"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Eye,
  Upload,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { ContentStatus } from "@/lib/constants";

interface LessonEditorData {
  id: string;
  title: string;
  contentMarkdown: string | null;
  protiumNote: string | null;
  audioUrl: string | null;
  contentStatus: ContentStatus;
}

export default function LessonEditorPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<LessonEditorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [protiumNote, setProtiumNote] = useState("");

  useEffect(() => {
    fetch(`/api/admin/content/${lessonId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setLesson(data);
          setMarkdown(data.contentMarkdown ?? "");
          setProtiumNote(data.protiumNote ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [lessonId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/content/${lessonId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentMarkdown: markdown,
          protiumNote,
        }),
      });
      if (res.ok) {
        toast.success("Content saved!");
      } else {
        toast.error("Failed to save.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: ContentStatus) => {
    try {
      const res = await fetch(`/api/admin/content/${lessonId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLesson((prev) => (prev ? { ...prev, contentStatus: newStatus } : prev));
        toast.success(`Marked as ${newStatus}!`);
      } else {
        toast.error("Failed to update status.");
      }
    } catch {
      toast.error("Network error.");
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("audio", file);

    try {
      const res = await fetch(`/api/admin/content/${lessonId}/audio`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setLesson((prev) =>
          prev ? { ...prev, audioUrl: data.audioUrl } : prev
        );
        toast.success("Audio uploaded!");
      } else {
        toast.error("Upload failed.");
      }
    } catch {
      toast.error("Network error.");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="h-96 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-slate-500">Lesson not found.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl space-y-6 px-4 py-6"
    >
      <Link
        href="/admin/content"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Content Pipeline
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">{lesson.title}</h1>
        <Badge variant="outline">{lesson.contentStatus}</Badge>
      </div>

      {/* Markdown editor */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Lesson Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="w-full min-h-[300px] rounded-lg border border-slate-200 p-3 font-mono text-sm text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-y"
            placeholder="Write lesson content in Markdown..."
          />
        </CardContent>
      </Card>

      {/* Protium note */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-amber-700">
            Protium Note
          </CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={protiumNote}
            onChange={(e) => setProtiumNote(e.target.value)}
            className="w-full min-h-[100px] rounded-lg border border-amber-200 bg-amber-50 p-3 font-mono text-sm text-amber-800 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100 resize-y"
            placeholder="Optional Protium-specific notes..."
          />
        </CardContent>
      </Card>

      {/* Audio upload */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Audio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {lesson.audioUrl ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-700">Audio uploaded</span>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No audio file yet.</p>
          )}
          <div>
            <Label className="text-xs text-slate-500">Upload MP3</Label>
            <Input
              type="file"
              accept="audio/mpeg,audio/mp3"
              onChange={handleAudioUpload}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Content"}
        </Button>

        {lesson.contentStatus === "generated" && (
          <Button
            variant="outline"
            onClick={() => handleStatusChange("reviewed")}
            className="flex-1"
          >
            <Eye className="mr-2 h-4 w-4" />
            Mark as Reviewed
          </Button>
        )}

        {(lesson.contentStatus === "reviewed" ||
          lesson.contentStatus === "generated") && (
          <Button
            variant="outline"
            onClick={() => handleStatusChange("published")}
            className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Publish
          </Button>
        )}
      </div>
    </motion.div>
  );
}
