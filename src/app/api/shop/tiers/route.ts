import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Tier } from "@prisma/client";

const DEFAULT_PRICES: Record<Tier, number> = {
  C: 50,
  U: 100,
  R: 250,
  HR: 600,
  UR: 1500,
  SR: 4000,
};

export async function GET() {
  // TierConfig가 없으면 기본값으로 초기화
  const existing = await prisma.tierConfig.findMany();

  if (existing.length < Object.keys(DEFAULT_PRICES).length) {
    const tiers = Object.entries(DEFAULT_PRICES) as [Tier, number][];
    await Promise.all(
      tiers.map(([tier, price]) =>
        prisma.tierConfig.upsert({
          where: { tier },
          update: {},
          create: { tier, price },
        })
      )
    );
    const fresh = await prisma.tierConfig.findMany();
    return NextResponse.json(fresh);
  }

  return NextResponse.json(existing);
}
