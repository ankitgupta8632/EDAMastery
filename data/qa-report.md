# QA Report — EDAMastery
Date: 2026-04-03

## Summary
- Total tests: 42
- Passed: 30
- Bugs found: 12 (Critical: 1, High: 4, Medium: 5, Low: 2)

## Bugs

### BUG-001: longestStreak never updated on first activity
- **Severity:** High
- **Steps:** Create a fresh user (or use seeded data). Complete a lesson. Check streak via `GET /api/streak`.
- **Expected:** `longestStreak` should be 1 (equal to `currentStreak`).
- **Actual:** `longestStreak` remains 0. The DB record shows `currentStreak: 1, longestStreak: 0`.
- **Root cause:** In `src/lib/gamification.ts`, the `updateStreak()` function has an early `return` on line 86 (first-ever activity branch, when `lastActiveDate` is null) that returns BEFORE the `longestStreak = Math.max(...)` update on line 127.
- **File:** `/Users/ankitgupta/Desktop/EDAMastery/src/lib/gamification.ts` lines 81-86

### BUG-002: GET /api/progress ignores userId parameter — hardcoded to default-user
- **Severity:** High
- **Steps:** Call `GET /api/progress?userId=other-user`.
- **Expected:** Should return progress for `other-user` (empty/zero completions).
- **Actual:** Returns `default-user` progress (shows 2 completedLessons). The route hardcodes `DEFAULT_USER_ID` on line 19 instead of reading the query parameter.
- **File:** `/Users/ankitgupta/Desktop/EDAMastery/src/app/api/progress/route.ts` line 8-9 (GET handler missing query param extraction)

### BUG-003: POST /api/progress accepts invalid status values
- **Severity:** High
- **Steps:** `POST /api/progress` with body `{"lessonId":"<valid>","status":"invalid_status"}`.
- **Expected:** Should return 400 error for invalid status (only "in_progress", "completed" should be valid).
- **Actual:** Returns 200 and saves `"invalid_status"` to the database. This corrupts lesson progress data.
- **File:** `/Users/ankitgupta/Desktop/EDAMastery/src/app/api/progress/route.ts` — no validation on status field value

### BUG-004: Settings API accepts negative and unreasonable values
- **Severity:** Medium
- **Steps:** `PUT /api/settings` with `{"userId":"default-user","dailyGoalMinutes":-5}` or `{"dailyGoalMinutes":99999}`.
- **Expected:** Should reject negative values and enforce reasonable bounds.
- **Actual:** Accepts and saves `-5` and `99999` as `dailyGoalMinutes`. This would break the UI goal tracking.
- **File:** `/Users/ankitgupta/Desktop/EDAMastery/src/app/api/settings/route.ts` — no input validation on PUT handler

### BUG-005: POST /api/progress accepts negative timeSpentSec
- **Severity:** Medium
- **Steps:** `POST /api/progress` with `{"lessonId":"<valid>","status":"completed","timeSpentSec":-100}`.
- **Expected:** Should reject negative time values.
- **Actual:** Saves `-100` as `timeSpentSec`. No input validation on numeric fields.
- **File:** `/Users/ankitgupta/Desktop/EDAMastery/src/app/api/progress/route.ts`

### BUG-006: POST /api/progress with nonexistent lessonId returns 500 instead of 404
- **Severity:** Medium
- **Steps:** `POST /api/progress` with `{"lessonId":"nonexistent","status":"completed"}`.
- **Expected:** Should return 404 with "Lesson not found" error.
- **Actual:** Returns 500 "Failed to update progress" (unhandled Prisma foreign key constraint error).
- **File:** `/Users/ankitgupta/Desktop/EDAMastery/src/app/api/progress/route.ts` — no pre-validation that lessonId exists

### BUG-007: Review API GET ignores limit query parameter
- **Severity:** Low
- **Steps:** `GET /api/review?userId=default-user&limit=5`.
- **Expected:** Should limit results to 5 items.
- **Actual:** The `limit` parameter is completely ignored. The Prisma query has no `take` clause.
- **File:** `/Users/ankitgupta/Desktop/EDAMastery/src/app/api/review/route.ts` — `limit` param not read from query string

### BUG-008: /learn/nonexistent-module returns 200 instead of 404
- **Severity:** Medium
- **Steps:** Navigate to `http://localhost:3002/learn/nonexistent-module` in the browser.
- **Expected:** Should return 404 or redirect to learn page.
- **Actual:** Returns HTTP 200 (likely rendering an empty or broken page client-side).
- **File:** `/Users/ankitgupta/Desktop/EDAMastery/src/app/learn/[moduleId]/page.tsx`

### BUG-009: Admin pages have no authentication/authorization
- **Severity:** Critical
- **Steps:** Navigate to `http://localhost:3002/admin` or `http://localhost:3002/admin/content`.
- **Expected:** Should require authentication or be restricted to admin users.
- **Actual:** Returns 200 and is accessible to anyone. The admin area includes content generation and management features.
- **File:** `/Users/ankitgupta/Desktop/EDAMastery/src/app/admin/` directory

