/**
 * Upload media files to Vercel Blob and update database URLs.
 *
 * Prerequisites:
 *   1. Create a Vercel Blob store at https://vercel.com/dashboard/stores
 *   2. Copy the BLOB_READ_WRITE_TOKEN
 *   3. Add it to .env.local: BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
 *
 * Usage: npx tsx scripts/upload-media.ts
 *   --dry-run    Show what would be uploaded without uploading
 *   --force      Re-upload even if lesson already has a blob URL
 */

import { PrismaClient } from "@prisma/client";
import { put, list } from "@vercel/blob";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");

const MEDIA_DIRS = {
  audio: path.resolve(process.cwd(), "public/audio"),
  video: path.resolve(process.cwd(), "public/video"),
  infographics: path.resolve(process.cwd(), "public/infographics"),
};

// Map filename prefix (e.g. "01") to lesson order number
// Files follow pattern: {order}-{slug}.{ext}
function parseFilename(filename: string): { order: number; slug: string } | null {
  const match = filename.match(/^(\d+)-(.+)\.\w+$/);
  if (!match) return null;
  return { order: parseInt(match[1], 10), slug: match[2] };
}

async function main() {
  console.log("\n☁️  EDAMastery Media Upload to Vercel Blob\n");
  console.log("═══════════════════════════════════════════════════\n");

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.log("❌ BLOB_READ_WRITE_TOKEN not found in environment.\n");
    console.log("   1. Create a Blob store at https://vercel.com/dashboard/stores");
    console.log("   2. Copy the read-write token");
    console.log("   3. Add to .env.local: BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...\n");
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log("🏃 DRY RUN — no files will be uploaded\n");
  }

  // Get all lessons with their module info for matching
  const lessons = await prisma.lesson.findMany({
    include: { module: { include: { phase: true } } },
    orderBy: [
      { module: { phase: { order: "asc" } } },
      { module: { order: "asc" } },
      { order: "asc" },
    ],
  });

  // Build a global lesson order → lesson map
  const lessonByGlobalOrder = new Map<number, typeof lessons[0]>();
  const lessonBySlug = new Map<string, typeof lessons[0]>();
  lessons.forEach((lesson, idx) => {
    lessonByGlobalOrder.set(idx + 1, lesson);
    lessonBySlug.set(lesson.slug, lesson);
  });

  let uploaded = 0;
  let skipped = 0;
  let errors = 0;

  // Process each media type
  for (const [mediaType, dir] of Object.entries(MEDIA_DIRS)) {
    if (!fs.existsSync(dir)) {
      console.log(`⏭️  ${mediaType}/ directory not found, skipping\n`);
      continue;
    }

    const files = fs.readdirSync(dir).filter((f) => !f.startsWith("."));
    if (files.length === 0) {
      console.log(`⏭️  ${mediaType}/ is empty, skipping\n`);
      continue;
    }

    console.log(`📁 ${mediaType}/ — ${files.length} file(s)\n`);

    for (const filename of files) {
      const parsed = parseFilename(filename);
      if (!parsed) {
        console.log(`   ⚠️  ${filename} — couldn't parse filename, skipping`);
        skipped++;
        continue;
      }

      // Try to match by slug first, then by global order
      let lesson = lessonBySlug.get(parsed.slug);
      if (!lesson) {
        lesson = lessonByGlobalOrder.get(parsed.order);
      }

      if (!lesson) {
        console.log(`   ⚠️  ${filename} — no matching lesson found, skipping`);
        skipped++;
        continue;
      }

      // Determine which DB field to update
      const fieldMap: Record<string, string> = {
        audio: "audioUrl",
        video: "videoUrl",
        infographics: "infographicUrl",
      };
      const dbField = fieldMap[mediaType];

      // Check if already has a blob URL
      const currentUrl = (lesson as Record<string, unknown>)[dbField] as string | null;
      if (currentUrl?.includes("blob.vercel-storage.com") && !FORCE) {
        console.log(`   ✅ ${filename} → ${lesson.title} (already uploaded)`);
        skipped++;
        continue;
      }

      const filePath = path.join(dir, filename);
      const fileSize = fs.statSync(filePath).size;
      const sizeMB = (fileSize / (1024 * 1024)).toFixed(1);
      const blobPath = `edamastery/${mediaType}/${filename}`;

      if (DRY_RUN) {
        console.log(`   📤 ${filename} (${sizeMB}MB) → ${blobPath} → ${lesson.title}`);
        uploaded++;
        continue;
      }

      try {
        console.log(`   📤 Uploading ${filename} (${sizeMB}MB)...`);
        const fileBuffer = fs.readFileSync(filePath);
        const blob = await put(blobPath, fileBuffer, {
          access: "public",
          addRandomSuffix: false,
        });

        // Update the database
        await prisma.$executeRawUnsafe(
          `UPDATE Lesson SET ${dbField} = ? WHERE id = ?`,
          blob.url,
          lesson.id
        );

        console.log(`   ✅ ${filename} → ${lesson.title}`);
        console.log(`      ${blob.url}\n`);
        uploaded++;
      } catch (err) {
        console.error(`   ❌ ${filename} — upload failed:`, (err as Error).message);
        errors++;
      }
    }
  }

  console.log("\n═══════════════════════════════════════════════════");
  console.log(`\n📊 Results: ${uploaded} uploaded, ${skipped} skipped, ${errors} errors\n`);

  if (DRY_RUN) {
    console.log("💡 Run without --dry-run to actually upload.\n");
  } else if (uploaded > 0) {
    console.log("💡 Media is now served from Vercel Blob CDN.");
    console.log("   You can remove local files from public/audio, public/video, public/infographics.\n");
  }
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
