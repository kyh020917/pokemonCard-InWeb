"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { X, Coins, Search } from "lucide-react";
import { Tier } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/pack/TierBadge";
import Image from "next/image";

interface UserCard {
  id: string;
  quantity: number;
  card: { id: string; name: string; tier: Tier; imageSmall: string; set: { name: string } };
}

interface CreateListingModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateListingModal({ open, onClose, onCreated }: CreateListingModalProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<UserCard | null>(null);
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const { data: myCards = [] } = useQuery<UserCard[]>({
    queryKey: ["myCards", search],
    queryFn: () =>
      axios.get(`/api/user/collection${search ? `?search=${search}` : ""}`).then((r) => r.data),
    enabled: open,
  });

  async function handleSubmit() {
    if (!selected || !price) return;
    setSubmitting(true);
    try {
      await axios.post("/api/market", {
        cardId: selected.card.id,
        quantity,
        price: parseInt(price),
      });
      onCreated();
      handleClose();
    } catch (e) {
      if (axios.isAxiosError(e)) {
        alert(e.response?.data?.error ?? "등록 실패");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setSelected(null);
    setPrice("");
    setQuantity(1);
    setSearch("");
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-full max-w-md max-h-[85vh] flex flex-col gap-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">카드 판매 등록</h2>
              <button onClick={handleClose} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!selected ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    placeholder="카드 검색..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-zinc-800 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-500/50"
                  />
                </div>
                <div className="overflow-y-auto flex-1 space-y-2 pr-1">
                  {myCards.length === 0 ? (
                    <p className="text-center text-white/30 py-8">보유한 카드가 없습니다</p>
                  ) : (
                    myCards.map((uc) => (
                      <button
                        key={uc.id}
                        onClick={() => setSelected(uc)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors text-left"
                      >
                        <div className="relative w-10 h-14 rounded-lg overflow-hidden shrink-0">
                          <Image src={uc.card.imageSmall} alt={uc.card.name} fill className="object-cover" sizes="40px" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{uc.card.name}</p>
                          <p className="text-xs text-white/40 truncate">{uc.card.set.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <TierBadge tier={uc.card.tier} className="text-[10px]" />
                            <span className="text-xs text-white/40">보유 {uc.quantity}장</span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-xl">
                  <div className="relative w-10 h-14 rounded-lg overflow-hidden shrink-0">
                    <Image src={selected.card.imageSmall} alt={selected.card.name} fill className="object-cover" sizes="40px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{selected.card.name}</p>
                    <TierBadge tier={selected.card.tier} className="text-[10px]" />
                  </div>
                  <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">판매 수량</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-lg bg-zinc-700 text-white font-bold hover:bg-zinc-600"
                    >
                      -
                    </button>
                    <span className="text-white font-bold w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(selected.quantity, q + 1))}
                      className="w-8 h-8 rounded-lg bg-zinc-700 text-white font-bold hover:bg-zinc-600"
                    >
                      +
                    </button>
                    <span className="text-xs text-white/30">/ {selected.quantity}장 보유</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/50 mb-1.5 block">판매 가격 (코인)</label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-400" />
                    <input
                      type="number"
                      min="1"
                      placeholder="가격 입력..."
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-zinc-800 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-500/50"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!price || submitting}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
                >
                  {submitting ? "등록 중..." : "판매 등록"}
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
