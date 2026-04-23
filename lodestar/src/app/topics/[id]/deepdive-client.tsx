"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Loader2, RotateCw } from "lucide-react";
import { toast } from "sonner";

interface Props {
  clusterId: string;
  initialMarkdown: string | null;
  generatedAt: string | null;
}

export function ClusterDeepDive({ clusterId, initialMarkdown, generatedAt }: Props): React.ReactElement {
  const [md, setMd] = useState<string | null>(initialMarkdown);
  const [busy, setBusy] = useState(false);

  async function run(): Promise<void> {
    setBusy(true);
    try {
      const res = await fetch(`/api/clusters/${clusterId}/deepdive`, { method: "POST" });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { bodyMarkdown: string };
      setMd(data.bodyMarkdown);
      toast.success("Deep-dive ready");
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error && err.message.toLowerCase().includes("anthropic")
          ? "Add ANTHROPIC_API_KEY to generate deep-dives"
          : "Deep-dive failed"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#F5B754]/8 via-transparent to-[#A78BFA]/8 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#F5B754]" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-white/70">
            Synthesised deep-dive
          </h2>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="btn btn-ghost h-9 px-3 text-xs"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : md ? <RotateCw className="h-3.5 w-3.5" /> : null}
          {md ? "Regenerate" : "Generate"}
        </button>
      </div>

      {!md && !busy && (
        <p className="mt-3 text-sm text-white/60">
          Claude will read every link in this cluster and write you a single, synthesised lesson on the broader topic. Takes ~30 seconds.
        </p>
      )}

      {busy && (
        <div className="mt-3 space-y-2">
          <div className="h-3 w-3/4 rounded bg-white/[0.06]" />
          <div className="h-3 w-full rounded bg-white/[0.06]" />
          <div className="h-3 w-5/6 rounded bg-white/[0.06]" />
          <div className="h-3 w-11/12 rounded bg-white/[0.06]" />
        </div>
      )}

      {md && (
        <article className="prose-lodestar prose prose-invert mt-4 max-w-none prose-headings:tracking-tight prose-p:leading-relaxed prose-li:leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
          {generatedAt && (
            <p className="mt-4 text-xs text-white/40">
              Generated {new Date(generatedAt).toLocaleString()}
            </p>
          )}
        </article>
      )}
    </section>
  );
}
