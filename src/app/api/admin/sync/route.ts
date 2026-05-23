import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Tier } from "@prisma/client";

export const maxDuration = 300;

const API_BASE = "https://api.pokemontcg.io/v2";
const API_KEY = process.env.POKEMON_TCG_API_KEY ?? "";
const fetchHeaders: Record<string, string> = API_KEY ? { "X-Api-Key": API_KEY } : {};

const RARITY_MAP: Record<string, Tier> = {
  Common: Tier.C,
  Uncommon: Tier.U,
  Rare: Tier.R,
  "Rare Holo": Tier.HR,
  "Rare Holo EX": Tier.HR,
  "Rare Holo GX": Tier.HR,
  "Rare Holo V": Tier.HR,
  "Rare Holo VMAX": Tier.HR,
  "Rare Holo VSTAR": Tier.HR,
  "Rare Ultra": Tier.UR,
  "Rare Rainbow": Tier.UR,
  "Rare Prism Star": Tier.UR,
  "Double Rare": Tier.UR,
  "Illustration Rare": Tier.UR,
  "Ultra Rare": Tier.UR,
  "Rare Secret": Tier.SR,
  "Special Illustration Rare": Tier.SR,
  "Hyper Rare": Tier.SR,
  "ACE SPEC Rare": Tier.SR,
  "Shiny Rare": Tier.SR,
  "Shiny Ultra Rare": Tier.SR,
};

async function fetchAllCards(setId: string) {
  const cards: {
    id: string; name: string; rarity?: string; hp?: string;
    types?: string[]; images: { small: string; large: string };
    number: string; set: { id: string };
  }[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(
      `${API_BASE}/cards?q=set.id:${setId}&page=${page}&pageSize=250`,
      { headers: fetchHeaders }
    );
    const data = await res.json();
    cards.push(...(data.data ?? []));
    if (cards.length >= (data.totalCount ?? 0)) break;
    page++;
  }
  return cards;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const adminId = process.env.ADMIN_USER_ID;
  if (!session?.user || session.user.id !== adminId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const { setId } = await req.json();
  if (!setId) return NextResponse.json({ error: "setId 필요" }, { status: 400 });

  // 세트 정보 가져오기
  const setRes = await fetch(`${API_BASE}/sets/${setId}`, { headers: fetchHeaders });
  if (!setRes.ok) return NextResponse.json({ error: "세트를 찾을 수 없습니다." }, { status: 404 });
  const { data: tcgSet } = await setRes.json();

  // 세트 upsert
  await prisma.cardSet.upsert({
    where: { id: tcgSet.id },
    update: {
      name: tcgSet.name,
      series: tcgSet.series,
      total: tcgSet.total,
      logoUrl: tcgSet.images?.logo ?? null,
      symbolUrl: tcgSet.images?.symbol ?? null,
      releaseDate: tcgSet.releaseDate ? new Date(tcgSet.releaseDate) : null,
    },
    create: {
      id: tcgSet.id,
      name: tcgSet.name,
      series: tcgSet.series,
      total: tcgSet.total,
      logoUrl: tcgSet.images?.logo ?? null,
      symbolUrl: tcgSet.images?.symbol ?? null,
      releaseDate: tcgSet.releaseDate ? new Date(tcgSet.releaseDate) : null,
    },
  });

  // 카드 가져오기
  const cards = await fetchAllCards(setId);

  // 기존 카드 ID 조회
  const existingIds = new Set(
    (await prisma.card.findMany({ where: { setId }, select: { id: true } }))
      .map((c) => c.id)
  );

  const newCards = cards
    .filter((c) => !existingIds.has(c.id))
    .map((c) => ({
      id: c.id,
      setId: c.set.id,
      name: c.name,
      rarity: c.rarity ?? "Common",
      tier: RARITY_MAP[c.rarity ?? ""] ?? Tier.C,
      hp: c.hp ? parseInt(c.hp) : null,
      types: JSON.stringify(c.types ?? []),
      imageSmall: c.images.small,
      imageLarge: c.images.large,
      number: c.number,
    }));

  if (newCards.length > 0) {
    await prisma.card.createMany({ data: newCards, skipDuplicates: true });
  }

  return NextResponse.json({
    success: true,
    setName: tcgSet.name,
    totalCards: cards.length,
    newCards: newCards.length,
  });
}
