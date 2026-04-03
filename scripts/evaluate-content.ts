/**
 * EDAMastery Content Evaluation Agent
 *
 * Acts as the target user (senior SW engineer at Cadence, limited EDA knowledge)
 * and evaluates every lesson on 7 quality dimensions.
 *
 * Usage:
 *   npx tsx scripts/evaluate-content.ts              # evaluate all
 *   npx tsx scripts/evaluate-content.ts --phase 1     # phase 1 only
 *   npx tsx scripts/evaluate-content.ts --lesson-id X # single lesson
 *   npx tsx scripts/evaluate-content.ts --dry-run     # evaluate only, no regen
 *   npx tsx scripts/evaluate-content.ts --regenerate-only # skip eval, regen failing
 */

import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DATA_DIR = path.resolve(process.cwd(), "data");
const RESULTS_FILE = path.join(DATA_DIR, "evaluation-results.json");
const REPORT_FILE = path.join(DATA_DIR, "evaluation-report.md");

// ─── Benchmarks ────────────────────────────────────────────────────────────

const BENCHMARK = {
  avgMinimum: 75,
  dimensionMinimum: 50,
};

const DIMENSIONS = [
  "clarity",
  "engagement",
  "protium_relevance",
  "code_quality",
  "software_analogies",
  "emotional_resonance",
  "difficulty_calibration",
] as const;

type Dimension = (typeof DIMENSIONS)[number];

interface EvalScores {
  clarity: number;
  engagement: number;
  protium_relevance: number;
  code_quality: number;
  software_analogies: number;
  emotional_resonance: number;
  difficulty_calibration: number;
}

interface EvalResult {
  lessonId: string;
  lessonTitle: string;
  moduleId: string;
  moduleName: string;
  phaseOrder: number;
  phaseName: string;
  difficulty: string;
  scores: EvalScores;
  average: number;
  passing: boolean;
  notes: Record<Dimension, string>;
  topIssues: string[];
  improvements: string[];
  evaluatedAt: string;
}

interface EvalReport {
  results: EvalResult[];
  summary: {
    totalLessons: number;
    passing: number;
    failing: number;
    overallAverage: number;
    dimensionAverages: Record<Dimension, number>;
    weakestLessons: { title: string; avg: number }[];
  };
}

// ─── Evaluation System Prompt ──────────────────────────────────────────────

const EVAL_SYSTEM_PROMPT = `You are role-playing as the target user of the EDAMastery learning app.

## Who You Are
- Senior principal software engineer at Cadence Design Systems
- You work on the Protium FPGA prototyping platform team
- Deep expertise in C++, Python, distributed systems, compilers
- LIMITED knowledge of EDA, digital design, and hardware
- You're a busy parent with a 1.5 year old — learning happens during commute or while baby naps
- You feel imposter syndrome in EDA meetings where colleagues discuss timing, synthesis, verification
- You want to contribute meaningfully to Protium but feel locked out by domain knowledge gaps

## Your Task
Evaluate the lesson content as if you're actually trying to learn from it. Score each dimension honestly — be constructive but fair. A lesson should make you feel smarter, more confident, and connected to your daily Protium work.

## Scoring Guide
- 90-100: Exceptional — you'd recommend this to a colleague
- 75-89: Good — solid learning experience, minor improvements possible
- 60-74: Adequate — gets the job done but feels generic or unclear in spots
- 40-59: Below average — significant issues that impede learning
- 0-39: Poor — confusing, disengaging, or irrelevant

## Response Format
You MUST respond with this exact format:

===EVAL_START===
CLARITY: [0-100]
CLARITY_NOTES: [1-2 sentences explaining your score]
ENGAGEMENT: [0-100]
ENGAGEMENT_NOTES: [1-2 sentences]
PROTIUM_RELEVANCE: [0-100]
PROTIUM_RELEVANCE_NOTES: [1-2 sentences]
CODE_QUALITY: [0-100]
CODE_QUALITY_NOTES: [1-2 sentences]
SOFTWARE_ANALOGIES: [0-100]
SOFTWARE_ANALOGIES_NOTES: [1-2 sentences]
EMOTIONAL_RESONANCE: [0-100]
EMOTIONAL_RESONANCE_NOTES: [1-2 sentences]
DIFFICULTY_CALIBRATION: [0-100]
DIFFICULTY_CALIBRATION_NOTES: [1-2 sentences]
TOP_ISSUES: [numbered list of the 1-3 most important problems, or "None" if score > 80 avg]
IMPROVEMENTS: [numbered list of 1-3 specific, actionable improvements]
===EVAL_END===`;

