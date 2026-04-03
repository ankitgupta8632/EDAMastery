---
name: ux-verify
description: Verify the full user experience flow works end-to-end
trigger: "verify ux", "test user journey", "check the app"
---

## Full Journey Test
1. Start dev server: `npm run dev -- -p 3001`
2. Open http://localhost:3001
3. Verify dashboard:
   - Greeting shows (time-appropriate)
   - Continue Learning card links to first incomplete lesson
   - Streak shows correctly
   - Phase progress rings render
4. Navigate to Learn → first module → first lesson:
   - Content renders (markdown with syntax highlighting)
   - Protium note shows if present
   - Confidence slider works
   - Mark Complete button awards XP
5. After completion:
   - Next Lesson button appears
   - XP toast shows
   - Streak increments on dashboard
6. Check nav:
   - All 5 tabs work (Home, Learn, Review, Awards, Progress)
   - Settings accessible from header gear icon
7. Check responsive:
   - Resize to 375px width — no overflow, nav still works

## Quick Checks
```bash
# API health
curl -s http://localhost:3001/api/streak?userId=default-user | python3 -m json.tool
curl -s http://localhost:3001/api/next-lesson?userId=default-user | python3 -m json.tool
curl -s http://localhost:3001/api/progress?userId=default-user | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d)} phases')"
```
