export function ProgressRing({
  size = 44,
  stroke = 4,
  value,
  max = 100,
  label,
}: {
  size?: number;
  stroke?: number;
  value: number;
  max?: number;
  label?: string;
}): React.ReactElement {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  const dash = c * pct;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F5B754" />
            <stop offset="100%" stopColor="#FF7A7A" />
          </linearGradient>
        </defs>
      </svg>
      {label && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white/80">
          {label}
        </span>
      )}
    </div>
  );
}
