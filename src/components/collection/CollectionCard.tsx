"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Tier } from "@prisma/client";
import { HoloEffect } from "@/components/pack/HoloEffect";
import { TierBadge } from "@/components/pack/TierBadge";

interface CollectionCardProps {
  card: {
    id: string;
    name: string;
    tier: Tier;
    imageSmall: string;
    imageLarge: string;
    number: string;
    set: { name: string; series: string };
  };
  quantity: number;
  index: number;
  onClick: () => void;
}

export function CollectionCard({ card, quantity, index, onClick }: CollectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.03, 0.5) }}
      whileHover={{ y: -4, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <HoloEffect tier={card.tier}>
        <div className="relative aspect-[2.5/3.5] w-full rounded-xl overflow-hidden bg-zinc-800">
          <Image
            src={card.imageSmall}
            alt={card.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 160px"
          />
          {quantity > 1 && (
            <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              ×{quantity}
            </div>
          )}
        </div>
      </HoloEffect>
      <div className="mt-1.5 px-0.5">
        <TierBadge tier={card.tier} className="text-[10px]" />
        <p className="text-xs text-white/70 truncate mt-0.5">
          {card.name}
          {quantity > 1 && <span className="text-white/40 ml-1">×{quantity}</span>}
        </p>
      </div>
    </motion.div>
  );
}
