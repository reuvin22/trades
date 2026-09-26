import { useCallback, useEffect, useState } from 'react'
import { apiFetch, date, readableApiError } from './api'

/**
 * The community feed, through the API.
 *
 * Posts are public: every signed-in account reads the same feed. An author
 * arrives as the four fields the directory already publishes — name, photo,
 * uid — and nothing else about them travels with a post.
 *
 * Likes are optimistic. The count is corrected from the response, so a click
 * that fails ends up showing the truth rather than the guess.
 */

export type PostComment = {
  id: string
  authorUid: string
  authorName: string
  authorPhoto: string
  text: string
  createdAt: Date | null
}

export type Post = {
  id: string
  authorUid: string
  authorName: string
  authorPhoto: string
  text: string
  tags: string[]
  createdAt: Date | null
  likeCount: number
  liked: boolean
  commentCount: number
  recentComments: PostComment[]
}

type Wire = Record<string, unknown>

function toComment(wire: Wire): PostComment {
  return {
    id: String(wire.id ?? ''),
    authorUid: String(wire.author_uid ?? ''),
    authorName: String(wire.author_name ?? ''),
    authorPhoto: String(wire.author_photo ?? ''),
    text: String(wire.text ?? ''),
    createdAt: date(wire.created_at),
  }
}

function toPost(wire: Wire): Post {
  const raw = Array.isArray(wire.recent_comments) ? wire.recent_comments : []

  return {
    id: String(wire.id ?? ''),
    authorUid: String(wire.author_uid ?? ''),
    authorName: String(wire.author_name ?? ''),
    authorPhoto: String(wire.author_photo ?? ''),
    text: String(wire.text ?? ''),
    tags: Array.isArray(wire.tags)
      ? wire.tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
    createdAt: date(wire.created_at),
    likeCount: Number(wire.like_count ?? 0),
    liked: wire.liked === true,
    commentCount: Number(wire.comment_count ?? 0),
    recentComments: raw.map((entry) => toComment(entry as Wire)),
  }
}

/** How long ago, in the compact form the rest of the product uses. */
export function ageOf(when: Date | null): string {
  if (when === null) return ''

  const seconds = Math.max(0, Math.round((Date.now() - when.getTime()) / 1000))
  if (seconds < 60) return 'just now'

  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`

  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d`

  return `${Math.round(days / 30)}mo`
}

export type FeedState = {
  posts: Post[]
  loading: boolean
  error: string | null
  reload: () => void
  /** Prepend a post that has just been written, without a refetch. */
  add: (post: Post) => void
  /** Replace one post in place, after a like or a comment. */
  replace: (post: Post) => void
}

export function useFeed(uid: string | null): FeedState {
  const [posts, setPosts] = useState<Post[]>([])
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((current) => current + 1), [])

  const add = useCallback((post: Post) => {
    setPosts((current) => [post, ...current])
  }, [])

  const replace = useCallback((post: Post) => {
    setPosts((current) =>
      current.map((entry) => (entry.id === post.id ? post : entry)),
    )
  }, [])

  useEffect(() => {
    if (uid === null) return

    const abort = new AbortController()

    apiFetch<{ items: Wire[] }>('/api/v1/community/posts', {
      query: { limit: 20 },
      signal: abort.signal,
    })
      .then((body) => {
        setPosts(body.items.map(toPost))
        setError(null)
        setLoadedFor(uid)
      })
      .catch((cause: unknown) => {
        if (abort.signal.aborted) return
        setError(readableApiError(cause))
        setLoadedFor(uid)
      })

    return () => abort.abort()
  }, [uid, nonce])

  /*
   * Loading is derived, not stored.
   *
   * `setLoading(true)` in an effect body is a render triggered by a render —
   * the same thing `useTrades` avoids. Instead the hook records which uid the
   * data it holds belongs to, and "loading" is simply: what we have is not for
   * the uid being asked about yet. A reload keeps the old rows on screen,
   * which is what a background refresh should do.
   */
  const loading = loadedFor !== uid

  // Signed out is "no posts", which is derived rather than stored — writing
  // it into state from an effect is a render caused by a render.
  if (uid === null) {
    return { posts: [], loading: false, error: null, reload, add, replace }
  }

  return { posts, loading, error, reload, add, replace }
}

export async function createPost(text: string, tags: string[]): Promise<Post> {
  return toPost(
    await apiFetch<Wire>('/api/v1/community/posts', {
      method: 'POST',
      body: { text, tags },
    }),
  )
}

export function deletePost(id: string): Promise<unknown> {
  return apiFetch(`/api/v1/community/posts/${id}`, { method: 'DELETE' })
}

/** Answers with the count the server holds, not the one the click assumed. */
export async function setLike(
  id: string,
  liked: boolean,
): Promise<{ liked: boolean; likeCount: number }> {
  const body = await apiFetch<Wire>(`/api/v1/community/posts/${id}/like`, {
    method: liked ? 'PUT' : 'DELETE',
  })

  return { liked: body.liked === true, likeCount: Number(body.like_count ?? 0) }
}

export async function addComment(id: string, text: string): Promise<PostComment> {
  return toComment(
    await apiFetch<Wire>(`/api/v1/community/posts/${id}/comments`, {
      method: 'POST',
      body: { text },
    }),
  )
}
