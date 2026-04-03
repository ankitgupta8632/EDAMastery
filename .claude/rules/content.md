## EDA Content Guidelines

### Target Reader
- Software engineer at Cadence Design Systems, Protium team
- Strong programming background, limited EDA/hardware knowledge
- Needs practical understanding, not academic depth
- Every concept should connect to "why this matters for FPGA prototyping"

### Lesson Structure (per lesson)
1. **Hook** (1 paragraph) — Why does this matter? Real-world motivation.
2. **Core Concepts** — Theory with clear explanations. No jargon without definition.
3. **Code Examples** — Valid Verilog/SystemVerilog with line-by-line comments. Use ```verilog fencing.
4. **Practice Challenge** — A small exercise the reader can think through.
5. **How This Applies to Protium** — 2-3 paragraphs connecting to Cadence Protium FPGA prototyping.
6. **Key Takeaways** — 3-5 bullet summary.

### Content Scaling by Difficulty
- **Beginner:** ~1500 words, 1 code example, focus on intuition
- **Intermediate:** ~2500 words, 2-3 code examples, introduce trade-offs
- **Advanced:** ~3000 words, complex examples, real-world scenarios

### Tone
- Clear, practical, encouraging
- "Think of it like..." analogies from software engineering
- Never condescending — the reader is a senior engineer, just new to this domain
- Celebrate progress: "You now understand enough to read a synthesis report"

### Quiz Questions (4 per lesson)
- 3 multiple choice + 1 true/false
- Test understanding, not memorization
- Every question has an explanation (shown after answering)
- Difficulty matches lesson difficulty
- Options should be plausible (no obviously wrong answers)

### Protium Connections (Phase 4 especially)
- Phase 1-3: Brief "How this applies to Protium" section (2-3 paragraphs)
- Phase 4: The ENTIRE lesson is about Protium — be specific about compilation pipeline, runtime execution, debug workflows
- Reference real Protium concepts: multi-FPGA partitioning, elaboration, timing closure, debug probes
