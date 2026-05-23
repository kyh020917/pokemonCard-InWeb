"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Search, CheckCircle2, X, ShoppingBag, Plus, Minus } from "lucide-react";
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

interface UserCard {
  id: string;
  quantity: number;
  card: {
    id: string;
    name: string;
    tier: Tier;
    imageSmall: string;
    imageLarge: string;
    number: string;
  };
}

// 선택된 카드: id → 판매 수량
type Selection = Map<string, number>;

const TIER_ORDER: Tier[] = ["SR", "UR", "HR", "R", "U", "C"];
const ALL_TIERS: Tier[] = ["C", "U", "R", "HR", "UR", "SR"];

export function ShopClient() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState<Tier | "ALL">("ALL");
  const [selection, setSelection] = useState<Selection>(new Map());
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: tiers = [] } = useQuery<TierConfig[]>({
    queryKey: ["shopTiers"],
    queryFn: () => axios.get("/api/shop/tiers").then((r) => r.data),
  });

  const { data: userCards = [], isLoading } = useQuery<UserCard[]>({
    queryKey: ["shopMyCards"],
    queryFn: () =>
      axios.get("/api/user/collection").then((r) => r.data.userCards ?? r.data),
  });

  const tierMap = new Map(tiers.map((t) => [t.tier, t]));

  const { mutate: sellCards, isPending } = useMutation({
    mutationFn: () =>
      axios
        .post("/api/shop/sell", {
          items: Array.from(selection.entries()).map(([userCardId, quantity]) => ({
            userCardId,
            quantity,
          })),
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      setSelection(new Map());
      setShowConfirm(false);
      qc.invalidateQueries({ queryKey: ["shopMyCards"] });
      qc.invalidateQueries({ queryKey: ["userCoins"] });
      qc.invalidateQueries({ queryKey: ["userMe"] });
      toast.success(
        `${data.soldCount}장 판매 완료! +${data.coinsEarned.toLocaleString()} 코인`
      );
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? "판매 실패"
        : "판매 실패";
      toast.error(msg);
    },
  });

  function toggleSelect(uc: UserCard) {
    const config = tierMap.get(uc.card.tier);
    if (!config?.enabled) return;
    setSelection((prev) => {
      const next = new Map(prev);
      if (next.has(uc.id)) {
        next.delete(uc.id);
      } else {
        next.set(uc.id, 1);
      }
      return next;
    });
  }

  function adjustQty(id: string, delta: number, max: number) {
    setSelection((prev) => {
      const next = new Map(prev);
      const cur = next.get(id) ?? 1;
      const newQty = Math.max(1, Math.min(max, cur + delta));
      next.set(id, newQty);
      return next;
    });
  }

  function clearSelection() {
    setSelection(new Map());
  }

  // 총 코인 계산
  const totalCoins = Array.from(selection.entries()).reduce((sum, [id, qty]) => {
    const uc = userCards.find((c) => c.id === id);
    if (!uc) return sum;
    return sum + (tierMap.get(uc.card.tier)?.price ?? 0) * qty;
  }, 0);

  const totalCount = Array.from(selection.values()).reduce((s, q) => s + q, 0);

  // 필터링 + 정렬
  const filtered = userCards
    .filter((uc) => {
      const matchTier = filterTier === "ALL" || uc.card.tier === filterTier;
      const matchSearch = uc.card.name.toLowerCase().includes(search.toLowerCase());
      return matchTier && matchSearch;
    })
    .sort((a, b) => TIER_ORDER.indexOf(a.card.tier) - TIER_ORDER.indexOf(b.card.tier));

  return (
    <div className="pb-32">
      {/* 등급별 매입 가격 */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
        {ALL_TIERS.map((tier) => {
          const config = tierMap.get(tier);
          return (
            <div key={tier} className="bg-zinc-900 border border-white/10 rounded-xl p-3 text-center">
              <TierBadge tier={tier} />
              <p className="text-yellow-300 font-bold text-sm mt-2">
                {config ? config.price.toLocaleString() : "…"}
              </p>
              <p className="text-white/30 text-[10px]">코인/장</p>
            </div>
          );
        })}
      </div>

      {/* 검색 + 필터 */}
      <div className="flex gap-3 flex-wrap mb-5">
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
          {(["ALL", ...ALL_TIERS] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterTier(t)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                filterTier === t
                  ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-300"
                  : "bg-zinc-900 border-white/10 text-white/50 hover:border-white/30"
              }`}
            >
              {t === "ALL" ? "전체" : t}
            </button>
          ))}
        </div>
      </div>

      {/* 카드 목록 */}
      {isLoading ? (
        <div className="text-center py-20 text-white/40">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-white/40">판매할 카드가 없습니다</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((uc) => {
            const config = tierMap.get(uc.card.tier);
            const isSelected = selection.has(uc.id);
            const canSell = config?.enabled ?? false;
            const sellQty = selection.get(uc.id) ?? 1;

            return (
              <motion.div
                key={uc.id}
                layout
                className="flex flex-col gap-2"
              >
                {/* 카드 이미지 */}
                <div
                  className={`relative cursor-pointer rounded-xl transition-all ${
                    isSelected ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-zinc-950" : ""
                  } ${!canSell ? "opacity-40 cursor-not-allowed" : ""}`}
                  onClick={() => toggleSelect(uc)}
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
                    </div>
                  </HoloEffect>

                  {/* 보유 수량 배지 */}
                  {uc.quantity > 1 && (
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      ×{uc.quantity}
                    </div>
                  )}

                  {/* 선택 체크 */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-yellow-400/10 rounded-xl flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-yellow-400 drop-shadow-lg" />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <TierBadge tier={uc.card.tier} />
                  <span className="text-xs text-yellow-300 font-bold flex items-center gap-0.5">
                    <Coins className="w-3 h-3" />
                    {config?.price.toLocaleString() ?? "…"}
                  </span>
                </div>

                <p className="text-xs text-white/60 truncate">{uc.card.name}</p>

                {/* 선택된 경우 수량 조절 */}
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-2 py-1"
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); adjustQty(uc.id, -1, uc.quantity); }}
                      className="w-6 h-6 rounded text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-yellow-300 font-bold text-sm">{sellQty}장</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); adjustQty(uc.id, 1, uc.quantity); }}
                      className="w-6 h-6 rounded text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 하단 선택 바 */}
      <AnimatePresence>
        {selection.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-zinc-900/95 backdrop-blur border-t border-white/10"
          >
            <div className="max-w-5xl mx-auto flex items-center gap-4">
              <button onClick={clearSelection} className="text-white/40 hover:text-white/70">
                <X className="w-5 h-5" />
              </button>

              <div className="flex-1">
                <p className="text-sm font-bold text-white">
                  {selection.size}종 {totalCount}장 선택됨
                </p>
                <div className="flex items-center gap-1 text-yellow-300 font-black text-lg">
                  <Coins className="w-4 h-4" />
                  {totalCoins.toLocaleString()} 코인
                </div>
              </div>

              <Button
                onClick={() => setShowConfirm(true)}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-black px-6 gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                판매하기
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 최종 확인 모달 */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-80 flex flex-col gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-black text-white text-lg text-center">판매 확인</h3>

              {/* 선택 목록 */}
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {Array.from(selection.entries()).map(([id, qty]) => {
                  const uc = userCards.find((c) => c.id === id);
                  if (!uc) return null;
                  const price = (tierMap.get(uc.card.tier)?.price ?? 0) * qty;
                  return (
                    <div key={id} className="flex items-center justify-between bg-zinc-800 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative w-8 h-11 rounded overflow-hidden shrink-0">
                          <Image src={uc.card.imageLarge} alt={uc.card.name} fill className="object-cover" sizes="32px" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-white truncate">{uc.card.name}</p>
                          <p className="text-[10px] text-white/40">{qty}장</p>
                        </div>
                      </div>
                      <span className="text-xs text-yellow-300 font-bold shrink-0 ml-2">
                        +{price.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
                <span className="text-white/60 text-sm">총 획득 코인</span>
                <div className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-300 font-black text-xl">{totalCoins.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 border-white/20 hover:bg-white/10"
                >
                  취소
                </Button>
                <Button
                  onClick={() => sellCards()}
                  disabled={isPending}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-black"
                >
                  {isPending ? "판매 중..." : "판매하기"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
