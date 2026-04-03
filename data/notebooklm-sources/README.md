# NotebookLM Audio Overview — Setup Guide

## Step-by-Step Instructions

### 1. Create a Notebook
1. Go to [notebooklm.google.com](https://notebooklm.google.com)
2. Click "New Notebook"
3. Name it: "EDAMastery — [Lesson Title]"

### 2. Upload Source
1. Click "Add source" → "Upload"
2. Upload the lesson markdown file (e.g., `01-what-is-digital-design.md`)
3. Wait for NotebookLM to process it

### 3. Generate Audio Overview
1. Click "Audio Overview" in the notebook
2. Click "Customize" and paste the contents of `audio-overview-prompt.txt`
3. Click "Generate"
4. Wait ~5-10 minutes for generation

### 4. Download Audio
1. Once generated, click the three dots menu on the audio overview
2. Download the audio file
3. Save it to `public/audio/` in the EDAMastery project:
   ```
   public/audio/01-what-is-digital-design.wav
   public/audio/02-combinational-logic-gates.wav
   ```

### 5. Import Audio
```bash
npm run import-audio
```

This will scan `public/audio/`, match files to lessons, and update the database.

## Exported Files
- `01-what-is-digital-design.md` — What is Digital Design?
- `02-combinational-logic-gates.md` — Combinational Logic Gates
- `audio-overview-prompt.txt` — Custom prompt for Audio Overview generation
