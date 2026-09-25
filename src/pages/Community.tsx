import { useId, useMemo, useState } from 'react'
import {
  BookmarkIcon,
  ChartBarsIcon,
  ChatIcon,
  HeartIcon,
  ImageIcon,
  SendIcon,
  UsersIcon,
} from '../components/Icons'
import { accentFor, displayNameFor, initialsFor } from '../data/messages'
import {
  FEED_FILTERS,
  GROUPS,
  PEOPLE,
  PERSON_BY_UID,
  POSTS,
  RECENT_CHATS,
  type CommunityPerson,
  type CommunityPost,
  type FeedFilter,
  type PostChart as PostChartData,
} from '../data/community'
import {
  CARD,
  COMM_ACTION,
  COMM_ACTION_ON,
  COMM_ASIDE,
  COMM_ASIDE_CARD,
  COMM_ASIDE_HEAD,
  COMM_AVATAR,
  COMM_AVATAR_FACE,
  COMM_CHART_CAPTION,
  COMM_CHART_SVG,
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
  COMM_ONLINE,
  COMM_PEOPLE,
  COMM_PERSON,
  COMM_PERSON_BODY,
  COMM_PERSON_NAME,
  COMM_PERSON_ROLE,
  COMM_PERSON_TAIL,
  COMM_PERSON_UNREAD,
  COMM_POST,
  COMM_POST_ACTIONS,
  COMM_POST_BADGE,
  COMM_POST_BADGE_COACH,
  COMM_POST_CHART,
  COMM_POST_COUNTS,
  COMM_POST_HEAD,
  COMM_POST_META,
  COMM_POST_NAME,
  COMM_POST_TAGS,
  COMM_POST_TEXT,
  COMM_POST_WHO,
  COMM_RAIL,
  COMM_RAIL_ACTIVE,
  COMM_RAIL_COUNT,
  COMM_RAIL_ITEM,
  COMM_SHELL,
  COMM_TAG,
  COMM_TOOL,
  EMPTY_BLOCK,
  MUTED_NOTE,
  NEG,
  PAGE_HEAD,
  PAGE_SUB,
  PAGE_TITLE,
  PILL,
  PILL_ACCENT,
  POS,
  SOON_BADGE,
} from '../components/ui'
import type { Profile } from '../lib/profile'

/**
 * The room outside your own journal.
 *
 * Three columns: what to read on the left, the reading in the middle, who is
 * around on the right. Facebook's shape, because it is the shape everybody
 * already knows and a trading feed has nothing to gain from being novel about
 * where the composer sits.
 *
 * **Nothing here is connected.** The posts, the people and the conversation
 * previews are fixtures in `data/community.ts`; liking, saving, commenting and
 * posting all write to component state and are gone on reload. That is
 * deliberate for now — the screen exists so the shape of a community endpoint
 * can be argued about against something real rather than a description.
 *
 * The one genuinely live thing nearby is chat, which is not reimplemented
 * here: it is end-to-end encrypted, reads the Realtime Database directly, and
 * already has a home in the dock. The rail points at it rather than competing
 * with it.
 */
