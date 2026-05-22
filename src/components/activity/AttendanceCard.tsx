"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { CalendarCheck, Flame, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  streakCount: number;
  lastAttendance: string | null;
  coins: number;
}

function hasAttendedToday(lastAttendance: string | null): boolean {
  if (!lastAttendance) return false;
  const last = new Date(lastAttendance);
  const now = new Date();
  return (
    last.getFullYear() === now.getFullYear() &&
    last.getMonth() === now.getMonth() &&
    last.getDate() === now.getDate()
  );
}

const WEEK_DAYS = ["월", "화", "수", "목", "금", "토", "일"];

export function AttendanceCard({ streakCount, lastAttendance }: Props) {
  const queryClient = useQueryClient();
  const [reward, setReward] = useState<{ reward: number; streak: number; streakBonus: number } | null>(null);
  const attended = hasAttendedToday(lastAttendance);

  const { mutate, isPending } = useMutation({
    mutationFn: () => axios.post("/api/user/attendance").then((r) => r.data),
    onSuccess: (data) => {
      setReward(data);
      queryClient.invalidateQueries({ queryKey: ["userCoins"] });
      queryClient.invalidateQueries({ queryKey: ["userMe"] });
      toast.success(`+${data.reward} 코인 획득!`);
    },
    onError: (err) => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.error ?? "오류가 발생했습니다.");
      }
    },
  });

  const currentStreak = attended ? streakCount : streakCount;
  const nextMilestone = Math.ceil((currentStreak + 1) / 7) * 7;
  const daysUntilBonus = nextMilestone - currentStreak;

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
          <CalendarCheck className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h2 className="font-bold text-white">출석체크</h2>
          <p className="text-xs text-white/40">매일 출석하면 코인을 획득해요</p>
        </div>
      </div>

      {/* 7일 스트릭 시각화 */}
      <div className="flex gap-2">
        {WEEK_DAYS.map((day, i) => {
          const filled = i < (currentStreak % 7 || (currentStreak > 0 && currentStreak % 7 === 0 ? 7 : 0));
          const isToday = attended && i === (currentStreak % 7) - 1;
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                  filled
                    ? "bg-orange-500 text-white"
                    : "bg-zinc-800 text-white/20"
                } ${isToday ? "ring-2 ring-orange-400 ring-offset-1 ring-offset-zinc-900" : ""}`}
              >
                {filled ? <Flame className="w-3 h-3" /> : null}
              </div>
              <span className="text-[10px] text-white/30">{day}</span>
            </div>
          );
        })}
      </div>

      {/* 스트릭 정보 */}
      <div className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          <span className="text-sm text-white">
            <span className="font-black text-orange-400">{currentStreak}일</span> 연속 출석
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/40">다음 보너스까지</p>
          <p className="text-sm font-bold text-yellow-400">{daysUntilBonus}일 남음 (+500)</p>
        </div>
      </div>

      {/* 보상 표시 */}
      <AnimatePresence>
        {reward && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3"
          >
            <Gift className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-sm font-bold text-yellow-300">+{reward.reward} 코인 획득!</p>
              {reward.streakBonus > 0 && (
                <p className="text-xs text-yellow-400/70">🎉 7일 연속 보너스 +{reward.streakBonus} 포함</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => mutate()}
        disabled={attended || isPending}
        className={`w-full font-bold py-5 rounded-xl transition-all ${
          attended
            ? "bg-zinc-700 text-white/30 cursor-not-allowed"
            : "bg-orange-500 hover:bg-orange-400 text-white"
        }`}
      >
        {attended ? "오늘 출석 완료 ✓" : isPending ? "처리 중..." : "출석체크 (+100 코인)"}
      </Button>
    </div>
  );
}
