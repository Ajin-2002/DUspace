"use client";

import { cn } from "@/lib/utils";

export type ReleaseChannel = "alpha" | "beta" | "stable";

const CHANNEL_CONFIG: Record<ReleaseChannel, { label: string; className: string }> = {
  alpha: {
    label: "Alpha",
    className: "bg-orange-50 text-orange-600 ring-orange-500/20",
  },
  beta: {
    label: "Beta",
    className: "bg-blue-50 text-blue-600 ring-blue-500/20",
  },
  stable: {
    label: "Stable",
    className: "bg-emerald-50 text-emerald-600 ring-emerald-500/20",
  },
};

interface ReleaseChannelBadgeProps {
  channel: ReleaseChannel;
  className?: string;
  size?: "sm" | "md";
}

export function ReleaseChannelBadge({ channel, className, size = "md" }: ReleaseChannelBadgeProps) {
  const config = CHANNEL_CONFIG[channel] ?? CHANNEL_CONFIG.stable;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-mono font-medium uppercase tracking-wide ring-1",
        size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2.5 py-0.5 text-[11px]",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