export function Community({ profile }: { profile: Profile | null }) {
  const [filter, setFilter] = useState<FeedFilter['id']>('feed')
  const [posts, setPosts] = useState<CommunityPost[]>(POSTS)
  const [saved, setSaved] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  /** One open comment box at a time; the drafts are keyed by post. */
  const [replies, setReplies] = useState<Record<string, string>>({})

  const me: CommunityPerson = useMemo(
    () => ({
      uid: 'me',
      name: displayNameFor(profile?.displayName ?? '', profile?.email ?? ''),
      email: profile?.email ?? '',
      accountType: profile?.accountType ?? 'individual',
      role: 'You',
      online: true,
    }),
    [profile],
  )

  const shown = useMemo(() => {
    if (filter === 'saved') return posts.filter((post) => saved.includes(post.id))
    if (filter === 'feed') return posts
    return posts.filter((post) => post.channel === filter)
  }, [filter, posts, saved])

  function toggleLike(id: string) {
    setPosts((current) =>
      current.map((post) =>
        post.id === id
          ? { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) }
          : post,
      ),
    )
  }

  function toggleSave(id: string) {
    setSaved((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    )
  }

  function publish() {
    const text = draft.trim()
    if (text === '') return

    setPosts((current) => [
      {
        id: `draft-${Date.now()}`,
        authorUid: 'me',
        age: 'just now',
        channel: 'following',
        text,
        tags: [],
        likes: 0,
        liked: false,
        comments: [],
      },
      ...current,
    ])
    setDraft('')
    // A new post is only in the unfiltered feed and "Following"; landing the
    // reader somewhere their own post is filtered out reads as a failure.
    if (filter === 'groups' || filter === 'saved') setFilter('feed')
  }

  function comment(postId: string) {
    const text = (replies[postId] ?? '').trim()
    if (text === '') return

    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [
                ...post.comments,
                {
                  id: `reply-${Date.now()}`,
                  authorUid: 'me',
                  text,
                  age: 'just now',
                },
              ],
            }
          : post,
      ),
    )
    setReplies((current) => ({ ...current, [postId]: '' }))
  }

  const counts: Record<FeedFilter['id'], number> = {
    feed: posts.length,
    following: posts.filter((post) => post.channel === 'following').length,
    groups: posts.filter((post) => post.channel === 'groups').length,
    saved: saved.length,
  }

  return (
    <>
      <div className={PAGE_HEAD}>
        <div>
          <h2 className={PAGE_TITLE}>Community</h2>
          <p className={PAGE_SUB}>
            What other traders are working on, and the people worth asking. Post a
            read, share a curve, or argue with someone about position sizing.
          </p>
        </div>
      </div>

      <div className={COMM_SHELL}>
        <nav className={COMM_RAIL} aria-label="Feed filters">
          {FEED_FILTERS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              aria-current={filter === entry.id ? 'page' : undefined}
              className={`${COMM_RAIL_ITEM} ${filter === entry.id ? COMM_RAIL_ACTIVE : ''}`}
              onClick={() => setFilter(entry.id)}
            >
              {entry.label}
              <span className={COMM_RAIL_COUNT}>{counts[entry.id]}</span>
            </button>
          ))}
        </nav>

        <div className={COMM_MAIN}>
          <section className={CARD}>
            <div className={COMM_COMPOSER}>
              <div className={COMM_COMPOSER_ROW}>
                <Avatar person={me} size={38} />
                <textarea
                  className={COMM_COMPOSER_INPUT}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={`What are you seeing, ${me.name.split(' ')[0]}?`}
                  aria-label="Write a post"
                />
              </div>

              <div className={COMM_COMPOSER_FOOT}>
                <div className={COMM_COMPOSER_TOOLS}>
                  <button type="button" className={COMM_TOOL} disabled>
                    <ImageIcon size={15} />
                    Image
                  </button>
                  <button type="button" className={COMM_TOOL} disabled>
                    <ChartBarsIcon size={15} />
                    Attach a trade
                  </button>
                </div>

                <button
                  type="button"
                  className={`${PILL} ${PILL_ACCENT}`}
                  onClick={publish}
                  disabled={draft.trim() === ''}
                >
                  <SendIcon size={15} />
                  Post
                </button>
              </div>
            </div>
          </section>

          {shown.length === 0 ? (
            <section className={`${CARD} ${EMPTY_BLOCK}`}>
              <p>
                {filter === 'saved'
                  ? 'Nothing saved yet. The bookmark on a post keeps it here.'
                  : 'No posts in this view.'}
              </p>
            </section>
          ) : (
            shown.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                me={me}
                saved={saved.includes(post.id)}
                reply={replies[post.id] ?? ''}
                onLike={() => toggleLike(post.id)}
                onSave={() => toggleSave(post.id)}
                onReplyChange={(value) =>
                  setReplies((current) => ({ ...current, [post.id]: value }))
                }
                onReply={() => comment(post.id)}
              />
            ))
          )}
        </div>

        <aside className={COMM_ASIDE}>
          <section className={`${CARD} ${COMM_ASIDE_CARD}`}>
            <h3 className={COMM_ASIDE_HEAD}>
              Messages
              <span className={SOON_BADGE}>Preview</span>
            </h3>

            <div className={COMM_PEOPLE}>
              {RECENT_CHATS.map((chat) => {
                const person = PERSON_BY_UID[chat.uid]
                return (
                  <div key={chat.uid} className={COMM_PERSON}>
                    <Avatar person={person} size={32} />
                    <span className={COMM_PERSON_BODY}>
                      <span className={COMM_PERSON_NAME}>{person.name}</span>
                      <span className={COMM_PERSON_ROLE}>{chat.preview}</span>
                    </span>
                    <span className={COMM_PERSON_TAIL}>
                      {chat.unread > 0 && (
                        <span className={COMM_PERSON_UNREAD}>{chat.unread}</span>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>

            {/*
              Pointed at rather than rebuilt. Real messages are encrypted in
              the browser and arrive over a websocket; a second, fixture-backed
              copy of that on this page would be a worse version of something
              that already works.
            */}
            <p className={MUTED_NOTE}>
              Previews only. Open the chat dock, bottom right, to actually reply.
            </p>
          </section>

          <section className={`${CARD} ${COMM_ASIDE_CARD}`}>
            <h3 className={COMM_ASIDE_HEAD}>Traders you may know</h3>
            <div className={COMM_PEOPLE}>
              {PEOPLE.slice(0, 5).map((person) => (
                <div key={person.uid} className={COMM_PERSON}>
                  <Avatar person={person} size={32} />
                  <span className={COMM_PERSON_BODY}>
                    <span className={COMM_PERSON_NAME}>{person.name}</span>
                    <span className={COMM_PERSON_ROLE}>{person.role}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className={`${CARD} ${COMM_ASIDE_CARD}`}>
            <h3 className={COMM_ASIDE_HEAD}>Groups</h3>
            <div className={COMM_PEOPLE}>
              {GROUPS.map((group) => (
                <div key={group.id} className={COMM_PERSON}>
                  <span className={COMM_AVATAR} style={{ width: 32, height: 32 }}>
                    <span
                      className={COMM_AVATAR_FACE}
                      style={{ background: accentFor(group.id), fontSize: 12 }}
                    >
                      <UsersIcon size={15} />
                    </span>
                  </span>
                  <span className={COMM_PERSON_BODY}>
                    <span className={COMM_PERSON_NAME}>{group.name}</span>
                    <span className={COMM_PERSON_ROLE}>
                      {group.members.toLocaleString()} members
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ parts */

function Avatar({ person, size }: { person: CommunityPerson; size: number }) {
  return (
    <span className={COMM_AVATAR} style={{ width: size, height: size }}>
      <span
        className={COMM_AVATAR_FACE}
        style={{ background: accentFor(person.uid), fontSize: size * 0.36 }}
      >
        {initialsFor(person.name, person.email)}
      </span>
      {person.online && <span className={COMM_ONLINE} />}
    </span>
  )
}

type PostCardProps = {
  post: CommunityPost
  me: CommunityPerson
  saved: boolean
  reply: string
  onLike: () => void
  onSave: () => void
  onReplyChange: (value: string) => void
  onReply: () => void
}

function PostCard({
  post,
  me,
  saved,
  reply,
  onLike,
  onSave,
  onReplyChange,
  onReply,
}: PostCardProps) {
  const author = post.authorUid === 'me' ? me : PERSON_BY_UID[post.authorUid]
  const isCoach = author.accountType === 'coach'

  return (
    <article className={CARD}>
      <div className={COMM_POST}>
        <header className={COMM_POST_HEAD}>
          <Avatar person={author} size={40} />
          <div className={COMM_POST_WHO}>
            <span className={COMM_POST_NAME}>
              {author.name}
              <span
                className={`${COMM_POST_BADGE} ${isCoach ? COMM_POST_BADGE_COACH : ''}`}
              >
                {author.accountType}
              </span>
            </span>
            <span className={COMM_POST_META}>
              {post.age}
              {post.group !== undefined && ` · in ${post.group}`}
            </span>
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

        {post.chart !== undefined && <PostChart chart={post.chart} />}

        <div className={COMM_POST_COUNTS}>
          <span>
            {post.likes} {post.likes === 1 ? 'like' : 'likes'}
          </span>
          <span>
            {post.comments.length}{' '}
            {post.comments.length === 1 ? 'comment' : 'comments'}
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
          <button
            type="button"
            className={`${COMM_ACTION} ${saved ? COMM_ACTION_ON : ''}`}
            aria-pressed={saved}
            onClick={onSave}
          >
            <BookmarkIcon size={16} />
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      <div className={COMM_COMMENTS}>
        {post.comments.map((entry) => {
          const who = entry.authorUid === 'me' ? me : PERSON_BY_UID[entry.authorUid]
          return (
            <div key={entry.id} className={COMM_COMMENT}>
              <Avatar person={who} size={28} />
              <div className={COMM_COMMENT_BODY}>
                <span className={COMM_COMMENT_NAME}>{who.name}</span>
                <p className={COMM_COMMENT_TEXT}>{entry.text}</p>
              </div>
            </div>
          )
        })}

        <div className={COMM_COMMENT_FORM}>
          <Avatar person={me} size={28} />
          <input
            className={COMM_COMMENT_INPUT}
            value={reply}
            placeholder="Write a comment…"
            aria-label={`Comment on ${author.name}'s post`}
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

/**
 * The attachment, drawn from numbers.
 *
 * Not an image. The client has one outbound destination and a fixture is no
 * reason to add a second, so a shared curve is a path built from samples
 * rather than a screenshot fetched from somewhere. When posts carry real
 * images they will go through the same signed-URL route trade screenshots
 * already use.
 */
function PostChart({ chart }: { chart: PostChartData }) {
  const gradient = useId()
  const width = 300
  const height = 100
  const inset = 6

  const step = width / (chart.points.length - 1)
  const y = (value: number) => height - inset - value * (height - inset * 2)

  const line = chart.points
    .map((value, index) => `${index === 0 ? 'M' : 'L'}${index * step} ${y(value)}`)
    .join(' ')

  return (
    <figure className={COMM_POST_CHART}>
      <svg
        className={`${COMM_CHART_SVG} ${chart.positive ? POS : NEG}`}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L${width} ${height} L0 ${height} Z`} fill={`url(#${gradient})`} />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <figcaption className={COMM_CHART_CAPTION}>
        <span>{chart.label}</span>
        <span className={chart.positive ? POS : NEG}>{chart.delta}</span>
      </figcaption>
    </figure>
  )
}