// ─── Regeneration System Prompt ────────────────────────────────────────────

const REGEN_SYSTEM_PROMPT = `You are an expert EDA instructor creating lesson content for EDAMastery, a microlearning app.

## Your Student
- Principal software engineer at Cadence Design Systems, on the Protium FPGA prototyping team
- Deep programming expertise (C++, Python, systems), but LIMITED EDA/hardware knowledge
- Busy parent — learns during commute or while baby naps (10-20 min sessions)
- Feels imposter syndrome in EDA meetings — wants to feel confident discussing these topics

## Content Philosophy
- Every concept gets a software analogy first, then the EDA reality
- "Meeting Confidence Boost" section: exact phrases they can use in their next team meeting
- Code examples are complete, runnable, heavily commented
- Protium connections in every lesson — "here's how this shows up in your daily work"
- Warm, encouraging tone — never condescending, always building confidence

## Required Sections
1. Hook (1 paragraph — a real scenario from their Protium work)
2. Why This Matters (connect to their career growth + daily work)
3. Core Concepts (main theory with tables/diagrams described in text)
4. Code Examples (Verilog/SystemVerilog, complete and commented)
5. Software Engineer's Mental Model (explicit SW→EDA analogies)
6. Practice Challenge (can be done mentally during commute)
7. Meeting Confidence Boost (2-3 phrases they can use)
8. Key Takeaways (3-5 bullets)

## Output Format
===CONTENT_START===
[Full markdown lesson content]
===CONTENT_END===

===PROTIUM_NOTE_START===
[2-3 paragraphs connecting this lesson to Protium FPGA prototyping work]
===PROTIUM_NOTE_END===

===QUIZ_START===
Q1: [question text]
TYPE: multiple_choice
OPTIONS: ["A) ...", "B) ...", "C) ...", "D) ..."]
CORRECT: [letter]
EXPLANATION: [why this is correct]

Q2: ...
Q3: ...
Q4: ...
===QUIZ_END===`;

// ─── Parsing ───────────────────────────────────────────────────────────────

function parseEvalResponse(response: string): {
  scores: EvalScores;
  notes: Record<Dimension, string>;
  topIssues: string[];
  improvements: string[];
} | null {
  const match = response.match(/===EVAL_START===\s*([\s\S]*?)\s*===EVAL_END===/);
  if (!match) return null;

  const text = match[1];
  const scores: Partial<EvalScores> = {};
  const notes: Partial<Record<Dimension, string>> = {};

  for (const dim of DIMENSIONS) {
    const key = dim.toUpperCase();
    const scoreMatch = text.match(new RegExp(`${key}:\\s*(\\d+)`));
    const notesMatch = text.match(new RegExp(`${key}_NOTES:\\s*(.+)`));
    if (scoreMatch) {
      scores[dim] = Math.min(100, Math.max(0, parseInt(scoreMatch[1])));
    }
    if (notesMatch) {
      notes[dim] = notesMatch[1].trim();
    }
  }

  const issuesMatch = text.match(/TOP_ISSUES:\s*([\s\S]*?)(?=IMPROVEMENTS:|===EVAL_END===)/);
  const improvementsMatch = text.match(/IMPROVEMENTS:\s*([\s\S]*?)(?====EVAL_END===)/);

  const topIssues = issuesMatch
    ? issuesMatch[1]
        .trim()
        .split(/\n/)
        .map((l) => l.replace(/^\d+[\.\)]\s*/, "").trim())
        .filter((l) => l && l !== "None")
    : [];

  const improvements = improvementsMatch
    ? improvementsMatch[1]
        .trim()
        .split(/\n/)
        .map((l) => l.replace(/^\d+[\.\)]\s*/, "").trim())
        .filter((l) => l)
    : [];

  // Verify all dimensions present
  for (const dim of DIMENSIONS) {
    if (scores[dim] === undefined) scores[dim] = 50; // default if parsing failed
    if (!notes[dim]) notes[dim] = "Could not parse evaluation notes.";
  }

  return {
    scores: scores as EvalScores,
    notes: notes as Record<Dimension, string>,
    topIssues,
    improvements,
  };
}

