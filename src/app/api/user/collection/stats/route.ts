import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Tier } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const userId = session.user.id;

  const [totalOwned, tierCounts, setCounts] = await Promise.all([
    prisma.userCard.aggregate({
      where: { userId },
      _sum: { quantity: true },
      _count: { cardId: true },
    }),

    prisma.userCard.findMany({
      where: { userId },
      select: { cardId: true },
    }),

    prisma.cardSet.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        series: true,
        logoUrl: true,
        total: true,
        _count: { select: { cards: true } },
        cards: {
          select: {
            id: true,
            userCards: {
              where: { userId },
              select: { quantity: true },
            },
          },
        },
      },
      orderBy: { releaseDate: "desc" },
    }),
  ]);

  const tierStats = await prisma.$queryRaw<{ tier: Tier; count: bigint }[]>`
    SELECT c.tier, COUNT(uc."cardId") as count
    FROM "UserCard" uc
    JOIN "Card" c ON c.id = uc."cardId"
    WHERE uc."userId" = ${userId}
    GROUP BY c.tier
  `;

  const setStats = setCounts.map((set) => {
    const owned = set.cards.filter((c) => c.userCards.length > 0).length;
    return {
      id: set.id,
      name: set.name,
      series: set.series,
      logoUrl: set.logoUrl,
      total: set._count.cards,
      owned,
      percent: set._count.cards > 0 ? Math.round((owned / set._count.cards) * 100) : 0,
    };
  });

  return NextResponse.json({
    totalCards: totalOwned._sum.quantity ?? 0,
    uniqueCards: totalOwned._count.cardId ?? 0,
    tierStats: tierStats.map((t) => ({ tier: t.tier, count: Number(t.count) })),
    setStats,
  });
}
