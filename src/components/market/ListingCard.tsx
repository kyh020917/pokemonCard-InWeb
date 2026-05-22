"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Tier } from "@prisma/client";
import { Coins, Trash2, ShoppingCart } from "lucide-react";
import { HoloEffect } from "@/components/pack/HoloEffect";
import { TierBadge } from "@/components/pack/TierBadge";
import { Button } from "@/components/ui/button";

interface Listing {
  id: string;
  price: number;
  quantity: number;
  card: {
    id: string;
    name: string;
    tier: Tier;
    imageSmall: string;
    imageLarge: string;
    set: { name: string };
  };
  seller: { id: string; username: string };
}

interface ListingCardProps {
  listing: Listing;
  isMine: boolean;
  canAfford: boolean;
  onBuy: (id: string) => void;
  onCancel: (id: string) => void;
  index: number;
}

export function ListingCard({ listing, isMine, canAfford, onBuy, onCancel, index }: ListingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      className="bg-zinc-800/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 hover:border-white/20 transition-colors"
    >
      <HoloEffect tier={listing.card.tier}>
        <div className="relative aspect-[2.5/3.5] w-full rounded-xl overflow-hidden bg-zinc-900">
          <Image
            src={listing.card.imageSmall}
            alt={listing.card.name}
            fill
            className="object-cover"
            sizes="200px"
          />
          {listing.quantity > 1 && (
            <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              ×{listing.quantity}
            </div>
          )}
        </div>
      </HoloEffect>

      <div className="space-y-1">
        <TierBadge tier={listing.card.tier} className="text-[10px]" />
        <p className="text-sm font-bold text-white leading-tight truncate">{listing.card.name}</p>
        <p className="text-xs text-white/40 truncate">{listing.card.set.name}</p>
        <p className="text-xs text-white/30">판매자: {listing.seller.username}</p>
      </div>

      <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-1.5">
        <Coins className="w-3.5 h-3.5 text-yellow-400" />
        <span className="text-sm font-black text-yellow-300">{listing.price.toLocaleString()}</span>
      </div>

      {isMine ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onCancel(listing.id)}
          className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 gap-2"
        >
          <Trash2 className="w-3.5 h-3.5" />
          등록 취소
        </Button>
      ) : (
        <Button
          size="sm"
          onClick={() => onBuy(listing.id)}
          disabled={!canAfford}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold gap-2 disabled:opacity-40"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          {canAfford ? "구매하기" : "코인 부족"}
        </Button>
      )}
    </motion.div>
  );
}
