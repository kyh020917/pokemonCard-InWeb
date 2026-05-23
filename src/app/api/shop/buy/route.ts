import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Tier } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { tier } = await req.json();
  if (!tier || !Object.values(Tier).includes(tier)) {
    return NextResponse.json({ error: "유효하지 않은 등급입니다." }, { status: 400 });
  }

  // 등급 가격 조회
  const config = await prisma.tierConfig.findUnique({ where: { tier } });
  if (!config || !config.enabled) {
    return NextResponse.json({ error: "현재 판매하지 않는 등급입니다." }, { status: 400 });
  }

  // 유저 코인 확인
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { coins: true },
  });
  if (!user || user.coins < config.price) {
    return NextResponse.json({ error: "코인이 부족합니다." }, { status: 400 });
  }

  // 해당 등급 카드 중 랜덤 선택
  const count = await prisma.card.count({ where: { tier } });
  if (count === 0) {
    return NextResponse.json({ error: "해당 등급 카드가 없습니다." }, { status: 404 });
  }
  const skip = Math.floor(Math.random() * count);
  const card = await prisma.card.findFirst({ where: { tier }, skip });
  if (!card) {
    return NextResponse.json({ error: "카드를 찾을 수 없습니다." }, { status: 404 });
  }

  // 코인 차감 + 카드 추가 + 거래 기록
  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { coins: { decrement: config.price } },
    }),
    prisma.userCard.upsert({
      where: { userId_cardId: { userId: session.user.id, cardId: card.id } },
      update: { quantity: { increment: 1 } },
      create: { userId: session.user.id, cardId: card.id, quantity: 1 },
    }),
    prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: "SPEND",
        amount: config.price,
        reason: `shop:${tier}`,
      },
    }),
  ]);

  return NextResponse.json({
    card,
    remainingCoins: updatedUser.coins,
  });
}
