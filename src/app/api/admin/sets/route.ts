import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const API_BASE = "https://api.pokemontcg.io/v2";
const API_KEY = process.env.POKEMON_TCG_API_KEY ?? "";
const fetchHeaders: Record<string, string> = API_KEY ? { "X-Api-Key": API_KEY } : {};

export async function GET() {
  const session = await auth();
  const adminId = process.env.ADMIN_USER_ID;
  if (!session?.user || session.user.id !== adminId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const [apiRes, dbSets] = await Promise.all([
    fetch(`${API_BASE}/sets?orderBy=-releaseDate&pageSize=50`, { headers: fetchHeaders }),
    prisma.cardSet.findMany({
      select: { id: true, _count: { select: { cards: true } } },
    }),
  ]);

  const apiData = await apiRes.json();
  const dbMap = new Map(dbSets.map((s) => [s.id, s._count.cards]));

  const sets = (apiData.data ?? []).map((s: {
    id: string; name: string; series: string; total: number;
    releaseDate: string; images?: { logo?: string };
  }) => ({
    id: s.id,
    name: s.name,
    series: s.series,
    total: s.total,
    releaseDate: s.releaseDate,
    logoUrl: s.images?.logo ?? null,
    synced: dbMap.has(s.id),
    syncedCount: dbMap.get(s.id) ?? 0,
  }));

  return NextResponse.json({ sets });
}
