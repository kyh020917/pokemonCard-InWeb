import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const [missions, userMissions] = await Promise.all([
    prisma.mission.findMany({ where: { isActive: true }, orderBy: { reward: "asc" } }),
    prisma.userMission.findMany({ where: { userId: session.user.id } }),
  ]);

  const completedSet = new Set(userMissions.map((um) => um.missionId));

  return NextResponse.json(
    missions.map((m) => ({
      ...m,
      completed: completedSet.has(m.id),
    }))
  );
}
