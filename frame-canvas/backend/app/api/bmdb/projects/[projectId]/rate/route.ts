import { NextRequest, NextResponse } from 'next/server'
import { createClientServer } from '@/lib/supabase/server'
import { z } from 'zod'

const rateSchema = z.object({
  rating: z.number().int().min(0).max(10),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = createClientServer()
    
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { rating } = rateSchema.parse(body)

    const { data, error } = await supabase.rpc('set_project_rating', {
      p_project_id: params.projectId,
      p_rating: rating,
    })

    if (error) {
      console.error('Error setting rating:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to set rating' },
        { status: 400 }
      )
    }

    return NextResponse.json({ id: data, rating }, { status: 200 })
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

