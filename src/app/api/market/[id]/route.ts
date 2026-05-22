import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 구매
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id, status: "ACTIVE" },
    include: { card: true },
  });

  if (!listing) {
    return NextResponse.json({ error: "존재하지 않는 매물입니다." }, { status: 404 });
  }

  if (listing.sellerId === session.user.id) {
    return NextResponse.json({ error: "자신의 매물은 구매할 수 없습니다." }, { status: 400 });
  }

  const buyer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { coins: true },
  });

  if (!buyer || buyer.coins < listing.price) {
    return NextResponse.json({ error: "코인이 부족합니다." }, { status: 400 });
  }

  await prisma.$transaction([
    // 구매자 코인 차감
    prisma.user.update({
      where: { id: session.user.id },
      data: { coins: { decrement: listing.price } },
    }),
    // 판매자 코인 지급
    prisma.user.update({
      where: { id: listing.sellerId },
      data: { coins: { increment: listing.price } },
    }),
    // 매물 상태 변경
    prisma.listing.update({
      where: { id },
      data: { status: "SOLD" },
    }),
    // 구매자 카드 지급
    prisma.userCard.upsert({
      where: { userId_cardId: { userId: session.user.id, cardId: listing.cardId } },
      update: { quantity: { increment: listing.quantity } },
      create: { userId: session.user.id, cardId: listing.cardId, quantity: listing.quantity },
    }),
    // 거래 내역 기록
    prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: "SPEND",
        amount: listing.price,
        reason: `listing_buy:${id}`,
      },
    }),
    prisma.transaction.create({
      data: {
        userId: listing.sellerId,
        type: "EARN",
        amount: listing.price,
        reason: `listing_sell:${id}`,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}

// 등록 취소
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id, status: "ACTIVE" },
  });

  if (!listing) {
    return NextResponse.json({ error: "존재하지 않는 매물입니다." }, { status: 404 });
  }

  if (listing.sellerId !== session.user.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  // 취소 시 카드 반환
  await prisma.$transaction([
    prisma.listing.update({ where: { id }, data: { status: "CANCELLED" } }),
    prisma.userCard.upsert({
      where: { userId_cardId: { userId: session.user.id, cardId: listing.cardId } },
      update: { quantity: { increment: listing.quantity } },
      create: { userId: session.user.id, cardId: listing.cardId, quantity: listing.quantity },
    }),
  ]);

  return NextResponse.json({ success: true });
}
