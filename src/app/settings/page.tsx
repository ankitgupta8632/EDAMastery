"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useApp } from "@/contexts/app-context";
import { LEARNING_MODES } from "@/lib/constants";
import type { UserSettingsData } from "@/types";

const DEFAULT_SETTINGS: UserSettingsData = {
  dailyGoalMinutes: 15,
  weekendLearning: true,
  reminderTime: "09:00",
  reminderEnabled: false,
  preferredMode: "focus",
  commuteStartTime: "08:00",
  commuteEndTime: "09:00",
  eveningStartTime: "20:00",
  eveningEndTime: "22:00",
  autoPlayAudio: true,
  playbackSpeed: 1,
  overwhelmedMode: false,
  overwhelmedUntil: null,
  reducedGoalMinutes: 5,
  notebookLmConfigured: false,
};

export default function SettingsPage() {
  const { refreshSettings } = useApp();
  const [settings, setSettings] = useState<UserSettingsData>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings?userId=default-user")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setSettings(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings?userId=default-user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast.success("Settings saved!");
        refreshSettings();
      } else {
        toast.error("Failed to save settings.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const update = <K extends keyof UserSettingsData>(
    key: K,
    value: UserSettingsData[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
        <div className="h-8 w-28 animate-pulse rounded-lg bg-slate-100" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-2xl space-y-6 px-4 py-8"
    >
      <motion.h1 variants={itemVariants} className="text-2xl font-bold text-slate-800">
        Settings
      </motion.h1>

      {/* Learning Schedule */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Learning Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium">
                Daily Goal: <span className="text-indigo-600 font-bold">{settings.dailyGoalMinutes} minutes</span>
              </Label>
              <Slider
                value={[settings.dailyGoalMinutes]}
                onValueChange={(v) => update("dailyGoalMinutes", Array.isArray(v) ? v[0] : v)}
                min={5}
                max={60}
                step={5}
                className="mt-2"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>5 min</span>
                <span>60 min</span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <div>
                <Label className="text-sm font-medium">Weekend Learning</Label>
                <p className="text-xs text-slate-400">Include weekends in your streak</p>
              </div>
              <Switch
                checked={settings.weekendLearning}
                onCheckedChange={(v) => update("weekendLearning", v)}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-slate-500">Commute Start</Label>
                <Input
                  type="time"
                  value={settings.commuteStartTime}
                  onChange={(e) => update("commuteStartTime", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500">Commute End</Label>
                <Input
                  type="time"
                  value={settings.commuteEndTime}
                  onChange={(e) => update("commuteEndTime", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-slate-500">Evening Start</Label>
                <Input
                  type="time"
                  value={settings.eveningStartTime}
                  onChange={(e) => update("eveningStartTime", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-500">Evening End</Label>
                <Input
                  type="time"
                  value={settings.eveningEndTime}
                  onChange={(e) => update("eveningEndTime", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Content Preferences */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Content Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-medium">Preferred Mode</Label>
              <Select
                value={settings.preferredMode}
                onValueChange={(v) => update("preferredMode", v ?? "auto")}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEARNING_MODES).map(([key, mode]) => (
                    <SelectItem key={key} value={key}>
                      {mode.icon} {mode.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">
                Playback Speed: <span className="text-indigo-600 font-bold">{settings.playbackSpeed}x</span>
              </Label>
              <Slider
                value={[settings.playbackSpeed]}
                onValueChange={(v) => update("playbackSpeed", Array.isArray(v) ? v[0] : v)}
                min={0.5}
                max={2}
                step={0.25}
                className="mt-2"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0.5x</span>
                <span>2x</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Empathy */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Empathy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 p-4">
              <div className="flex-1">
                <Label className="text-sm font-medium">I&apos;m Overwhelmed</Label>
                <p className="text-xs text-slate-400 mt-0.5">
                  Reduces daily goals to {settings.reducedGoalMinutes} minutes for 3 days. No judgment — rest is part of learning.
                </p>
              </div>
              <Switch
                checked={settings.overwhelmedMode}
                onCheckedChange={(v) => update("overwhelmedMode", v)}
              />
            </div>
            {settings.overwhelmedMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3"
              >
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700">
                  Overwhelmed mode is active. Your goals are reduced. Take it easy.
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* NotebookLM */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">NotebookLM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {settings.notebookLmConfigured ? (
                <>
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-emerald-700">Connected</span>
                </>
              ) : (
                <>
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100">
                    <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <span className="text-sm text-slate-500">Not configured</span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Configure in the admin panel to enable notebook-powered learning.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Save button */}
      <motion.div variants={itemVariants}>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-sm"
          size="lg"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </motion.div>

      <Separator className="my-2" />
      <div className="text-center pb-4">
        <Link href="/admin" className="text-xs text-slate-400 hover:text-indigo-500 transition-colors duration-200">
          Admin Panel &rarr;
        </Link>
      </div>
    </motion.div>
  );
}
