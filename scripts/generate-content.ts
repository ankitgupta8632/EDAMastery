/**
 * EDAMastery Content Generator
 *
 * Generates rich EDA lesson content for all 78 lessons using Claude API.
 * Resumable: skips lessons that already have content.
 *
 * Usage: npx tsx scripts/generate-content.ts
 */

import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const prisma = new PrismaClient();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── System Prompt ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert EDA (Electronic Design Automation) instructor creating lesson content for EDAMastery, a microlearning app.

## Your Student
- Principal software engineer at Cadence Design Systems, working on the Protium team
- Deep programming expertise (C++, Python, systems), but LIMITED EDA/hardware knowledge
- Wants to understand EDA deeply so she can contribute meaningfully to Protium development
- Has a 1.5-year-old baby and a demanding full-time job — learning happens in 10-20 minute fragments
- Feels like an outsider in EDA discussions at work and wants to change that

## Your Teaching Philosophy
- **Bridge from software**: Always connect EDA concepts to software analogies. "Think of synthesis like a compiler that targets hardware instead of machine code." "A testbench is like a unit test framework for hardware."
- **Respect intelligence**: She's a senior engineer — explain the WHY, not just the WHAT. She can handle complexity if it's structured well.
- **Build meeting confidence**: After each lesson, she should be able to use this knowledge in a real conversation. Include phrases like "When someone in a review mentions X, they mean..."
- **Make Protium real**: Every lesson must connect to her actual work on Protium FPGA prototyping. Not generic FPGA facts — specific to how Protium uses these concepts.
- **Celebrate progress**: End each lesson making the learner feel they've genuinely leveled up.

## Content Structure
Return your response in this EXACT format (including the markers):

===CONTENT_START===
[Full lesson markdown content following the structure below]
===CONTENT_END===

