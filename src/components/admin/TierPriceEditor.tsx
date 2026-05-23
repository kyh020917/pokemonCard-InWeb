"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { Tier } from "@prisma/client";
import { TierBadge } from "@/components/pack/TierBadge";
import { Check, X } from "lucide-react";

interface TierConfig {
  tier: Tier;
  price: number;
  enabled: boolean;
}

const TIER_ORDER: Tier[] = ["C", "U", "R", "HR", "UR", "SR"];
const TIER_LABEL: Record<Tier, string> = {
  C: "커먼", U: "언커먼", R: "레어",
  HR: "홀로 레어", UR: "울트라 레어", SR: "시크릿 레어",
};

export function TierPriceEditor() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Tier | null>(null);
  const [priceInput, setPriceInput] = useState("");

  const { data: tiers = [] } = useQuery<TierConfig[]>({
    queryKey: ["adminTierPrices"],
    queryFn: () => axios.get("/api/shop/tiers").then((r) => r.data),
  });

  const { mutate: update } = useMutation({
    mutationFn: (payload: { tier: Tier; price?: number; enabled?: boolean }) =>
      axios.patch("/api/admin/tier-prices", payload).then((r) => r.data),
    onSuccess: () => {
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["adminTierPrices"] });
      qc.invalidateQueries({ queryKey: ["shopTiers"] });
      toast.success("등급 가격이 업데이트되었습니다.");
    },
    onError: () => toast.error("업데이트 실패"),
  });

  const tierMap = new Map(tiers.map((t) => [t.tier, t]));

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10">
        <h2 className="font-bold text-white">등급별 카드 매입 가격</h2>
        <p className="text-xs text-white/40 mt-0.5">유저가 카드를 판매할 때 지급되는 코인 금액을 설정합니다</p>
      </div>
      <div className="divide-y divide-white/5">
        {TIER_ORDER.map((tier) => {
          const config = tierMap.get(tier);
          const isEditing = editing === tier;

          return (
            <div key={tier} className="flex items-center gap-4 px-5 py-3">
              <TierBadge tier={tier} />
              <div className="flex-1">
                <span className="text-sm text-white font-medium">{TIER_LABEL[tier]}</span>
              </div>

              {/* 활성화 토글 */}
              <button
                onClick={() => config && update({ tier, enabled: !config.enabled })}
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                  config?.enabled
                    ? "border-green-500/50 text-green-400 bg-green-500/10"
                    : "border-white/10 text-white/30 bg-white/5"
                }`}
              >
                {config?.enabled ? "판매 중" : "중단"}
              </button>

              {/* 가격 편집 */}
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const price = parseInt(priceInput);
                        if (!isNaN(price) && price >= 0) update({ tier, price });
                      }
                    }}
                    className="w-24 bg-zinc-700 border border-yellow-500/50 rounded px-2 py-1 text-white text-sm outline-none"
                    autoFocus
                  />
                  <span className="text-white/30 text-xs">코인</span>
                  <button
                    onClick={() => {
                      const price = parseInt(priceInput);
                      if (!isNaN(price) && price >= 0) update({ tier, price });
                      else toast.error("올바른 숫자를 입력해주세요.");
                    }}
                    className="text-green-400 hover:text-green-300"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditing(null)} className="text-white/30 hover:text-white/60">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditing(tier); setPriceInput(String(config?.price ?? 100)); }}
                  className="text-yellow-400/80 hover:text-yellow-300 text-sm font-bold w-28 text-right transition-colors"
                >
                  {config ? `${config.price.toLocaleString()} 코인` : "…"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
