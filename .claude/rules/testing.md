## Build Verification
- `npm run build` MUST pass with 0 TypeScript errors before any sprint is considered complete
- After any schema change: `npx prisma migrate dev` + verify with `npx prisma studio`
- After content generation: spot-check random lessons via `npx prisma studio` or API curl

## API Testing
- Test API routes with curl after changes:
  ```bash
  curl -s http://localhost:3001/api/progress?userId=default-user | head -c 200
  curl -s http://localhost:3001/api/next-lesson?userId=default-user
  curl -s http://localhost:3001/api/streak?userId=default-user
  ```
- Verify correct HTTP status codes (200 for success, 404 for not found, 400 for bad input)
- Check error responses have `{ error: "descriptive message" }` format

## User Journey Verification
After UX changes, verify the complete flow:
1. Dashboard loads with greeting + Continue Learning card
2. Click Continue → opens next incomplete lesson with content
3. Complete lesson → XP toast + Next Lesson button works
4. Streak updates on dashboard
5. Nav bar shows correct active state
6. Review badge shows count when items are due

## Content Quality Checks
After running `generate-content`:
- Lessons have `contentMarkdown` (not null, >500 chars)
- Lessons have `contentStatus = "published"`
- Quizzes exist with 4 questions each
- Questions have valid JSON options, correct answers, explanations
- Phase 4 lessons have detailed Protium sections
- Code examples use valid Verilog/SystemVerilog syntax
