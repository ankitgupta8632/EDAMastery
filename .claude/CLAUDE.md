# EDAMastery — Adaptive EDA Microlearning Platform

## What This Is
Local-first microlearning app to teach EDA (Electronic Design Automation) to a software engineer at Cadence Design Systems (Protium team). 78 lessons across 4 phases, 12 modules. Built for a busy parent — sessions are 2-20 minutes, adaptive to time-of-day, with gamification and empathy features.

## Tech Stack
- **Framework:** Next.js 16 (App Router), React 19, TypeScript (strict)
- **Styling:** Tailwind CSS v4 + shadcn/ui components
- **Database:** Prisma 6 + SQLite (`prisma/dev.db`)
- **Content:** Claude API for lesson generation, NotebookLM for audio/video
- **Extras:** Framer Motion (animations), Recharts (charts), Sonner (toasts)

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
│   └── tutor/              # Ask Claude component
├── contexts/               # AppContext (streak, settings, recommendation)
├── lib/                    # Core logic
│   ├── db.ts               # Prisma singleton
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
└── export-for-notebooklm.ts # Export lessons for audio generation
prisma/
├── schema.prisma           # 15 models
├── seed.ts                 # Curriculum seed (4 phases, 12 modules, 78 lessons)
└── migrations/
```

## Commands
```bash
npm run dev                         # Dev server (port 3001)
npm run build                       # Production build — MUST pass before any PR
npm run lint                        # ESLint check
npm run generate-content            # Populate all lessons via Claude API
npx prisma migrate dev              # Apply schema changes
npx prisma db seed                  # Re-seed curriculum metadata
npx prisma studio                   # Visual DB browser
```

## Database
- **Prisma singleton** from `src/lib/db.ts` — never instantiate PrismaClient elsewhere
- **SQLite** — no `skipDuplicates`, use upsert loops instead
- **JSON fields** stored as String — always `JSON.parse()` on read, `JSON.stringify()` on write
- **Transactions** for multi-table writes (progress + XP + streak updates)
- **DEFAULT_USER_ID** = `"default-user"` (single-user app, no auth)

## Environment Variables
```
DATABASE_URL="file:./prisma/dev.db"
ANTHROPIC_API_KEY="sk-ant-..."           # Claude API for tutor + content generation
NOTEBOOKLM_SKILL_PATH="~/.claude/skills/notebooklm"
DEFAULT_USER_ID="default-user"
```

## Content Pipeline
1. **Generation:** `scripts/generate-content.ts` uses Claude API to generate markdown + quizzes for all 78 lessons
2. **Audio:** Export content → upload to NotebookLM → generate Audio Overviews → import MP3s
3. **Tutor:** In-lesson "Ask Claude" button — tries NotebookLM first (source-grounded), falls back to Claude API

## Curriculum (78 lessons)
| Phase | Modules | Focus |
|-------|---------|-------|
| 1 Foundations | Digital Design, Verilog, Synthesis | Core EDA concepts |
| 2 RTL & Verification | SystemVerilog, UVM, Coverage | Design & test methodology |
| 3 Physical Design | STA, Place & Route, Power/SI | Gates to silicon |
| 4 Protium Mastery | FPGA Arch, Protium Compile, Runtime | Direct job relevance |

## Gamification
- **XP:** lesson=50, audio=40, quiz=5/10%, perfect=+25, review=20, streak=10, quick-win=15
- **Levels:** Novice(0) → Apprentice(500) → Practitioner(1500) → Expert(4000) → Master(8000)
- **Streaks:** 1 grace day for busy parents. 2 consecutive active days resets grace pool.
- **Achievements:** 17 badges across effort/mastery/time/empathy categories

## Testing & Verification
- `npm run build` must pass with 0 errors before considering any sprint complete
- After content generation: spot-check 3-5 random lessons for quality, code correctness, Protium relevance
- After UX changes: verify full user journey — onboarding → first lesson → complete → XP → next lesson
- API routes: test with curl or browser dev tools for correct responses
- Use `npx prisma studio` to verify database state after any data-modifying operation

## Key Constraints
- **No `any`** — TypeScript strict mode, use proper types
- **Server Components by default** — `"use client"` only for interactivity
- **Tailwind only** — no inline styles, no CSS modules. Use `cn()` for conditional classes.
- **No unused code** — delete dead code, don't comment it out
- **Mobile-first** — all pages must work on phone (bottom nav, responsive grids)
- **Empathy-first** — never guilt-based messaging, celebrate small wins, respect time constraints
