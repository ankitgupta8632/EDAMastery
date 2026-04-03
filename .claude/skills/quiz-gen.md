---
name: quiz-gen
description: Generate quiz questions from lesson content
trigger: "generate quizzes", "create quiz questions", "add quizzes"
---

## Workflow
Quizzes are generated as part of the content-gen pipeline (same API call).

If quizzes need to be regenerated separately:
1. Find lessons with `contentMarkdown` but no associated Quiz
2. For each lesson:
   - Build quiz prompt from lesson content
   - Call Claude API for 4 questions (3 multiple choice + 1 true/false)
   - Parse response into Question records
   - Save Quiz + Questions to database
3. Verify: each quiz has 4 questions with valid options and explanations

## Question Format
```
Q1: [question text]
TYPE: multiple_choice
OPTIONS: ["A) ...", "B) ...", "C) ...", "D) ..."]
CORRECT: A
EXPLANATION: [why this is correct]
```
