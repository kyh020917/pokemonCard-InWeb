import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface TradeCardItem {
  cardId: string;
  quantity: number;
}

// 수락 / 거절 / 취소
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const { action } = await request.json(); // "accept" | "decline" | "cancel"

  const trade = await prisma.trade.findUnique({ where: { id, status: "PENDING" } });
  if (!trade) {
    return NextResponse.json({ error: "존재하지 않는 트레이드입니다." }, { status: 404 });
  }

  const isProposer = trade.proposerId === session.user.id;
  const isReceiver = trade.receiverId === session.user.id;

  if (action === "cancel" && !isProposer) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  if ((action === "accept" || action === "decline") && !isReceiver) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  if (action === "decline" || action === "cancel") {
    await prisma.trade.update({
      where: { id },
      data: { status: action === "decline" ? "DECLINED" : "CANCELLED" },
    });
    return NextResponse.json({ success: true });
  }

  // 수락 처리: 카드 교환
  const offeredCards = trade.offeredCards as unknown as TradeCardItem[];
  const requestedCards = trade.requestedCards as unknown as TradeCardItem[];

  // 제안자 보유 카드 재확인
  for (const item of offeredCards) {
    const uc = await prisma.userCard.findUnique({
      where: { userId_cardId: { userId: trade.proposerId, cardId: item.cardId } },
    });
    if (!uc || uc.quantity < item.quantity) {
      return NextResponse.json({ error: "제안자의 카드 보유량이 변경되었습니다." }, { status: 400 });
    }
  }

  // 수신자 보유 카드 확인
  for (const item of requestedCards) {
    const uc = await prisma.userCard.findUnique({
      where: { userId_cardId: { userId: trade.receiverId, cardId: item.cardId } },
    });
    if (!uc || uc.quantity < item.quantity) {
      return NextResponse.json({ error: "보유하지 않은 카드가 포함되어 있습니다." }, { status: 400 });
    }
  }

  // 트랜잭션으로 카드 교환
  await prisma.$transaction(async (tx) => {
    // 트레이드 상태 완료
    await tx.trade.update({ where: { id }, data: { status: "ACCEPTED" } });

    // 제안자 → 수신자 (offeredCards)
    for (const item of offeredCards) {
      await tx.userCard.update({
        where: { userId_cardId: { userId: trade.proposerId, cardId: item.cardId } },
        data: { quantity: { decrement: item.quantity } },
      });
      await tx.userCard.upsert({
        where: { userId_cardId: { userId: trade.receiverId, cardId: item.cardId } },
        update: { quantity: { increment: item.quantity } },
        create: { userId: trade.receiverId, cardId: item.cardId, quantity: item.quantity },
      });
    }

    // 수신자 → 제안자 (requestedCards)
    for (const item of requestedCards) {
      await tx.userCard.update({
        where: { userId_cardId: { userId: trade.receiverId, cardId: item.cardId } },
        data: { quantity: { decrement: item.quantity } },
      });
      await tx.userCard.upsert({
        where: { userId_cardId: { userId: trade.proposerId, cardId: item.cardId } },
        update: { quantity: { increment: item.quantity } },
        create: { userId: trade.proposerId, cardId: item.cardId, quantity: item.quantity },
      });
    }

    // 0수량 정리
    const allUsers = [trade.proposerId, trade.receiverId];
    const allCards = [...offeredCards, ...requestedCards];
    for (const userId of allUsers) {
      for (const item of allCards) {
        const uc = await tx.userCard.findUnique({
          where: { userId_cardId: { userId, cardId: item.cardId } },
        });
        if (uc && uc.quantity <= 0) {
          await tx.userCard.delete({
            where: { userId_cardId: { userId, cardId: item.cardId } },
          });
        }
      }
    }
  });

  return NextResponse.json({ success: true });
}
