import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BASE_REWARD = 100;
const STREAK_BONUS = 500; // 7일 연속 보너스

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { lastAttendance: true, streakCount: true },
  });

  if (!user) return NextResponse.json({ error: "유저를 찾을 수 없습니다." }, { status: 404 });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (user.lastAttendance && user.lastAttendance >= todayStart) {
    return NextResponse.json({ error: "오늘 이미 출석했습니다." }, { status: 400 });
  }

  const yesterday = new Date(todayStart);
  yesterday.setDate(yesterday.getDate() - 1);

  const isConsecutive =
    user.lastAttendance !== null && user.lastAttendance >= yesterday;

  const newStreak = isConsecutive ? user.streakCount + 1 : 1;
  const streakBonus = newStreak % 7 === 0 ? STREAK_BONUS : 0;
  const totalReward = BASE_REWARD + streakBonus;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        coins: { increment: totalReward },
        lastAttendance: now,
        streakCount: newStreak,
      },
    }),
    prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: "EARN",
        amount: totalReward,
        reason: streakBonus > 0 ? "attendance_streak_bonus" : "attendance",
      },
    }),
  ]);

  return NextResponse.json({
    reward: totalReward,
    streak: newStreak,
    streakBonus,
  });
}
