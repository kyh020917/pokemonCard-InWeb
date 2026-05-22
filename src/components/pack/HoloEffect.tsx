"use client";

import { Tier } from "@prisma/client";
import { cn } from "@/lib/utils";

const HOLO_CLASS: Partial<Record<Tier, string>> = {
  HR: "holo-hr",
  UR: "holo-ur",
  SR: "holo-sr",
};

export function HoloEffect({
  tier,
  children,
}: {
  tier: Tier;
  children: React.ReactNode;
}) {
  const holoClass = HOLO_CLASS[tier];

  return (
    <div className={cn("relative rounded-xl overflow-hidden", holoClass)}>
      {children}
      {holoClass && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl holo-overlay"
        />
      )}
    </div>
  );
}
