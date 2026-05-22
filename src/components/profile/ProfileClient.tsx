"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import { motion } from "framer-motion";
import { Tier } from "@prisma/client";
import { Search, BookOpen, Layers } from "lucide-react";
import { TierBadge } from "@/components/pack/TierBadge";
import { HoloEffect } from "@/components/pack/HoloEffect";
import { parseCardTypes } from "@/lib/utils/cardTypes";

interface UserCard {
  id: string;
  quantity: number;
  card: {
    id: string;
    name: string;
    tier: Tier;
    imageSmall: string;
    imageLarge: string;
    hp: number | null;
    types: string | string[];
    number: string;
    rarity: string;
    setId: string;
    set: { name: string; series: string };
  };
}

const TIER_ORDER: Tier[] = ["SR", "UR", "HR", "R", "U", "C"];

const TIER_COLORS: Record<Tier, string> = {
  SR: "text-yellow-300",
  UR: "text-purple-400",
  HR: "text-cyan-400",
  R: "text-blue-400",
  U: "text-green-400",
  C: "text-white/50",
};

interface Props {
  userId: string;
  username: string;
  image?: string | null;
  createdAt: string;
}

export function ProfileClient({ userId, username, image, createdAt }: Props) {
  const [search, setSearch] = useState("");
  const [selectedTier, setSelectedTier] = useState<Tier | "">("");

  const { data: userCards = [], isLoading } = useQuery<UserCard[]>({
    queryKey: ["publicCollection", userId, search],
    queryFn: () =>
      axios
        .get(`/api/user/collection/user/${userId}`, { params: { search: search || undefined } })
        .then((r) => r.data),
  });

  const filtered = userCards.filter((uc) =>
    selectedTier ? uc.card.tier === selectedTier : true
  );

  // 통계
  const uniqueCards = userCards.length;
  const totalCards = userCards.reduce((sum, uc) => sum + uc.quantity, 0);
  const rareCards = userCards.filter((uc) => ["UR", "SR"].includes(uc.card.tier)).length;
  const joinYear = new Date(createdAt).getFullYear();

  return (
    <div className="space-y-6">
      {/* 프로필 헤더 */}
      <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center overflow-hidden shrink-0">
            {image ? (
              <Image src={image} alt={username} width={64} height={64} className="object-cover" />
            ) : (
              <span className="text-2xl font-black text-white">
                {username[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-black text-white">{username}</h2>
            <p className="text-white/40 text-sm">{joinYear}년부터 트레이너 활동 중</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-5">
          {[
            { label: "보유 카드 종류", value: uniqueCards },
            { label: "총 카드 수", value: totalCards },
            { label: "UR·SR 카드", value: rareCards },
          ].map(({ label, value }) => (
            <div key={label} className="bg-zinc-800 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-white">{value}</p>
              <p className="text-xs text-white/40 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 컬렉션 필터 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="카드 이름 검색..."
            className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/30"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setSelectedTier("")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              selectedTier === "" ? "bg-white text-zinc-900" : "bg-zinc-800 text-white/50 hover:text-white"
            }`}
          >
            전체
          </button>
          {TIER_ORDER.map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(selectedTier === tier ? "" : tier)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedTier === tier
                  ? "bg-white text-zinc-900"
                  : `bg-zinc-800 ${TIER_COLORS[tier]} hover:text-white`
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* 카드 그리드 */}
      {isLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {[...Array(18)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-white/30 space-y-2">
          <BookOpen className="w-12 h-12 mx-auto opacity-30" />
          <p>카드가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {filtered.map((uc, i) => (
            <motion.div
              key={uc.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
              className="relative group"
            >
              <HoloEffect tier={uc.card.tier}>
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden">
                  <Image
                    src={uc.card.imageSmall}
                    alt={uc.card.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                    sizes="150px"
                  />
                  {uc.quantity > 1 && (
                    <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white flex items-center gap-0.5">
                      <Layers className="w-2.5 h-2.5" />
                      {uc.quantity}
                    </div>
                  )}
                </div>
              </HoloEffect>
              <div className="mt-1.5 px-0.5">
                <p className="text-[11px] font-medium text-white/80 truncate">{uc.card.name}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <TierBadge tier={uc.card.tier} className="text-[9px] px-1.5 py-0" />
                  <p className="text-[10px] text-white/30">{parseCardTypes(uc.card.types)[0] ?? ""}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
