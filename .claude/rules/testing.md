## Build Verification
- `npm run build` MUST pass with 0 TypeScript errors before any sprint is considered complete
- After any schema change: generate migration SQL → apply to Turso → `npx prisma generate`
- After content generation: spot-check random lessons via API curl or Turso shell

## API Testing
- Test API routes with curl after changes:
  ```bash
  curl -s http://localhost:3001/api/progress?userId=default-user | head -c 200
  curl -s http://localhost:3001/api/next-lesson?userId=default-user
  curl -s http://localhost:3001/api/streak?userId=default-user
  ```
- Production API: `curl -s https://eda-mastery.vercel.app/api/progress`
- Verify correct HTTP status codes (200 for success, 404 for not found, 400 for bad input)
- Check error responses have `{ error: "descriptive message" }` format

## User Journey Verification
After UX changes, verify the complete flow:
1. Dashboard loads with greeting + Continue Learning card
2. Click Continue → opens next incomplete lesson with content
3. Lesson shows: Video → Audio → Text → Protium Note → Infographic → Complete
4. Complete lesson → XP toast + Next Lesson button works
5. Streak updates on dashboard
6. Nav bar shows correct active state
7. Review badge shows count when items are due

## Deployment Verification
After pushing to main:
1. Vercel auto-deploys (or `PATH="/usr/local/bin:$PATH" npx vercel --prod --yes --archive=tgz --force`)
2. Check https://eda-mastery.vercel.app loads
3. Verify API returns data: `curl -s https://eda-mastery.vercel.app/api/progress`
4. Test on mobile viewport

## Content Quality Checks
After running `generate-content`:
- Lessons have `contentMarkdown` (not null, >500 chars)
- Lessons have `contentStatus = "published"`
- Quizzes exist with 4 questions each
- Questions have valid JSON options, correct answers, explanations
- Phase 4 lessons have detailed Protium sections
- Code examples use valid Verilog/SystemVerilog syntax

## Database Verification
```bash
# Turso (production)
~/.turso/turso db shell edamastery
> SELECT COUNT(*) FROM Lesson;  -- Expected: 79
> SELECT COUNT(*) FROM Quiz;    -- Expected: 79
> SELECT COUNT(*) FROM Question; -- Expected: 318

# Local
sqlite3 prisma/prisma/dev.db "SELECT COUNT(*) FROM Lesson;"
```
