import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface SellItem {
  userCardId: string;
  quantity: number;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { items }: { items: SellItem[] } = await req.json();
  if (!items || items.length === 0) {
    return NextResponse.json({ error: "판매할 카드를 선택해주세요." }, { status: 400 });
  }

  // 보유 카드 + 등급 설정 한번에 조회
  const userCards = await prisma.userCard.findMany({
    where: {
      id: { in: items.map((i) => i.userCardId) },
      userId: session.user.id,
    },
    include: { card: true },
  });

  if (userCards.length !== items.length) {
    return NextResponse.json({ error: "일부 카드를 찾을 수 없습니다." }, { status: 404 });
  }

  const tiers = await prisma.tierConfig.findMany();
  const tierMap = new Map(tiers.map((t) => [t.tier, t]));

  // 유효성 검사 먼저
  let totalCoins = 0;
  for (const item of items) {
    const uc = userCards.find((c) => c.id === item.userCardId)!;
    const config = tierMap.get(uc.card.tier);

    if (!config || !config.enabled) {
      return NextResponse.json(
        { error: `${uc.card.name} 등급(${uc.card.tier})은 현재 매입하지 않습니다.` },
        { status: 400 }
      );
    }
    if (uc.quantity < item.quantity) {
      return NextResponse.json(
        { error: `${uc.card.name}의 보유 수량이 부족합니다.` },
        { status: 400 }
      );
    }
    totalCoins += config.price * item.quantity;
  }

  // interactive transaction으로 일괄 처리
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const uc = userCards.find((c) => c.id === item.userCardId)!;
      if (uc.quantity === item.quantity) {
        await tx.userCard.delete({ where: { id: uc.id } });
      } else {
        await tx.userCard.update({
          where: { id: uc.id },
          data: { quantity: { decrement: item.quantity } },
        });
      }
    }

    await tx.user.update({
      where: { id: session.user.id },
      data: { coins: { increment: totalCoins } },
    });

    await tx.transaction.create({
      data: {
        userId: session.user.id,
        type: "EARN",
        amount: totalCoins,
        reason: `shop_sell_batch:${items.length}cards`,
      },
    });
  });

  return NextResponse.json({
    success: true,
    soldCount: items.reduce((s, i) => s + i.quantity, 0),
    coinsEarned: totalCoins,
  });
}
