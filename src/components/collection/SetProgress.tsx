"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface SetStat {
  id: string;
  name: string;
  series: string;
  logoUrl: string | null;
  total: number;
  owned: number;
  percent: number;
}

export function SetProgress({ stats }: { stats: SetStat[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {stats.map((set, i) => (
        <motion.div
          key={set.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-zinc-800/60 border border-white/10 rounded-2xl p-4 flex items-center gap-4"
        >
          <div className="relative w-12 h-12 shrink-0">
            {set.logoUrl ? (
              <Image src={set.logoUrl} alt={set.name} fill className="object-contain" sizes="48px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">🎴</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/40 truncate">{set.series}</p>
            <p className="text-sm font-bold text-white truncate">{set.name}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${set.percent}%` }}
                  transition={{ delay: i * 0.05 + 0.3, duration: 0.6, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    set.percent === 100
                      ? "bg-yellow-400"
                      : set.percent >= 50
                      ? "bg-blue-400"
                      : "bg-zinc-500"
                  }`}
                />
              </div>
              <span className="text-xs text-white/50 shrink-0">
                {set.owned}/{set.total}
              </span>
            </div>
          </div>

          {set.percent === 100 && (
            <span className="text-lg shrink-0" title="완성!">⭐</span>
          )}
        </motion.div>
      ))}
    </div>
  );
}
