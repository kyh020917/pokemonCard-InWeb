"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Trophy } from "lucide-react";

interface Mission {
  id: string;
  key: string;
  title: string;
  description: string;
  reward: number;
  completed: boolean;
}

const MISSION_ICONS: Record<string, string> = {
  first_pack: "🎴",
  collect_10: "📦",
  first_rare: "✨",
  first_listing: "🏪",
  first_trade: "🤝",
  streak_7: "🔥",
};

export function MissionList() {
  const { data: missions = [], isLoading } = useQuery<Mission[]>({
    queryKey: ["missions"],
    queryFn: () => axios.get("/api/user/missions").then((r) => r.data),
  });

  const completed = missions.filter((m) => m.completed).length;
  const total = missions.length;

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse space-y-3 shadow-sm">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">미션</h2>
            <p className="text-xs text-gray-400">완료하면 코인을 드려요</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-gray-900">{completed}/{total}</p>
          <p className="text-xs text-gray-400">완료</p>
        </div>
      </div>

      {/* 진행 바 */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: total > 0 ? `${(completed / total) * 100}%` : "0%" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-yellow-500 to-orange-400 rounded-full"
        />
      </div>

      <div className="space-y-2">
        {missions.map((mission, i) => (
          <motion.div
            key={mission.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              mission.completed
                ? "bg-green-50 border border-green-200"
                : "bg-gray-50 border border-gray-100"
            }`}
          >
            <span className="text-xl w-8 text-center">
              {MISSION_ICONS[mission.key] ?? "🎯"}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${mission.completed ? "text-green-700" : "text-gray-800"}`}>
                {mission.title}
              </p>
              <p className="text-xs text-gray-400 truncate">{mission.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-yellow-600">+{mission.reward}</span>
              {mission.completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300" />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
