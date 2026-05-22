"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Tier } from "@prisma/client";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ListingCard } from "./ListingCard";
import { CreateListingModal } from "./CreateListingModal";
import { TierBadge } from "@/components/pack/TierBadge";

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

const ALL_TIERS: Tier[] = ["C", "U", "R", "HR", "UR", "SR"];

export function MarketClient({ sets }: { sets: { id: string; name: string }[] }) {
  const { data: session } = useSession();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [selectedSet, setSelectedSet] = useState<string>("all");
  const [showMine, setShowMine] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: listings = [], isLoading } = useQuery<Listing[]>({
    queryKey: ["market", search, selectedTier, selectedSet, showMine],
    queryFn: () => {
      const p = new URLSearchParams();
      if (search) p.set("search", search);
      if (selectedTier !== "all") p.set("tier", selectedTier);
      if (selectedSet !== "all") p.set("setId", selectedSet);
      if (showMine) p.set("mine", "true");
      return axios.get(`/api/market?${p}`).then((r) => r.data);
    },
  });

  const { data: userData } = useQuery({
    queryKey: ["userCoins"],
    queryFn: () => axios.get("/api/user/me").then((r) => r.data),
    enabled: !!session,
  });

  const buyMutation = useMutation({
    mutationFn: (id: string) => axios.post(`/api/market/${id}`),
    onSuccess: () => {
      toast.success("구매 완료!");
      qc.invalidateQueries({ queryKey: ["market"] });
      qc.invalidateQueries({ queryKey: ["userCoins"] });
    },
    onError: (e) => {
      if (axios.isAxiosError(e)) toast.error(e.response?.data?.error ?? "구매 실패");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/market/${id}`),
    onSuccess: () => {
      toast.success("등록이 취소되었습니다.");
      qc.invalidateQueries({ queryKey: ["market"] });
    },
    onError: (e) => {
      if (axios.isAxiosError(e)) toast.error(e.response?.data?.error ?? "취소 실패");
    },
  });

  const coins = userData?.coins ?? 0;

  return (
    <div className="space-y-6">
      {/* 필터 & 액션 바 */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="relative min-w-48 flex-1">
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
            className="px-3 py-2 bg-zinc-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none"
          >
            <option value="all">전체 세트</option>
            {sets.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMine((v) => !v)}
            className={`gap-2 border-white/20 ${showMine ? "bg-white/10 text-white" : "text-white/50"}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            내 매물
          </Button>
        </div>

        {session && (
          <Button
            onClick={() => setCreateOpen(true)}
            className="gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
          >
            <Plus className="w-4 h-4" />
            판매 등록
          </Button>
        )}
      </div>

      {/* 등급 필터 */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedTier("all")}
          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
            selectedTier === "all" ? "bg-white text-black border-white" : "border-white/20 text-white/50 hover:border-white/40"
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

      {/* 목록 */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full"
          />
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-white/30">
          <span className="text-5xl mb-3">🏪</span>
          <p className="font-medium">등록된 매물이 없습니다</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-white/30">{listings.length}개 매물</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {listings.map((listing, i) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isMine={listing.seller.id === session?.user?.id}
                canAfford={coins >= listing.price}
                onBuy={(id) => buyMutation.mutate(id)}
                onCancel={(id) => cancelMutation.mutate(id)}
                index={i}
              />
            ))}
          </div>
        </>
      )}

      <CreateListingModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          qc.invalidateQueries({ queryKey: ["market"] });
          qc.invalidateQueries({ queryKey: ["collection"] });
        }}
      />
    </div>
  );
}
