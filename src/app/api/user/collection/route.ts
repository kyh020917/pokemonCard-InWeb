import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const setId = searchParams.get("setId");
  const tier = searchParams.get("tier");
  const search = searchParams.get("search");

  const userCards = await prisma.userCard.findMany({
    where: {
      userId: session.user.id,
      card: {
        ...(setId ? { setId } : {}),
        ...(tier ? { tier: tier as never } : {}),
        ...(search ? { name: { contains: search } } : {}),
      },
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
