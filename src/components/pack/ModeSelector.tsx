"use client";

import { motion } from "framer-motion";

export type OpenMode = "one_by_one" | "all_at_once";

const MODES: { id: OpenMode; label: string; emoji: string; desc: string }[] = [
  {
    id: "one_by_one",
    label: "한 장씩",
    emoji: "🃏",
    desc: "카드를 하나씩 탭해서 공개",
  },
  {
    id: "all_at_once",
    label: "전체 공개",
    emoji: "✨",
    desc: "5장을 한번에 펼쳐보기",
  },
];

interface ModeSelectorProps {
  onSelect: (mode: OpenMode) => void;
}

export function ModeSelector({ onSelect }: ModeSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6"
    >
      <h2 className="text-2xl font-bold text-white">어떻게 볼까요?</h2>
      <div className="flex flex-col sm:flex-row gap-4">
        {MODES.map((mode, i) => (
          <motion.button
            key={mode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(mode.id)}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-zinc-800/80 border border-white/10 hover:border-yellow-500/50 hover:bg-zinc-700/80 transition-colors w-44 cursor-pointer"
          >
            <span className="text-4xl">{mode.emoji}</span>
            <span className="font-bold text-white">{mode.label}</span>
            <span className="text-xs text-white/50 text-center leading-relaxed">
              {mode.desc}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
