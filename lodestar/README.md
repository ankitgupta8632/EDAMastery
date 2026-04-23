# Lodestar

**Your learning feed. Curated by your goals.**

Paste any YouTube, Instagram, or web link. Lodestar tags it, clusters it with related content you've saved, and serves a bounded daily feed mixing deep learning with light entertainment — weighted by the goals you chose for yourself.

Built for accomplished performers who don't have time to curate. The content is already out there; Lodestar is the curator.

## Why this exists
Meta and TikTok optimise feeds for engagement. Great, for them. Lodestar borrows the same dopamine loops — streaks, variable rewards, progress rings — and redirects them toward a goal *you* chose. No infinite scroll. Bounded daily budgets. Friction breaks at 30/60/90 minutes to remind you to stretch, drink water, or check on the kids.

## What's in v0.1 (this build)
- **Ingestion:** YouTube (title, author, thumbnail, transcript), web articles (Readability), Instagram (Manus-ready stub)
- **AI pipeline:** Claude extracts topics, summary, takeaways, vibe (deep/light), difficulty, estimated minutes. OpenAI embeds the result for semantic search + clustering.
- **Clustering:** New links are attached to an existing cluster when similarity ≥ 0.78; otherwise a new cluster forms from the nearest neighbours. Cluster labels are Claude-generated.
- **Semantic search:** Cosine similarity over stored embeddings. Understands meaning, not just keywords.
- **Daily feed:** Interleaves deep / light / serendipity slots up to your minute budget. Skips items you dismissed; avoids re-serving completed ones.
- **Cluster deep-dives:** One-tap Claude synthesis that reads every link in a cluster and writes a single lesson.
- **Addictive-for-good UX:** Streak with grace day, progress ring, friction-break toasts, explicit "done for today" state.

## Stack
- Next.js 16 (App Router) · React 19 · TypeScript strict
- Tailwind v4 · Framer Motion · Sonner
- Prisma 6 + SQLite
- Anthropic Claude (`claude-sonnet-4-6`) · OpenAI (`text-embedding-3-small`)
- `@mozilla/readability` · `jsdom` · `youtube-transcript`

## Setup
```bash
cp .env.example .env
# Fill in:
#   ANTHROPIC_API_KEY=...
#   OPENAI_API_KEY=...
#   (optional) MANUS_API_BASE + MANUS_API_KEY  for Instagram extraction

npm install
npm run db:push
npm run db:seed
npm run dev        # localhost:3002
```

## Runbook
1. Visit `/you` — set your life context + goals (takes 2 minutes).
2. Visit `/add` — paste a few YouTube / article links.
3. Wait 20–60s for each link to process (status pill → "Ready").
4. Visit `/` — today's feed is built from what you saved.
5. Visit `/topics` — when 2+ links cluster, open the cluster for a synthesised deep-dive.

## Design principles
- **Bounded.** No infinite scroll. The feed ends.
- **Forgiving.** Streaks have grace days. No guilt.
- **Honest.** Serendipity comes from your own library, not a fresh algorithm.
- **Airbnb-quality dark UI.** Generous whitespace, warm accents, tight typography.

## What's not here yet
- NotebookLM handoff for audio versions of cluster deep-dives (API integration deferred; the user's existing NotebookLM skill can be wired to `ClusterDeepDive` in a follow-up).
- Full Manus integration for Instagram — the adapter is wired behind `MANUS_API_BASE`/`MANUS_API_KEY` env vars; set them and Instagram ingestion activates.
- Multi-user / auth — single default user for now.
- Cloud DB — SQLite locally. Swap in Turso adapter when ready.

## License
Private.
