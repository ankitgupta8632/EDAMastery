/**
 * Generate VTT transcripts from audio files using OpenAI Whisper.
 * Handles files > 25MB by splitting into chunks via ffmpeg.
 * Stores results in audioTranscript and videoTranscript fields.
 *
 * Usage: npx tsx scripts/generate-transcripts.ts
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import OpenAI from "openai";

async function getDb() {
  const { prisma } = await import("../src/lib/db");
  return prisma;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const AUDIO_DIR = path.join(process.cwd(), "public/audio");
const TMP_DIR = path.join(process.cwd(), ".tmp-transcribe");
const MAX_SIZE = 24 * 1024 * 1024; // 24MB to stay under 25MB limit
const CHUNK_DURATION = 300; // 5 minutes per chunk

interface VTTSegment {
  startTime: number;
  endTime: number;
  text: string;
}

function parseVTTToSegments(vtt: string): VTTSegment[] {
  const segments: VTTSegment[] = [];
  if (!vtt.includes("-->")) return segments;

  const blocks = vtt.split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    const tsIdx = lines.findIndex((l) => l.includes("-->"));
    if (tsIdx === -1) continue;

    const [startStr, endStr] = lines[tsIdx].split("-->").map((s) => s.trim());
    if (!startStr || !endStr) continue;

    const startTime = vttTimeToSeconds(startStr);
    const endTime = vttTimeToSeconds(endStr);
    const text = lines
      .slice(tsIdx + 1)
      .join(" ")
      .replace(/<[^>]*>/g, "")
      .trim();

    if (text) segments.push({ startTime, endTime, text });
  }
  return segments;
}

function vttTimeToSeconds(ts: string): number {
  const parts = ts.split(":");
  if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
  }
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(ts) || 0;
}

function secondsToVTTTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toFixed(3).padStart(6, "0")}`;
}

function segmentsToVTT(segments: VTTSegment[]): string {
  let vtt = "WEBVTT\n\n";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    vtt += `${i + 1}\n`;
    vtt += `${secondsToVTTTime(seg.startTime)} --> ${secondsToVTTTime(seg.endTime)}\n`;
    vtt += `${seg.text}\n\n`;
  }
  return vtt;
}

function getAudioDuration(filePath: string): number {
  const output = execSync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`,
    { encoding: "utf-8" }
  );
  return parseFloat(output.trim());
}

function splitAudio(filePath: string): string[] {
  const size = fs.statSync(filePath).size;
  if (size <= MAX_SIZE) return [filePath];

  console.log(`  File is ${(size / 1024 / 1024).toFixed(1)}MB, splitting into chunks...`);

  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

  const duration = getAudioDuration(filePath);
  const numChunks = Math.ceil(duration / CHUNK_DURATION);
  const chunks: string[] = [];

  for (let i = 0; i < numChunks; i++) {
    const start = i * CHUNK_DURATION;
    const chunkPath = path.join(TMP_DIR, `chunk_${i}.m4a`);
    execSync(
      `ffmpeg -y -i "${filePath}" -ss ${start} -t ${CHUNK_DURATION} -c copy "${chunkPath}" 2>/dev/null`
    );
    chunks.push(chunkPath);
  }

  console.log(`  Split into ${chunks.length} chunks`);
  return chunks;
}

async function transcribeFile(audioPath: string, offsetSeconds: number): Promise<VTTSegment[]> {
  const response = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file: fs.createReadStream(audioPath),
    response_format: "vtt",
  });

  const vtt = response as unknown as string;
  const segments = parseVTTToSegments(vtt);

  // Offset timestamps for chunks after the first
  if (offsetSeconds > 0) {
    for (const seg of segments) {
      seg.startTime += offsetSeconds;
      seg.endTime += offsetSeconds;
    }
  }

  return segments;
}

async function transcribeToVTT(audioPath: string): Promise<string> {
  console.log(`  Transcribing: ${path.basename(audioPath)}...`);

  const chunks = splitAudio(audioPath);
  const allSegments: VTTSegment[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const offset = i * CHUNK_DURATION;
    console.log(`  Chunk ${i + 1}/${chunks.length}...`);
    const segments = await transcribeFile(chunks[i], offset);
    allSegments.push(...segments);
  }

  // Clean up temp files
  if (fs.existsSync(TMP_DIR)) {
    fs.rmSync(TMP_DIR, { recursive: true });
  }

  return segmentsToVTT(allSegments);
}

async function main(): Promise<void> {
  const prisma = await getDb();

  const audioFiles = fs
    .readdirSync(AUDIO_DIR)
    .filter((f) => f.endsWith(".m4a") || f.endsWith(".mp3") || f.endsWith(".wav"))
    .sort();

  console.log(`Found ${audioFiles.length} audio files\n`);

  for (const filename of audioFiles) {
    const audioPath = path.join(AUDIO_DIR, filename);

    const slug = filename
      .replace(/^\d+-/, "")
      .replace(/\.(m4a|mp3|wav)$/, "");

    const lesson = await prisma.lesson.findFirst({
      where: { slug },
      select: { id: true, title: true, slug: true, audioTranscript: true },
    });

    if (!lesson) {
      console.log(`Skipping ${filename} — no matching lesson for slug "${slug}"`);
      continue;
    }

    if (lesson.audioTranscript) {
      console.log(`Skipping "${lesson.title}" — already has transcript`);
      continue;
    }

    console.log(`Processing: "${lesson.title}"`);

    try {
      const vtt = await transcribeToVTT(audioPath);

      await prisma.lesson.update({
        where: { id: lesson.id },
        data: {
          audioTranscript: vtt,
          videoTranscript: vtt,
        },
      });

      console.log(`  Saved VTT transcript (${vtt.length} chars)\n`);
    } catch (err) {
      console.error(`  Error transcribing "${lesson.title}":`, err);
    }
  }

  // Clean up
  if (fs.existsSync(TMP_DIR)) {
    fs.rmSync(TMP_DIR, { recursive: true });
  }

  console.log("Done!");
}

main().catch(console.error);
