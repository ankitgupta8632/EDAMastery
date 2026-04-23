import { prisma } from "@/lib/db";
import { claudeText, hasAnthropic } from "./anthropic";

export async function generateClusterDeepDive(clusterId: string): Promise<string> {
  const cluster = await prisma.cluster.findUnique({
    where: { id: clusterId },
    include: {
      links: {
        include: {
          link: {
            select: {
              title: true,
              summary: true,
              takeaways: true,
              author: true,
              url: true,
              transcript: true,
              rawText: true,
              vibe: true,
            },
          },
        },
      },
    },
  });
  if (!cluster) throw new Error("cluster not found");

  if (!hasAnthropic()) {
    const md = renderOffline(cluster.label, cluster.summary, cluster.links.map((c) => c.link));
    await persist(clusterId, md);
    return md;
  }

  const linkLines = cluster.links.map((c, i) => {
    const l = c.link;
    const takeaways = safeParse(l.takeaways) as string[];
    const body = (l.transcript ?? l.rawText ?? "").slice(0, 2000);
    return `### [${i + 1}] ${l.title ?? l.url}${l.author ? " — " + l.author : ""}
Summary: ${l.summary ?? ""}
Takeaways:
- ${takeaways.slice(0, 5).join("\n- ")}
Excerpt:
${body}`;
  });

  const user = `Cluster label: ${cluster.label}
Cluster summary: ${cluster.summary}

Source links (${cluster.links.length}):
${linkLines.join("\n\n---\n\n")}`;

  const system = `You are the house writer for a personal learning app. Synthesise multiple sources the user saved into a single, self-contained "broader topic" lesson.

Output: rich Markdown only (no preamble, no json).

Structure:
# <Cluster label>

*One-paragraph hook: what's the single thread? Why does this matter to a senior professional who's time-starved?*

## What I'd bet matters most
3–5 bullets capturing the highest-signal takeaways across the sources.

## The shape of the idea
Explain the concept from first principles in 2-3 short paragraphs. Include analogies.

## Where the sources converge
Short section: where do the sources agree?

## Where the sources disagree or leave gaps
Short section: tensions, contradictions, open questions.

## A 15-minute action
One concrete thing the reader can do today to test or apply this.

## Cite your sources
For each source used, a one-line citation in the form:
- [Title](URL) — one-sentence note on what this contributed.

Tone: sharp, senior-to-senior, never patronising, never listicle-fluff. Use "you" sparingly. Show your reasoning.`;

  const md = await claudeText({ system, user, maxTokens: 3500 });
  await persist(clusterId, md);
  return md;
}

async function persist(clusterId: string, md: string): Promise<void> {
  await prisma.clusterDeepDive.upsert({
    where: { clusterId },
    create: { clusterId, bodyMarkdown: md },
    update: { bodyMarkdown: md, generatedAt: new Date() },
  });
}

function renderOffline(label: string, summary: string, links: { title: string | null; url: string; summary: string | null }[]): string {
  return `# ${label}

${summary}

## Sources (${links.length})
${links.map((l) => `- [${l.title ?? l.url}](${l.url})${l.summary ? " — " + l.summary : ""}`).join("\n")}

*(Anthropic key not configured — synthesised deep-dive requires ANTHROPIC_API_KEY.)*`;
}

function safeParse(s: string | null): unknown {
  if (!s) return [];
  try {
    return JSON.parse(s);
  } catch {
    return [];
  }
}