// ─── Build Evaluation Prompt ───────────────────────────────────────────────

function buildEvalPrompt(lesson: {
  title: string;
  description: string;
  difficulty: string;
  estimatedMinutes: number;
  contentMarkdown: string | null;
  protiumNote: string | null;
  module: { name: string; phase: { name: string; order: number } };
  quiz: { questions: { questionText: string; options: string; correctAnswer: string; explanation: string | null }[] } | null;
}): string {
  const quizSection = lesson.quiz?.questions
    ?.map(
      (q, i) =>
        `Q${i + 1}: ${q.questionText}\nOptions: ${q.options}\nAnswer: ${q.correctAnswer}\nExplanation: ${q.explanation ?? "none"}`
    )
    .join("\n\n");

  return `Evaluate this lesson as the target user described in your instructions.

## Lesson Metadata
- **Title:** ${lesson.title}
- **Description:** ${lesson.description}
- **Module:** ${lesson.module.name}
- **Phase:** Phase ${lesson.module.phase.order}: ${lesson.module.phase.name}
- **Difficulty:** ${lesson.difficulty}
- **Target reading time:** ${lesson.estimatedMinutes} minutes

## Lesson Content
${lesson.contentMarkdown ?? "(No content)"}

## Protium Note
${lesson.protiumNote ?? "(No Protium note)"}

## Quiz Questions
${quizSection ?? "(No quiz)"}

Now evaluate this lesson on all 7 dimensions. Be honest and constructive.`;
}

// ─── Regeneration Prompt ───────────────────────────────────────────────────

function buildRegenPrompt(
  lesson: {
    title: string;
    description: string;
    difficulty: string;
    estimatedMinutes: number;
    module: { name: string; description: string; phase: { name: string; description: string; order: number } };
  },
  evalResult: EvalResult
): string {
  const weakDims = DIMENSIONS.filter((d) => evalResult.scores[d] < BENCHMARK.avgMinimum)
    .map((d) => `- ${d}: ${evalResult.scores[d]}/100 — ${evalResult.notes[d]}`)
    .join("\n");

  const isPhase4 = lesson.module.phase.order === 4;

  return `Regenerate this lesson with SPECIFIC improvements based on evaluation feedback.

## Lesson Details
- **Title:** ${lesson.title}
- **Description:** ${lesson.description}
- **Module:** ${lesson.module.name} — ${lesson.module.description}
- **Phase:** Phase ${lesson.module.phase.order}: ${lesson.module.phase.name}
- **Difficulty:** ${lesson.difficulty}
- **Reading time target:** ${lesson.estimatedMinutes} minutes

## Evaluation Feedback (MUST address these)
Overall score: ${evalResult.average}/100 (needs >= ${BENCHMARK.avgMinimum})

Weak dimensions:
${weakDims}

Top issues:
${evalResult.topIssues.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}

Suggested improvements:
${evalResult.improvements.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}

## Special Instructions
${isPhase4 ? "This is a Phase 4 (Protium Mastery) lesson — the ENTIRE lesson should be Protium-specific." : `Include a strong Protium connection, but main content covers general EDA concepts.`}
${lesson.difficulty === "beginner" ? "BEGINNER: Start from first principles. Lots of software analogies." : lesson.difficulty === "intermediate" ? "INTERMEDIATE: Build on established concepts. Introduce trade-offs." : "ADVANCED: Focus on real-world complexity and expert-level decisions."}

Generate the complete improved lesson following the format in your instructions.`;
}

// ─── Content Parser (for regeneration) ─────────────────────────────────────

function parseRegenResponse(response: string) {
  const contentMatch = response.match(/===CONTENT_START===\s*([\s\S]*?)\s*===CONTENT_END===/);
  const markdown = contentMatch?.[1]?.trim() ?? "";

  const protiumMatch = response.match(/===PROTIUM_NOTE_START===\s*([\s\S]*?)\s*===PROTIUM_NOTE_END===/);
  const protiumNote = protiumMatch?.[1]?.trim() ?? "";

  const quizMatch = response.match(/===QUIZ_START===\s*([\s\S]*?)\s*===QUIZ_END===/);
  const quizText = quizMatch?.[1]?.trim() ?? "";

  return { markdown, protiumNote, quizText };
}

