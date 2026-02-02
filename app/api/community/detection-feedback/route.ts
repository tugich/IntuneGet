/**
 * Detection Rule Feedback API Routes
 * POST - Submit feedback on detection rules
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { parseAccessToken } from '@/lib/auth-utils';
import {
  feedbackSchema,
  validateInput,
  sanitizeText,
} from '@/lib/validators/community';
import {
  applyRateLimit,
  getUserKey,
  COMMUNITY_RATE_LIMIT,
} from '@/lib/rate-limit';

/**
 * POST /api/community/detection-feedback
 * Submit feedback on an app's detection rules
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

    // Rate limit by user
    const rateLimitResponse = applyRateLimit(
      getUserKey(user.userId),
      COMMUNITY_RATE_LIMIT
    );
    if (rateLimitResponse) return rateLimitResponse;

    // Parse and validate request body
    const body = await request.json();
    const validation = validateInput(feedbackSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { app_id, feedback_type, description, environment_info } = validation.data;

    const supabase = createServerClient();

    // Verify the app exists in curated_apps
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingApp } = await (supabase as any)
      .from('curated_apps')
      .select('id, winget_id, name')
      .eq('winget_id', app_id)
      .single();

    if (!existingApp) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 }
      );
    }

    // Create the feedback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: feedback, error: insertError } = await (supabase as any)
      .from('detection_rule_feedback')
      .insert({
        app_id,
        user_id: user.userId,
        user_email: user.userEmail,
        feedback_type,
        description: sanitizeText(description),
        environment_info: environment_info || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating feedback:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        feedback,
        message: 'Thank you for your feedback! This helps us improve detection rules.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Detection feedback POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/community/detection-feedback
 * Get feedback for an app (admin only or own feedback)
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

    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('app_id');
    const ownOnly = searchParams.get('own') === 'true';

    if (!appId) {
      return NextResponse.json(
        { error: 'app_id parameter is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('detection_rule_feedback')
      .select('*')
      .eq('app_id', appId)
      .order('created_at', { ascending: false });

    // Users can only see their own feedback unless they're an admin
    if (ownOnly) {
      query = query.eq('user_id', user.userId);
    }

    const { data: feedback, error } = await query;

    if (error) {
      console.error('Error fetching feedback:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    // Filter to only show user's own feedback for non-admins
    const filteredFeedback = feedback?.filter(
      (f: { user_id: string }) => f.user_id === user.userId
    ) || [];

    return NextResponse.json({ feedback: filteredFeedback });
  } catch (error) {
    console.error('Detection feedback GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
