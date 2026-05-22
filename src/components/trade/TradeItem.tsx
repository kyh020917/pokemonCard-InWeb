"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Tier } from "@prisma/client";
import { ArrowLeftRight, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/pack/TierBadge";

interface CardMini {
  id: string;
  name: string;
  tier: Tier;
  imageSmall: string;
}

interface TradeCardItem {
  cardId: string;
  quantity: number;
}

interface Trade {
  id: string;
  offeredCards: TradeCardItem[];
  requestedCards: TradeCardItem[];
  message: string | null;
  createdAt: string;
  proposer?: { username: string };
  receiver?: { username: string };
}

interface TradeItemProps {
  trade: Trade;
  cardMap: Record<string, CardMini>;
  direction: "incoming" | "outgoing";
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onCancel?: (id: string) => void;
  index: number;
}

function CardStack({ items, cardMap }: { items: TradeCardItem[]; cardMap: Record<string, CardMini> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const card = cardMap[item.cardId];
        if (!card) return null;
        return (
          <div key={item.cardId} className="flex flex-col items-center gap-1">
            <div className="relative w-14 h-20 rounded-lg overflow-hidden bg-zinc-700">
              <Image src={card.imageSmall} alt={card.name} fill className="object-cover" sizes="56px" />
              {item.quantity > 1 && (
                <div className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[9px] font-bold px-1 rounded-full">
                  ×{item.quantity}
                </div>
              )}
            </div>
            <TierBadge tier={card.tier} className="text-[9px]" />
          </div>
        );
      })}
    </div>
  );
}

export function TradeItem({ trade, cardMap, direction, onAccept, onDecline, onCancel, index }: TradeItemProps) {
  const partner = direction === "incoming" ? trade.proposer : trade.receiver;
  const partnerLabel = direction === "incoming" ? "제안자" : "상대방";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`bg-zinc-800/60 border rounded-2xl p-5 space-y-4 ${
        direction === "incoming" ? "border-blue-500/20" : "border-white/10"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            direction === "incoming" ? "bg-blue-500/20 text-blue-300" : "bg-zinc-700 text-white/50"
          }`}>
            {direction === "incoming" ? "받은 제안" : "보낸 제안"}
          </span>
          <span className="text-xs text-white/30 ml-2">{partnerLabel}: {partner?.username}</span>
        </div>
        <span className="text-xs text-white/20">
          {new Date(trade.createdAt).toLocaleDateString("ko-KR")}
        </span>
      </div>

      <div className="flex items-center gap-4 overflow-x-auto pb-1">
        <div className="shrink-0">
          <p className="text-xs text-white/40 mb-2">
            {direction === "incoming" ? "상대가 주는 것" : "내가 주는 것"}
          </p>
          <CardStack items={trade.offeredCards} cardMap={cardMap} />
        </div>

        <div className="shrink-0">
          <ArrowLeftRight className="w-6 h-6 text-white/20" />
        </div>

        <div className="shrink-0">
          <p className="text-xs text-white/40 mb-2">
            {direction === "incoming" ? "상대가 원하는 것" : "내가 원하는 것"}
          </p>
          <CardStack items={trade.requestedCards} cardMap={cardMap} />
        </div>
      </div>

      {trade.message && (
        <p className="text-sm text-white/50 bg-zinc-700/50 rounded-xl px-3 py-2 italic">
          &ldquo;{trade.message}&rdquo;
        </p>
      )}

      <div className="flex gap-2">
        {direction === "incoming" ? (
          <>
            <Button
              size="sm"
              onClick={() => onAccept?.(trade.id)}
              className="gap-2 bg-green-500 hover:bg-green-400 text-black font-bold"
            >
              <Check className="w-4 h-4" />
              수락
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDecline?.(trade.id)}
              className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <X className="w-4 h-4" />
              거절
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCancel?.(trade.id)}
            className="gap-2 border-white/20 text-white/50 hover:bg-white/5"
          >
            <Trash2 className="w-4 h-4" />
            취소
          </Button>
        )}
      </div>
    </motion.div>
  );
}
