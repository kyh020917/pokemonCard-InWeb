import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface TradeCardItem {
  cardId: string;
  quantity: number;
}

// 트레이드 목록 조회
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const [incoming, outgoing] = await Promise.all([
    prisma.trade.findMany({
      where: { receiverId: session.user.id, status: "PENDING" },
      include: {
        proposer: { select: { id: true, username: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.trade.findMany({
      where: { proposerId: session.user.id, status: "PENDING" },
      include: {
        receiver: { select: { id: true, username: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // 카드 상세 정보 주입
  const allCardIds = [
    ...incoming.flatMap((t) => [
      ...(t.offeredCards as unknown as TradeCardItem[]).map((c) => c.cardId),
      ...(t.requestedCards as unknown as TradeCardItem[]).map((c) => c.cardId),
    ]),
    ...outgoing.flatMap((t) => [
      ...(t.offeredCards as unknown as TradeCardItem[]).map((c) => c.cardId),
      ...(t.requestedCards as unknown as TradeCardItem[]).map((c) => c.cardId),
    ]),
  ];

  const cards = await prisma.card.findMany({
    where: { id: { in: [...new Set(allCardIds)] } },
    select: { id: true, name: true, tier: true, imageSmall: true },
  });

  const cardMap = Object.fromEntries(cards.map((c) => [c.id, c]));

  return NextResponse.json({ incoming, outgoing, cardMap });
}

// 트레이드 제안
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { receiverId, offeredCards, requestedCards, message } = await request.json();

  if (!receiverId || !offeredCards?.length || !requestedCards?.length) {
    return NextResponse.json({ error: "올바른 정보를 입력해주세요." }, { status: 400 });
  }

  if (receiverId === session.user.id) {
    return NextResponse.json({ error: "자신에게 트레이드를 제안할 수 없습니다." }, { status: 400 });
  }

  // 제공 카드 보유 확인
  for (const item of offeredCards as unknown as TradeCardItem[]) {
    const uc = await prisma.userCard.findUnique({
      where: { userId_cardId: { userId: session.user.id, cardId: item.cardId } },
    });
    if (!uc || uc.quantity < item.quantity) {
      return NextResponse.json({ error: "보유하지 않은 카드가 포함되어 있습니다." }, { status: 400 });
    }
  }

  await prisma.trade.create({
    data: {
      proposerId: session.user.id,
      receiverId,
      offeredCards,
      requestedCards,
      message: message ?? null,
    },
  });

  return NextResponse.json({ success: true });
}
