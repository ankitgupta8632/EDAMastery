---
name: content-gen
description: Generate lesson content for EDA curriculum using Claude API
trigger: "generate content", "populate lessons", "create lesson content", "fill lessons"
---

## Workflow
1. Run `npm run generate-content` (executes `scripts/generate-content.ts`)
2. Script iterates all lessons where `contentMarkdown IS NULL`
3. For each lesson:
   - Builds prompt with: title, description, difficulty, module name, phase name, content guidelines
   - Calls Claude API (claude-sonnet-4-20250514)
   - Parses response into: contentMarkdown, protiumNote, 4 quiz questions
   - Saves to database with `contentStatus = "published"`
4. Logs progress per lesson
5. After all done, verify with `npm run build`

## Prerequisites
- `ANTHROPIC_API_KEY` set in `.env.local`
- `@anthropic-ai/sdk` installed
- Database migrated and seeded

## Cost Estimate
- ~78 lessons × ~3000 tokens avg output = ~234K output tokens
- Claude Sonnet: ~$0.70 total
