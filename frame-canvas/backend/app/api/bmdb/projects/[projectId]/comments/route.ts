import { NextRequest, NextResponse } from 'next/server'
import { createClientServer } from '@/lib/supabase/server'
import { z } from 'zod'

const commentSchema = z.object({
  body: z.string().min(3).max(1500),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = createClientServer()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { body: commentBody } = commentSchema.parse(body)

    const { data, error } = await supabase.rpc('create_project_comment', {
      p_project_id: params.projectId,
      p_body: commentBody,
    })

    if (error) {
      console.error('Error creating comment:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create comment' },
        { status: 400 }
      )
    }

    return NextResponse.json({ id: data }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = createClientServer()
    const searchParams = request.nextUrl.searchParams
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    let query = supabase
      .from('project_comments')
      .select(`
        id,
        body,
        status,
        created_at,
        updated_at,
        user_id,
        profiles:user_id (
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('project_id', params.projectId)
      .eq('status', 'VISIBLE')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (cursor) {
      query = query.lt('created_at', cursor)
    }

    const { data: comments, error } = await query

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      comments: comments || [],
      nextCursor: comments && comments.length === limit ? comments[comments.length - 1].created_at : null,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

