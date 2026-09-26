import { useMemo, useState } from 'react'
import { ChatIcon, HeartIcon, SendIcon, TrashIcon } from '../components/Icons'
import { ConfirmDialog, type ConfirmRequest } from '../components/ConfirmDialog'
import { accentFor, displayNameFor, initialsFor } from '../data/messages'
import {
  CARD,
  COMM_ACTION,
  COMM_ACTION_ON,
  COMM_AVATAR,
  COMM_AVATAR_FACE,
  COMM_COMMENT,
  COMM_COMMENT_BODY,
  COMM_COMMENT_FORM,
  COMM_COMMENT_INPUT,
  COMM_COMMENT_NAME,
  COMM_COMMENT_TEXT,
  COMM_COMMENTS,
  COMM_COMPOSER,
  COMM_COMPOSER_FOOT,
  COMM_COMPOSER_INPUT,
  COMM_COMPOSER_ROW,
  COMM_COMPOSER_TOOLS,
  COMM_MAIN,
  COMM_POST,
  COMM_POST_ACTIONS,
  COMM_POST_COUNTS,
  COMM_POST_HEAD,
  COMM_POST_META,
  COMM_POST_NAME,
  COMM_POST_TAGS,
  COMM_POST_TEXT,
  COMM_POST_WHO,
  COMM_TAG,
  COMM_TOOL,
  EMPTY_BLOCK,
  MUTED_NOTE,
  PAGE_HEAD,
  PAGE_SUB,
  PAGE_TITLE,
  PILL,
  PILL_ACCENT,
  UNI_LOADING,
} from '../components/ui'
import { readableApiError } from '../lib/api'
import {
  addComment,
  ageOf,
  createPost,
  deletePost,
  setLike,
  useFeed,
  type Post,
} from '../lib/community'
import { useToast } from '../lib/toast'
import type { Profile } from '../lib/profile'

/**
 * The room outside your own journal, on the real feed.
 *
 * Posts come from `/api/v1/community/posts` and every signed-in account reads
 * the same ones. An author arrives as the three fields the directory already
 * publishes — uid, name, photo — and nothing else about them travels with a
 * post. Nothing on this page is computed from anybody's journal.
 *
 * A single column, not three. The rails were fixtures: "traders you may know"
 * has no honest source, because the API deliberately refuses to return a
 * browsable list of accounts — contact search needs an address precisely so
 * the user base cannot be walked. A panel that can only be filled by breaking
 * that is a panel that should not exist.
 */
export function Community({ profile }: { profile: Profile | null }) {
  const feed = useFeed(profile?.uid ?? null)
  const toast = useToast()

  const [draft, setDraft] = useState('')
  const [posting, setPosting] = useState(false)
  const [replies, setReplies] = useState<Record<string, string>>({})
  const [confirming, setConfirming] = useState<ConfirmRequest | null>(null)

  const me = useMemo(
    () => ({
      uid: profile?.uid ?? 'me',
      name: displayNameFor(profile?.displayName ?? '', profile?.email ?? ''),
    }),
    [profile],
  )

  async function publish() {
    const text = draft.trim()
    if (text === '' || posting) return

    setPosting(true)
    try {
      feed.add(await createPost(text, tagsIn(text)))
      setDraft('')
    } catch (cause) {
      toast.error('Could not post that', readableApiError(cause))
    } finally {
      setPosting(false)
    }
  }

  async function toggleLike(post: Post) {
    // Optimistic, then corrected from the response — a click that fails ends
    // up showing the truth rather than the guess.
    const wanted = !post.liked
    feed.replace({
      ...post,
      liked: wanted,
      likeCount: post.likeCount + (wanted ? 1 : -1),
    })

    try {
      const result = await setLike(post.id, wanted)
      feed.replace({ ...post, liked: result.liked, likeCount: result.likeCount })
    } catch (cause) {
      feed.replace(post)
      toast.error('Could not register that', readableApiError(cause))
    }
  }

  async function comment(post: Post) {
    const text = (replies[post.id] ?? '').trim()
    if (text === '') return

    setReplies((current) => ({ ...current, [post.id]: '' }))

    try {
      const entry = await addComment(post.id, text)
      feed.replace({
        ...post,
        commentCount: post.commentCount + 1,
        recentComments: [...post.recentComments, entry].slice(-3),
      })
    } catch (cause) {
      setReplies((current) => ({ ...current, [post.id]: text }))
      toast.error('Could not add that comment', readableApiError(cause))
    }
  }

  function remove(post: Post) {
    setConfirming({
      title: 'Delete this post?',
      body: 'It disappears from the feed for everyone.',
      consequence: 'Its likes and comments go with it.',
      onConfirm: async () => {
        await deletePost(post.id)
        feed.reload()
        toast.success('Post deleted.')
      },
    })
  }

  return (
    <>
      <div className={PAGE_HEAD}>
        <div>
          <h2 className={PAGE_TITLE}>Community</h2>
          <p className={PAGE_SUB}>
            What other traders are working on. Everything posted here is public to
            everyone with an account — your journal is not, and never travels with a
            post.
          </p>
        </div>
      </div>

      <div className={COMM_MAIN}>
        <section className={CARD}>
          <div className={COMM_COMPOSER}>
            <div className={COMM_COMPOSER_ROW}>
              <Avatar uid={me.uid} name={me.name} size={38} />
              <textarea
                className={COMM_COMPOSER_INPUT}
                value={draft}
                maxLength={2000}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={`What are you seeing, ${me.name.split(' ')[0]}?`}
                aria-label="Write a post"
              />
            </div>

            <div className={COMM_COMPOSER_FOOT}>
              <div className={COMM_COMPOSER_TOOLS}>
                <span className={COMM_TOOL}>
                  {/* Hashtags are read out of the text rather than a separate
                      field — it is how people already write them. */}
                  #tags become topics
                </span>
              </div>

              <button
                type="button"
                className={`${PILL} ${PILL_ACCENT}`}
                onClick={publish}
                disabled={posting || draft.trim() === ''}
              >
                <SendIcon size={15} />
                {posting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        </section>

        {feed.error !== null && (
          <section className={`${CARD} ${EMPTY_BLOCK}`}>
            <p>{feed.error}</p>
          </section>
        )}

        {feed.loading && feed.posts.length === 0 && (
          <section className={CARD}>
            <p className={UNI_LOADING}>Loading the feed…</p>
          </section>
        )}

        {!feed.loading && feed.posts.length === 0 && feed.error === null && (
          <section className={`${CARD} ${EMPTY_BLOCK}`}>
            <p>Nothing here yet.</p>
            <p className={MUTED_NOTE}>
              Be the first. A read you are watching, a mistake you made, a question
              worth asking.
            </p>
          </section>
        )}

        {feed.posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            meUid={me.uid}
            meName={me.name}
            reply={replies[post.id] ?? ''}
            onLike={() => toggleLike(post)}
            onDelete={() => remove(post)}
            onReplyChange={(value) =>
              setReplies((current) => ({ ...current, [post.id]: value }))
            }
            onReply={() => comment(post)}
          />
        ))}
      </div>

      <ConfirmDialog request={confirming} onClose={() => setConfirming(null)} />
    </>
  )
}

