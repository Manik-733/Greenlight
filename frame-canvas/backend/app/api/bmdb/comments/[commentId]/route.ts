import { NextRequest, NextResponse } from 'next/server'
import { createClientServer } from '@/lib/supabase/server'
import { z } from 'zod'

const editCommentSchema = z.object({
  body: z.string().min(3).max(1500),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { commentId: string } }
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
    const { body: commentBody } = editCommentSchema.parse(body)

    const { error } = await supabase.rpc('edit_project_comment', {
      p_comment_id: params.commentId,
      p_body: commentBody,
    })

    if (error) {
      console.error('Error editing comment:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to edit comment' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { commentId: string } }
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

    const searchParams = request.nextUrl.searchParams
    const reason = searchParams.get('reason') || null

    const { error } = await supabase.rpc('remove_project_comment', {
      p_comment_id: params.commentId,
      p_reason: reason,
    })

    if (error) {
      console.error('Error deleting comment:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to delete comment' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

