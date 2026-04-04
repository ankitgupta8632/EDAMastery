"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BookOpen, Clock, Heart, Sparkles, ArrowRight, GraduationCap } from "lucide-react";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(15);
  const [commuteStart, setCommuteStart] = useState("08:00");
  const [commuteEnd, setCommuteEnd] = useState("09:00");
  const [eveningStart, setEveningStart] = useState("20:00");
  const [eveningEnd, setEveningEnd] = useState("22:00");
  const [weekendLearning, setWeekendLearning] = useState(false);

  const handleFinish = async () => {
    try {
      await fetch("/api/settings?userId=default-user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyGoalMinutes: dailyGoal,
          commuteStartTime: commuteStart,
          commuteEndTime: commuteEnd,
          eveningStartTime: eveningStart,
          eveningEndTime: eveningEnd,
          weekendLearning,
          onboardingCompleted: true,
        }),
      });
      onComplete();
    } catch {
      // Still complete onboarding even if save fails
      onComplete();
    }
  };

  const springTransition = {
    type: "spring" as const,
    stiffness: 260,
    damping: 25,
  };

  const steps = [
    // Step 0: Welcome
    <motion.div
      key="welcome"
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.97 }}
      transition={springTransition}
      className="flex flex-col items-center text-center space-y-8"
    >
      <motion.div
        initial={{ scale: 0.8, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ ...springTransition, delay: 0.1 }}
        className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/[0.06]"
      >
        <GraduationCap className="h-12 w-12 text-green-500" />
      </motion.div>
      <div className="space-y-3">
        <h1 className="text-3xl font-extrabold text-white">Welcome to EDAMastery</h1>
        <p className="text-white/70 max-w-md leading-relaxed text-base">
          Your personal path from software engineer to EDA expert.
          <span className="font-semibold text-white"> 78 bite-sized lessons</span>,
          designed to fit your busy life.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-sm pt-2">
        {[
          { icon: BookOpen, label: "12 Modules", color: "text-green-400" },
          { icon: Clock, label: "15 min/day", color: "text-green-300" },
          { icon: Heart, label: "Your pace", color: "text-green-200" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="flex flex-col items-center gap-2 rounded-2xl bg-white/[0.06] p-4"
          >
            <item.icon className={`h-5 w-5 ${item.color}`} />
            <span className="text-xs text-white/70 font-medium">{item.label}</span>
          </motion.div>
        ))}
      </div>

      <p className="text-sm text-white/40 italic max-w-xs">
        We know you&apos;re juggling a lot. This app adapts to your schedule — not the other way around.
      </p>

      <Button
        onClick={() => setStep(1)}
        size="lg"
        className="mt-2 bg-green-600 text-white hover:bg-green-700 font-semibold text-base px-8"
      >
        Get Started <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </motion.div>,

    // Step 1: Quick setup
    <motion.div
      key="setup"
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.97 }}
      transition={springTransition}
      className="space-y-6 w-full max-w-sm"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-extrabold text-white">Quick Setup</h2>
        <p className="text-sm text-white/70">Takes 30 seconds. You can change these anytime.</p>
      </div>

      <Card className="border border-white/[0.06] bg-[#1a1a1a]">
        <CardContent className="space-y-5 pt-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white">Daily learning goal</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[dailyGoal]}
                min={5}
                max={30}
                step={5}
                onValueChange={(v) => setDailyGoal(Array.isArray(v) ? v[0] : v)}
                className="flex-1"
              />
              <span className="text-sm font-bold text-green-500 w-16 text-right">
                {dailyGoal} min
              </span>
            </div>
            <p className="text-xs text-white/40">
              {dailyGoal <= 10
                ? "Perfect for super busy days"
                : dailyGoal <= 15
                  ? "Great balance -- most parents pick this"
                  : "Ambitious! You'll progress quickly"}
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-white">When do you commute?</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input type="time" value={commuteStart} onChange={(e) => setCommuteStart(e.target.value)} />
              <Input type="time" value={commuteEnd} onChange={(e) => setCommuteEnd(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-white">Evening wind-down time?</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input type="time" value={eveningStart} onChange={(e) => setEveningStart(e.target.value)} />
              <Input type="time" value={eveningEnd} onChange={(e) => setEveningEnd(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium text-white">Learn on weekends?</Label>
              <p className="text-xs text-white/40">Family first -- off by default</p>
            </div>
            <Switch checked={weekendLearning} onCheckedChange={setWeekendLearning} />
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={() => setStep(2)}
        size="lg"
        className="w-full bg-green-600 text-white hover:bg-green-700 font-semibold"
      >
        Almost done <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </motion.div>,

    // Step 2: Let's go
    <motion.div
      key="ready"
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.97 }}
      transition={springTransition}
      className="flex flex-col items-center text-center space-y-8"
    >
      <motion.div
        initial={{ scale: 0.5, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ ...springTransition, delay: 0.1 }}
        className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/[0.06]"
      >
        <Sparkles className="h-12 w-12 text-green-500" />
      </motion.div>
      <div className="space-y-3">
        <h2 className="text-3xl font-extrabold text-white">You&apos;re all set!</h2>
        <p className="text-white/70 max-w-md leading-relaxed text-base">
          Your first lesson is <span className="font-semibold text-white">What is Digital Design?</span> -- a gentle 10-minute introduction that connects to your work on Protium.
        </p>
      </div>

      <div className="bg-white/[0.06] border border-white/[0.06] rounded-2xl p-5 max-w-sm">
        <p className="text-sm text-white/70">
          <span className="font-semibold text-white">Remember:</span> Even 2 minutes counts.
          On the hardest days, just open a Quick Win -- your streak stays alive, and you&apos;re still moving forward.
        </p>
      </div>

      <Button
        onClick={handleFinish}
        size="lg"
        className="mt-2 bg-green-600 text-white hover:bg-green-700 font-semibold text-base px-10"
      >
        Start Learning <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </motion.div>,
  ];

  return (
    <motion.div
      key={step}
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[#121212]"
      initial={false}
      animate={{ opacity: 1 }}
    >
      {/* Progress dots */}
      <div className="flex gap-2 mb-10">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              width: i === step ? 32 : 8,
              backgroundColor: i <= step ? "rgba(34,197,94,0.9)" : "rgba(255,255,255,0.15)",
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-2 rounded-full"
          />
        ))}
      </div>

      <AnimatePresence mode="wait">{steps[step]}</AnimatePresence>
    </motion.div>
  );
}
