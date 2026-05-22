import { Tier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { TIER_WEIGHTS, PACK_SLOTS, PREMIUM_PACK_SLOTS } from "./rarityMap";

const TIER_ORDER: Tier[] = [Tier.C, Tier.U, Tier.R, Tier.HR, Tier.UR, Tier.SR];

function pickTier(minTier: Tier): Tier {
  const minIndex = TIER_ORDER.indexOf(minTier);
  const eligibleTiers = TIER_ORDER.slice(minIndex);

  const totalWeight = eligibleTiers.reduce(
    (sum, t) => sum + TIER_WEIGHTS[t],
    0
  );

  let rand = Math.random() * totalWeight;
  for (const tier of eligibleTiers) {
    rand -= TIER_WEIGHTS[tier];
    if (rand <= 0) return tier;
  }
  return eligibleTiers[0];
}

export async function openPack(
  userId: string,
  setId: string,
  isPremium = false
): Promise<{ cardId: string; isNew: boolean }[]> {
  const slots = isPremium ? PREMIUM_PACK_SLOTS : PACK_SLOTS;

  const pickedCards: { cardId: string; isNew: boolean }[] = [];

  for (const slot of slots) {
    const tier = pickTier(slot.minTier);

    const count = await prisma.card.count({ where: { setId, tier } });
    if (count === 0) continue;

    const skip = Math.floor(Math.random() * count);
    const card = await prisma.card.findFirst({
      where: { setId, tier },
      skip,
    });
    if (!card) continue;

    const existing = await prisma.userCard.findUnique({
      where: { userId_cardId: { userId, cardId: card.id } },
    });

    await prisma.userCard.upsert({
      where: { userId_cardId: { userId, cardId: card.id } },
      update: { quantity: { increment: 1 } },
      create: { userId, cardId: card.id, quantity: 1 },
    });

    pickedCards.push({ cardId: card.id, isNew: !existing });
  }

  return pickedCards;
}
