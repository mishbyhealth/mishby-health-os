import React from "react";

type Props = {
  label: string;
  current: number;
  target: number;
  unit?: string;
  className?: string;
};

export default function ProgressBar({
  label,
  current,
  target,
  unit,
  className,
}: Props) {
  const safeTarget = Math.max(1, Number.isFinite(target) ? target : 1);
  const safeCurrent = Math.max(0, Number.isFinite(current) ? current : 0);
  const pct = Math.min(100, Math.round((safeCurrent / safeTarget) * 100));

  return (
    <div className={`w-full ${className ?? ""}`}>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-sm font-medium text-gray-800">{label}</span>
        <span className="text-xs text-gray-600">
          {safeCurrent}
          {unit ? ` ${unit}` : ""} / {safeTarget}
          {unit ? ` ${unit}` : ""} ({pct}%)
        </span>
      </div>
      <div className="w-full h-3 rounded-full bg-violet-200/50 overflow-hidden">
        <div
          className="h-3 rounded-full bg-teal-500 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
