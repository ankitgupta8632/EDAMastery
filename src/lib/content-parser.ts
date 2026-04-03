interface ContentSection {
  type: "introduction" | "key_concepts" | "example" | "protium" | "summary" | "other";
  heading: string;
  content: string;
}

interface CodeBlock {
  language: string;
  code: string;
}

interface ParsedContent {
  sections: ContentSection[];
  keyTerms: string[];
  codeBlocks: CodeBlock[];
  estimatedReadMinutes: number;
}

function classifySection(heading: string): ContentSection["type"] {
  const lower = heading.toLowerCase();
  if (lower.includes("introduction") || lower.includes("overview")) return "introduction";
  if (lower.includes("key concept") || lower.includes("core concept")) return "key_concepts";
  if (lower.includes("example") || lower.includes("practical") || lower.includes("code")) return "example";
  if (lower.includes("protium") || lower.includes("applies") || lower.includes("connection")) return "protium";
  if (lower.includes("summary") || lower.includes("takeaway") || lower.includes("conclusion")) return "summary";
  return "other";
}

function extractCodeBlocks(text: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({
      language: match[1] || "text",
      code: match[2].trim(),
    });
  }
  return blocks;
}

function extractKeyTerms(text: string): string[] {
  const terms = new Set<string>();

  // Extract bold terms (**term**)
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let match;
  while ((match = boldRegex.exec(text)) !== null) {
    const term = match[1].trim();
    if (term.length > 2 && term.length < 60) {
      terms.add(term);
    }
  }

  return Array.from(terms);
}

function estimateReadTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function parseNotebookLmResponse(rawText: string): ParsedContent {
  const sections: ContentSection[] = [];
  const codeBlocks = extractCodeBlocks(rawText);
  const keyTerms = extractKeyTerms(rawText);

  // Split by ## headings
  const parts = rawText.split(/^## /m);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    if (i === 0 && !rawText.startsWith("## ")) {
      // Content before first heading = introduction
      sections.push({
        type: "introduction",
        heading: "Introduction",
        content: part,
      });
    } else {
      const newlineIndex = part.indexOf("\n");
      const heading = newlineIndex !== -1 ? part.substring(0, newlineIndex).trim() : part;
      const content = newlineIndex !== -1 ? part.substring(newlineIndex + 1).trim() : "";

      sections.push({
        type: classifySection(heading),
        heading,
        content,
      });
    }
  }

  // If no sections parsed, wrap entire text as introduction
  if (sections.length === 0) {
    sections.push({
      type: "introduction",
      heading: "Lesson Content",
      content: rawText,
    });
  }

  return {
    sections,
    keyTerms,
    codeBlocks,
    estimatedReadMinutes: estimateReadTime(rawText),
  };
}

/**
 * Build a structured NotebookLM prompt for lesson generation
 */
export function buildLessonPrompt(
  lessonTitle: string,
  moduleName: string,
  difficulty: string,
  estimatedMinutes: number
): string {
  return `Create a structured lesson on "${lessonTitle}" for the "${moduleName}" module.
Target audience: A software engineer learning EDA, ${difficulty} difficulty level.

Format the response with these exact sections:

## Introduction
(2 paragraphs introducing the concept and why it matters)

## Key Concepts
(3-5 numbered concepts with clear explanations)

## Practical Example
(A complete code example with explanation, preferably in Verilog/SystemVerilog if applicable)

## How This Applies to FPGA Prototyping
(Specifically how this concept matters for Cadence Protium FPGA-based prototyping work)

## Summary
(3-4 bullet point takeaways)

Target reading time: ${estimatedMinutes} minutes. Include code blocks where relevant.
Use clear, accessible language. Build from fundamentals before introducing complexity.`;
}
