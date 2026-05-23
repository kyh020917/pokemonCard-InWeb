/**
 * 포켓몬 TCG API → DB 동기화 스크립트
 * 실행: npx tsx scripts/syncPokemonTCG.ts [setId?]
 * 특정 세트만: npx tsx scripts/syncPokemonTCG.ts sv3
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });
if (fs.existsSync(".env.local")) dotenv.config({ path: ".env.local", override: true });

import { PrismaClient, Tier } from "@prisma/client";

function createClient() {
  const dbUrl = process.env.DATABASE_URL ?? "";
  if (dbUrl.startsWith("file:")) {
    const absUrl = `file:${path.resolve(dbUrl.slice(5))}`;
    process.env.DATABASE_URL = absUrl;
    const { PrismaLibSql } = require("@prisma/adapter-libsql");
    return new PrismaClient({ adapter: new PrismaLibSql({ url: absUrl }), log: ["error"] });
  }
  const { PrismaPg } = require("@prisma/adapter-pg");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: dbUrl }), log: ["error"] });
}

const prisma = createClient();
const API_BASE = "https://api.pokemontcg.io/v2";
const API_KEY = process.env.POKEMON_TCG_API_KEY ?? "";

const headers: Record<string, string> = API_KEY
  ? { "X-Api-Key": API_KEY }
  : {};

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

interface TCGSet {
  id: string;
  name: string;
  series: string;
  total: number;
  images: { logo?: string; symbol?: string };
  releaseDate: string;
}

interface TCGCard {
  id: string;
  name: string;
  rarity?: string;
  hp?: string;
  types?: string[];
  images: { small: string; large: string };
  number: string;
  set: { id: string };
}

async function fetchSets(): Promise<TCGSet[]> {
  const res = await fetch(`${API_BASE}/sets?orderBy=-releaseDate`, { headers });
  const data = await res.json();
  return data.data;
}

async function fetchCards(setId: string): Promise<TCGCard[]> {
  const cards: TCGCard[] = [];
  let page = 1;
  const pageSize = 250;

  while (true) {
    const res = await fetch(
      `${API_BASE}/cards?q=set.id:${setId}&page=${page}&pageSize=${pageSize}`,
      { headers }
    );
    const data = await res.json();
    cards.push(...data.data);
    if (cards.length >= data.totalCount) break;
    page++;
  }

  return cards;
}

async function syncSet(tcgSet: TCGSet) {
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

  const cards = await fetchCards(tcgSet.id);
  console.log(`  ${tcgSet.name}: 카드 ${cards.length}장 동기화 중...`);

  for (const card of cards) {
    const tier = RARITY_MAP[card.rarity ?? ""] ?? Tier.C;

    await prisma.card.upsert({
      where: { id: card.id },
      update: {
        name: card.name,
        rarity: card.rarity ?? "Common",
        tier,
        hp: card.hp ? parseInt(card.hp) : null,
        types: JSON.stringify(card.types ?? []),
        imageSmall: card.images.small,
        imageLarge: card.images.large,
        number: card.number,
      },
      create: {
        id: card.id,
        setId: card.set.id,
        name: card.name,
        rarity: card.rarity ?? "Common",
        tier,
        hp: card.hp ? parseInt(card.hp) : null,
        types: JSON.stringify(card.types ?? []),
        imageSmall: card.images.small,
        imageLarge: card.images.large,
        number: card.number,
      },
    });
  }
}

async function seedMissions() {
  const missions = [
    { key: "first_pack", title: "첫 번째 팩 오픈", description: "처음으로 팩을 열어보세요!", reward: 100 },
    { key: "collect_10", title: "카드 10장 모으기", description: "카드를 10장 이상 보유하세요.", reward: 200 },
    { key: "first_rare", title: "희귀 카드 획득", description: "R 등급 이상 카드를 처음 뽑아보세요.", reward: 150 },
    { key: "first_listing", title: "거래소 첫 등록", description: "거래소에 카드를 처음 등록해보세요.", reward: 100 },
    { key: "first_trade", title: "첫 트레이드", description: "다른 유저와 카드를 교환해보세요.", reward: 300 },
    { key: "streak_7", title: "7일 연속 출석", description: "7일 연속으로 출석 체크를 완료하세요.", reward: 500 },
  ];

  for (const m of missions) {
    await prisma.mission.upsert({
      where: { key: m.key },
      update: m,
      create: m,
    });
  }

  console.log("미션 데이터 seeding 완료");
}

async function main() {
  const targetSetId = process.argv[2];

  await seedMissions();

  if (targetSetId) {
    const sets = await fetchSets();
    const target = sets.find((s) => s.id === targetSetId);
    if (!target) {
      console.error(`세트를 찾을 수 없습니다: ${targetSetId}`);
      process.exit(1);
    }
    console.log(`[${target.name}] 동기화 시작...`);
    await syncSet(target);
  } else {
    // 최근 10개 세트만 동기화 (전체 동기화는 시간이 오래 걸림)
    const sets = await fetchSets();
    const recent = sets.slice(0, 10);
    console.log(`최근 ${recent.length}개 세트 동기화 시작...`);

    for (const set of recent) {
      console.log(`[${set.name}] 동기화 중...`);
      await syncSet(set);
    }
  }

  console.log("동기화 완료!");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
