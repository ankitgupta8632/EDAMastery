/**
 * Generate VTT transcripts from VIDEO files using OpenAI Whisper.
 * Stores results in videoTranscript field (separate from audioTranscript).
 *
 * Usage: npx tsx scripts/generate-video-transcripts.ts
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

const VIDEO_DIR = path.join(process.cwd(), "public/video");
const TMP_DIR = path.join(process.cwd(), ".tmp-vtranscribe");
const MAX_SIZE = 24 * 1024 * 1024;
const CHUNK_DURATION = 300;

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

interface Seg { startTime: number; endTime: number; text: string; }

function parseVTTToSegments(vtt: string): Seg[] {
  const segments: Seg[] = [];
  if (!vtt.includes("-->")) return segments;
  const blocks = vtt.split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    const tsIdx = lines.findIndex((l) => l.includes("-->"));
    if (tsIdx === -1) continue;
    const [startStr, endStr] = lines[tsIdx].split("-->").map((s) => s.trim());
    if (!startStr || !endStr) continue;
    const text = lines.slice(tsIdx + 1).join(" ").replace(/<[^>]*>/g, "").trim();
    if (text) segments.push({ startTime: vttTimeToSeconds(startStr), endTime: vttTimeToSeconds(endStr), text });
  }
  return segments;
}

function segmentsToVTT(segments: Seg[]): string {
  let vtt = "WEBVTT\n\n";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    vtt += `${i + 1}\n${secondsToVTTTime(seg.startTime)} --> ${secondsToVTTTime(seg.endTime)}\n${seg.text}\n\n`;
  }
  return vtt;
}

function getMediaDuration(filePath: string): number {
  const output = execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`, { encoding: "utf-8" });
  return parseFloat(output.trim());
}

function extractAudioChunks(videoPath: string): string[] {
  const size = fs.statSync(videoPath).size;
  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

  if (size <= MAX_SIZE) {
    // Extract audio track as m4a
    const outPath = path.join(TMP_DIR, "audio_full.m4a");
    execSync(`ffmpeg -y -i "${videoPath}" -vn -acodec aac "${outPath}" 2>/dev/null`);
    return [outPath];
  }

  console.log(`  Video is ${(size / 1024 / 1024).toFixed(1)}MB, splitting audio into chunks...`);
  const duration = getMediaDuration(videoPath);
  const numChunks = Math.ceil(duration / CHUNK_DURATION);
  const chunks: string[] = [];

  for (let i = 0; i < numChunks; i++) {
    const start = i * CHUNK_DURATION;
    const chunkPath = path.join(TMP_DIR, `chunk_${i}.m4a`);
    execSync(`ffmpeg -y -i "${videoPath}" -ss ${start} -t ${CHUNK_DURATION} -vn -acodec aac "${chunkPath}" 2>/dev/null`);
    chunks.push(chunkPath);
  }
  console.log(`  Split into ${chunks.length} audio chunks`);
  return chunks;
}

async function transcribeVideo(videoPath: string): Promise<string> {
  console.log(`  Extracting audio and transcribing...`);
  const chunks = extractAudioChunks(videoPath);
  const allSegments: Seg[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const offset = i * CHUNK_DURATION;
    console.log(`  Chunk ${i + 1}/${chunks.length}...`);
    const response = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: fs.createReadStream(chunks[i]),
      response_format: "vtt",
    });
    const segments = parseVTTToSegments(response as unknown as string);
    if (offset > 0) {
      for (const seg of segments) { seg.startTime += offset; seg.endTime += offset; }
    }
    allSegments.push(...segments);
  }

  if (fs.existsSync(TMP_DIR)) fs.rmSync(TMP_DIR, { recursive: true });
  return segmentsToVTT(allSegments);
}

async function main(): Promise<void> {
  const prisma = await getDb();

  const videoFiles = fs
    .readdirSync(VIDEO_DIR)
    .filter((f) => f.endsWith(".mp4") || f.endsWith(".webm"))
    .sort();

  console.log(`Found ${videoFiles.length} video files\n`);

  for (const filename of videoFiles) {
    const videoPath = path.join(VIDEO_DIR, filename);
    const slug = filename.replace(/^\d+-/, "").replace(/\.(mp4|webm)$/, "");

    const lesson = await prisma.lesson.findFirst({
      where: { slug },
      select: { id: true, title: true, videoTranscript: true },
    });

    if (!lesson) { console.log(`Skipping ${filename} — no matching lesson`); continue; }
    if (lesson.videoTranscript) { console.log(`Skipping "${lesson.title}" — already has video transcript`); continue; }

    console.log(`Processing: "${lesson.title}"`);
    try {
      const vtt = await transcribeVideo(videoPath);
      await prisma.lesson.update({ where: { id: lesson.id }, data: { videoTranscript: vtt } });
      console.log(`  Saved video transcript (${vtt.length} chars)\n`);
    } catch (err) {
      console.error(`  Error:`, err);
    }
  }

  if (fs.existsSync(TMP_DIR)) fs.rmSync(TMP_DIR, { recursive: true });
  console.log("Done!");
}

main().catch(console.error);
