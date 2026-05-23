"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tier } from "@prisma/client";
import { TierBadge } from "@/components/pack/TierBadge";
import { HoloEffect } from "@/components/pack/HoloEffect";
import { parseCardTypes } from "@/lib/utils/cardTypes";
import Image from "next/image";

interface TierConfig {
  tier: Tier;
  price: number;
  enabled: boolean;
}

interface UserCard {
  id: string;
  quantity: number;
  card: {
    id: string;
    name: string;
    tier: Tier;
    rarity: string;
    imageSmall: string;
    imageLarge: string;
    number: string;
    types: string;
  };
}

const TIER_ORDER: Tier[] = ["SR", "UR", "HR", "R", "U", "C"];
const ALL_TIERS: Tier[] = ["C", "U", "R", "HR", "UR", "SR"];

export function ShopClient() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState<Tier | "ALL">("ALL");
  const [sellingId, setSellingId] = useState<string | null>(null);
  const [confirmCard, setConfirmCard] = useState<UserCard | null>(null);
  const [sellQty, setSellQty] = useState(1);

  const { data: tiers = [] } = useQuery<TierConfig[]>({
    queryKey: ["shopTiers"],
    queryFn: () => axios.get("/api/shop/tiers").then((r) => r.data),
  });

  const { data: userCards = [], isLoading } = useQuery<UserCard[]>({
    queryKey: ["shopMyCards"],
    queryFn: () =>
      axios.get("/api/user/collection").then((r) =>
        r.data.userCards ?? r.data
      ),
  });

  const tierMap = new Map(tiers.map((t) => [t.tier, t]));

  const { mutate: sellCard, isPending: isSelling } = useMutation({
    mutationFn: ({ userCardId, quantity }: { userCardId: string; quantity: number }) =>
      axios.post("/api/shop/sell", { userCardId, quantity }).then((r) => r.data),
    onSuccess: (data) => {
      setConfirmCard(null);
      setSellingId(null);
      qc.invalidateQueries({ queryKey: ["shopMyCards"] });
      qc.invalidateQueries({ queryKey: ["userCoins"] });
      qc.invalidateQueries({ queryKey: ["userMe"] });
      toast.success(`${data.cardName} ${data.quantity}장 판매 → +${data.coinsEarned.toLocaleString()} 코인`);
    },
    onError: (err) => {
      setSellingId(null);
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? "판매 실패"
        : "판매 실패";
      toast.error(msg);
    },
  });

  // 필터링
  const filtered = userCards.filter((uc) => {
    const matchTier = filterTier === "ALL" || uc.card.tier === filterTier;
    const matchSearch = uc.card.name.toLowerCase().includes(search.toLowerCase());
    return matchTier && matchSearch;
  });

  // 등급 순 정렬
  const sorted = [...filtered].sort(
    (a, b) => TIER_ORDER.indexOf(a.card.tier) - TIER_ORDER.indexOf(b.card.tier)
  );

  function openConfirm(uc: UserCard) {
    setConfirmCard(uc);
    setSellQty(1);
  }

  return (
    <div className="space-y-6">
      {/* 등급별 매입 가격 안내 */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {ALL_TIERS.map((tier) => {
          const config = tierMap.get(tier);
          return (
            <div key={tier} className="bg-zinc-900 border border-white/10 rounded-xl p-3 text-center">
              <TierBadge tier={tier} />
              <p className="text-yellow-300 font-bold text-sm mt-2">
                {config ? `${config.price.toLocaleString()}` : "…"}
              </p>
              <p className="text-white/30 text-xs">코인</p>
              {config && !config.enabled && (
                <p className="text-red-400 text-[10px] mt-1">매입 중단</p>
              )}
            </div>
          );
        })}
      </div>

      {/* 검색 + 필터 */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="카드 이름 검색..."
            className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-yellow-500/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterTier("ALL")}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
              filterTier === "ALL"
                ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-300"
                : "bg-zinc-900 border-white/10 text-white/50 hover:border-white/30"
            }`}
          >
            전체
          </button>
          {ALL_TIERS.map((tier) => (
            <button
              key={tier}
              onClick={() => setFilterTier(tier)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                filterTier === tier
                  ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-300"
                  : "bg-zinc-900 border-white/10 text-white/50 hover:border-white/30"
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* 카드 목록 */}
      {isLoading ? (
        <div className="text-center py-20 text-white/40">불러오는 중...</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20 text-white/40">판매할 카드가 없습니다</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sorted.map((uc) => {
            const config = tierMap.get(uc.card.tier);
            const canSell = config?.enabled ?? false;

            return (
              <motion.div
                key={uc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-2"
              >
                <HoloEffect tier={uc.card.tier}>
                  <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden">
                    <Image
                      src={uc.card.imageLarge}
                      alt={uc.card.name}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                    {uc.quantity > 1 && (
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        ×{uc.quantity}
                      </div>
                    )}
                  </div>
                </HoloEffect>
                <TierBadge tier={uc.card.tier} />
                <p className="text-xs text-white/70 truncate text-center">{uc.card.name}</p>
                <div className="flex items-center justify-center gap-1 text-xs text-yellow-300 font-bold">
                  <Coins className="w-3 h-3" />
                  {config ? config.price.toLocaleString() : "…"}
                </div>
                <Button
                  size="sm"
                  onClick={() => openConfirm(uc)}
                  disabled={!canSell}
                  className={`w-full text-xs font-bold ${
                    canSell
                      ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30"
                      : "bg-zinc-800 text-white/20 cursor-not-allowed"
                  }`}
                >
                  {canSell ? "판매" : "매입 중단"}
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 판매 확인 모달 */}
      <AnimatePresence>
        {confirmCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setConfirmCard(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-80 flex flex-col gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-black text-white text-lg text-center">카드 판매</h3>

              <div className="flex items-center gap-3 bg-zinc-800 rounded-2xl p-3">
                <div className="relative w-14 h-20 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={confirmCard.card.imageLarge}
                    alt={confirmCard.card.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{confirmCard.card.name}</p>
                  <TierBadge tier={confirmCard.card.tier} />
                  <p className="text-white/40 text-xs mt-1">보유 {confirmCard.quantity}장</p>
                </div>
              </div>

              {/* 수량 선택 */}
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">판매 수량</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSellQty((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg bg-zinc-800 text-white font-bold hover:bg-zinc-700"
                  >−</button>
                  <span className="text-white font-bold w-6 text-center">{sellQty}</span>
                  <button
                    onClick={() => setSellQty((q) => Math.min(confirmCard.quantity, q + 1))}
                    className="w-8 h-8 rounded-lg bg-zinc-800 text-white font-bold hover:bg-zinc-700"
                  >+</button>
                </div>
              </div>

              {/* 받을 코인 */}
              <div className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
                <span className="text-white/60 text-sm">받을 코인</span>
                <div className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-300 font-black text-lg">
                    {((tierMap.get(confirmCard.card.tier)?.price ?? 0) * sellQty).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setConfirmCard(null)}
                  className="flex-1 border-white/20 hover:bg-white/10"
                >
                  취소
                </Button>
                <Button
                  onClick={() => sellCard({ userCardId: confirmCard.id, quantity: sellQty })}
                  disabled={isSelling}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-black"
                >
                  {isSelling ? "판매 중..." : "판매하기"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