/** Hashtags as written, so the composer needs no second field. */
function tagsIn(text: string): string[] {
  return [...text.matchAll(/#([\p{L}\p{N}_-]{1,24})/gu)].map((match) => match[1])
}

/* ------------------------------------------------------------------ parts */

function Avatar({ uid, name, size }: { uid: string; name: string; size: number }) {
  return (
    <span className={COMM_AVATAR} style={{ width: size, height: size }}>
      <span
        className={COMM_AVATAR_FACE}
        style={{ background: accentFor(uid), fontSize: size * 0.36 }}
      >
        {initialsFor(name, '')}
      </span>
    </span>
  )
}

type PostCardProps = {
  post: Post
  meUid: string
  meName: string
  reply: string
  onLike: () => void
  onDelete: () => void
  onReplyChange: (value: string) => void
  onReply: () => void
}

function PostCard({
  post,
  meUid,
  meName,
  reply,
  onLike,
  onDelete,
  onReplyChange,
  onReply,
}: PostCardProps) {
  const author = post.authorName.trim() || 'Trader'
  const mine = post.authorUid === meUid

  return (
    <article className={CARD}>
      <div className={COMM_POST}>
        <header className={COMM_POST_HEAD}>
          <Avatar uid={post.authorUid} name={author} size={40} />
          <div className={COMM_POST_WHO}>
            <span className={COMM_POST_NAME}>{author}</span>
            <span className={COMM_POST_META}>{ageOf(post.createdAt)}</span>
          </div>
        </header>

        <p className={COMM_POST_TEXT}>{post.text}</p>

        {post.tags.length > 0 && (
          <div className={COMM_POST_TAGS}>
            {post.tags.map((tag) => (
              <span key={tag} className={COMM_TAG}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className={COMM_POST_COUNTS}>
          <span>
            {post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}
          </span>
          <span>
            {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
          </span>
        </div>

        <div className={COMM_POST_ACTIONS}>
          <button
            type="button"
            className={`${COMM_ACTION} ${post.liked ? COMM_ACTION_ON : ''}`}
            aria-pressed={post.liked}
            onClick={onLike}
          >
            <HeartIcon size={16} />
            Like
          </button>
          <button type="button" className={COMM_ACTION}>
            <ChatIcon size={16} />
            Comment
          </button>
          {mine && (
            <button type="button" className={COMM_ACTION} onClick={onDelete}>
              <TrashIcon size={16} />
              Delete
            </button>
          )}
        </div>
      </div>

      <div className={COMM_COMMENTS}>
        {post.recentComments.map((entry) => (
          <div key={entry.id} className={COMM_COMMENT}>
            <Avatar
              uid={entry.authorUid}
              name={entry.authorName.trim() || 'Trader'}
              size={28}
            />
            <div className={COMM_COMMENT_BODY}>
              <span className={COMM_COMMENT_NAME}>
                {entry.authorName.trim() || 'Trader'}
              </span>
              <p className={COMM_COMMENT_TEXT}>{entry.text}</p>
            </div>
          </div>
        ))}

        <div className={COMM_COMMENT_FORM}>
          <Avatar uid={meUid} name={meName} size={28} />
          <input
            className={COMM_COMMENT_INPUT}
            value={reply}
            maxLength={600}
            placeholder="Write a comment…"
            aria-label={`Comment on ${author}'s post`}
            onChange={(event) => onReplyChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onReply()
            }}
          />
        </div>
      </div>
    </article>
  )
}
