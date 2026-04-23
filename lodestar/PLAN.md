# Lodestar — Overnight Build Plan

> Your learning feed. Curated by your goals, not an algorithm optimised for engagement.

## Vision
Paste any YouTube / Instagram / web link → Lodestar tags it, clusters it with related content, and serves it back in a **bounded daily feed** that mixes deep learning with light entertainment, weighted by the user's life context (career, health, family, curiosity). Target audience: high-performers who don't have time to figure out *what* to learn.

## North Star
Replace the user's default scrolling app. Occupy that same screen time — but every minute moves them toward a goal they chose, not an outcome Meta/TikTok chose for them.

## Design Ethos: Addictive-For-Good
Borrow dopamine loops from TikTok/Reels, but redirect the target.
| Loop | TikTok | Lodestar |
|------|--------|----------|
| Streak | Snapchat-style, punishing | Grace days, celebration-only |
| Variable reward | Random viral clip | Serendipity card from a cluster you forgot about |
| Social proof | Likes, views | "This connects to 4 things you already watched" |
| Progress | Watch time = profit | Progress ring toward *your* goal |
| Infinite scroll | No bottom | Bounded daily budget, explicit "done for today" |
| Friction | None (bad) | 30/60/90-min nudges: stretch, water, family |

## Architecture
- **Framework:** Next.js 16 App Router + React 19 + TypeScript strict
- **Styling:** Tailwind v4, dark theme (`bg-[#0A0A0A]`), gradient accents (violet → coral)
- **DB:** Prisma 6 + SQLite (local file). Schema designed so Turso swap is a one-liner later.
- **AI:**
  - Anthropic Claude (`claude-sonnet-4-6`) — topic/entity extraction, cluster labels, deep-dives
  - OpenAI `text-embedding-3-small` (1536-dim) — semantic search + clustering
- **Ingestion:**
  - YouTube — `youtube-transcript` + oEmbed
  - Web — `@mozilla/readability` + `cheerio`
  - Instagram — Manus client stub (auth via Manus credentials, NOT user's personal creds)
- **State:** React contexts + server actions. No Redux/Zustand.

## Data Model (15 tables)
```
User (single default user, no auth)
Profile (lifeContext JSON: health, career, family)
Goal (name, category, priority, notes)
Link (url, source, title, description, thumbnail, author, durationSec, transcript, rawText, status, addedAt)
LinkTopic (linkId, topicId, confidence)
Topic (name, slug, aliases)
Embedding (linkId UNIQUE, vector BLOB, model, dims)
Cluster (id, label, summary, topicIdsJson)
ClusterLink (clusterId, linkId, centrality)
FeedSession (date UNIQUE, minutesTarget, minutesWatched, completedAt)
FeedItem (sessionId, linkId, position, slot: deep|light|serendipity, status)
Interaction (linkId, action: opened|completed|saved|dismissed|loved, msWatched, at)
Streak (current, longest, lastActiveDate, graceUsed)
DailySummary (date, minutesDeep, minutesLight, topicsJson, reflection)
ClusterDeepDive (clusterId, bodyMarkdown, generatedAt)
```

## App Structure
```
src/
├── app/
│   ├── page.tsx                    # Feed — today's session
│   ├── add/page.tsx                # Paste URL
│   ├── library/page.tsx            # All saved, filters
│   ├── search/page.tsx             # Semantic search
│   ├── topics/page.tsx             # Clusters grid
│   ├── topics/[id]/page.tsx        # Cluster detail + deep-dive
│   ├── you/page.tsx                # Profile + goals + stats
│   └── api/
│       ├── links/route.ts          # POST ingest, GET list
│       ├── links/[id]/route.ts     # GET detail, DELETE
│       ├── links/[id]/process/route.ts  # Trigger pipeline
│       ├── search/route.ts         # Semantic search
│       ├── feed/today/route.ts     # Today's session
│       ├── feed/[id]/interact/route.ts  # Record interaction
│       ├── clusters/route.ts       # List clusters
│       ├── clusters/[id]/route.ts  # Cluster detail
│       ├── clusters/[id]/deepdive/route.ts  # Claude deep-dive
│       ├── profile/route.ts        # GET/PUT profile
│       ├── goals/route.ts          # CRUD goals
│       └── stats/route.ts          # Analytics
├── components/
│   ├── layout/                     # nav-bar.tsx, header.tsx
│   ├── feed/                       # feed-card.tsx, progress-ring.tsx, streak-badge.tsx
│   ├── ingest/                     # paste-box.tsx, link-status.tsx
│   ├── ui/                         # button, card, badge, skeleton, input
│   └── charts/
├── lib/
│   ├── db.ts                       # Prisma singleton
│   ├── ingest/
│   │   ├── youtube.ts              # transcript + oEmbed
│   │   ├── web.ts                  # readability
│   │   ├── instagram.ts            # Manus stub
│   │   └── index.ts                # dispatcher
│   ├── ai/
│   │   ├── anthropic.ts            # Claude client
│   │   ├── openai.ts               # OpenAI client
│   │   ├── extract.ts              # topic/entity extraction
│   │   ├── embed.ts                # embedding helpers
│   │   ├── cluster.ts              # clustering logic
│   │   └── deepdive.ts             # cluster → lesson generation
│   ├── feed/
│   │   ├── engine.ts               # daily feed algorithm
│   │   ├── interleave.ts           # deep/light mixing
│   │   └── goals.ts                # goal-weighting
│   ├── search.ts                   # cosine similarity ranking
│   ├── vector.ts                   # blob ↔ Float32Array
│   ├── streak.ts                   # streak logic with grace
│   └── constants.ts
├── types/
└── hooks/
```

## Overnight Phases
1. **Scaffold** (20m): Next.js init, deps, Tailwind, harness docs
2. **Schema** (15m): Prisma schema + migrate + singleton
3. **Ingestion** (45m): YT/web/IG adapters + pipeline API
4. **AI** (45m): Claude extract + OpenAI embed + clustering
5. **Search** (20m): cosine ranking API + UI
6. **Feed engine** (45m): daily mix algorithm + UI cards
7. **Profile/goals** (20m): life context editor
8. **Topics + deep-dives** (30m): cluster browser + Claude generation
9. **Stats** (15m): charts for time invested
10. **Polish** (45m): animations, skeletons, end-of-day reflection
11. **Build + fix** (30m): lint, typecheck, fix
12. **Commit + push**

## Resilience Policy
Per user directive: **keep building after failures**. If any phase blocks after reasonable retries:
- Note the blocker in PLAN.md `## Blockers`
- Stub the minimum interface so downstream phases unblock
- Continue forward

## Blockers
_(populated during build)_