### BUG-010: Content generate API returns 500 without useful error
- **Severity:** Medium
- **Steps:** `POST /api/content/generate` with `{"lessonId":"<valid>"}`.
- **Expected:** Should return a clear error (e.g., API key not configured) or generate content.
- **Actual:** Returns 500 "Failed to generate content" with no details about what failed.
- **File:** `/Users/ankitgupta/Desktop/EDAMastery/src/app/api/content/generate/route.ts`

### BUG-011: Quiz submit awards "first_lesson" achievement from quiz (not lesson completion)
- **Severity:** High
- **Steps:** Submit a quiz via `POST /api/quiz/submit`. Check `newAchievements` in response.
- **Expected:** "first_lesson" should only be awarded when a lesson is completed via the progress API.
- **Actual:** Quiz submit awards "first_lesson" achievement because `checkAchievements` counts `lessonProgress` records with status "completed", and the quiz submit route also creates/updates `lessonProgress`. In this test, submitting a quiz returned `"newAchievements":["first_lesson","first_quiz","night_owl","speed_demon"]`.
- **File:** `/Users/ankitgupta/Desktop/EDAMastery/src/app/api/quiz/submit/route.ts` lines 150-163

### BUG-012: Settings PUT passes unsanitized body directly to Prisma update
- **Severity:** Low
- **Steps:** `PUT /api/settings` with arbitrary fields like `{"userId":"default-user","randomField":"value"}`.
- **Expected:** Should only accept known settings fields.
- **Actual:** The entire request body (minus `userId` and `id`) is spread into the Prisma update via `{ ...body }`. While Prisma schema enforcement prevents unknown columns, it means any valid column can be overwritten without whitelist validation.
- **File:** `/Users/ankitgupta/Desktop/EDAMastery/src/app/api/settings/route.ts` line 55

## Passed Tests

### API Endpoints (Happy Path)
- GET /api/progress — returns valid JSON with phases, modules, lesson counts (200)
- GET /api/next-lesson — returns correct next uncompleted lesson with module progress (200)
- GET /api/streak — returns streak data with level info and XP (200)
- GET /api/settings — returns all settings fields with correct defaults (200)
- GET /api/adaptive/recommend — returns mode recommendation and suggested lessons (200)
- GET /api/review — returns review items with count (200)
- GET /api/content/:lessonId — returns full lesson markdown content with metadata (200)
- GET /api/quiz?lessonId=:id — returns quiz with parsed question options (200)
- GET /api/achievements — returns all achievements with earned status and progress (200)
- GET /api/notebooklm/status — returns auth status (200)
- POST /api/progress — successfully marks lesson completed, awards XP, updates streak (200)
- POST /api/quiz/submit — correctly scores quiz, awards XP, checks achievements (200)
- PUT /api/settings — successfully updates settings (200)

### API Endpoints (Error Handling)
- GET /api/content/invalid-id — returns 404 "Lesson not found"
- GET /api/quiz (no lessonId) — returns 400 "lessonId query parameter is required"
- POST /api/progress (empty body) — returns 400 "lessonId and status are required"
- POST /api/quiz/submit (empty body) — returns 400 "quizId and answers are required"
- POST /api/quiz/submit (bad quizId) — returns 404 "Quiz not found"
- POST /api/review (bad reviewItemId) — returns 404 "Review item not found"
- POST /api/review (quality > 5) — returns 400 "quality must be between 0 and 5"
- GET /api/tutor — returns 405 (correct, POST only)
- POST /api/tutor (wrong field name) — returns 400 with helpful error message

### User Flow
- Next lesson advances correctly after marking a lesson completed
- Streak updates correctly on lesson completion (same-day dedup works)
- XP accumulates across lesson completions and quiz submissions
- Quiz scoring correctly calculates percentage from answers
- Quiz with empty answers scores 0% (not error)
- Overwhelmed mode auto-sets overwhelmedUntil to 3 days ahead
- lessonsToday counter increments correctly

### Content Quality
- All 79 lessons have content (none null)
- All 79 lessons have published contentStatus
- All 79 quizzes exist with 318 total questions (avg 4 per quiz)
- No lessons with fewer than 500 chars of content
- No lessons with unclosed code blocks
- All lessons have valid estimatedMinutes
- All quizzes have at least 3 questions
- All lessons have proper ## section headings

### Build
- `npm run build` completes successfully with no TypeScript errors
- All 26 static pages generated
- All dynamic routes compile correctly

### Front-End Routes
- / — 200
- /learn — 200
- /settings — 200
- /progress — 200
- /achievements — 200
- /review — 200
- /learn/digital-design — 200
- /learn/digital-design/:lessonId — 200
- /quiz/:quizId — 200
- /admin — 200
- /admin/content — 200
- /nonexistent-page — 404 (correct)
