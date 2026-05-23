import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Tier } from "@prisma/client";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const adminId = process.env.ADMIN_USER_ID;
  if (!session?.user || session.user.id !== adminId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const { tier, price, enabled } = await req.json();

  if (!tier || !Object.values(Tier).includes(tier)) {
    return NextResponse.json({ error: "유효하지 않은 등급입니다." }, { status: 400 });
  }

  const data: { price?: number; enabled?: boolean } = {};
  if (price !== undefined) {
    if (typeof price !== "number" || price < 0) {
      return NextResponse.json({ error: "유효하지 않은 가격입니다." }, { status: 400 });
    }
    data.price = price;
  }
  if (enabled !== undefined) data.enabled = enabled;

  const updated = await prisma.tierConfig.upsert({
    where: { tier },
    update: data,
    create: { tier, price: data.price ?? 100, enabled: data.enabled ?? true },
  });

  return NextResponse.json(updated);
}