===PROTIUM_NOTE_START===
[2-3 paragraphs specifically about how this lesson's concepts apply to Protium FPGA prototyping at Cadence. Be specific — reference compilation flow, multi-FPGA partitioning, timing closure, debug probes, etc. as relevant.]
===PROTIUM_NOTE_END===

===QUIZ_START===
Q1: [Question text]
TYPE: multiple_choice
OPTIONS: ["A) ...", "B) ...", "C) ...", "D) ..."]
CORRECT: [A/B/C/D]
EXPLANATION: [Why this is correct and why other options are wrong]

Q2: [Question text]
TYPE: multiple_choice
OPTIONS: ["A) ...", "B) ...", "C) ...", "D) ..."]
CORRECT: [A/B/C/D]
EXPLANATION: [Why this is correct]

Q3: [Question text]
TYPE: multiple_choice
OPTIONS: ["A) ...", "B) ...", "C) ...", "D) ..."]
CORRECT: [A/B/C/D]
EXPLANATION: [Why this is correct]

Q4: [Question text]
TYPE: true_false
OPTIONS: ["True", "False"]
CORRECT: [True/False]
EXPLANATION: [Why this is correct]
===QUIZ_END===

## Lesson Markdown Structure
1. **Hook** (1 paragraph) — Start with a real scenario. "Imagine you're reviewing a Protium compilation report and you see..." or "Your colleague mentions X in a design review. What does that mean?"
2. **Why This Matters** (1 paragraph) — Direct connection to the learner's work and career growth
3. **Core Concepts** — Main content with clear headers (##). Use tables, bullet points, and diagrams-as-text where helpful.
4. **Code Examples** — Use \`\`\`verilog or \`\`\`systemverilog fencing. Include line-by-line comments explaining what each part does. Make examples practical, not academic.
5. **Software Engineer's Mental Model** — A dedicated section that maps this concept to something they already know from software engineering.
6. **Practice Challenge** — A thought exercise they can work through mentally (remember, they might be on a commute or holding a baby)
7. **Meeting Confidence Boost** — "After this lesson, when someone says X, you can confidently respond with Y" — give them actual phrases they can use.
8. **Key Takeaways** — 3-5 bullet summary, each starting with an action verb

## Content Length by Difficulty
- Beginner: ~1500-2000 words, 1 code example, focus on building intuition
- Intermediate: ~2500-3000 words, 2-3 code examples, introduce trade-offs and nuance
- Advanced: ~3000-3500 words, complex examples, real-world decision-making scenarios

## Quiz Guidelines
- Test understanding and application, NOT memorization
- Questions should feel like real scenarios: "Your Protium compilation fails with timing violation. Which is the most likely cause?"
- All options must be plausible — no obviously silly answers
- Explanations should teach, not just confirm: "B is correct because... A is wrong because..."`;

// ─── Content Parsing ────────────────────────────────────────────────────────

interface ParsedContent {
  markdown: string;
  protiumNote: string;
  quiz: ParsedQuestion[];
}

interface ParsedQuestion {
  questionText: string;
  questionType: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  order: number;
}

function parseResponse(response: string): ParsedContent {
  // Extract content
  const contentMatch = response.match(
    /===CONTENT_START===\s*([\s\S]*?)\s*===CONTENT_END===/
  );
  const markdown = contentMatch?.[1]?.trim() ?? "";

  // Extract Protium note
  const protiumMatch = response.match(
    /===PROTIUM_NOTE_START===\s*([\s\S]*?)\s*===PROTIUM_NOTE_END===/
  );
  const protiumNote = protiumMatch?.[1]?.trim() ?? "";

  // Extract quiz
  const quizMatch = response.match(
    /===QUIZ_START===\s*([\s\S]*?)\s*===QUIZ_END===/
  );
  const quizText = quizMatch?.[1]?.trim() ?? "";
  const quiz = parseQuiz(quizText);

  return { markdown, protiumNote, quiz };
}

function parseQuiz(quizText: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  // Split by Q1:, Q2:, Q3:, Q4: patterns
  const qBlocks = quizText.split(/(?=Q\d+:)/);

  for (let i = 0; i < qBlocks.length; i++) {
    const block = qBlocks[i].trim();
    if (!block) continue;

    const questionMatch = block.match(/Q\d+:\s*(.*)/);
    const typeMatch = block.match(/TYPE:\s*(.*)/);
    const optionsMatch = block.match(/OPTIONS:\s*(\[[\s\S]*?\])/);
    const correctMatch = block.match(/CORRECT:\s*(.*)/);
    const explanationMatch = block.match(/EXPLANATION:\s*([\s\S]*?)(?=Q\d+:|$)/);

    if (questionMatch && optionsMatch && correctMatch) {
      let options: string[];
      try {
        options = JSON.parse(optionsMatch[1]);
      } catch {
        // Try to extract manually if JSON parse fails
        const raw = optionsMatch[1];
        options = raw
          .replace(/[\[\]]/g, "")
          .split(/",\s*"/)
          .map((o) => o.replace(/^"/, "").replace(/"$/, "").trim());
      }

      const correctLetter = correctMatch[1].trim();
      let correctAnswer = correctLetter;

      // Map letter to full option text for multiple_choice
      if (
        typeMatch?.[1]?.trim() === "multiple_choice" &&
        /^[A-D]$/.test(correctLetter)
      ) {
        const idx = correctLetter.charCodeAt(0) - "A".charCodeAt(0);
        if (idx >= 0 && idx < options.length) {
          // Store just the letter for consistent matching
          correctAnswer = options[idx];
        }
      } else if (typeMatch?.[1]?.trim() === "true_false") {
        correctAnswer = correctLetter;
      }

      questions.push({
        questionText: questionMatch[1].trim(),
        questionType: typeMatch?.[1]?.trim() ?? "multiple_choice",
        options,
        correctAnswer,
        explanation: explanationMatch?.[1]?.trim() ?? "",
        order: questions.length + 1,
      });
    }
  }

  return questions;
}

// ─── Lesson Prompt Builder ──────────────────────────────────────────────────

function buildLessonPrompt(lesson: {
  title: string;
  description: string;
  difficulty: string;
  estimatedMinutes: number;
  contentType: string;
  protiumNote: string | null;
  module: {
    name: string;
    description: string;
    phase: { name: string; description: string; order: number };
  };
  order: number;
}): string {
  const phase = lesson.module.phase;
  const isPhase4 = phase.order === 4;

  return `Generate a lesson for the EDAMastery app.

## Lesson Details
- **Title:** ${lesson.title}
- **Description:** ${lesson.description}
- **Module:** ${lesson.module.name} — ${lesson.module.description}
- **Phase:** Phase ${phase.order}: ${phase.name} — ${phase.description}
- **Difficulty:** ${lesson.difficulty}
- **Reading time target:** ${lesson.estimatedMinutes} minutes
- **Lesson number in module:** ${lesson.order}
${lesson.protiumNote ? `- **Existing Protium note hint:** ${lesson.protiumNote}` : ""}

## Special Instructions
${
  isPhase4
    ? `This is a **Phase 4 (Protium Mastery)** lesson. The ENTIRE lesson should be Protium-specific. Don't just add a Protium section — the whole lesson IS about Protium. Reference specific Protium architecture, compilation pipeline, runtime execution, debug workflows, and multi-FPGA partitioning as relevant.`
    : `This is a Phase ${phase.order} lesson. Include a strong "How This Applies to Protium" connection, but the main content covers general EDA concepts that happen to be relevant to Protium work.`
}

${
  lesson.difficulty === "beginner"
    ? "This is a BEGINNER lesson. Assume NO prior EDA knowledge. Start from first principles. Use lots of software analogies. Keep code examples simple and heavily commented."
    : lesson.difficulty === "intermediate"
      ? "This is an INTERMEDIATE lesson. The student has completed the beginner lessons in this module. Build on established concepts. Introduce trade-offs and design decisions."
      : "This is an ADVANCED lesson. The student has a solid foundation. Focus on real-world complexity, edge cases, and expert-level decision making."
}

Generate the full lesson content, Protium note, and 4 quiz questions following the format specified in your instructions.`;
}

// ─── Main Generation Loop ───────────────────────────────────────────────────

async function generateContent() {
  console.log("\n🎓 EDAMastery Content Generator\n");
  console.log("═══════════════════════════════════════════════════\n");

  // Verify API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "❌ ANTHROPIC_API_KEY not found in .env.local\n" +
        '   Add it: echo \'ANTHROPIC_API_KEY=sk-ant-...\' >> .env.local'
    );
    process.exit(1);
  }

  // Get all lessons ordered by curriculum sequence
  const lessons = await prisma.lesson.findMany({
    include: {
      module: {
        include: {
          phase: true,
        },
      },
      quiz: {
        include: {
          questions: true,
        },
      },
    },
    orderBy: [
      { module: { phase: { order: "asc" } } },
      { module: { order: "asc" } },
      { order: "asc" },
    ],
  });

  const needsContent = lessons.filter((l) => !l.contentMarkdown);
  const total = lessons.length;
  const pending = needsContent.length;
  const done = total - pending;

  console.log(`📚 Total lessons: ${total}`);
  console.log(`✅ Already generated: ${done}`);
  console.log(`⏳ Needs content: ${pending}\n`);

  if (pending === 0) {
    console.log("🎉 All lessons already have content! Nothing to do.\n");
    return;
  }

  let generated = 0;
  let failed = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (const lesson of needsContent) {
    const lessonNum = done + generated + failed + 1;
    const prefix = `[${lessonNum}/${total}]`;
    const modulePhase = `P${lesson.module.phase.order}/${lesson.module.name}`;

    console.log(`${prefix} 📝 Generating: ${lesson.title} (${modulePhase})...`);

    try {
      const prompt = buildLessonPrompt(lesson);

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      });

      // Track usage
      totalInputTokens += response.usage.input_tokens;
      totalOutputTokens += response.usage.output_tokens;

      const responseText =
        response.content[0].type === "text" ? response.content[0].text : "";

      const parsed = parseResponse(responseText);

      if (!parsed.markdown || parsed.markdown.length < 200) {
        console.log(`${prefix} ⚠️  Short content (${parsed.markdown.length} chars), retrying...`);
        // One retry with a nudge
        const retryResponse = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8000,
          system: SYSTEM_PROMPT,
          messages: [
            { role: "user", content: prompt },
            { role: "assistant", content: responseText },
            {
              role: "user",
              content:
                "The content seems too short. Please generate a complete, comprehensive lesson with all sections (Hook, Why This Matters, Core Concepts, Code Examples, Software Engineer's Mental Model, Practice Challenge, Meeting Confidence Boost, Key Takeaways). Follow the exact ===CONTENT_START=== / ===CONTENT_END=== format.",
            },
          ],
        });
        totalInputTokens += retryResponse.usage.input_tokens;
        totalOutputTokens += retryResponse.usage.output_tokens;

        const retryText =
          retryResponse.content[0].type === "text"
            ? retryResponse.content[0].text
            : "";
        const retryParsed = parseResponse(retryText);
        if (retryParsed.markdown.length > parsed.markdown.length) {
          Object.assign(parsed, retryParsed);
        }
      }

      // Save lesson content
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: {
          contentMarkdown: parsed.markdown,
          protiumNote: parsed.protiumNote || lesson.protiumNote,
          contentStatus: "published",
          generatedAt: new Date(),
          contentJson: JSON.stringify({
            sections: extractSections(parsed.markdown),
          }),
        },
      });

      // Save quiz + questions (delete old if exists)
      if (parsed.quiz.length > 0) {
        // Delete existing quiz if any
        if (lesson.quiz) {
          await prisma.question.deleteMany({
            where: { quizId: lesson.quiz.id },
          });
          await prisma.quiz.delete({ where: { id: lesson.quiz.id } });
        }

        await prisma.quiz.create({
          data: {
            lessonId: lesson.id,
            questions: {
              create: parsed.quiz.map((q) => ({
                questionText: q.questionText,
                questionType: q.questionType,
                options: JSON.stringify(q.options),
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                order: q.order,
              })),
            },
          },
        });
      }

      generated++;
      const wordCount = parsed.markdown.split(/\s+/).length;
      const quizCount = parsed.quiz.length;
      console.log(
        `${prefix} ✅ Done — ${wordCount} words, ${quizCount} questions`
      );

      // Rate limiting: 1 second between requests
      await sleep(1000);
    } catch (error: unknown) {
      failed++;
      const errMsg = error instanceof Error ? error.message : String(error);
      console.log(`${prefix} ❌ Failed: ${errMsg}`);

      // If rate limited, wait longer
      if (errMsg.includes("rate") || errMsg.includes("429")) {
        console.log(`${prefix} ⏳ Rate limited, waiting 30s...`);
        await sleep(30000);
      } else {
        await sleep(2000);
      }
    }
  }

  // Summary
  console.log("\n═══════════════════════════════════════════════════");
  console.log("📊 Generation Complete!\n");
  console.log(`  ✅ Generated: ${generated}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📥 Input tokens: ${totalInputTokens.toLocaleString()}`);
  console.log(`  📤 Output tokens: ${totalOutputTokens.toLocaleString()}`);

  const estimatedCost =
    (totalInputTokens * 3) / 1_000_000 + (totalOutputTokens * 15) / 1_000_000;
  console.log(`  💰 Estimated cost: $${estimatedCost.toFixed(2)}`);

  if (failed > 0) {
    console.log(
      `\n⚠️  ${failed} lessons failed. Run again to retry (script is resumable).`
    );
  }

  console.log("\n🎉 Content generation complete!\n");
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractSections(markdown: string): { heading: string; content: string }[] {
  const sections: { heading: string; content: string }[] = [];
  const lines = markdown.split("\n");
  let currentHeading = "Introduction";
  let currentContent: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.*)/);
    if (headingMatch) {
      if (currentContent.length > 0) {
        sections.push({
          heading: currentHeading,
          content: currentContent.join("\n").trim(),
        });
      }
      currentHeading = headingMatch[1];
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  if (currentContent.length > 0) {
    sections.push({
      heading: currentHeading,
      content: currentContent.join("\n").trim(),
    });
  }

  return sections;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Run ────────────────────────────────────────────────────────────────────

generateContent()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
