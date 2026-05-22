/**
 * 개발용 로컬 시드 스크립트
 * SQLite DB에 샘플 데이터 삽입
 * 실행: npx tsx scripts/seedDev.ts
 */

import * as fs from "fs";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });
if (fs.existsSync(".env.local")) dotenv.config({ path: ".env.local", override: true });

import * as path from "path";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient, Tier } from "@prisma/client";

const rawUrl = process.env.DATABASE_URL ?? "file:./dev.db";
// libsql needs absolute path for local files
const dbUrl = rawUrl.startsWith("file:") && !rawUrl.startsWith("file:///")
  ? `file:${path.resolve(rawUrl.slice(5))}`
  : rawUrl;
process.env.DATABASE_URL = dbUrl;
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter, log: ["error"] });

const SAMPLE_SETS = [
  {
    id: "sv3pt5",
    name: "151",
    series: "Scarlet & Violet",
    total: 207,
    logoUrl: "https://images.pokemontcg.io/sv3pt5/logo.png",
    symbolUrl: "https://images.pokemontcg.io/sv3pt5/symbol.png",
    releaseDate: new Date("2023-09-22"),
    packPrice: 300,
  },
  {
    id: "sv4",
    name: "Paradox Rift",
    series: "Scarlet & Violet",
    total: 266,
    logoUrl: "https://images.pokemontcg.io/sv4/logo.png",
    symbolUrl: "https://images.pokemontcg.io/sv4/symbol.png",
    releaseDate: new Date("2023-11-03"),
    packPrice: 300,
  },
  {
    id: "swsh1",
    name: "Sword & Shield",
    series: "Sword & Shield",
    total: 202,
    logoUrl: "https://images.pokemontcg.io/swsh1/logo.png",
    symbolUrl: "https://images.pokemontcg.io/swsh1/symbol.png",
    releaseDate: new Date("2020-02-07"),
    packPrice: 300,
  },
];

