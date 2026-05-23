import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { userCardId, quantity = 1 } = await req.json();
  if (!userCardId || quantity < 1) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  // 보유 카드 확인
  const userCard = await prisma.userCard.findUnique({
    where: { id: userCardId },
    include: { card: true },
  });

  if (!userCard || userCard.userId !== session.user.id) {
    return NextResponse.json({ error: "카드를 찾을 수 없습니다." }, { status: 404 });
  }
  if (userCard.quantity < quantity) {
    return NextResponse.json({ error: "보유 수량이 부족합니다." }, { status: 400 });
  }

  // 등급별 매입 가격
  const config = await prisma.tierConfig.findUnique({
    where: { tier: userCard.card.tier },
  });
  if (!config || !config.enabled) {
    return NextResponse.json({ error: "현재 매입하지 않는 등급입니다." }, { status: 400 });
  }

  const totalCoins = config.price * quantity;

  // 카드 차감 또는 삭제 + 코인 추가
  await prisma.$transaction([
    userCard.quantity === quantity
      ? prisma.userCard.delete({ where: { id: userCardId } })
      : prisma.userCard.update({
          where: { id: userCardId },
          data: { quantity: { decrement: quantity } },
        }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { coins: { increment: totalCoins } },
    }),
    prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: "EARN",
        amount: totalCoins,
        reason: `shop_sell:${userCard.card.id}:${quantity}`,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    cardName: userCard.card.name,
    quantity,
    coinsEarned: totalCoins,
  });
}
