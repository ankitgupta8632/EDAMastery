"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  FileText,
  PenLine,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CONTENT_STATUSES } from "@/lib/constants";
import type { ContentStatus } from "@/lib/constants";

interface LessonInfo {
  id: string;
  title: string;
  contentStatus: ContentStatus;
  order: number;
}

interface ModuleInfo {
  id: string;
  name: string;
  phaseName: string;
  lessons: LessonInfo[];
}

interface RateLimit {
  remaining: number;
  limit: number;
  resetsAt: string;
}

const STATUS_CONFIG: Record<
  ContentStatus,
  { icon: typeof FileText; color: string; label: string }
> = {
  draft: { icon: PenLine, color: "text-slate-400", label: "Draft" },
  generated: { icon: Sparkles, color: "text-blue-500", label: "Generated" },
  reviewed: { icon: Clock, color: "text-amber-500", label: "Reviewed" },
  published: { icon: CheckCircle2, color: "text-green-500", label: "Published" },
};

export default function ContentPipelinePage() {
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [rateLimit, setRateLimit] = useState<RateLimit | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/content").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/admin/rate-limit").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([contentData, rlData]) => {
        if (contentData?.modules) setModules(contentData.modules);
        if (rlData) setRateLimit(rlData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async (lessonId: string) => {
    setGenerating((prev) => new Set(prev).add(lessonId));
    try {
      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });
      if (res.ok) {
        toast.success("Content generated!");
        // Refresh lesson status
        setModules((prev) =>
          prev.map((mod) => ({
            ...mod,
            lessons: mod.lessons.map((l) =>
              l.id === lessonId ? { ...l, contentStatus: "generated" as ContentStatus } : l
            ),
          }))
        );
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Generation failed.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setGenerating((prev) => {
        const next = new Set(prev);
        next.delete(lessonId);
        return next;
      });
    }
  };

  const handleGenerateModule = async (moduleId: string) => {
    const mod = modules.find((m) => m.id === moduleId);
    if (!mod) return;

    const draftLessons = mod.lessons.filter((l) => l.contentStatus === "draft");
    for (const lesson of draftLessons) {
      await handleGenerate(lesson.id);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl space-y-6 px-4 py-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Content Pipeline</h1>
        {rateLimit && (
          <Badge variant="outline" className="text-xs">
            {rateLimit.remaining}/{rateLimit.limit} queries today
          </Badge>
        )}
      </div>

      {modules.map((mod) => {
        const draftCount = mod.lessons.filter(
          (l) => l.contentStatus === "draft"
        ).length;

        return (
          <Card key={mod.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">{mod.phaseName}</p>
                  <CardTitle className="text-base">{mod.name}</CardTitle>
                </div>
                {draftCount > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateModule(mod.id)}
                    className="text-xs"
                  >
                    <Sparkles className="mr-1 h-3 w-3" />
                    Generate All ({draftCount})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {mod.lessons
                .sort((a, b) => a.order - b.order)
                .map((lesson) => {
                  const config =
                    STATUS_CONFIG[lesson.contentStatus] ?? STATUS_CONFIG.draft;
                  const StatusIcon = config.icon;
                  const isGenerating = generating.has(lesson.id);

                  return (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      ) : (
                        <StatusIcon
                          className={cn("h-4 w-4", config.color)}
                        />
                      )}
                      <Link
                        href={`/admin/content/${lesson.id}`}
                        className="flex-1 text-sm text-slate-700 hover:text-indigo-600 transition-colors truncate"
                      >
                        {lesson.title}
                      </Link>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px]", config.color)}
                      >
                        {config.label}
                      </Badge>
                      {lesson.contentStatus === "draft" && !isGenerating && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleGenerate(lesson.id)}
                          className="h-7 px-2 text-xs"
                        >
                          <Sparkles className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        );
      })}
    </motion.div>
  );
}
