"use client";

import { useState } from "react";
import { Plus, Trash2, Save, Loader2, Flame } from "lucide-react";
import { toast } from "sonner";
import { GOAL_CATEGORIES, type GoalCategory } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Goal {
  id: string;
  name: string;
  category: string;
  priority: number;
  notes: string;
}

interface Props {
  lifeContext: Record<string, string | number>;
  goals: Goal[];
  stats: { total: number; ready: number; pending: number; failed: number };
  streak: { current: number; longest: number; graceUsed: boolean };
}

export function YouClient({ lifeContext, goals: initialGoals, stats, streak }: Props): React.ReactElement {
  const [ctx, setCtx] = useState({
    career: (lifeContext.career as string) ?? "",
    health: (lifeContext.health as string) ?? "",
    family: (lifeContext.family as string) ?? "",
    screenTimeMin: Number(lifeContext.screenTimeMin ?? 60),
    tone: ((lifeContext.tone as string) ?? "warm") as "sharp" | "warm" | "playful",
    mixRatio: Number(lifeContext.mixRatio ?? 70),
  });
  const [savingCtx, setSavingCtx] = useState(false);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalCat, setNewGoalCat] = useState<GoalCategory>("career");
  const [newGoalPri, setNewGoalPri] = useState(3);
  const [addingGoal, setAddingGoal] = useState(false);

  async function saveContext(): Promise<void> {
    setSavingCtx(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lifeContext: ctx }),
      });
      if (!res.ok) throw new Error();
      toast.success("Saved");
    } catch {
      toast.error("Couldn't save");
    } finally {
      setSavingCtx(false);
    }
  }

  async function addGoal(): Promise<void> {
    if (!newGoalName.trim()) return;
    setAddingGoal(true);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGoalName.trim(),
          category: newGoalCat,
          priority: newGoalPri,
        }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { goal: Goal };
      setGoals((g) => [data.goal, ...g]);
      setNewGoalName("");
      toast.success("Goal added");
    } catch {
      toast.error("Couldn't add goal");
    } finally {
      setAddingGoal(false);
    }
  }

  async function removeGoal(id: string): Promise<void> {
    setGoals((g) => g.filter((x) => x.id !== id));
    try {
      await fetch(`/api/goals?id=${id}`, { method: "DELETE" });
    } catch {
      toast.error("Couldn't archive goal");
    }
  }

  return (
    <main className="px-5 pt-6 safe-top">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.14em] text-white/45">You</div>
        <h1 className="text-2xl font-semibold tracking-tight">Life context &amp; goals</h1>
      </div>

      <section className="mb-6 grid grid-cols-2 gap-3">
        <StatCard label="Saved" value={stats.total} />
        <StatCard label="Ready" value={stats.ready} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard
          label="Streak"
          value={streak.current}
          accent
          icon={<Flame className="h-3.5 w-3.5 text-[#F5B754]" />}
        />
      </section>

      <section className="card mb-5 p-5">
        <h2 className="mb-1 text-base font-semibold">Your life right now</h2>
        <p className="mb-4 text-xs text-white/55">
          One line each. Used to weight what the feed surfaces. Lodestar never shares this.
        </p>
        <Textarea
          label="Career"
          placeholder="Lead PM at a payments company. Want to go deeper on AI distribution."
          value={ctx.career}
          onChange={(v) => setCtx((c) => ({ ...c, career: v }))}
        />
        <Textarea
          label="Health"
          placeholder="Recovering from a torn meniscus. Can do mobility + easy cardio."
          value={ctx.health}
          onChange={(v) => setCtx((c) => ({ ...c, health: v }))}
        />
        <Textarea
          label="Family"
          placeholder="Two kids, one starting school. Mornings are chaos. Evenings with kids."
          value={ctx.family}
          onChange={(v) => setCtx((c) => ({ ...c, family: v }))}
        />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <NumberField
            label="Daily feed budget (min)"
            value={ctx.screenTimeMin}
            onChange={(v) => setCtx((c) => ({ ...c, screenTimeMin: v }))}
          />
          <SelectField
            label="Tone"
            value={ctx.tone}
            options={[
              ["warm", "Warm"],
              ["sharp", "Sharp"],
              ["playful", "Playful"],
            ]}
            onChange={(v) => setCtx((c) => ({ ...c, tone: v as typeof c.tone }))}
          />
        </div>
        <div className="mt-3">
          <label className="mb-1.5 block text-xs font-medium text-white/55">
            Mix: more learning ↔ more entertainment ({ctx.mixRatio}% learning)
          </label>
          <input
            type="range"
            min={20}
            max={95}
            step={5}
            value={ctx.mixRatio}
            onChange={(e) => setCtx((c) => ({ ...c, mixRatio: Number(e.target.value) }))}
            className="w-full accent-[#F5B754]"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={saveContext} className="btn btn-accent h-10 px-4 text-sm">
            {savingCtx ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </section>

      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Goals</h2>
          <span className="text-xs text-white/45">{goals.length} active</span>
        </div>

        <div className="space-y-2">
          {goals.map((g) => (
            <div key={g.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <span className="text-lg">{emojiFor(g.category)}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{g.name}</div>
                <div className="text-[11px] text-white/45">
                  {g.category} · priority {g.priority}
                </div>
              </div>
              <button
                onClick={() => removeGoal(g.id)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.04]"
                aria-label="Archive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {goals.length === 0 && (
            <p className="text-center text-sm text-white/45">Add your first goal below.</p>
          )}
        </div>

        <div className="mt-4 space-y-2 rounded-2xl border border-dashed border-white/[0.08] p-3">
          <input
            value={newGoalName}
            onChange={(e) => setNewGoalName(e.target.value)}
            placeholder="Goal — e.g. Build fluency in distributed systems"
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm outline-none focus:border-white/[0.18]"
          />
          <div className="flex flex-wrap gap-1.5">
            {GOAL_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setNewGoalCat(c.id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs",
                  newGoalCat === c.id
                    ? "border-white/[0.2] bg-white/[0.08]"
                    : "border-white/[0.06] bg-transparent text-white/60"
                )}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-white/55">Priority</label>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={newGoalPri}
              onChange={(e) => setNewGoalPri(Number(e.target.value))}
              className="flex-1 accent-[#F5B754]"
            />
            <span className="text-xs font-semibold">{newGoalPri}</span>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={addGoal}
              disabled={addingGoal || !newGoalName.trim()}
              className="btn btn-accent h-9 px-3 text-sm disabled:opacity-60"
            >
              {addingGoal ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add goal
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-white/40">Longest streak: {streak.longest}</p>
      </section>
    </main>
  );
}

function emojiFor(cat: string): string {
  const found = GOAL_CATEGORIES.find((g) => g.id === cat);
  return found?.emoji ?? "✨";
}

function StatCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
  icon?: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4",
        accent && "bg-gradient-to-br from-[#F5B754]/10 via-transparent to-[#FF7A7A]/10"
      )}
    >
      <div className="flex items-center gap-1 text-[11px] uppercase tracking-[0.12em] text-white/50">
        {icon} {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}): React.ReactElement {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block text-xs font-medium text-white/55">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full resize-none rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-sm outline-none focus:border-white/[0.18]"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}): React.ReactElement {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-white/55">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-sm outline-none focus:border-white/[0.18]"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}): React.ReactElement {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-white/55">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-sm outline-none focus:border-white/[0.18]"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v} className="bg-[#121214]">
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
