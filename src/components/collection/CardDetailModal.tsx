"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Tier } from "@prisma/client";
import { HoloEffect } from "@/components/pack/HoloEffect";
import { TierBadge } from "@/components/pack/TierBadge";
import { X, Zap, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseCardTypes } from "@/lib/utils/cardTypes";

interface CardDetailModalProps {
  card: {
    id: string;
    name: string;
    tier: Tier;
    imageLarge: string;
    hp: number | null;
    types: string | string[];
    number: string;
    rarity: string;
    set: { name: string; series: string };
  } | null;
  quantity: number;
  onClose: () => void;
}

const TYPE_COLOR: Record<string, string> = {
  Fire: "bg-red-500",
  Water: "bg-blue-500",
  Grass: "bg-green-500",
  Lightning: "bg-yellow-400",
  Psychic: "bg-pink-500",
  Fighting: "bg-orange-600",
  Darkness: "bg-zinc-700",
  Metal: "bg-zinc-400",
  Dragon: "bg-purple-600",
  Colorless: "bg-zinc-500",
  Fairy: "bg-pink-300",
};

export function CardDetailModal({ card, quantity, onClose }: CardDetailModalProps) {
  return (
    <AnimatePresence>
      {card && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, y: 30 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-zinc-900 border border-white/10 rounded-3xl p-6 max-w-sm w-full flex flex-col items-center gap-5"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <HoloEffect tier={card.tier}>
              <div className="relative w-52 h-72 rounded-xl overflow-hidden">
                <Image
                  src={card.imageLarge}
                  alt={card.name}
                  fill
                  className="object-cover"
                  sizes="208px"
                  priority
                />
              </div>
            </HoloEffect>

            <div className="w-full space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-black text-white leading-tight">{card.name}</h2>
                  <p className="text-xs text-white/40 mt-0.5">
                    #{card.number} · {card.set.name}
                  </p>
                </div>
                <TierBadge tier={card.tier} />
              </div>

              <div className="flex flex-wrap gap-2">
                {parseCardTypes(card.types).map((type) => (
                  <span
                    key={type}
                    className={`text-xs text-white font-medium px-2.5 py-0.5 rounded-full ${TYPE_COLOR[type] ?? "bg-zinc-600"}`}
                  >
                    {type}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {card.hp && (
                  <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2">
                    <Heart className="w-4 h-4 text-red-400" />
                    <div>
                      <p className="text-xs text-white/40">HP</p>
                      <p className="text-sm font-bold text-white">{card.hp}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <div>
                    <p className="text-xs text-white/40">보유 수량</p>
                    <p className="text-sm font-bold text-white">{quantity}장</p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-white/30 text-center">
                {card.set.series} · {card.rarity}
              </div>
            </div>

            <Button
              onClick={onClose}
              className="w-full bg-zinc-700 hover:bg-zinc-600"
            >
              닫기
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
