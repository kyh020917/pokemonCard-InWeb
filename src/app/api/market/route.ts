import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 거래소 목록 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const tier = searchParams.get("tier");
  const setId = searchParams.get("setId");
  const mine = searchParams.get("mine") === "true";

  const session = await auth();

  const cardFilter = {
    ...(tier ? { tier: tier as never } : {}),
    ...(setId ? { setId } : {}),
    ...(search ? { name: { contains: search } } : {}),
  };

  const listings = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      ...(mine && session?.user ? { sellerId: session.user.id } : {}),
      ...(Object.keys(cardFilter).length > 0 ? { card: cardFilter } : {}),
    },
    include: {
      card: {
        include: { set: { select: { name: true, series: true } } },
      },
      seller: { select: { id: true, username: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return NextResponse.json(listings);
}

// 거래소 등록
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { cardId, quantity, price } = await request.json();

  if (!cardId || !quantity || !price || price < 1) {
    return NextResponse.json({ error: "올바른 정보를 입력해주세요." }, { status: 400 });
  }

  const userCard = await prisma.userCard.findUnique({
    where: { userId_cardId: { userId: session.user.id, cardId } },
  });

  if (!userCard || userCard.quantity < quantity) {
    return NextResponse.json({ error: "보유 수량이 부족합니다." }, { status: 400 });
  }

  // 수량 차감 후 등록
  await prisma.$transaction([
    prisma.userCard.update({
      where: { userId_cardId: { userId: session.user.id, cardId } },
      data: { quantity: { decrement: quantity } },
    }),
    prisma.listing.create({
      data: { sellerId: session.user.id, cardId, quantity, price },
    }),
  ]);

  // 수량 0이면 UserCard 삭제
  const updated = await prisma.userCard.findUnique({
    where: { userId_cardId: { userId: session.user.id, cardId } },
  });
  if (updated && updated.quantity <= 0) {
    await prisma.userCard.delete({
      where: { userId_cardId: { userId: session.user.id, cardId } },
    });
  }

  return NextResponse.json({ success: true });
}
