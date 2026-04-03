/**
 * Export lesson content as source documents for NotebookLM.
 *
 * Usage:
 *   npx tsx scripts/export-for-notebooklm.ts              # first 2 lessons
 *   npx tsx scripts/export-for-notebooklm.ts --count 5     # first 5 lessons
 *   npx tsx scripts/export-for-notebooklm.ts --all         # all lessons
 */

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const prisma = new PrismaClient();
const OUTPUT_DIR = path.resolve(process.cwd(), "data/notebooklm-sources");

const AUDIO_PROMPT = `You are creating an audio overview podcast for a software engineer learning EDA (Electronic Design Automation).

## Your Listener
- Senior C++/Python engineer at Cadence Design Systems
- Works on the Protium FPGA prototyping platform
- Deep software expertise but LIMITED hardware/EDA knowledge
- Busy parent — listens during commute or while baby naps
- Feels imposter syndrome in EDA meetings, wants to feel confident

## Conversation Guidelines
- Start with a warm, relatable hook: "If you've ever opened a Protium compilation report and felt lost..."
- Explain EVERY EDA concept using a software engineering analogy first
  - "Think of synthesis like a compiler — it takes your high-level description and..."
  - "Timing analysis is basically the hardware equivalent of profiling your code for..."
- Discuss how each concept applies to Protium FPGA prototyping specifically
- Be conversational, warm, and encouraging — like two knowledgeable friends chatting
- Acknowledge that learning a new domain is challenging: "This took me a while to click too"
- Include "meeting cheat sheet" moments: "Next time someone mentions [X], you can say..."
- Use real-world scenarios: "Imagine you're looking at a Protium compilation log and you see..."
- Target 30-35 minutes for this overview
- End with encouragement and a teaser for what's next
- Address imposter syndrome directly: "You absolutely belong in these conversations"

## Tone
- Think NPR's Planet Money explaining finance, but for EDA
- Enthusiastic but not manic
- Expert but never condescending
- Empathetic — you understand the listener's situation
- Practical — always connect theory to what they'll actually see at work`;

async function main() {
  const args = process.argv.slice(2);
  const countArg = args.includes("--count") ? parseInt(args[args.indexOf("--count") + 1]) : null;
  const all = args.includes("--all");
  const count = all ? 999 : (countArg ?? 2);

  console.log("\n📦 EDAMastery NotebookLM Export\n");
  console.log("═══════════════════════════════════════════════════\n");

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Get lessons
  const lessons = await prisma.lesson.findMany({
    where: { contentMarkdown: { not: null } },
    include: {
      module: { include: { phase: true } },
      quiz: { include: { questions: true } },
    },
    orderBy: [
      { module: { phase: { order: "asc" } } },
      { module: { order: "asc" } },
      { order: "asc" },
    ],
    take: count,
  });

  console.log(`📚 Exporting ${lessons.length} lessons\n`);

  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    const slug = lesson.slug || lesson.id;
    const filename = `${String(i + 1).padStart(2, "0")}-${slug}.md`;
    const filepath = path.join(OUTPUT_DIR, filename);

    let content = `# ${lesson.title}\n\n`;
    content += `> **Module:** ${lesson.module.name} | **Phase:** ${lesson.module.phase.name} | **Difficulty:** ${lesson.difficulty} | **Reading time:** ${lesson.estimatedMinutes} min\n\n`;
    content += `---\n\n`;

    // Main content
    content += lesson.contentMarkdown + "\n\n";

    // Protium note
    if (lesson.protiumNote) {
      content += `---\n\n## Protium FPGA Prototyping Connection\n\n`;
      content += lesson.protiumNote + "\n\n";
    }

    // Quiz questions (without answers — for discussion)
    if (lesson.quiz?.questions && lesson.quiz.questions.length > 0) {
      content += `---\n\n## Discussion Questions\n\n`;
      content += `*These are great topics to explore in the podcast discussion:*\n\n`;
      for (const q of lesson.quiz.questions) {
        content += `- ${q.questionText}\n`;
        try {
          const options = JSON.parse(q.options);
          options.forEach((opt: string) => (content += `  - ${opt}\n`));
        } catch {
          // skip if options can't be parsed
        }
        content += `\n`;
      }
    }

    fs.writeFileSync(filepath, content);
    console.log(`  ✅ ${filename} (${(content.length / 1024).toFixed(1)} KB)`);
  }

  // Write audio prompt
  const promptPath = path.join(OUTPUT_DIR, "audio-overview-prompt.txt");
  fs.writeFileSync(promptPath, AUDIO_PROMPT);
  console.log(`\n  📝 audio-overview-prompt.txt`);

  // Write README with instructions
  const readmePath = path.join(OUTPUT_DIR, "README.md");
  const readme = `# NotebookLM Audio Overview — Setup Guide

## Step-by-Step Instructions

### 1. Create a Notebook
1. Go to [notebooklm.google.com](https://notebooklm.google.com)
2. Click "New Notebook"
3. Name it: "EDAMastery — [Lesson Title]"

### 2. Upload Source
1. Click "Add source" → "Upload"
2. Upload the lesson markdown file (e.g., \`01-what-is-digital-design.md\`)
3. Wait for NotebookLM to process it

### 3. Generate Audio Overview
1. Click "Audio Overview" in the notebook
2. Click "Customize" and paste the contents of \`audio-overview-prompt.txt\`
3. Click "Generate"
4. Wait ~5-10 minutes for generation

### 4. Download Audio
1. Once generated, click the three dots menu on the audio overview
2. Download the audio file
3. Save it to \`public/audio/\` in the EDAMastery project:
   \`\`\`
   public/audio/01-what-is-digital-design.wav
   public/audio/02-combinational-logic-gates.wav
   \`\`\`

### 5. Import Audio
\`\`\`bash
npm run import-audio
\`\`\`

This will scan \`public/audio/\`, match files to lessons, and update the database.

## Exported Files
${lessons.map((l, i) => `- \`${String(i + 1).padStart(2, "0")}-${l.slug || l.id}.md\` — ${l.title}`).join("\n")}
- \`audio-overview-prompt.txt\` — Custom prompt for Audio Overview generation
`;

  fs.writeFileSync(readmePath, readme);
  console.log(`  📖 README.md`);

  console.log(`\n═══════════════════════════════════════════════════`);
  console.log(`✅ Export complete! Files at: ${OUTPUT_DIR}`);
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Open notebooklm.google.com`);
  console.log(`   2. Upload each lesson file as a source`);
  console.log(`   3. Use audio-overview-prompt.txt for Audio Overview customization`);
  console.log(`   4. Download generated audio to public/audio/`);
  console.log(`   5. Run: npm run import-audio\n`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  prisma.$disconnect();
  process.exit(1);
});
