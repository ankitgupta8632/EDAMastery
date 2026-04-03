import Anthropic from "@anthropic-ai/sdk";

const getClient = () => {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
};

export async function askTutor(
  question: string,
  lessonMarkdown: string,
  moduleName: string
): Promise<string> {
  const client = getClient();
  if (!client) {
    return "Claude tutor is not configured. Add ANTHROPIC_API_KEY to .env.local to enable this feature.";
  }

  // Trim lesson content to avoid huge context
  const context = lessonMarkdown.slice(0, 6000);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    system: `You are a patient, encouraging EDA tutor for a software engineer at Cadence Design Systems who works on the Protium FPGA prototyping platform.

The student is working through the "${moduleName}" module. They have a strong programming background but are new to EDA/hardware design.

Answer their question clearly and concisely. Use software engineering analogies when helpful. If the question relates to their lesson content, reference it. If it goes beyond the lesson, use your broader knowledge but note that you're going beyond the lesson material.

Keep answers focused — they're learning in short sessions (10-20 min). Use markdown formatting. Include code examples in \`\`\`verilog or \`\`\`systemverilog fences when relevant.`,
    messages: [
      {
        role: "user",
        content: `Here is my current lesson content for context:\n\n${context}\n\n---\n\nMy question: ${question}`,
      },
    ],
  });

  return response.content[0].type === "text"
    ? response.content[0].text
    : "Sorry, I couldn't generate an answer. Please try again.";
}

export async function askPodcastHost(
  question: string,
  recentTranscript: string,
  audioTimestamp: number,
  lessonTitle: string,
  moduleName: string
): Promise<string> {
  const client = getClient();
  if (!client) {
    return "Podcast host is not configured. Add ANTHROPIC_API_KEY to .env.local.";
  }

  const minutes = Math.floor(audioTimestamp / 60);
  const seconds = Math.floor(audioTimestamp % 60);
  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: `You are one of the friendly, knowledgeable podcast hosts from the EDAMastery audio lesson on "${lessonTitle}" (${moduleName} module).

The listener — a senior software engineer at Cadence who works on Protium FPGA prototyping — just paused the podcast at ${timeStr} to ask you a question.

They were listening to this part of your discussion:
---
${recentTranscript.slice(0, 3000)}
---

Respond as if they're in the room with you, naturally:
- Start warmly: "Great question!" or "Oh, that's a really important point..." or "I'm glad you paused for this..."
- Reference what you were just discussing specifically — don't be generic
- Use software engineering analogies (they're a C++/Python expert)
- Keep it concise: 2-3 paragraphs max — they want to get back to listening
- Be encouraging and build their confidence
- If relevant, connect it to their Protium work at Cadence
- End with a natural transition back: "When you hit play, listen for when we talk about [X]..." or "This actually comes up again in a minute..."

Do NOT use headers or bullet points. Write in natural conversational paragraphs, like you're actually talking to them.`,
    messages: [
      {
        role: "user",
        content: question,
      },
    ],
  });

  return response.content[0].type === "text"
    ? response.content[0].text
    : "Hmm, let me think about that... Could you try asking again?";
}
