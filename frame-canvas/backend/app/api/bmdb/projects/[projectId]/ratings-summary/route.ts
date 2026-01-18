import { NextRequest, NextResponse } from 'next/server'
import { createClientServer } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = createClientServer()

    // Get current user if authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Get rating aggregate
    const { data: aggregate, error: aggregateError } = await supabase
      .from('project_rating_aggregates')
      .select('*')
      .eq('project_id', params.projectId)
      .single()

    if (aggregateError && aggregateError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is fine
      console.error('Error fetching rating aggregate:', aggregateError)
    }

    let userRating = null
    if (user) {
      const { data: ratingData } = await supabase
        .from('project_ratings')
        .select('rating')
        .eq('project_id', params.projectId)
        .eq('user_id', user.id)
        .single()

      userRating = ratingData?.rating ?? null
    }

    // Get rating distribution
    const { data: distribution } = await supabase
      .from('project_ratings')
      .select('rating')
      .eq('project_id', params.projectId)

    const distributionMap: Record<number, number> = {}
    if (distribution) {
      distribution.forEach((r) => {
        distributionMap[r.rating] = (distributionMap[r.rating] || 0) + 1
      })
    }

    return NextResponse.json({
      avg: aggregate?.avg_rating ?? null,
      count: aggregate?.rating_count ?? 0,
      distribution: distributionMap,
      userRating,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

