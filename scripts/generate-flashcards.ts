/**
 * Generate flashcards for lessons using Claude API.
 * Stores as JSON array of {front, back} in flashcardsJson field.
 *
 * Usage: npx tsx scripts/generate-flashcards.ts          # lessons without flashcards
 *        npx tsx scripts/generate-flashcards.ts --count 5 # first 5 lessons only
 *        npx tsx scripts/generate-flashcards.ts --all     # regenerate all
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import Anthropic from "@anthropic-ai/sdk";

async function getDb() {
  const { prisma } = await import("../src/lib/db");
  return prisma;
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface Flashcard {
  front: string;
  back: string;
}

async function generateFlashcards(
  title: string,
  content: string,
  moduleName: string
): Promise<Flashcard[]> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: `You generate flashcards for a software engineer learning EDA (Electronic Design Automation) at Cadence Design Systems (Protium team).

Create exactly 8 flashcards from the lesson content. Each flashcard should:
- Have a concise question/term on the FRONT (1-2 sentences max)
- Have a clear, practical answer on the BACK (2-3 sentences max)
- Use software engineering analogies where helpful
- Cover the most important concepts from the lesson
- Mix concept definitions, practical applications, and "how does this relate to Protium?" cards

Return ONLY a JSON array with no other text:
[{"front": "question", "back": "answer"}, ...]`,
    messages: [
      {
        role: "user",
        content: `Generate flashcards for the lesson "${title}" in the ${moduleName} module:\n\n${content.slice(0, 5000)}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON array from response
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) {
    console.error("  Could not parse flashcards JSON");
    return [];
  }

  try {
    return JSON.parse(match[0]) as Flashcard[];
  } catch {
    console.error("  Invalid JSON in flashcards response");
    return [];
  }
}

async function main(): Promise<void> {
  const prisma = await getDb();
  const args = process.argv.slice(2);
  const countArg = args.includes("--count")
    ? parseInt(args[args.indexOf("--count") + 1])
    : null;
  const all = args.includes("--all");
  const count = all ? 999 : (countArg ?? 999);

  const lessons = await prisma.lesson.findMany({
    where: {
      contentMarkdown: { not: null },
      ...(all ? {} : { flashcardsJson: null }),
    },
    include: { module: true },
    orderBy: [
      { module: { phase: { order: "asc" } } },
      { module: { order: "asc" } },
      { order: "asc" },
    ],
    take: count,
  });

  console.log(`\nGenerating flashcards for ${lessons.length} lessons\n`);

  for (const lesson of lessons) {
    if (!lesson.contentMarkdown) continue;

    console.log(`Processing: "${lesson.title}"`);

    try {
      const cards = await generateFlashcards(
        lesson.title,
        lesson.contentMarkdown,
        lesson.module.name
      );

      if (cards.length > 0) {
        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { flashcardsJson: JSON.stringify(cards) },
        });
        console.log(`  Saved ${cards.length} flashcards\n`);
      } else {
        console.log(`  No flashcards generated\n`);
      }
    } catch (err) {
      console.error(`  Error: ${err}\n`);
    }
  }

  console.log("Done!");
}

main().catch(console.error);
