# Lodestar — Agent guardrails

> Replace any part of this file with the canonical harness when it arrives. Until then, these are the rules.

## This is NOT the Next.js you know
This repo targets **Next.js 16** (App Router) + **React 19** + **Tailwind v4**. APIs differ from older docs. Prefer reading files in `node_modules/next/dist/` over guessing.

## Non-negotiables
- **No `any`**, no `as any`, no `@ts-ignore`. TypeScript strict mode.
- **Server Components by default.** Add `"use client"` only when you need useState / useEffect / event handlers / browser APIs / framer-motion.
- **Tailwind only** — no inline `style={...}` except for dynamic values that cannot be expressed as classes (e.g. width percentages, transform coords). No CSS modules, no styled-components.
- **Prisma singleton** from `@/lib/db` — never `new PrismaClient()` elsewhere.
- **No unused code** — delete dead code, don't comment it out.
- **No half-built features** — stub cleanly or cut the scope.

## File conventions
- Components: PascalCase (`FeedCard.tsx`)
- Utilities/hooks: camelCase (`useFeed.ts`, `clustering.ts`)
- Route dirs: kebab-case (`/topics/[id]`)
- Path alias: `@/` → `./src/`
- API routes: `GET`/`POST`/`PUT` exports, return `NextResponse.json`

## Dark UI Design
- Background `bg-[#0A0A0B]`, surface `bg-[#121214]`, borders `border-white/[0.06]`
- Text `text-[--color-ink]`, muted `text-[--color-ink-muted]`
- Accents: gold `#F5B754`, coral `#FF7A7A`, violet `#A78BFA`
- Airbnb-quality: generous whitespace, tall line-height, bold headlines, rounded `rounded-2xl` / `rounded-3xl`
- Mobile-first: base styles for mobile, `sm:`/`md:`/`lg:` for larger. Bottom nav on mobile.

## AI pipeline
- Anthropic Claude (`claude-sonnet-4-6`) for extraction, clustering labels, deep-dives
- OpenAI `text-embedding-3-small` (1536 dim) for embeddings
- All AI calls must be resilient: catch, log, fall back gracefully. Never block UI on AI.

## Addictive-for-good (house style)
- **Streaks must forgive.** Grace day per week. Never shame.
- **Bounded feed.** No infinite scroll. Daily budget → explicit "done" state.
- **Variable reward, not bait.** Serendipity cards come from the user's own library.
- **Friction on demand.** At 30/60/90 min, offer a break, never force.
- **Celebration over criticism.** Every completion earns a beat.

## Git
- Branch: `claude/learning-feed-app-8DfhM` in the outer `EDAMastery` repo (lodestar lives at `/lodestar/`).
- Commit messages: conventional (`feat:`, `fix:`, `refactor:`, `chore:`).
- Never skip hooks, never force-push.
