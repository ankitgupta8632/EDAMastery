---
name: ux-redesign
description: Implement UX improvements — onboarding, dashboard, navigation, lesson flow
tools: Read, Edit, Write, Bash, Glob, Grep
---

## Scope
Fix the UX so the app is immediately intuitive for a first-time user.

## Changes Required

### Navigation (nav-bar.tsx)
- Replace Settings tab with Awards (Trophy icon → /achievements)
- Keep: Home, Learn, Review, Awards, Progress

### Header (header.tsx)
- Add Settings gear icon (link to /settings) next to level badge

### Dashboard (page.tsx)
New priority order:
1. Greeting (time-based)
2. **Continue Learning** hero card — next incomplete lesson title, module, time estimate
3. Today's progress (lessons today vs daily goal)
4. Streak (compact)
5. Phase progress rings (smaller)
6. Quick actions (demoted to bottom)
7. Upcoming reviews (only if count > 0)

### Onboarding (new component)
- 3-step flow for first-time users
- Step 1: Welcome message
- Step 2: Quick settings (daily goal, commute times)
- Step 3: Start learning → goes to first lesson
- Requires `onboardingCompleted` field on UserSettings

### Lesson Viewer
- After Mark Complete: show "Next Lesson →" button instead of going back
- Add next/prev lesson data from API

### Settings
- Add subtle "Admin Panel" link at bottom

## Verification
After changes: `npm run build` must pass, then verify full journey via browser.
