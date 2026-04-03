## NotebookLM Integration

### Architecture
- NotebookLM is for **audio/video generation** — NOT the primary content source
- Primary content comes from Claude API (`scripts/generate-content.ts`)
- NotebookLM role: user uploads Claude-generated content as sources → generates Audio Overviews
- In-app tutor: try NotebookLM first (source-grounded), fall back to Claude API

### Python Skill
- Location: `/Users/ankitgupta/.claude/skills/notebooklm/`
- Entry point: `python scripts/run.py <script> <args>`
- Use `child_process.execFile` (NOT `exec`) — prevent shell injection
- Parse stdout between `===` delimiters, strip `FOLLOW_UP_REMINDER` suffix
- 3-minute timeout per query

### Rate Limits
- Free tier: 50 queries/day
- Track in-memory (resets on server restart — acceptable for local app)
- Warn user at 40 queries, hard stop at 50
- Batch by phase when generating audio sources

### Error Handling
- If NotebookLM skill not installed → graceful degradation, Claude tutor still works
- If auth expired → show "reconnect" prompt in settings
- Never block the learning experience on NotebookLM availability