const SAMPLE_CARDS = [
  // sv3pt5 (151)
  { id: "sv3pt5-1", setId: "sv3pt5", name: "Bulbasaur", rarity: "Common", tier: Tier.C, hp: 60, types: '["Grass"]', imageSmall: "https://images.pokemontcg.io/sv3pt5/1_hires.png", imageLarge: "https://images.pokemontcg.io/sv3pt5/1_hires.png", number: "1" },
  { id: "sv3pt5-6", setId: "sv3pt5", name: "Charizard ex", rarity: "Double Rare", tier: Tier.UR, hp: 330, types: '["Fire"]', imageSmall: "https://images.pokemontcg.io/sv3pt5/6_hires.png", imageLarge: "https://images.pokemontcg.io/sv3pt5/6_hires.png", number: "6" },
  { id: "sv3pt5-9", setId: "sv3pt5", name: "Blastoise ex", rarity: "Double Rare", tier: Tier.UR, hp: 320, types: '["Water"]', imageSmall: "https://images.pokemontcg.io/sv3pt5/9_hires.png", imageLarge: "https://images.pokemontcg.io/sv3pt5/9_hires.png", number: "9" },
  { id: "sv3pt5-25", setId: "sv3pt5", name: "Pikachu", rarity: "Common", tier: Tier.C, hp: 60, types: '["Lightning"]', imageSmall: "https://images.pokemontcg.io/sv3pt5/25_hires.png", imageLarge: "https://images.pokemontcg.io/sv3pt5/25_hires.png", number: "25" },
  { id: "sv3pt5-39", setId: "sv3pt5", name: "Jigglypuff", rarity: "Common", tier: Tier.C, hp: 70, types: '["Colorless"]', imageSmall: "https://images.pokemontcg.io/sv3pt5/39_hires.png", imageLarge: "https://images.pokemontcg.io/sv3pt5/39_hires.png", number: "39" },
  { id: "sv3pt5-59", setId: "sv3pt5", name: "Arcanine ex", rarity: "Ultra Rare", tier: Tier.UR, hp: 280, types: '["Fire"]', imageSmall: "https://images.pokemontcg.io/sv3pt5/59_hires.png", imageLarge: "https://images.pokemontcg.io/sv3pt5/59_hires.png", number: "59" },
  { id: "sv3pt5-65", setId: "sv3pt5", name: "Alakazam ex", rarity: "Double Rare", tier: Tier.UR, hp: 280, types: '["Psychic"]', imageSmall: "https://images.pokemontcg.io/sv3pt5/65_hires.png", imageLarge: "https://images.pokemontcg.io/sv3pt5/65_hires.png", number: "65" },
  { id: "sv3pt5-94", setId: "sv3pt5", name: "Gengar ex", rarity: "Double Rare", tier: Tier.UR, hp: 310, types: '["Psychic"]', imageSmall: "https://images.pokemontcg.io/sv3pt5/94_hires.png", imageLarge: "https://images.pokemontcg.io/sv3pt5/94_hires.png", number: "94" },
  { id: "sv3pt5-103", setId: "sv3pt5", name: "Exeggutor", rarity: "Uncommon", tier: Tier.U, hp: 120, types: '["Grass","Psychic"]', imageSmall: "https://images.pokemontcg.io/sv3pt5/103_hires.png", imageLarge: "https://images.pokemontcg.io/sv3pt5/103_hires.png", number: "103" },
  { id: "sv3pt5-121", setId: "sv3pt5", name: "Starmie ex", rarity: "Double Rare", tier: Tier.UR, hp: 270, types: '["Water","Psychic"]', imageSmall: "https://images.pokemontcg.io/sv3pt5/121_hires.png", imageLarge: "https://images.pokemontcg.io/sv3pt5/121_hires.png", number: "121" },
  { id: "sv3pt5-143", setId: "sv3pt5", name: "Snorlax", rarity: "Rare", tier: Tier.R, hp: 160, types: '["Colorless"]', imageSmall: "https://images.pokemontcg.io/sv3pt5/143_hires.png", imageLarge: "https://images.pokemontcg.io/sv3pt5/143_hires.png", number: "143" },
  { id: "sv3pt5-150", setId: "sv3pt5", name: "Mewtwo ex", rarity: "Ultra Rare", tier: Tier.UR, hp: 300, types: '["Psychic"]', imageSmall: "https://images.pokemontcg.io/sv3pt5/150_hires.png", imageLarge: "https://images.pokemontcg.io/sv3pt5/150_hires.png", number: "150" },
  { id: "sv3pt5-174", setId: "sv3pt5", name: "Mew ex", rarity: "Ultra Rare", tier: Tier.SR, hp: 180, types: '["Psychic"]', imageSmall: "https://images.pokemontcg.io/sv3pt5/174_hires.png", imageLarge: "https://images.pokemontcg.io/sv3pt5/174_hires.png", number: "174" },
  { id: "sv3pt5-182", setId: "sv3pt5", name: "Charizard ex (SIR)", rarity: "Special Illustration Rare", tier: Tier.SR, hp: 330, types: '["Fire"]', imageSmall: "https://images.pokemontcg.io/sv3pt5/182_hires.png", imageLarge: "https://images.pokemontcg.io/sv3pt5/182_hires.png", number: "182" },
  { id: "sv3pt5-50", setId: "sv3pt5", name: "Diglett", rarity: "Common", tier: Tier.C, hp: 40, types: '["Fighting"]', imageSmall: "https://images.pokemontcg.io/sv3pt5/50_hires.png", imageLarge: "https://images.pokemontcg.io/sv3pt5/50_hires.png", number: "50" },
  { id: "sv3pt5-100", setId: "sv3pt5", name: "Voltorb", rarity: "Common", tier: Tier.C, hp: 60, types: '["Lightning"]', imageSmall: "https://images.pokemontcg.io/sv3pt5/100_hires.png", imageLarge: "https://images.pokemontcg.io/sv3pt5/100_hires.png", number: "100" },
  { id: "sv3pt5-131", setId: "sv3pt5", name: "Lapras", rarity: "Rare", tier: Tier.R, hp: 130, types: '["Water"]', imageSmall: "https://images.pokemontcg.io/sv3pt5/131_hires.png", imageLarge: "https://images.pokemontcg.io/sv3pt5/131_hires.png", number: "131" },
  { id: "sv3pt5-147", setId: "sv3pt5", name: "Dratini", rarity: "Common", tier: Tier.C, hp: 50, types: '["Dragon"]', imageSmall: "https://images.pokemontcg.io/sv3pt5/147_hires.png", imageLarge: "https://images.pokemontcg.io/sv3pt5/147_hires.png", number: "147" },
  { id: "sv3pt5-149", setId: "sv3pt5", name: "Dragonite ex", rarity: "Double Rare", tier: Tier.UR, hp: 300, types: '["Dragon","Flying"]', imageSmall: "https://images.pokemontcg.io/sv3pt5/149_hires.png", imageLarge: "https://images.pokemontcg.io/sv3pt5/149_hires.png", number: "149" },
  { id: "sv3pt5-45", setId: "sv3pt5", name: "Vileplume", rarity: "Rare Holo", tier: Tier.HR, hp: 140, types: '["Grass"]', imageSmall: "https://images.pokemontcg.io/sv3pt5/45_hires.png", imageLarge: "https://images.pokemontcg.io/sv3pt5/45_hires.png", number: "45" },
];

const MISSIONS = [
  { key: "first_pack", title: "첫 번째 팩 오픈", description: "처음으로 팩을 열어보세요!", reward: 100 },
  { key: "collect_10", title: "카드 10장 모으기", description: "카드를 10장 이상 보유하세요.", reward: 200 },
  { key: "first_rare", title: "희귀 카드 획득", description: "R 등급 이상 카드를 처음 뽑아보세요.", reward: 150 },
  { key: "first_listing", title: "거래소 첫 등록", description: "거래소에 카드를 처음 등록해보세요.", reward: 100 },
  { key: "first_trade", title: "첫 트레이드", description: "다른 유저와 카드를 교환해보세요.", reward: 300 },
  { key: "streak_7", title: "7일 연속 출석", description: "7일 연속으로 출석 체크를 완료하세요.", reward: 500 },
];

async function main() {
  console.log("개발용 시드 데이터 삽입 중...");

  // CardSets
  for (const set of SAMPLE_SETS) {
    await prisma.cardSet.upsert({
      where: { id: set.id },
      update: set,
      create: set,
    });
  }
  console.log(`✓ CardSet ${SAMPLE_SETS.length}개 삽입`);

  // Cards
  for (const card of SAMPLE_CARDS) {
    await prisma.card.upsert({
      where: { id: card.id },
      update: card,
      create: card,
    });
  }
  console.log(`✓ Card ${SAMPLE_CARDS.length}개 삽입`);

  // Missions
  for (const m of MISSIONS) {
    await prisma.mission.upsert({
      where: { key: m.key },
      update: m,
      create: m,
    });
  }
  console.log(`✓ Mission ${MISSIONS.length}개 삽입`);

  console.log("\n✅ 시드 완료! 이제 http://localhost:3000/login 에서 테스트 로그인을 사용하세요.");
  console.log('   닉네임 입력 후 "테스트 로그인" 버튼 클릭\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
