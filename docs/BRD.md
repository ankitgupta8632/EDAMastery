# EDAMastery — Business Requirements Document

**Version:** 1.0
**Date:** 2026-04-03
**Author:** Claude Code + User
**Status:** Approved

---

## 1. Executive Summary

EDAMastery is a personal adaptive learning platform that transforms a software engineer into an EDA (Electronic Design Automation) expert through microlearning. Powered by NotebookLM-generated content, it delivers 5-20 minute sessions that adapt to context — commuting, focused time, or quick breaks — while gamifying the journey and empathizing with the constraints of a working parent.

## 2. Problem Statement

A principal software engineer at Cadence Design Systems works on Protium (FPGA-based prototyping) but lacks deep EDA domain knowledge. Traditional EDA courses require hours-long sessions and rigid schedules — incompatible with parenting a 1.5-year-old while maintaining a demanding career.

**The engineer needs a learning system that:**
- Fits into fragmented time slots (commute, baby naps, evening wind-down)
- Delivers content in multiple modalities (audio when hands are busy, visual when focused)
- Tracks progress and maintains motivation despite irregular schedules
- Connects abstract EDA concepts to concrete Protium work
- Never creates guilt or pressure — only encouragement

## 3. User Persona

| Attribute | Detail |
|-----------|--------|
| **Role** | Principal Software Engineer, Cadence Design Systems |
| **Team** | Protium (FPGA-based prototyping/emulation) |
| **Family** | Spouse, 1.5-year-old infant |
| **Support** | Nanny, maid, cook — but still very busy |
| **Available time** | 15-30 min/day in fragments |
| **Learning pref** | NotebookLM audio podcasts, infographics, interactive tools |
| **Motivation** | Career confidence, meaningful EDA discussions, deep Protium understanding |

### Typical Schedule
- **Morning commute:** 15-20 min (audio-friendly, hands busy)
- **Work:** 8-10 hours (no learning time)
- **Evening:** 1-2 hours shared — family, chores, personal
- **Baby nap:** 30-60 min (unpredictable, high-value focus time)
- **Weekend:** Family-first, minimal learning

## 4. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Complete EDA foundations | Phase 1 completion | 100% in 2 weeks |
| Build Protium-relevant expertise | Phase 4 completion | 100% in 7 weeks |
| Maintain learning habit | Average streak length | 5+ days |
| Retain knowledge | Spaced repetition accuracy | 80%+ |
| Feel confident in EDA discussions | Self-assessed confidence | 4+/5 per module |
| Never feel guilty about pace | Overwhelmed mode usage | Decreasing over time |
| Enjoy the process | Session completion rate | 90%+ |

## 5. Feature Requirements

### 5.1 Adaptive Learning Engine (P0 — Must Have)

| ID | Requirement |
|----|-------------|
| FR-001 | System SHALL detect time-of-day and recommend appropriate learning mode |
| FR-002 | System SHALL support 4 session modes: Commute (audio), Focus (visual), Quick Win (2 min), Baby Napping (15 min) |
| FR-003 | System SHALL track lesson prerequisites and unlock modules progressively |
| FR-004 | System SHALL implement SM-2 spaced repetition for knowledge retention |
| FR-005 | System SHALL adapt daily goals when user activates overwhelmed mode |

### 5.2 Content Delivery (P0 — Must Have)

| ID | Requirement |
|----|-------------|
| FR-010 | System SHALL display markdown lessons with syntax-highlighted Verilog/SystemVerilog code |
| FR-011 | System SHALL provide custom audio player with speed control (0.5x-2x) and skip controls |
| FR-012 | Each lesson SHALL include a "How this applies to Protium" section |
| FR-013 | System SHALL link to external hands-on labs (EDA Playground, Makerchip) |
| FR-014 | System SHALL support 3 content types: audio, visual, mixed |

### 5.3 Assessment & Progress (P0 — Must Have)

| ID | Requirement |
|----|-------------|
| FR-020 | Each lesson SHALL have a 3-5 question quiz |
| FR-021 | Quizzes SHALL provide immediate feedback with explanations |
| FR-022 | System SHALL track completion percentage per module and phase |
| FR-023 | System SHALL provide confidence self-assessment (1-5) per lesson |
| FR-024 | System SHALL display progress analytics (completion bars, heat map, velocity) |

### 5.4 Gamification (P1 — Should Have)

