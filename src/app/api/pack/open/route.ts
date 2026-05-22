import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { openPack } from "@/lib/pack/openPack";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { setId } = await request.json();
  if (!setId) {
    return NextResponse.json({ error: "세트 ID가 필요합니다." }, { status: 400 });
  }

  const cardSet = await prisma.cardSet.findUnique({ where: { id: setId } });
  if (!cardSet || !cardSet.isActive) {
    return NextResponse.json({ error: "유효하지 않은 팩입니다." }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { coins: true },
  });

  if (!user || user.coins < cardSet.packPrice) {
    return NextResponse.json({ error: "코인이 부족합니다." }, { status: 400 });
  }

  const [pickedCards] = await prisma.$transaction([
    // 뽑기 실행은 트랜잭션 외부에서 하고 코인만 트랜잭션으로
    prisma.user.update({
      where: { id: session.user.id },
      data: { coins: { decrement: cardSet.packPrice } },
    }),
  ]);

  await prisma.transaction.create({
    data: {
      userId: session.user.id,
      type: "SPEND",
      amount: cardSet.packPrice,
      reason: `pack_open:${setId}`,
    },
  });

  const results = await openPack(session.user.id, setId);

  const cardDetails = await prisma.card.findMany({
    where: { id: { in: results.map((r) => r.cardId) } },
  });

  const response = results.map((r) => ({
    ...r,
    card: cardDetails.find((c) => c.id === r.cardId),
  }));

  // 미션 체크: 첫 뽑기
  await checkMission(session.user.id, "first_pack");

  return NextResponse.json({
    cards: response,
    remainingCoins: (pickedCards as { coins: number }).coins,
  });
}

async function checkMission(userId: string, missionKey: string) {
  const mission = await prisma.mission.findUnique({ where: { key: missionKey } });
  if (!mission) return;

  const already = await prisma.userMission.findUnique({
    where: { userId_missionId: { userId, missionId: mission.id } },
  });
  if (already) return;

  await prisma.$transaction([
    prisma.userMission.create({ data: { userId, missionId: mission.id } }),
    prisma.user.update({
      where: { id: userId },
      data: { coins: { increment: mission.reward } },
    }),
    prisma.transaction.create({
      data: {
        userId,
        type: "EARN",
        amount: mission.reward,
        reason: `mission:${missionKey}`,
      },
    }),
  ]);
}
