"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface Notebook {
  id: string;
  name: string;
  url: string;
  description: string;
  topics: string[];
}

export default function NotebooksPage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [authStatus, setAuthStatus] = useState<"connected" | "disconnected">(
    "disconnected"
  );
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formTopics, setFormTopics] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/notebooks")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setNotebooks(data.notebooks ?? []);
          setAuthStatus(data.authStatus ?? "disconnected");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!formName || !formUrl) {
      toast.error("Name and URL are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/notebooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          url: formUrl,
          description: formDesc,
          topics: formTopics
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotebooks((prev) => [...prev, data.notebook]);
        setFormName("");
        setFormUrl("");
        setFormDesc("");
        setFormTopics("");
        setShowForm(false);
        toast.success("Notebook added!");
      } else {
        toast.error("Failed to add notebook.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/notebooks/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotebooks((prev) => prev.filter((n) => n.id !== id));
        toast.success("Notebook removed.");
      } else {
        toast.error("Failed to remove notebook.");
      }
    } catch {
      toast.error("Network error.");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
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
      <h1 className="text-2xl font-bold text-slate-800">Notebook Manager</h1>

      {/* Auth status */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            {authStatus === "connected" ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-700">
                  NotebookLM Connected
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <span className="text-sm font-medium text-amber-700">
                  NotebookLM Not Connected
                </span>
              </>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            {notebooks.length} notebook{notebooks.length !== 1 ? "s" : ""}
          </Badge>
        </CardContent>
      </Card>

      {/* Notebook list */}
      {notebooks.map((nb) => (
        <Card key={nb.id}>
          <CardContent className="py-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <BookOpen className="mt-0.5 h-5 w-5 text-indigo-500" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {nb.name}
                  </p>
                  {nb.description && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {nb.description}
                    </p>
                  )}
                  {nb.topics.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {nb.topics.map((topic) => (
                        <Badge
                          key={topic}
                          variant="outline"
                          className="text-[10px]"
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <a
                    href={nb.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open
                  </a>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(nb.id)}
                className="text-red-400 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {notebooks.length === 0 && !showForm && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <BookOpen className="h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">
              No notebooks registered yet. Add one to get started.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add notebook form */}
      {showForm ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Add Notebook</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-slate-500">Name *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., EDA Foundations"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500">URL *</Label>
              <Input
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://notebooklm.google.com/..."
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Description</Label>
              <Input
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Optional description"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500">
                Topics (comma-separated)
              </Label>
              <Input
                value={formTopics}
                onChange={(e) => setFormTopics(e.target.value)}
                placeholder="e.g., histograms, distributions, pandas"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAdd}
                disabled={submitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {submitting ? "Adding..." : "Add Notebook"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowForm(true)}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Notebook
        </Button>
      )}
    </motion.div>
  );
}