function parseQuizFromText(quizText: string) {
  const questions: {
    questionText: string;
    questionType: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    order: number;
  }[] = [];

  const qBlocks = quizText.split(/(?=Q\d+:)/);
  for (const block of qBlocks) {
    if (!block.trim()) continue;
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
        options = optionsMatch[1]
          .replace(/[\[\]]/g, "")
          .split(/",\s*"/)
          .map((o) => o.replace(/^"/, "").replace(/"$/, "").trim());
      }

      const correctLetter = correctMatch[1].trim();
      let correctAnswer = correctLetter;
      if (/^[A-D]$/.test(correctLetter)) {
        const idx = correctLetter.charCodeAt(0) - "A".charCodeAt(0);
        if (idx >= 0 && idx < options.length) correctAnswer = options[idx];
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

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const phaseFilter = args.includes("--phase") ? parseInt(args[args.indexOf("--phase") + 1]) : null;
  const lessonIdFilter = args.includes("--lesson-id") ? args[args.indexOf("--lesson-id") + 1] : null;
  const dryRun = args.includes("--dry-run");
  const regenOnly = args.includes("--regenerate-only");

  console.log("\n🔍 EDAMastery Content Evaluation Agent\n");
  console.log("═══════════════════════════════════════════════════\n");

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("❌ ANTHROPIC_API_KEY not found");
    process.exit(1);
  }

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  // Load existing results if doing regen-only
  let existingResults: EvalResult[] = [];
  if (regenOnly && fs.existsSync(RESULTS_FILE)) {
    existingResults = JSON.parse(fs.readFileSync(RESULTS_FILE, "utf-8")).results;
    console.log(`📂 Loaded ${existingResults.length} existing evaluations\n`);
  }

  // Get lessons
  const where: Record<string, unknown> = { contentMarkdown: { not: null } };
  if (phaseFilter) where.module = { phase: { order: phaseFilter } };
  if (lessonIdFilter) where.id = lessonIdFilter;

  const lessons = await prisma.lesson.findMany({
    where,
    include: {
      module: { include: { phase: true } },
      quiz: { include: { questions: true } },
    },
    orderBy: [
      { module: { phase: { order: "asc" } } },
      { module: { order: "asc" } },
      { order: "asc" },
    ],
  });

  console.log(`📚 Lessons to ${regenOnly ? "regenerate" : "evaluate"}: ${lessons.length}`);
  if (phaseFilter) console.log(`🔎 Phase filter: ${phaseFilter}`);
  if (lessonIdFilter) console.log(`🔎 Lesson filter: ${lessonIdFilter}`);
  if (dryRun) console.log(`🏃 Dry run — no regeneration`);
  console.log();

  // ── Phase 1: Evaluate ────────────────────────────────────────────────

  let results: EvalResult[] = regenOnly ? existingResults : [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  if (!regenOnly) {
    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      const prefix = `[${i + 1}/${lessons.length}]`;
      const ctx = `P${lesson.module.phase.order}/${lesson.module.name}`;

      console.log(`${prefix} 🔍 Evaluating: ${lesson.title} (${ctx})...`);

      try {
        const prompt = buildEvalPrompt(lesson);
        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: EVAL_SYSTEM_PROMPT,
          messages: [{ role: "user", content: prompt }],
        });

        totalInputTokens += response.usage.input_tokens;
        totalOutputTokens += response.usage.output_tokens;

        const text = response.content[0].type === "text" ? response.content[0].text : "";
        const parsed = parseEvalResponse(text);

        if (!parsed) {
          console.log(`${prefix} ⚠️  Could not parse evaluation, using defaults`);
          continue;
        }

        const avg = Math.round(
          DIMENSIONS.reduce((sum, d) => sum + parsed.scores[d], 0) / DIMENSIONS.length
        );
        const passing = avg >= BENCHMARK.avgMinimum && DIMENSIONS.every((d) => parsed.scores[d] >= BENCHMARK.dimensionMinimum);

        const result: EvalResult = {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          moduleId: lesson.moduleId,
          moduleName: lesson.module.name,
          phaseOrder: lesson.module.phase.order,
          phaseName: lesson.module.phase.name,
          difficulty: lesson.difficulty,
          scores: parsed.scores,
          average: avg,
          passing,
          notes: parsed.notes,
          topIssues: parsed.topIssues,
          improvements: parsed.improvements,
          evaluatedAt: new Date().toISOString(),
        };

        results.push(result);

        const status = passing ? "✅" : "❌";
        console.log(`${prefix} ${status} avg=${avg} [${DIMENSIONS.map((d) => `${d.slice(0, 3)}:${parsed.scores[d]}`).join(" ")}]`);

        // Rate limiting
        await new Promise((r) => setTimeout(r, 1000));
      } catch (err: unknown) {
        const error = err as { status?: number; message?: string };
        if (error.status === 429) {
          console.log(`${prefix} ⏳ Rate limited, waiting 30s...`);
          await new Promise((r) => setTimeout(r, 30000));
          i--; // retry
        } else {
          console.log(`${prefix} ❌ Error: ${error.message ?? "Unknown"}`);
        }
      }
    }

    // Save results
    const report = generateReport(results);
    fs.writeFileSync(RESULTS_FILE, JSON.stringify({ results, summary: report.summary }, null, 2));
    writeMarkdownReport(report);

    console.log(`\n═══════════════════════════════════════════════════`);
    console.log(`📊 Evaluation Complete!\n`);
    console.log(`  📚 Total evaluated: ${results.length}`);
    console.log(`  ✅ Passing: ${report.summary.passing}`);
    console.log(`  ❌ Failing: ${report.summary.failing}`);
    console.log(`  📈 Overall average: ${report.summary.overallAverage}`);
    console.log(`  📥 Input tokens: ${totalInputTokens.toLocaleString()}`);
    console.log(`  📤 Output tokens: ${totalOutputTokens.toLocaleString()}`);

    const inputCost = (totalInputTokens / 1_000_000) * 3;
    const outputCost = (totalOutputTokens / 1_000_000) * 15;
    console.log(`  💰 Estimated cost: $${(inputCost + outputCost).toFixed(2)}\n`);
  }

  // ── Phase 2: Regenerate failing lessons ──────────────────────────────

  const failing = results.filter((r) => !r.passing);

  if (failing.length === 0) {
    console.log("🎉 All lessons pass benchmarks! No regeneration needed.\n");
    await prisma.$disconnect();
    return;
  }

  if (dryRun) {
    console.log(`\n📋 ${failing.length} lessons would need regeneration (dry run — skipping):`);
    failing.forEach((r) => console.log(`  - ${r.lessonTitle} (avg=${r.average})`));
    await prisma.$disconnect();
    return;
  }

  console.log(`\n🔄 Regenerating ${failing.length} failing lessons...\n`);

  let regenCount = 0;
  for (const evalResult of failing) {
    const lesson = lessons.find((l) => l.id === evalResult.lessonId);
    if (!lesson) continue;

    const prefix = `[${++regenCount}/${failing.length}]`;
    console.log(`${prefix} 🔄 Regenerating: ${lesson.title} (avg=${evalResult.average})...`);

    try {
      const prompt = buildRegenPrompt(lesson, evalResult);
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        system: REGEN_SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      });

      totalInputTokens += response.usage.input_tokens;
      totalOutputTokens += response.usage.output_tokens;

      const text = response.content[0].type === "text" ? response.content[0].text : "";
      const parsed = parseRegenResponse(text);

      if (!parsed.markdown || parsed.markdown.length < 200) {
        console.log(`${prefix} ⚠️  Regeneration too short, skipping`);
        continue;
      }

      // Update lesson
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: {
          contentMarkdown: parsed.markdown,
          protiumNote: parsed.protiumNote || lesson.protiumNote,
          contentStatus: "generated", // not published until re-evaluated
          generatedAt: new Date(),
        },
      });

      // Update quiz if we got new questions
      if (parsed.quizText) {
        const questions = parseQuizFromText(parsed.quizText);
        if (questions.length > 0 && lesson.quiz) {
          await prisma.question.deleteMany({ where: { quizId: lesson.quiz.id } });
          for (const q of questions) {
            await prisma.question.create({
              data: {
                quizId: lesson.quiz.id,
                questionText: q.questionText,
                questionType: q.questionType,
                options: JSON.stringify(q.options),
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                order: q.order,
              },
            });
          }
        }
      }

      console.log(`${prefix} ✅ Regenerated — ${parsed.markdown.split(/\s+/).length} words`);
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      if (error.status === 429) {
        console.log(`${prefix} ⏳ Rate limited, waiting 30s...`);
        await new Promise((r) => setTimeout(r, 30000));
        regenCount--; // retry
      } else {
        console.log(`${prefix} ❌ Error: ${error.message ?? "Unknown"}`);
      }
    }
  }

  // ── Phase 3: Re-evaluate regenerated lessons ─────────────────────────

  console.log(`\n🔍 Re-evaluating ${failing.length} regenerated lessons...\n`);

  let improved = 0;
  for (const oldResult of failing) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: oldResult.lessonId },
      include: {
        module: { include: { phase: true } },
        quiz: { include: { questions: true } },
      },
    });
    if (!lesson || !lesson.contentMarkdown) continue;

    console.log(`  🔍 Re-evaluating: ${lesson.title}...`);

    try {
      const prompt = buildEvalPrompt(lesson);
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: EVAL_SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "";
      const parsed = parseEvalResponse(text);
      if (!parsed) continue;

      const newAvg = Math.round(DIMENSIONS.reduce((sum, d) => sum + parsed.scores[d], 0) / DIMENSIONS.length);
      const delta = newAvg - oldResult.average;
      const nowPassing = newAvg >= BENCHMARK.avgMinimum && DIMENSIONS.every((d) => parsed.scores[d] >= BENCHMARK.dimensionMinimum);

      if (nowPassing) {
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { contentStatus: "published", reviewedAt: new Date() },
        });
        improved++;
      }

      // Update the result in our array
      const idx = results.findIndex((r) => r.lessonId === oldResult.lessonId);
      if (idx !== -1) {
        results[idx] = {
          ...results[idx],
          scores: parsed.scores,
          average: newAvg,
          passing: nowPassing,
          notes: parsed.notes,
          topIssues: parsed.topIssues,
          improvements: parsed.improvements,
          evaluatedAt: new Date().toISOString(),
        };
      }

      const arrow = delta >= 0 ? "↑" : "↓";
      const status = nowPassing ? "✅" : "⚠️";
      console.log(`  ${status} ${lesson.title}: ${oldResult.average} → ${newAvg} (${arrow}${Math.abs(delta)})`);

      await new Promise((r) => setTimeout(r, 1000));
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.log(`  ❌ Error: ${error.message ?? "Unknown"}`);
    }
  }

  // Save updated results
  const finalReport = generateReport(results);
  fs.writeFileSync(RESULTS_FILE, JSON.stringify({ results, summary: finalReport.summary }, null, 2));
  writeMarkdownReport(finalReport);

  console.log(`\n═══════════════════════════════════════════════════`);
  console.log(`📊 Final Results\n`);
  console.log(`  ✅ Improved: ${improved}/${failing.length}`);
  console.log(`  📈 Final overall average: ${finalReport.summary.overallAverage}`);
  console.log(`  ✅ Passing: ${finalReport.summary.passing}/${finalReport.summary.totalLessons}`);

  const stillFailing = results.filter((r) => !r.passing);
  if (stillFailing.length > 0) {
    console.log(`\n  ⚠️  Still failing (need manual review):`);
    stillFailing.forEach((r) => console.log(`    - ${r.lessonTitle} (avg=${r.average})`));
  }

  console.log(`\n📝 Report saved to: ${REPORT_FILE}`);
  console.log(`📊 Results saved to: ${RESULTS_FILE}\n`);

  await prisma.$disconnect();
}

