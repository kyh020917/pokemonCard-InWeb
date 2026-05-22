import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sets = await prisma.cardSet.findMany({
    where: { isActive: true },
    orderBy: { releaseDate: "desc" },
    select: {
      id: true,
      name: true,
      series: true,
      total: true,
      logoUrl: true,
      symbolUrl: true,
      releaseDate: true,
      packPrice: true,
      _count: { select: { cards: true } },
    },
  });

  return NextResponse.json(sets);
}
