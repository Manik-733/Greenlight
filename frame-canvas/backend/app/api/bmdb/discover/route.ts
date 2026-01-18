import { NextRequest, NextResponse } from 'next/server'
import { createClientServer } from '@/lib/supabase/server'

interface ProjectCardDTO {
  id: string
  title: string
  slug: string
  description: string | null
  poster_url: string | null
  project_type: string
  published_at: string | null
  avg_rating: number | null
  rating_count: number
  comment_count: number
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientServer()

    // Get all published projects with rating aggregates
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        slug,
        description,
        poster_url,
        project_type,
        published_at
      `)
      .eq('status', 'PUBLISHED')
      .eq('is_removed', false)
      .not('published_at', 'is', null)

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      )
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({
        trending: [],
        topRated: [],
        newNotable: [],
        recent: [],
      })
    }

    const projectIds = projects.map((p) => p.id)

    // Get rating aggregates
    const { data: ratingAggregates } = await supabase
      .from('project_rating_aggregates')
      .select('*')
      .in('project_id', projectIds)

    const ratingMap = new Map(
      (ratingAggregates || []).map((ra) => [ra.project_id, ra])
    )

    // Get comment counts
    const { data: commentCounts } = await supabase
      .from('project_comments')
      .select('project_id')
      .eq('status', 'VISIBLE')
      .in('project_id', projectIds)

    const commentCountMap = new Map<string, number>()
    commentCounts?.forEach((cc) => {
      commentCountMap.set(
        cc.project_id,
        (commentCountMap.get(cc.project_id) || 0) + 1
      )
    )

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentRatings } = await supabase
      .from('project_ratings')
      .select('project_id, created_at')
      .in('project_id', projectIds)
      .gte('created_at', sevenDaysAgo.toISOString())

    const { data: recentComments } = await supabase
      .from('project_comments')
      .select('project_id, created_at')
      .in('project_id', projectIds)
      .eq('status', 'VISIBLE')
      .gte('created_at', sevenDaysAgo.toISOString())

    const recentActivityMap = new Map<string, number>()
    recentRatings?.forEach((rr) => {
      recentActivityMap.set(
        rr.project_id,
        (recentActivityMap.get(rr.project_id) || 0) + 1
      )
    })
    recentComments?.forEach((rc) => {
      recentActivityMap.set(
        rc.project_id,
        (recentActivityMap.get(rc.project_id) || 0) + 1
      )
    })

    // Build project cards
    const projectCards: ProjectCardDTO[] = projects.map((project) => {
      const ratingAgg = ratingMap.get(project.id)
      return {
        id: project.id,
        title: project.title,
        slug: project.slug,
        description: project.description,
        poster_url: project.poster_url,
        project_type: project.project_type,
        published_at: project.published_at,
        avg_rating: ratingAgg?.avg_rating ?? null,
        rating_count: ratingAgg?.rating_count ?? 0,
        comment_count: commentCountMap.get(project.id) ?? 0,
      }
    })

    // Sort and filter
    const now = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Recently Added: order by published_at desc
    const recent = [...projectCards]
      .sort(
        (a, b) =>
          new Date(b.published_at || 0).getTime() -
          new Date(a.published_at || 0).getTime()
      )
      .slice(0, 20)

    // Top Rated: order by avg_rating desc, require rating_count >= 5
    const topRated = [...projectCards]
      .filter((p) => p.avg_rating !== null && p.rating_count >= 5)
      .sort((a, b) => {
        const aRating = a.avg_rating || 0
        const bRating = b.avg_rating || 0
        if (aRating !== bRating) return bRating - aRating
        return b.rating_count - a.rating_count
      })
      .slice(0, 20)

    // Trending: order by recent activity score
    const trending = [...projectCards]
      .map((p) => ({
        ...p,
        activityScore: recentActivityMap.get(p.id) || 0,
      }))
      .sort((a, b) => b.activityScore - a.activityScore)
      .slice(0, 20)
      .map(({ activityScore, ...p }) => p)

    // New & Notable: published in last 30 days with avg_rating > 7.5 and min 5 votes
    const newNotable = [...projectCards]
      .filter((p) => {
        if (!p.published_at) return false
        const publishedDate = new Date(p.published_at)
        if (publishedDate < thirtyDaysAgo) return false
        return (
          p.avg_rating !== null &&
          p.avg_rating >= 7.5 &&
          p.rating_count >= 5
        )
      })
      .sort(
        (a, b) =>
          new Date(b.published_at || 0).getTime() -
          new Date(a.published_at || 0).getTime()
      )
      .slice(0, 20)

    return NextResponse.json({
      trending,
      topRated,
      newNotable,
      recent,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

