import { Tier } from "@prisma/client";

// 포켓몬 TCG API rarity → 우리 등급 변환
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

export function mapRarityToTier(rarity: string): Tier {
  return RARITY_MAP[rarity] ?? Tier.C;
}

// 등급별 뽑기 확률 (%)
export const TIER_WEIGHTS: Record<Tier, number> = {
  [Tier.C]: 60,
  [Tier.U]: 25,
  [Tier.R]: 10,
  [Tier.HR]: 4,
  [Tier.UR]: 0.8,
  [Tier.SR]: 0.2,
};

// 팩 구성 (5장): 슬롯별 최소 등급 보장
export const PACK_SLOTS = [
  { minTier: Tier.R },  // 슬롯 1: R 이상 보장
  { minTier: Tier.C },  // 슬롯 2~5: 일반 확률
  { minTier: Tier.C },
  { minTier: Tier.C },
  { minTier: Tier.C },
];

export const PREMIUM_PACK_SLOTS = [
  { minTier: Tier.HR }, // 프리미엄: HR 이상 보장
  { minTier: Tier.C },
  { minTier: Tier.C },
  { minTier: Tier.C },
  { minTier: Tier.C },
];
