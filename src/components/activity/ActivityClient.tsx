"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { AttendanceCard } from "./AttendanceCard";
import { MissionList } from "./MissionList";
import { ReferralCard } from "./ReferralCard";

interface UserData {
  id: string;
  username: string;
  coins: number;
  referralCode: string;
  streakCount: number;
  lastAttendance: string | null;
  referredById: string | null;
}

export function ActivityClient() {
  const { data: user, isLoading } = useQuery<UserData>({
    queryKey: ["userMe"],
    queryFn: () => axios.get("/api/user/me").then((r) => r.data),
  });

  if (isLoading || !user) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-white/10 rounded-2xl h-48 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <AttendanceCard
          streakCount={user.streakCount}
          lastAttendance={user.lastAttendance}
          coins={user.coins}
        />
        <ReferralCard
          myCode={user.referralCode}
          hasUsedReferral={!!user.referredById}
        />
      </div>
      <div>
        <MissionList />
      </div>
    </div>
  );
}