| ID | Requirement |
|----|-------------|
| FR-030 | System SHALL award XP for lesson completion, quizzes, reviews, and streaks |
| FR-031 | System SHALL track 5 levels: Novice → Apprentice → Practitioner → Expert → Master |
| FR-032 | System SHALL maintain daily streaks with 1 grace day for busy parents |
| FR-033 | System SHALL award 15+ achievement badges for milestones |
| FR-034 | System SHALL display confetti animation on level-up and achievements |
| FR-035 | System SHALL generate weekly progress reports |

### 5.5 Empathy Features (P1 — Should Have)

| ID | Requirement |
|----|-------------|
| FR-040 | System SHALL provide "I'm overwhelmed" button reducing goals for 3 days |
| FR-041 | System SHALL never use guilt-based language in reminders |
| FR-042 | System SHALL celebrate every small win (even 2-minute sessions) |
| FR-043 | System SHALL make weekend learning optional (off by default) |
| FR-044 | System SHALL provide "Quick Win" mode always accessible from dashboard |

### 5.6 Content Pipeline (P0 — Must Have)

| ID | Requirement |
|----|-------------|
| FR-050 | System SHALL integrate with NotebookLM for content generation |
| FR-051 | System SHALL parse NotebookLM responses into structured lessons |
| FR-052 | System SHALL auto-generate quiz questions from lesson content |
| FR-053 | System SHALL support manual audio file upload for Audio Overviews |
| FR-054 | Admin UI SHALL track NotebookLM query rate limits (50/day) |

### 5.7 Settings & Customization (P2 — Nice to Have)

| ID | Requirement |
|----|-------------|
| FR-060 | User SHALL configure daily goal (5-60 minutes) |
| FR-061 | User SHALL configure commute and evening time windows |
| FR-062 | User SHALL configure audio playback speed preference |
| FR-063 | User SHALL toggle between auto/audio/visual/mixed mode preference |

## 6. EDA Curriculum

### 6.1 Structure: 12 Modules, 4 Phases, ~75 Lessons

**Phase 1 — Foundations (Weeks 1-2):**
1. **Digital Design Fundamentals** (6 lessons) — Sequential/combinational logic, flip-flops, clock domains
2. **Verilog HDL** (7 lessons) — Data types, behavioral modeling, testbenches
3. **Logic Synthesis** (6 lessons) — RTL-to-gates, optimization, constraints

**Phase 2 — RTL & Verification (Weeks 3-4):**
4. **SystemVerilog** (7 lessons) — Interfaces, assertions, design patterns
5. **UVM Verification** (8 lessons) — Testbench architecture, TLM, drivers/monitors
6. **Coverage & Closure** (6 lessons) — Functional/code coverage, metrics, sign-off

**Phase 3 — Physical Design (Weeks 5-6):**
7. **Static Timing Analysis** (7 lessons) — Timing paths, slack, constraints
8. **Place & Route** (7 lessons) — Placement, routing, parasitic extraction
9. **Power & Signal Integrity** (6 lessons) — Dynamic/static power, crosstalk, PDN

**Phase 4 — Protium Mastery (Week 7):**
10. **FPGA Architecture** (6 lessons) — LUTs, CLBs, FPGA vs ASIC flow
11. **Protium Compilation** (7 lessons) — Elaboration, partitioning, synthesis, P&R
12. **Protium Runtime & Debug** (6 lessons) — Execution, software bring-up, debugging

### 6.2 Prerequisite Dependency Graph

```
Digital Design ──→ Verilog ──→ Synthesis ──→ STA ──→ P&R ──→ Power/SI
                      │              │                │
                      ↓              │                │
                SystemVerilog        │                │
                      │              ↓                │
                      ↓         FPGA Arch ────────────┘
                    UVM              │
                      │              ↓
                      ↓        Protium Compile
                  Coverage           │
                                     ↓
                               Protium Runtime
```

### 6.3 Pedagogy Principles

- **Microlearning:** 5-20 minutes per session, never more
- **Lesson structure:** Hook (1 min) → Core Concepts (8-12 min) → Practice (3-5 min) → Protium Connection (2 min) → Takeaway (1 min)
- **Spaced repetition:** Auto-scheduled reviews using SM-2 algorithm
- **Progressive unlock:** Prerequisite graph enforced
- **Real-world hooks:** Every lesson starts with "Why does this matter for your Protium work?"
- **Multi-modal:** Audio podcasts (NotebookLM) + visual infographics + interactive labs
- **Confidence tracking:** Self-assessment after each lesson, quiz-derived scores

