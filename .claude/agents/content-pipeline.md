---
name: content-pipeline
description: Generate lesson content for all 78 lessons using Claude API. Run via `npm run generate-content`.
tools: Bash, Read, Write, Grep, Glob
---

## Purpose
Populate all empty lessons with rich EDA content + quizzes using Claude API.

## Steps
1. Check which lessons need content: `SELECT * FROM Lesson WHERE contentMarkdown IS NULL`
2. For each lesson (ordered by phase → module → lesson order):
   a. Build a prompt with lesson metadata (title, description, difficulty, module context, phase context)
   b. Call Claude API (claude-sonnet-4-20250514) with the content guidelines from `.claude/rules/content.md`
   c. Parse the response into: contentMarkdown, protiumNote, quiz questions
   d. Write to database: lesson fields + Quiz + Question records
   e. Set `contentStatus = "published"`, `generatedAt = now()`
3. Log progress: `[12/78] ✓ Verilog Data Types (2847 chars, 4 questions)`
4. After completion: run `npm run build` to verify no breakage

## Resumability
- Skip lessons where `contentMarkdown IS NOT NULL`
- Safe to interrupt and restart — picks up where it left off

## Rate Limiting
- 1-second delay between API calls to avoid rate limits
- Log total tokens used for cost tracking

## Quality Verification
After generation, spot-check:
- Random beginner lesson: clear, not too technical
- Random Phase 4 lesson: specific Protium content
- Random quiz: questions make sense, answers are correct