// ─── Report Generation ─────────────────────────────────────────────────────

function generateReport(results: EvalResult[]): EvalReport {
  const totalLessons = results.length;
  const passing = results.filter((r) => r.passing).length;
  const failing = totalLessons - passing;

  const overallAverage = totalLessons > 0
    ? Math.round(results.reduce((sum, r) => sum + r.average, 0) / totalLessons)
    : 0;

  const dimensionAverages = {} as Record<Dimension, number>;
  for (const dim of DIMENSIONS) {
    dimensionAverages[dim] = totalLessons > 0
      ? Math.round(results.reduce((sum, r) => sum + r.scores[dim], 0) / totalLessons)
      : 0;
  }

  const weakestLessons = [...results]
    .sort((a, b) => a.average - b.average)
    .slice(0, 10)
    .map((r) => ({ title: r.lessonTitle, avg: r.average }));

  return {
    results,
    summary: { totalLessons, passing, failing, overallAverage, dimensionAverages, weakestLessons },
  };
}

function writeMarkdownReport(report: EvalReport) {
  const { summary, results } = report;

  let md = `# EDAMastery Content Evaluation Report\n\n`;
  md += `**Date:** ${new Date().toISOString().split("T")[0]}\n`;
  md += `**Benchmark:** avg >= ${BENCHMARK.avgMinimum}, each dimension >= ${BENCHMARK.dimensionMinimum}\n\n`;

  md += `## Summary\n\n`;
  md += `| Metric | Value |\n|--------|-------|\n`;
  md += `| Total Lessons | ${summary.totalLessons} |\n`;
  md += `| Passing | ${summary.passing} (${Math.round((summary.passing / summary.totalLessons) * 100)}%) |\n`;
  md += `| Failing | ${summary.failing} |\n`;
  md += `| Overall Average | **${summary.overallAverage}** |\n\n`;

  md += `## Dimension Averages\n\n`;
  md += `| Dimension | Average | Status |\n|-----------|---------|--------|\n`;
  for (const dim of DIMENSIONS) {
    const avg = summary.dimensionAverages[dim];
    const status = avg >= BENCHMARK.avgMinimum ? "✅" : avg >= BENCHMARK.dimensionMinimum ? "⚠️" : "❌";
    md += `| ${dim.replace(/_/g, " ")} | ${avg} | ${status} |\n`;
  }

  md += `\n## Weakest Lessons\n\n`;
  md += `| Lesson | Average |\n|--------|--------|\n`;
  for (const l of summary.weakestLessons) {
    md += `| ${l.title} | ${l.avg} |\n`;
  }

  // Group by phase
  const phases = [...new Set(results.map((r) => r.phaseOrder))].sort();
  for (const phase of phases) {
    const phaseResults = results.filter((r) => r.phaseOrder === phase);
    const phaseName = phaseResults[0]?.phaseName ?? `Phase ${phase}`;
    const phaseAvg = Math.round(phaseResults.reduce((s, r) => s + r.average, 0) / phaseResults.length);

    md += `\n## Phase ${phase}: ${phaseName} (avg: ${phaseAvg})\n\n`;
    md += `| Lesson | Avg | Cla | Eng | Pro | Cod | Ana | Emo | Dif | Status |\n`;
    md += `|--------|-----|-----|-----|-----|-----|-----|-----|-----|--------|\n`;

    for (const r of phaseResults) {
      const s = r.scores;
      const status = r.passing ? "✅" : "❌";
      md += `| ${r.lessonTitle.slice(0, 40)} | ${r.average} | ${s.clarity} | ${s.engagement} | ${s.protium_relevance} | ${s.code_quality} | ${s.software_analogies} | ${s.emotional_resonance} | ${s.difficulty_calibration} | ${status} |\n`;
    }
  }

  // Failing lessons detail
  const failing = results.filter((r) => !r.passing);
  if (failing.length > 0) {
    md += `\n## Failing Lessons — Detail\n\n`;
    for (const r of failing) {
      md += `### ${r.lessonTitle} (avg: ${r.average})\n\n`;
      md += `**Issues:**\n`;
      r.topIssues.forEach((issue) => (md += `- ${issue}\n`));
      md += `\n**Improvements:**\n`;
      r.improvements.forEach((imp) => (md += `- ${imp}\n`));
      md += `\n`;
    }
  }

  fs.writeFileSync(REPORT_FILE, md);
}

// ─── Run ───────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error("Fatal error:", err);
  prisma.$disconnect();
  process.exit(1);
});