### 6.4 Content Sourcing Strategy

Per module, a NotebookLM notebook is created with:
- Relevant textbook chapters (Harris & Harris, Wang et al.)
- Verification Academy articles
- Cadence training materials (Cadence employee access)
- IEEE standards excerpts (SystemVerilog LRM, UVM)
- Open-source tool docs (Yosys, Verilator, Icarus Verilog)
- Protium datasheets and technical notes
- Conference papers (DVCON, DAC)

Audio: Generate Audio Overviews in NotebookLM per module → 2 AI hosts discuss topic → download MP3 → upload to app.

## 7. Gamification Design

### 7.1 XP System

| Activity | XP |
|----------|-----|
| Complete lesson | 50 |
| Complete audio lesson | 40 |
| Quiz per 10% score | 5 (max 50) |
| Perfect quiz bonus | +25 |
| Complete review item | 20 |
| Daily streak bonus | 10 |
| Quick win session | 15 |

### 7.2 Levels

| Level | Name | XP Required |
|-------|------|-------------|
| 1 | Novice | 0 |
| 2 | Apprentice | 500 |
| 3 | Practitioner | 1,500 |
| 4 | Expert | 4,000 |
| 5 | Master | 8,000 |

### 7.3 Streak System (Parent-Friendly)

- **Grace days:** Miss 1 day → streak preserved (1 grace day)
- **Grace day reset:** 2 consecutive active days after using a grace day resets the grace day pool
- **Broken streak:** "Welcome back!" celebration, no guilt messaging
- **Weekend:** Learning is optional by default

### 7.4 Achievements (17 badges)

**Effort:** First Step, Getting Started (3d), Week Warrior (7d), Fortnight Force (14d), Monthly Master (30d)
**Mastery:** Quiz Taker, Perfect Score, Module Master, Phase Champion, Solid Foundation, Protium Pro
**Time:** Early Bird (<7 AM), Night Owl (>10 PM), Speed Demon (<5 min)
**Empathy:** Parent Hero (10 quick wins), Comeback Kid (grace day used), Review Master (50 reviews)

## 8. Technical Architecture

### 8.1 Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | SQLite via Prisma |
| Animations | Framer Motion |
| Charts | Recharts |
| Audio | HTML5 Audio API |
| Content | NotebookLM (via Python skill) |

### 8.2 Key Architectural Decisions

1. **Local-first:** Everything runs on localhost:3000. SQLite DB. Zero infrastructure.
2. **Content decoupled from runtime:** NotebookLM used only during admin content creation. Learning experience works offline.
3. **Server + Client Components:** Data fetching in Server Components, interactivity in Client Components.
4. **Python skill integration:** NotebookLM at `~/.claude/skills/notebooklm/` called via `child_process.execFile`.
5. **Empathy as data:** Grace days, overwhelmed mode, and reduced goals are first-class database fields.

### 8.3 Database (13 models)

User, Phase, Module, ModulePrerequisite, Lesson, LessonProgress, Quiz, Question, QuizAttempt, ReviewItem, UserAchievement, Streak, LearningSession, UserSettings

## 9. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-001 | App SHALL load any page in < 500ms (local SQLite) |
| NFR-002 | Audio player SHALL support background playback |
| NFR-003 | All user data SHALL persist in local SQLite |
| NFR-004 | App SHALL work fully offline after content is generated |
| NFR-005 | UI SHALL be responsive (mobile-friendly) |

## 10. Timeline

| Phase | Duration | Content |
|-------|----------|---------|
| App Build | 1 session | Full app implementation |
| Content Generation | 8 days | ~50 queries/day via NotebookLM |
| Content Review | 2-3 days | User reviews and edits |
| Audio Generation | 2-3 days | Manual NotebookLM Audio Overviews |
| **Total to Launch** | **~2 weeks** | |
| **Learning Journey** | **~7 weeks** | Daily 15-min sessions |

## 11. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| NotebookLM rate limits (50/day) | Batch generation across days; cache all content locally |
| Content quality from AI generation | Admin review/edit workflow before publishing |
| User drops off due to life demands | Grace days, overwhelmed mode, quick wins, gentle messaging |
| Audio generation is manual | Guide user through NotebookLM UI; audio is optional (text always available) |
| Curriculum too theoretical | Every lesson has "Protium Connection" section; Phase 4 is entirely Protium-specific |
