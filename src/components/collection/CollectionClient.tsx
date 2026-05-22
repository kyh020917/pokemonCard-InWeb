"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { motion } from "framer-motion";
import { Tier } from "@prisma/client";
import { Search, SlidersHorizontal, LayoutGrid, List } from "lucide-react";
import { CollectionCard } from "./CollectionCard";
import { CardDetailModal } from "./CardDetailModal";
import { SetProgress } from "./SetProgress";
import { TierBadge } from "@/components/pack/TierBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface Stats {
  totalCards: number;
  uniqueCards: number;
  tierStats: { tier: Tier; count: number }[];
  setStats: {
    id: string;
    name: string;
    series: string;
    logoUrl: string | null;
    total: number;
    owned: number;
    percent: number;
  }[];
}

const ALL_TIERS: Tier[] = ["C", "U", "R", "HR", "UR", "SR"];
const SORT_OPTIONS = [
  { value: "obtainedAt_desc", label: "최근 획득순" },
  { value: "tier_desc", label: "등급 높은순" },
  { value: "tier_asc", label: "등급 낮은순" },
  { value: "name_asc", label: "이름순" },
];

export function CollectionClient({ sets }: { sets: { id: string; name: string }[] }) {
  const [search, setSearch] = useState("");
  const [selectedSet, setSelectedSet] = useState<string>("all");
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [sortBy, setSortBy] = useState("obtainedAt_desc");
  const [selectedCard, setSelectedCard] = useState<UserCard | null>(null);

  const { data: userCards = [], isLoading } = useQuery<UserCard[]>({
    queryKey: ["collection", selectedSet, selectedTier, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedSet !== "all") params.set("setId", selectedSet);
      if (selectedTier !== "all") params.set("tier", selectedTier);
      if (search) params.set("search", search);
      return axios.get(`/api/user/collection?${params}`).then((r) => r.data);
    },
  });

  const { data: stats } = useQuery<Stats>({
    queryKey: ["collectionStats"],
    queryFn: () => axios.get("/api/user/collection/stats").then((r) => r.data),
  });

  const sorted = useMemo(() => {
    const TIER_RANK: Record<Tier, number> = { C: 0, U: 1, R: 2, HR: 3, UR: 4, SR: 5 };
    return [...userCards].sort((a, b) => {
      switch (sortBy) {
        case "tier_desc": return TIER_RANK[b.card.tier] - TIER_RANK[a.card.tier];
        case "tier_asc": return TIER_RANK[a.card.tier] - TIER_RANK[b.card.tier];
        case "name_asc": return a.card.name.localeCompare(b.card.name);
        default: return 0;
      }
    });
  }, [userCards, sortBy]);

  return (
    <div className="space-y-6">
      {/* 요약 통계 */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox label="총 카드 수" value={stats.totalCards.toLocaleString()} unit="장" />
          <StatBox label="보유 종류" value={stats.uniqueCards.toLocaleString()} unit="종" />
          <StatBox
            label="UR 이상"
            value={(
              (stats.tierStats.find((t) => t.tier === "UR")?.count ?? 0) +
              (stats.tierStats.find((t) => t.tier === "SR")?.count ?? 0)
            ).toLocaleString()}
            unit="장"
            highlight
          />
          <StatBox
            label="세트 완성"
            value={stats.setStats.filter((s) => s.percent === 100).length.toString()}
            unit="개"
          />
        </div>
      )}

      <Tabs defaultValue="cards">
        <TabsList className="bg-zinc-800 border border-white/10">
          <TabsTrigger value="cards" className="gap-2 data-[state=active]:bg-zinc-700">
            <LayoutGrid className="w-4 h-4" /> 카드 목록
          </TabsTrigger>
          <TabsTrigger value="sets" className="gap-2 data-[state=active]:bg-zinc-700">
            <List className="w-4 h-4" /> 세트별 완성도
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="mt-6 space-y-4">
          {/* 필터 바 */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="카드 이름 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-800 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-500/50"
              />
            </div>

            <select
              value={selectedSet}
              onChange={(e) => setSelectedSet(e.target.value)}
              className="px-3 py-2 bg-zinc-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-yellow-500/50"
            >
              <option value="all">전체 세트</option>
              {sets.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-zinc-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-yellow-500/50"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* 등급 필터 */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedTier("all")}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                selectedTier === "all"
                  ? "bg-white text-black border-white"
                  : "border-white/20 text-white/50 hover:border-white/40"
              }`}
            >
              전체
            </button>
            {ALL_TIERS.map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(selectedTier === tier ? "all" : tier)}
                className={`transition-opacity ${selectedTier !== "all" && selectedTier !== tier ? "opacity-40" : ""}`}
              >
                <TierBadge tier={tier} />
              </button>
            ))}
          </div>

          {/* 카드 그리드 */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full"
              />
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-white/30">
              <span className="text-5xl mb-3">📭</span>
              <p className="font-medium">보유한 카드가 없습니다</p>
              <p className="text-sm mt-1">팩을 뽑아서 카드를 모아보세요!</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-white/30">{sorted.length}종 표시 중</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                {sorted.map((uc, i) => (
                  <CollectionCard
                    key={uc.id}
                    card={uc.card}
                    quantity={uc.quantity}
                    index={i}
                    onClick={() => setSelectedCard(uc)}
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="sets" className="mt-6">
          {stats?.setStats ? (
            <SetProgress stats={stats.setStats} />
          ) : (
            <div className="flex justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full"
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CardDetailModal
        card={selectedCard?.card ?? null}
        quantity={selectedCard?.quantity ?? 0}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  );
}

function StatBox({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-4 border ${highlight ? "bg-yellow-500/10 border-yellow-500/30" : "bg-zinc-800/60 border-white/10"}`}>
      <p className="text-xs text-white/40">{label}</p>
      <p className={`text-2xl font-black mt-1 ${highlight ? "text-yellow-300" : "text-white"}`}>
        {value}
        <span className={`text-sm font-medium ml-1 ${highlight ? "text-yellow-400/70" : "text-white/40"}`}>
          {unit}
        </span>
      </p>
    </div>
  );
}
