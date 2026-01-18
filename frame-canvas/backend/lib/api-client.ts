/**
 * BMDB API Client
 * Typed helper functions for calling backend API routes
 */

import type {
  RatingsSummaryResponse,
  CommentsResponse,
  DiscoverResponse,
  RateProjectRequest,
  CreateCommentRequest,
  EditCommentRequest,
  ApiError,
} from '@/types/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/bmdb'

async function fetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: `HTTP ${response.status}`,
    }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// Ratings
export async function rateProject(
  projectId: string,
  data: RateProjectRequest
): Promise<{ id: string; rating: number }> {
  return fetchJson(`${API_BASE}/projects/${projectId}/rate`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getRatingsSummary(
  projectId: string
): Promise<RatingsSummaryResponse> {
  return fetchJson(`${API_BASE}/projects/${projectId}/ratings-summary`)
}

// Comments
export async function createComment(
  projectId: string,
  data: CreateCommentRequest
): Promise<{ id: string }> {
  return fetchJson(`${API_BASE}/projects/${projectId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getComments(
  projectId: string,
  options?: { cursor?: string; limit?: number }
): Promise<CommentsResponse> {
  const params = new URLSearchParams()
  if (options?.cursor) params.set('cursor', options.cursor)
  if (options?.limit) params.set('limit', options.limit.toString())

  const queryString = params.toString()
  return fetchJson(
    `${API_BASE}/projects/${projectId}/comments${queryString ? `?${queryString}` : ''}`
  )
}

export async function editComment(
  commentId: string,
  data: EditCommentRequest
): Promise<{ success: boolean }> {
  return fetchJson(`${API_BASE}/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteComment(
  commentId: string,
  reason?: string
): Promise<{ success: boolean }> {
  const params = new URLSearchParams()
  if (reason) params.set('reason', reason)

  const queryString = params.toString()
  return fetchJson(
    `${API_BASE}/comments/${commentId}${queryString ? `?${queryString}` : ''}`,
    { method: 'DELETE' }
  )
}

// Discovery
export async function getDiscover(): Promise<DiscoverResponse> {
  return fetchJson(`${API_BASE}/discover`)
}

