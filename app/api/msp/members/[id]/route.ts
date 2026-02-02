/**
 * MSP Member Management API Routes
 * PATCH - Update member role
 * DELETE - Remove member from organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { parseAccessToken } from '@/lib/auth-utils';
import {
  hasPermission,
  canModifyRole,
  type MspRole,
} from '@/lib/msp-permissions';
import {
  updateMemberRoleSchema,
  validateMspInput,
  isValidUuid,
} from '@/lib/validators/msp';
import { logRoleChanged, logMemberRemoved } from '@/lib/audit-logger';
import { notifyMemberRemoved } from '@/lib/notification-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/msp/members/[id]
 * Update a member's role
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = parseAccessToken(request.headers.get('Authorization'));
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: memberId } = await params;

    if (!isValidUuid(memberId)) {
      return NextResponse.json(
        { error: 'Invalid member ID format' },
        { status: 400 }
      );
    }

    // Validate input
    const body = await request.json();
    const validation = validateMspInput(updateMemberRoleSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { role: newRole } = validation.data;

    const supabase = createServerClient();

    // Get actor's membership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: actorMembership, error: actorError } = await (supabase as any)
      .from('msp_user_memberships')
      .select('msp_organization_id, role')
      .eq('user_id', user.userId)
      .single();

    if (actorError || !actorMembership) {
      return NextResponse.json(
        { error: 'MSP organization not found' },
        { status: 404 }
      );
    }

    const actorRole = actorMembership.role as MspRole;

    // Check if actor has permission to change roles
    if (!hasPermission(actorRole, 'change_roles')) {
      return NextResponse.json(
        { error: 'You do not have permission to change member roles' },
        { status: 403 }
      );
    }

    // Get target member
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: targetMember, error: targetError } = await (supabase as any)
      .from('msp_user_memberships')
      .select('id, user_id, user_email, role, msp_organization_id')
      .eq('id', memberId)
      .single();

    if (targetError || !targetMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Verify same organization
    if (targetMember.msp_organization_id !== actorMembership.msp_organization_id) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Cannot modify own role
    if (targetMember.user_id === user.userId) {
      return NextResponse.json(
        { error: 'You cannot change your own role' },
        { status: 400 }
      );
    }

    // Check if actor can modify the target's current role
    if (!canModifyRole(actorRole, targetMember.role as MspRole)) {
      return NextResponse.json(
        { error: 'You cannot modify a user with equal or higher privileges' },
        { status: 403 }
      );
    }

    // Check if actor can assign the new role
    if (!canModifyRole(actorRole, newRole as MspRole)) {
      return NextResponse.json(
        { error: 'You cannot assign a role equal to or higher than your own' },
        { status: 403 }
      );
    }

    // Cannot change anyone to owner (owners are only the creator)
    if (newRole === 'owner') {
      return NextResponse.json(
        { error: 'Cannot assign owner role' },
        { status: 400 }
      );
    }

    // Update the role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('msp_user_memberships')
      .update({
        role: newRole,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memberId);

    if (updateError) {
      console.error('Error updating member role:', updateError);
      return NextResponse.json(
        { error: 'Failed to update member role' },
        { status: 500 }
      );
    }

    // Log the role change
    try {
      await logRoleChanged(
        {
          organization_id: actorMembership.msp_organization_id,
          user_id: user.userId,
          user_email: user.userEmail,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          user_agent: request.headers.get('user-agent') || undefined,
        },
        memberId,
        targetMember.user_email,
        targetMember.role,
        newRole
      );
    } catch (auditError) {
      console.error('Failed to log role change:', auditError);
    }

    console.log(`[Member] ${user.userEmail} changed ${targetMember.user_email}'s role from ${targetMember.role} to ${newRole}`);

    return NextResponse.json({
      success: true,
      member: {
        id: memberId,
        role: newRole,
      },
    });
  } catch (error) {
    console.error('Member PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/msp/members/[id]
 * Remove a member from the organization
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = parseAccessToken(request.headers.get('Authorization'));
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: memberId } = await params;

    if (!isValidUuid(memberId)) {
      return NextResponse.json(
        { error: 'Invalid member ID format' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get actor's membership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: actorMembership, error: actorError } = await (supabase as any)
      .from('msp_user_memberships')
      .select('msp_organization_id, role')
      .eq('user_id', user.userId)
      .single();

    if (actorError || !actorMembership) {
      return NextResponse.json(
        { error: 'MSP organization not found' },
        { status: 404 }
      );
    }

    const actorRole = actorMembership.role as MspRole;

    // Check if actor has permission to remove members
    if (!hasPermission(actorRole, 'remove_members')) {
      return NextResponse.json(
        { error: 'You do not have permission to remove members' },
        { status: 403 }
      );
    }

    // Get target member
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: targetMember, error: targetError } = await (supabase as any)
      .from('msp_user_memberships')
      .select('id, user_id, user_email, role, msp_organization_id')
      .eq('id', memberId)
      .single();

    if (targetError || !targetMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Verify same organization
    if (targetMember.msp_organization_id !== actorMembership.msp_organization_id) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Cannot remove self
    if (targetMember.user_id === user.userId) {
      return NextResponse.json(
        { error: 'You cannot remove yourself. Please transfer ownership first.' },
        { status: 400 }
      );
    }

    // Cannot remove owner
    if (targetMember.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove the organization owner' },
        { status: 400 }
      );
    }

    // Check if actor can modify the target's role
    if (!canModifyRole(actorRole, targetMember.role as MspRole)) {
      return NextResponse.json(
        { error: 'You cannot remove a user with equal or higher privileges' },
        { status: 403 }
      );
    }

    // Remove the member
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from('msp_user_memberships')
      .delete()
      .eq('id', memberId);

    if (deleteError) {
      console.error('Error removing member:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      );
    }

    // Log the member removal
    try {
      await logMemberRemoved(
        {
          organization_id: actorMembership.msp_organization_id,
          user_id: user.userId,
          user_email: user.userEmail,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          user_agent: request.headers.get('user-agent') || undefined,
        },
        memberId,
        targetMember.user_email
      );
    } catch (auditError) {
      console.error('Failed to log member removal:', auditError);
    }

    // Send in-app notification to the removed member
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: org } = await (supabase as any)
        .from('msp_organizations')
        .select('name')
        .eq('id', actorMembership.msp_organization_id)
        .single();

      if (org) {
        await notifyMemberRemoved(
          targetMember.user_id,
          targetMember.user_email,
          org.name,
          user.userEmail
        );
      }
    } catch (notifyError) {
      console.error('Failed to send member removal notification:', notifyError);
    }

    console.log(`[Member] ${user.userEmail} removed ${targetMember.user_email} from organization`);

    return NextResponse.json({
      success: true,
      removed_member_email: targetMember.user_email,
    });
  } catch (error) {
    console.error('Member DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
