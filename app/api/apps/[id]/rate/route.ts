/**
 * App Rating API Routes
 * GET - Get ratings for an app
 * POST - Rate an app
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { parseAccessToken } from '@/lib/auth-utils';
import {
  ratingSchema,
  validateInput,
  sanitizeText,
} from '@/lib/validators/community';
import {
  applyRateLimit,
  getUserKey,
  getIpKey,
  COMMUNITY_RATE_LIMIT,
  PUBLIC_RATE_LIMIT,
} from '@/lib/rate-limit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/apps/[id]/rate
 * Get ratings for an app
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Rate limit by IP for public access
    const rateLimitResponse = applyRateLimit(getIpKey(request), PUBLIC_RATE_LIMIT);
    if (rateLimitResponse) return rateLimitResponse;

    const { id: appId } = await params;

    // Decode the app ID (it might be URL encoded)
    const decodedAppId = decodeURIComponent(appId);

    const supabase = createServerClient();

    // Get all ratings for the app
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: ratings, error } = await (supabase as any)
      .from('app_ratings')
      .select('id, rating, comment, deployment_success, created_at')
      .eq('app_id', decodedAppId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ratings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ratings' },
        { status: 500 }
      );
    }

    // Calculate aggregates
    const totalRatings = ratings?.length || 0;
    const averageRating = totalRatings > 0
      ? ratings.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / totalRatings
      : 0;
    const successfulDeployments = ratings?.filter(
      (r: { deployment_success: boolean | null }) => r.deployment_success === true
    ).length || 0;
    const failedDeployments = ratings?.filter(
      (r: { deployment_success: boolean | null }) => r.deployment_success === false
    ).length || 0;

    // Rating distribution
    const distribution = [1, 2, 3, 4, 5].map(star => ({
      rating: star,
      count: ratings?.filter((r: { rating: number }) => r.rating === star).length || 0,
    }));

    // Get user's rating if authenticated
    const user = parseAccessToken(request.headers.get('Authorization'));
    let userRating = null;

    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: userRatingData } = await (supabase as any)
        .from('app_ratings')
        .select('*')
        .eq('app_id', decodedAppId)
        .eq('user_id', user.userId)
        .single();

      userRating = userRatingData;
    }

    return NextResponse.json({
      app_id: decodedAppId,
      stats: {
        total_ratings: totalRatings,
        average_rating: Math.round(averageRating * 10) / 10,
        successful_deployments: successfulDeployments,
        failed_deployments: failedDeployments,
        success_rate: totalRatings > 0
          ? Math.round((successfulDeployments / (successfulDeployments + failedDeployments)) * 100)
          : null,
      },
      distribution,
      ratings: ratings?.slice(0, 10) || [], // Return first 10 ratings
      user_rating: userRating,
    });
  } catch (error) {
    console.error('Ratings GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/apps/[id]/rate
 * Rate an app (creates or updates)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const { id: appId } = await params;
    const decodedAppId = decodeURIComponent(appId);

    // Parse and validate request body
    const body = await request.json();
    const validation = validateInput(ratingSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { rating, comment, deployment_success } = validation.data;

    const supabase = createServerClient();

    // Verify the app exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingApp } = await (supabase as any)
      .from('curated_apps')
      .select('id, winget_id')
      .eq('winget_id', decodedAppId)
      .single();

    if (!existingApp) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 }
      );
    }

    // Upsert the rating (update if exists, create if not)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: ratingData, error: upsertError } = await (supabase as any)
      .from('app_ratings')
      .upsert(
        {
          app_id: decodedAppId,
          user_id: user.userId,
          user_email: user.userEmail,
          rating,
          comment: sanitizeText(comment),
          deployment_success,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'app_id,user_id',
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('Error upserting rating:', upsertError);
      return NextResponse.json(
        { error: 'Failed to save rating' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      rating: ratingData,
      message: 'Rating saved successfully',
    });
  } catch (error) {
    console.error('Ratings POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
