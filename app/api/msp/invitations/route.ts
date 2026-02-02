/**
 * MSP Team Invitations API Routes
 * GET - List pending invitations
 * POST - Create and send a new invitation
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerClient } from '@/lib/supabase';
import { parseAccessToken } from '@/lib/auth-utils';
import { hasPermission, type MspRole } from '@/lib/msp-permissions';
import { invitationSchema, validateMspInput } from '@/lib/validators/msp';
import {
  applyRateLimit,
  getUserKey,
  COMMUNITY_RATE_LIMIT,
} from '@/lib/rate-limit';
import { checkCanAddMember } from '@/lib/usage-limits';
import { logMemberInvited } from '@/lib/audit-logger';
import { sendTeamInvitationEmail, isEmailConfigured } from '@/lib/email/service';

// Token expiry: 7 days
const INVITATION_EXPIRY_DAYS = 7;

/**
 * GET /api/msp/invitations
 * List all invitations for the user's organization
 */
export async function GET(request: NextRequest) {
  try {
    const user = parseAccessToken(request.headers.get('Authorization'));
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Get user's membership and organization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership, error: membershipError } = await (supabase as any)
      .from('msp_user_memberships')
      .select('*, msp_organizations!inner(*)')
      .eq('user_id', user.userId)
      .eq('msp_organizations.is_active', true)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'MSP organization not found' },
        { status: 404 }
      );
    }

    // Check permission
    const userRole = membership.role as MspRole;
    if (!hasPermission(userRole, 'invite_members')) {
      return NextResponse.json(
        { error: 'You do not have permission to view invitations' },
        { status: 403 }
      );
    }

    // Get invitations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invitations, error: invitationsError } = await (supabase as any)
      .from('msp_invitations')
      .select('id, email, role, invited_by_email, expires_at, accepted_at, created_at')
      .eq('organization_id', membership.msp_organization_id)
      .order('created_at', { ascending: false });

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError);
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    // Separate pending and processed invitations
    const now = new Date();
    const pending = invitations.filter(
      (inv: { accepted_at: string | null; expires_at: string }) =>
        !inv.accepted_at && new Date(inv.expires_at) > now
    );
    const expired = invitations.filter(
      (inv: { accepted_at: string | null; expires_at: string }) =>
        !inv.accepted_at && new Date(inv.expires_at) <= now
    );
    const accepted = invitations.filter(
      (inv: { accepted_at: string | null }) => inv.accepted_at
    );

    return NextResponse.json({
      pending,
      expired,
      accepted,
    });
  } catch (error) {
    console.error('Invitations GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/msp/invitations
 * Create a new invitation and send email
 */
export async function POST(request: NextRequest) {
  try {
    const user = parseAccessToken(request.headers.get('Authorization'));
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Rate limit
    const rateLimitResponse = applyRateLimit(
      getUserKey(user.userId),
      COMMUNITY_RATE_LIMIT
    );
    if (rateLimitResponse) return rateLimitResponse;

    // Validate input
    const body = await request.json();
    const validation = validateMspInput(invitationSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { email, role } = validation.data;

    const supabase = createServerClient();

    // Get user's membership and organization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership, error: membershipError } = await (supabase as any)
      .from('msp_user_memberships')
      .select('*, msp_organizations!inner(*)')
      .eq('user_id', user.userId)
      .eq('msp_organizations.is_active', true)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'MSP organization not found' },
        { status: 404 }
      );
    }

    // Check permission
    const userRole = membership.role as MspRole;
    if (!hasPermission(userRole, 'invite_members')) {
      return NextResponse.json(
        { error: 'You do not have permission to invite members' },
        { status: 403 }
      );
    }

    const organization = membership.msp_organizations;

    // Check member limit
    const limitCheck = await checkCanAddMember(membership.msp_organization_id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: limitCheck.reason,
          upgradeRecommended: limitCheck.upgradeRecommended,
          recommendedTier: limitCheck.recommendedTier,
        },
        { status: 403 }
      );
    }

    // Check if user is already a member
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingMember } = await (supabase as any)
      .from('msp_user_memberships')
      .select('id')
      .eq('msp_organization_id', membership.msp_organization_id)
      .ilike('user_email', email)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'This user is already a member of the organization' },
        { status: 409 }
      );
    }

    // Check if there's already a pending invitation for this email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingInvitation } = await (supabase as any)
      .from('msp_invitations')
      .select('id, expires_at')
      .eq('organization_id', membership.msp_organization_id)
      .ilike('email', email)
      .is('accepted_at', null)
      .single();

    if (existingInvitation && new Date(existingInvitation.expires_at) > new Date()) {
      return NextResponse.json(
        { error: 'An invitation for this email is already pending' },
        { status: 409 }
      );
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    // Create invitation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invitation, error: insertError } = await (supabase as any)
      .from('msp_invitations')
      .insert({
        organization_id: membership.msp_organization_id,
        email,
        role,
        invited_by_user_id: user.userId,
        invited_by_email: user.userEmail,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select('id, email, role, expires_at, created_at')
      .single();

    if (insertError) {
      console.error('Error creating invitation:', insertError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // Send invitation email via Resend
    let emailSent = false;
    if (isEmailConfigured()) {
      try {
        const emailResult = await sendTeamInvitationEmail(email, {
          inviter_name: user.userName || user.userEmail,
          inviter_email: user.userEmail,
          organization_name: organization.name,
          role,
          token,
          expires_at: expiresAt,
        });
        emailSent = emailResult.success;
        if (!emailResult.success) {
          console.error('Failed to send invitation email:', emailResult.error);
        }
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
      }
    }

    // Generate accept URL for fallback/manual sharing
    const baseUrl = process.env.NEXT_PUBLIC_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const acceptUrl = `${baseUrl.replace(/\/$/, '')}/msp/invite/accept?token=${token}`;

    // Log the invitation to audit log
    try {
      await logMemberInvited(
        {
          organization_id: membership.msp_organization_id,
          user_id: user.userId,
          user_email: user.userEmail,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          user_agent: request.headers.get('user-agent') || undefined,
        },
        invitation.id,
        email,
        role
      );
    } catch (auditError) {
      console.error('Failed to log invitation:', auditError);
      // Don't fail the request if audit logging fails
    }

    console.log(`[Invitation] ${email} invited to ${organization.name} as ${role} (email sent: ${emailSent})`);

    return NextResponse.json(
      {
        invitation: {
          ...invitation,
          organization_name: organization.name,
        },
        emailSent,
        // Include acceptUrl for manual sharing when email fails or is not configured
        ...(emailSent ? {} : { acceptUrl }),
        message: emailSent
          ? `Invitation sent to ${email}`
          : `Invitation created for ${email}. Share the link manually.`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Invitations POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/msp/invitations
 * Cancel a pending invitation
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = parseAccessToken(request.headers.get('Authorization'));
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('id');

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get user's membership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership, error: membershipError } = await (supabase as any)
      .from('msp_user_memberships')
      .select('msp_organization_id, role')
      .eq('user_id', user.userId)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'MSP organization not found' },
        { status: 404 }
      );
    }

    // Check permission
    if (!hasPermission(membership.role as MspRole, 'invite_members')) {
      return NextResponse.json(
        { error: 'You do not have permission to cancel invitations' },
        { status: 403 }
      );
    }

    // Delete the invitation (only if it belongs to user's org and is not accepted)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError, count } = await (supabase as any)
      .from('msp_invitations')
      .delete({ count: 'exact' })
      .eq('id', invitationId)
      .eq('organization_id', membership.msp_organization_id)
      .is('accepted_at', null);

    if (deleteError) {
      console.error('Error deleting invitation:', deleteError);
      return NextResponse.json(
        { error: 'Failed to cancel invitation' },
        { status: 500 }
      );
    }

    if (count === 0) {
      return NextResponse.json(
        { error: 'Invitation not found or already accepted' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Invitations DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
