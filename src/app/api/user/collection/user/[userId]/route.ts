import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const search = new URL(request.url).searchParams.get("search");

  const userCards = await prisma.userCard.findMany({
    where: {
      userId,
      card: search ? { name: { contains: search } } : undefined,
    },
    include: {
      card: {
        include: { set: { select: { name: true, series: true } } },
      },
    },
    orderBy: { obtainedAt: "desc" },
  });

  return NextResponse.json(userCards);
}
