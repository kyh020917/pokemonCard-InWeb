import { Tier } from "@prisma/client";
import { cn } from "@/lib/utils";

const TIER_CONFIG: Record<Tier, { label: string; className: string }> = {
  C:  { label: "일반",         className: "bg-zinc-700 text-zinc-300" },
  U:  { label: "고급",         className: "bg-green-900 text-green-300" },
  R:  { label: "희귀",         className: "bg-blue-900 text-blue-300" },
  HR: { label: "홀로그래픽",   className: "bg-purple-900 text-purple-300" },
  UR: { label: "울트라",       className: "bg-orange-900 text-orange-300" },
  SR: { label: "시크릿",       className: "bg-yellow-900 text-yellow-300 font-black" },
};

export function TierBadge({ tier, className }: { tier: Tier; className?: string }) {
  const config = TIER_CONFIG[tier];
  return (
    <span
      className={cn(
        "inline-block text-xs px-2 py-0.5 rounded-full font-semibold",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

export { TIER_CONFIG };
