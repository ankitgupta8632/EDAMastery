---
name: qa
description: Validate content quality and app functionality after changes
tools: Bash, Read, Grep, Glob
---

## Purpose
Run after content generation or UX changes to verify everything works.

## Content QA Checks
1. All lessons have `contentMarkdown` (not null, >500 chars)
2. All lessons have `contentStatus = "published"`
3. All lessons have a Quiz with 4 Questions
4. Questions have valid JSON `options` arrays (parseable, 4 options each)
5. Questions have `correctAnswer` matching one of the options
6. Questions have non-empty `explanation`
7. Phase 4 lessons have substantial `protiumNote` content
8. Code blocks use valid fence syntax (```verilog or ```systemverilog)

## Build QA
1. `npm run build` passes with 0 errors
2. `npm run lint` passes

## UX QA (manual verification with preview tools)
1. Dashboard: Continue Learning card links to correct next lesson
2. Onboarding: Shows for new users, saves settings correctly
3. Lesson viewer: Content renders with syntax highlighting
4. Quiz: Questions display, scoring works, XP awarded
5. Nav: All 5 tabs work, correct active states
6. Mobile: Pages render correctly at 375px width

## Database QA
```bash
# Verify counts
npx prisma studio
# Expected: 78 lessons, 78 quizzes, ~312 questions, 4 phases, 12 modules
```
