/**
 * Import audio files from public/audio/ into the database.
 * Matches files to lessons by filename pattern and updates audioUrl + audioTranscript.
 *
 * Usage: npx tsx scripts/import-audio.ts
 */

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const prisma = new PrismaClient();
const AUDIO_DIR = path.resolve(process.cwd(), "public/audio");

async function main() {
  console.log("\n🎵 EDAMastery Audio Import\n");
  console.log("═══════════════════════════════════════════════════\n");

  if (!fs.existsSync(AUDIO_DIR)) {
    console.log(`❌ Audio directory not found: ${AUDIO_DIR}`);
    console.log(`   Create it and add audio files first.\n`);
    process.exit(1);
  }

  // Get all lessons ordered by curriculum sequence
  const lessons = await prisma.lesson.findMany({
    include: { module: { include: { phase: true } } },
    orderBy: [
      { module: { phase: { order: "asc" } } },
      { module: { order: "asc" } },
      { order: "asc" },
    ],
  });

  // Scan audio directory for files
  const audioFiles = fs.readdirSync(AUDIO_DIR).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return [".mp3", ".wav", ".ogg", ".m4a", ".webm", ".aac"].includes(ext);
  });

  console.log(`📂 Found ${audioFiles.length} audio files in public/audio/`);
  console.log(`📚 ${lessons.length} lessons in database\n`);

  if (audioFiles.length === 0) {
    console.log("No audio files to import.\n");
    await prisma.$disconnect();
    return;
  }

  let matched = 0;
  let transcriptsFound = 0;

  for (const audioFile of audioFiles) {
    const basename = path.parse(audioFile).name.toLowerCase();

    // Try to match by:
    // 1. Filename starts with NN- prefix matching lesson order
    // 2. Filename contains the lesson slug
    let matchedLesson = null;

    // Pattern 1: "01-what-is-digital-design.wav" → match by order prefix
    const orderMatch = basename.match(/^(\d+)-/);
    if (orderMatch) {
      const idx = parseInt(orderMatch[1]) - 1;
      if (idx >= 0 && idx < lessons.length) {
        matchedLesson = lessons[idx];
      }
    }

    // Pattern 2: match by slug
    if (!matchedLesson) {
      matchedLesson = lessons.find((l) => {
        const slug = (l.slug || "").toLowerCase();
        return slug && (basename.includes(slug) || slug.includes(basename));
      });
    }

    // Pattern 3: match by title keywords
    if (!matchedLesson) {
      const words = basename.replace(/[-_]/g, " ").split(/\s+/);
      matchedLesson = lessons.find((l) => {
        const titleWords = l.title.toLowerCase().split(/\s+/);
        const overlap = words.filter((w) => titleWords.includes(w) && w.length > 3);
        return overlap.length >= 2;
      });
    }

    if (!matchedLesson) {
      console.log(`  ⚠️  No match: ${audioFile}`);
      continue;
    }

    const audioUrl = `/audio/${audioFile}`;

    // Check for transcript file alongside audio
    let transcript: string | null = null;
    const transcriptExts = [".vtt", ".srt", ".txt"];
    for (const ext of transcriptExts) {
      const transcriptFile = path.join(AUDIO_DIR, `${path.parse(audioFile).name}${ext}`);
      if (fs.existsSync(transcriptFile)) {
        transcript = fs.readFileSync(transcriptFile, "utf-8");
        transcriptsFound++;
        break;
      }
    }

    // Update database
    await prisma.lesson.update({
      where: { id: matchedLesson.id },
      data: {
        audioUrl,
        ...(transcript ? { audioTranscript: transcript } : {}),
      },
    });

    matched++;
    console.log(`  ✅ ${audioFile} → "${matchedLesson.title}"${transcript ? " (+transcript)" : ""}`);
  }

  console.log(`\n═══════════════════════════════════════════════════`);
  console.log(`✅ Import complete!`);
  console.log(`  🎵 Matched: ${matched}/${audioFiles.length}`);
  console.log(`  📝 Transcripts: ${transcriptsFound}`);
  console.log(`  ⚠️  Unmatched: ${audioFiles.length - matched}\n`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  prisma.$disconnect();
  process.exit(1);
});
