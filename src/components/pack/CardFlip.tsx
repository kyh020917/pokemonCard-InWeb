"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Tier } from "@prisma/client";
import { HoloEffect } from "./HoloEffect";
import { TierBadge } from "./TierBadge";
import { cn } from "@/lib/utils";

interface CardData {
  id: string;
  name: string;
  tier: Tier;
  imageSmall: string;
  imageLarge: string;
  isNew: boolean;
}

interface CardFlipProps {
  card: CardData;
  autoFlip?: boolean;
  delay?: number;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

const SIZE = {
  sm: { w: 120, h: 168 },
  md: { w: 180, h: 252 },
  lg: { w: 240, h: 336 },
};

const HIGH_TIER: Tier[] = ["HR", "UR", "SR"];

export function CardFlip({
  card,
  autoFlip = false,
  delay = 0,
  onClick,
  size = "md",
}: CardFlipProps) {
  const [flipped, setFlipped] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [imgError, setImgError] = useState(false);
  const dim = SIZE[size];
  const isHighTier = HIGH_TIER.includes(card.tier);

  useEffect(() => {
    if (!autoFlip) return;
    const t = setTimeout(() => setFlipped(true), delay);
    return () => clearTimeout(t);
  }, [autoFlip, delay]);

  useEffect(() => {
    if (flipped) {
      const t = setTimeout(() => setRevealed(true), 350);
      return () => clearTimeout(t);
    }
  }, [flipped]);

  function handleClick() {
    if (!flipped) {
      setFlipped(true);
      onClick?.();
    }
  }

  return (
    <motion.div
      className="card-scene cursor-pointer select-none"
      style={{ width: dim.w, height: dim.h }}
      whileHover={!flipped ? { scale: 1.05 } : {}}
      whileTap={!flipped ? { scale: 0.97 } : {}}
      onClick={handleClick}
    >
      <div
        className={cn("card-inner relative w-full h-full", flipped && "flipped")}
      >
        {/* 앞면 (카드 뒷면 - 뒤집히기 전) */}
        <div className="card-face absolute inset-0 rounded-xl overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <span className="text-3xl">🎴</span>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent" />
          {!flipped && (
            <div className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/30">
              탭하여 공개
            </div>
          )}
        </div>

        {/* 뒷면 (실제 카드) */}
        <div className="card-face card-back absolute inset-0 rounded-xl overflow-hidden">
          <HoloEffect tier={card.tier}>
            <div className="relative" style={{ width: dim.w, height: dim.h }}>
              {revealed && !imgError && (
                <Image
                  src={card.imageLarge}
                  alt={card.name}
                  fill
                  className="object-cover"
                  sizes={`${dim.w}px`}
                  priority
                  onError={() => setImgError(true)}
                />
              )}
              {revealed && imgError && (
                <div className="w-full h-full bg-zinc-800 flex flex-col items-center justify-center gap-2 p-3">
                  <span className="text-3xl">🎴</span>
                  <span className="text-xs text-white/50 text-center leading-tight">{card.name}</span>
                </div>
              )}
            </div>
          </HoloEffect>

          {/* 등급 배지 */}
          {revealed && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute top-2 right-2"
            >
              <TierBadge tier={card.tier} />
            </motion.div>
          )}

          {/* 새 카드 표시 */}
          {revealed && card.isNew && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full"
            >
              NEW
            </motion.div>
          )}

          {/* UR/SR 특수 빛 버스트 */}
          {revealed && isHighTier && (
            <motion.div
              initial={{ opacity: 0.8, scale: 0.5 }}
              animate={{ opacity: 0, scale: 2 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute inset-0 rounded-xl"
              style={{
                background:
                  card.tier === "SR"
                    ? "radial-gradient(circle, rgba(255,220,0,0.6) 0%, transparent 70%)"
                    : "radial-gradient(circle, rgba(180,100,255,0.5) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
