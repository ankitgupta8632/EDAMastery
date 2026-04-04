# EDAMastery — Adaptive EDA Microlearning Platform

## What This Is
Mobile-first microlearning app to teach EDA (Electronic Design Automation) to a software engineer at Cadence Design Systems (Protium team). 79 lessons across 4 phases, 12 modules. Built for a busy parent — sessions are 2-20 minutes, adaptive to time-of-day, with gamification and empathy features.

**Live:** https://eda-mastery.vercel.app

## Tech Stack
- **Framework:** Next.js 16 (App Router), React 19, TypeScript (strict)
- **Styling:** Tailwind CSS v4 — dark theme (`bg-[#121212]`), green accent, Airbnb-quality UI
- **Database:** Prisma 6 + Turso (hosted libSQL) — cloud-ready, no local SQLite dependency in prod
- **Media:** Vercel Blob CDN for audio/video/infographics
- **Content:** Claude API for lesson generation, NotebookLM for audio/video/infographics
- **Extras:** Framer Motion (animations), Recharts (charts), Sonner (toasts)

## Infrastructure

### Database (Turso)
- **Production:** `libsql://edamastery-ankitgupta8632.aws-ap-south-1.turso.io`
- **Adapter:** `@prisma/adapter-libsql` → `PrismaLibSql` (note lowercase 'q')
- **Fallback:** If `TURSO_DATABASE_URL` not set, falls back to local SQLite (`file:./prisma/dev.db`)
- **Local DB path:** `prisma/prisma/dev.db` (resolved from `file:./prisma/dev.db` relative to prisma dir)
- **CLI:** `~/.turso/turso` — `turso db shell edamastery` for direct SQL access
- **Migrations:** `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script | turso db shell edamastery` (Prisma Migrate doesn't work with Turso)

### Media (Vercel Blob)
- Audio/video/infographics served from `1v1a8vrvk4rgkkxq.public.blob.vercel-storage.com/edamastery/`
- Upload script: `npm run upload-media` (reads from `public/audio/`, `public/video/`, `public/infographics/`)
- Local media files are gitignored — only served from CDN in production

### Deployment (Vercel)
- Auto-deploys from `main` branch on GitHub (`ankitgupta8632/EDAMastery`)
- Project: `eda-mastery` on Vercel (team: `ankitgupta8632-2441s-projects`)
- Environment variables must be set in Vercel dashboard for Production:
  - `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BLOB_READ_WRITE_TOKEN`, `ANTHROPIC_API_KEY`, `DEFAULT_USER_ID`

## Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/                # 13 API routes (progress, streak, quiz, review, settings, etc.)
│   ├── learn/              # Module browser → lesson viewer
│   ├── review/             # Spaced repetition sessions
│   ├── quiz/[quizId]/      # Quiz taking
│   ├── progress/           # Analytics dashboard
│   ├── achievements/       # Gamification hub
│   ├── settings/           # User preferences
│   └── admin/              # Content management (hidden from main nav)
├── components/
│   ├── layout/             # header.tsx, nav-bar.tsx
│   ├── ui/                 # shadcn/ui components
│   ├── onboarding/         # First-time user flow
│   └── tutor/              # Ask Claude + podcast tutor
├── contexts/               # AppContext (streak, settings, recommendation)
├── lib/                    # Core logic
│   ├── db.ts               # Prisma singleton (Turso adapter with local SQLite fallback)
│   ├── constants.ts        # XP, levels, achievements, learning modes
│   ├── gamification.ts     # XP, streaks, achievements
│   ├── spaced-repetition.ts # SM-2 algorithm
│   ├── adaptive-engine.ts  # Time-based mode recommendations
│   ├── claude-client.ts    # Claude API wrapper for tutor
│   ├── notebooklm.ts       # NotebookLM Python skill wrapper
│   ├── content-parser.ts   # Parse NotebookLM responses
│   └── quiz-generator.ts   # Generate quiz questions
├── types/                  # TypeScript interfaces
└── hooks/                  # Custom React hooks
scripts/
├── generate-content.ts     # Bulk lesson generation via Claude API
├── export-for-notebooklm.ts # Export lessons for NotebookLM source upload
├── import-audio.ts         # Import audio files and update DB
├── upload-media.ts         # Upload media to Vercel Blob CDN
└── evaluate-content.ts     # Content quality evaluation
prisma/
├── schema.prisma           # 15 models (sqlite provider, driverAdapters not needed in v6+)
├── seed.ts                 # Curriculum seed (Turso-aware via PrismaLibSql adapter)
└── migrations/
```

## Commands
```bash
npm run dev                         # Dev server (port 3001, 0.0.0.0)
npm run build                       # Production build — MUST pass before any PR
npm run lint                        # ESLint check
npm run generate-content            # Populate all lessons via Claude API
npm run upload-media                # Upload audio/video/infographics to Vercel Blob
npm run import-audio                # Import audio files from public/audio/ to DB
npm run export-notebooklm           # Export lesson content for NotebookLM upload
npx prisma db seed                  # Seed curriculum to Turso (reads TURSO_* from .env.local)
npx prisma studio                   # Visual DB browser (local SQLite only)
```

## Node.js Path
- Node.js: `/usr/local/bin/node` (NOT on shell PATH in Claude Code sandbox)
- npm/npx: `/usr/local/bin/npm`, `/usr/local/bin/npx`
- Use `PATH="/usr/local/bin:$PATH" npx ...` or `/usr/local/bin/node ./node_modules/.bin/...`

## Database
- **Prisma singleton** from `src/lib/db.ts` — never instantiate PrismaClient elsewhere
- **Turso in prod**, SQLite locally — adapter auto-selected by env vars
- **JSON fields** stored as String — always `JSON.parse()` on read, `JSON.stringify()` on write
- **Transactions** for multi-table writes (progress + XP + streak updates)
- **DEFAULT_USER_ID** = `"default-user"` (single-user app, no auth)
- **PrismaLibSql** (lowercase 'q') — NOT `PrismaLibSQL`

## Environment Variables (.env.local)
```
DATABASE_URL="file:./prisma/dev.db"           # Local SQLite fallback
TURSO_DATABASE_URL="libsql://..."             # Turso cloud DB
TURSO_AUTH_TOKEN="eyJ..."                     # Turso auth token
ANTHROPIC_API_KEY="sk-ant-..."                # Claude API for tutor + content generation
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."    # Vercel Blob for media uploads
DEFAULT_USER_ID="default-user"
NOTEBOOKLM_SKILL_PATH="~/.claude/skills/notebooklm"
```

## Content Pipeline
1. **Generation:** `scripts/generate-content.ts` — Claude API generates markdown + quizzes for all 79 lessons
2. **Export:** `scripts/export-for-notebooklm.ts` — exports lesson content as markdown for NotebookLM upload
3. **NotebookLM:** Upload sources → generate Audio Overview, Video Overview, Infographic per lesson
4. **Download:** Download generated media from NotebookLM (manual Save required for each)
5. **Upload:** `npm run upload-media` — pushes media to Vercel Blob CDN, updates DB URLs
6. **Tutor:** In-lesson "Ask Claude" button — tries NotebookLM first (source-grounded), falls back to Claude API

### NotebookLM Notebooks
- Lesson 1: https://notebooklm.google.com/notebook/87f251c3-067b-4c94-8bd5-4ecd0a8495b8
- Lesson 2: https://notebooklm.google.com/notebook/99fc48ec-d573-452b-a847-1c38b2ff5ff1

### Media Status
- Lessons 1-2: Full media (audio, video, infographic) uploaded to Vercel Blob
- Lessons 3-79: Content generated, no media yet

## Curriculum (79 lessons)
| Phase | Modules | Focus |
|-------|---------|-------|
| 1 Foundations | Digital Design, Verilog, Synthesis | Core EDA concepts |
| 2 RTL & Verification | SystemVerilog, UVM, Coverage | Design & test methodology |
| 3 Physical Design | STA, Place & Route, Power/SI | Gates to silicon |
| 4 Protium Mastery | FPGA Arch, Protium Compile, Runtime | Direct job relevance |

## UI Design
- **Dark theme:** `bg-[#121212]` background, `text-white/XX` text, `border-white/[0.06]` borders
- **Accent:** Green (`bg-green-500`) for CTAs
- **Style:** Airbnb-quality — warm, generous whitespace, bold headlines, rounded cards
- **Lesson content:** Flows directly on page (no card wrapper), markdown with syntax highlighting
- **Content order:** Video Overview → Audio Player → Text Content → Protium Note → Infographic → Confidence + Complete
- **Mobile-first:** Bottom nav bar (Home, Learn, Review, Progress, Awards), sticky header

## Gamification
- **XP:** lesson=50, audio=40, quiz=5/10%, perfect=+25, review=20, streak=10, quick-win=15
- **Levels:** Novice(0) → Apprentice(500) → Practitioner(1500) → Expert(4000) → Master(8000)
- **Streaks:** 1 grace day for busy parents. 2 consecutive active days resets grace pool.
- **Achievements:** 17 badges across effort/mastery/time/empathy categories

## Key Constraints
- **No `any`** — TypeScript strict mode, use proper types
- **Server Components by default** — `"use client"` only for interactivity
- **Tailwind only** — no inline styles, no CSS modules. Use `cn()` for conditional classes.
- **No unused code** — delete dead code, don't comment it out
- **Mobile-first** — all pages must work on phone (bottom nav, responsive grids)
- **Empathy-first** — never guilt-based messaging, celebrate small wins, respect time constraints

## API Response Pattern
- Content API (`/api/content/[lessonId]`) explicitly constructs the JSON response object — when adding new fields to the Lesson model, you MUST also add them to the response builder in the route handler
- The API supports both `id` and `slug` lookup for lessons
