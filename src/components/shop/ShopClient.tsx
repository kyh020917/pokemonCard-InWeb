"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tier } from "@prisma/client";
import { TierBadge } from "@/components/pack/TierBadge";
import { HoloEffect } from "@/components/pack/HoloEffect";
import Image from "next/image";

interface TierConfig {
  tier: Tier;
  price: number;
  enabled: boolean;
}

interface CardResult {
  id: string;
  name: string;
  tier: Tier;
  imageSmall: string;
  imageLarge: string;
}

const TIER_ORDER: Tier[] = ["C", "U", "R", "HR", "UR", "SR"];

const TIER_STYLE: Record<Tier, { bg: string; border: string; label: string; desc: string }> = {
  C:  { bg: "from-zinc-800 to-zinc-900",   border: "border-zinc-600",    label: "커먼",        desc: "기본 카드" },
  U:  { bg: "from-zinc-700 to-zinc-800",   border: "border-zinc-500",    label: "언커먼",      desc: "약간 희귀한 카드" },
  R:  { bg: "from-blue-950 to-zinc-900",   border: "border-blue-700",    label: "레어",        desc: "희귀 카드" },
  HR: { bg: "from-purple-950 to-zinc-900", border: "border-purple-700",  label: "홀로 레어",   desc: "홀로그램 카드" },
  UR: { bg: "from-yellow-950 to-zinc-900", border: "border-yellow-600",  label: "울트라 레어", desc: "초희귀 카드" },
  SR: { bg: "from-rose-950 to-zinc-900",   border: "border-rose-600",    label: "시크릿 레어", desc: "최고 등급 카드" },
};

export function ShopClient({ userCoins }: { userCoins: number }) {
  const qc = useQueryClient();
  const [lastCard, setLastCard] = useState<CardResult | null>(null);
  const [buyingTier, setBuyingTier] = useState<Tier | null>(null);
  const [imgError, setImgError] = useState(false);

  const { data: tiers = [] } = useQuery<TierConfig[]>({
    queryKey: ["shopTiers"],
    queryFn: () => axios.get("/api/shop/tiers").then((r) => r.data),
  });

  const { mutate: buyCard } = useMutation({
    mutationFn: (tier: Tier) =>
      axios.post<{ card: CardResult; remainingCoins: number }>("/api/shop/buy", { tier }).then((r) => r.data),
    onMutate: (tier) => setBuyingTier(tier),
    onSuccess: (data) => {
      setBuyingTier(null);
      setLastCard(data.card);
      setImgError(false);
      qc.invalidateQueries({ queryKey: ["userCoins"] });
      qc.invalidateQueries({ queryKey: ["userMe"] });
      toast.success(`${data.card.name} 획득!`);
    },
    onError: (err) => {
      setBuyingTier(null);
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? "구매 실패"
        : "구매 실패";
      toast.error(msg);
    },
  });

  const tierMap = new Map(tiers.map((t) => [t.tier, t]));

  return (
    <div className="space-y-8">
      {/* 획득한 카드 팝업 */}
      <AnimatePresence>
        {lastCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setLastCard(null)}
          >
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              className="flex flex-col items-center gap-4 p-8 bg-zinc-900 border border-white/10 rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-white/50 text-sm font-medium">획득한 카드</p>
              <HoloEffect tier={lastCard.tier}>
                <div className="relative w-48 h-64 rounded-xl overflow-hidden">
                  {!imgError ? (
                    <Image
                      src={lastCard.imageLarge}
                      alt={lastCard.name}
                      fill
                      className="object-cover"
                      sizes="192px"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-4xl">🎴</div>
                  )}
                </div>
              </HoloEffect>
              <TierBadge tier={lastCard.tier} />
              <p className="font-bold text-white text-center">{lastCard.name}</p>
              <Button
                onClick={() => setLastCard(null)}
                className="gap-2 bg-zinc-700 hover:bg-zinc-600 w-full"
              >
                <X className="w-4 h-4" />
                닫기
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 등급 카드 목록 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {TIER_ORDER.map((tier, i) => {
          const config = tierMap.get(tier);
          const style = TIER_STYLE[tier];
          const isBuying = buyingTier === tier;
          const canAfford = config ? userCoins >= config.price : false;

          return (
            <motion.div
              key={tier}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`bg-gradient-to-br ${style.bg} border ${style.border} rounded-2xl p-5 flex flex-col gap-4`}
            >
              <div className="flex items-start justify-between">
                <TierBadge tier={tier} />
                {config && !config.enabled && (
                  <span className="text-xs text-white/30 bg-white/10 px-2 py-0.5 rounded-full">판매 중단</span>
                )}
              </div>

              <div>
                <p className="font-bold text-white">{style.label}</p>
                <p className="text-xs text-white/40 mt-0.5">{style.desc}</p>
              </div>

              <div className="flex items-center gap-1.5 mt-auto">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-300 font-black text-lg">
                  {config ? config.price.toLocaleString() : "…"}
                </span>
                <span className="text-white/30 text-xs">코인</span>
              </div>

              <Button
                onClick={() => buyCard(tier)}
                disabled={isBuying || !config?.enabled || !canAfford}
                className={`w-full gap-2 font-bold transition-all ${
                  !config?.enabled
                    ? "bg-zinc-700 text-white/30 cursor-not-allowed"
                    : !canAfford
                    ? "bg-zinc-700 text-white/40 cursor-not-allowed"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                {isBuying ? "구매 중..." : !canAfford ? "코인 부족" : "구매"}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
