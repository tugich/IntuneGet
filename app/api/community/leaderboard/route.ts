/**
 * Community Leaderboard API Routes
 * GET - Get community leaderboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  applyRateLimit,
  getIpKey,
  PUBLIC_RATE_LIMIT,
} from '@/lib/rate-limit';

/**
 * GET /api/community/leaderboard
 * Get the community contribution leaderboard
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit by IP
    const rateLimitResponse = applyRateLimit(getIpKey(request), PUBLIC_RATE_LIMIT);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    const supabase = createServerClient();

    // Get leaderboard from materialized view
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: leaderboard, error } = await (supabase as any)
      .from('community_leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }

    // Anonymize emails (show first part only)
    const anonymizedLeaderboard = leaderboard?.map((entry: {
      user_email: string;
      suggestions_count: number;
      votes_cast: number;
      feedback_count: number;
      ratings_count: number;
      score: number;
    }, index: number) => ({
      rank: index + 1,
      username: entry.user_email.split('@')[0],
      suggestions_count: entry.suggestions_count,
      votes_cast: entry.votes_cast,
      feedback_count: entry.feedback_count,
      ratings_count: entry.ratings_count,
      score: entry.score,
    }));

    // Get community stats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [suggestionsResult, votesResult, feedbackResult, ratingsResult] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('app_suggestions').select('*', { count: 'exact', head: true }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('app_suggestion_votes').select('*', { count: 'exact', head: true }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('detection_rule_feedback').select('*', { count: 'exact', head: true }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from('app_ratings').select('*', { count: 'exact', head: true }),
    ]);

    const communityStats = {
      total_suggestions: suggestionsResult.count || 0,
      total_votes: votesResult.count || 0,
      total_feedback: feedbackResult.count || 0,
      total_ratings: ratingsResult.count || 0,
      total_contributors: leaderboard?.length || 0,
    };

    return NextResponse.json({
      leaderboard: anonymizedLeaderboard || [],
      stats: communityStats,
    });
  } catch (error) {
    console.error('Leaderboard GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
