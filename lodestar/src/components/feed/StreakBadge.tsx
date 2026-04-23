import { Flame } from "lucide-react";

export function StreakBadge({ current, graceUsed }: { current: number; graceUsed?: boolean }): React.ReactElement {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs">
      <Flame
        className={current > 0 ? "h-3.5 w-3.5 text-[#F5B754]" : "h-3.5 w-3.5 text-white/30"}
        strokeWidth={2.5}
      />
      <span className="font-semibold">{current}</span>
      {graceUsed && (
        <span className="rounded-full bg-white/[0.06] px-1.5 text-[10px] text-white/50">grace</span>
      )}
    </div>
  );
}
