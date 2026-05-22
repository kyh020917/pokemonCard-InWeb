"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { X, Search, Plus, Minus } from "lucide-react";
import { Tier } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/pack/TierBadge";
import Image from "next/image";

interface UserCard {
  id: string;
  quantity: number;
  card: { id: string; name: string; tier: Tier; imageSmall: string };
}

interface TradeCardItem {
  cardId: string;
  quantity: number;
  name: string;
  imageSmall: string;
  tier: Tier;
}

interface CreateTradeModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateTradeModal({ open, onClose, onCreated }: CreateTradeModalProps) {
  const [step, setStep] = useState<"receiver" | "offered" | "requested" | "message">("receiver");
  const [receiverUsername, setReceiverUsername] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [receiverError, setReceiverError] = useState("");
  const [offeredCards, setOfferedCards] = useState<TradeCardItem[]>([]);
  const [requestedCards, setRequestedCards] = useState<TradeCardItem[]>([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mySearch, setMySearch] = useState("");
  const [reqSearch, setReqSearch] = useState("");

  const { data: myCards = [] } = useQuery<UserCard[]>({
    queryKey: ["myCards", mySearch],
    queryFn: () =>
      axios.get(`/api/user/collection${mySearch ? `?search=${mySearch}` : ""}`).then((r) => r.data),
    enabled: open && step === "offered",
  });

  const { data: theirCards = [] } = useQuery<UserCard[]>({
    queryKey: ["theirCards", receiverId, reqSearch],
    queryFn: () =>
      axios.get(`/api/user/collection/user/${receiverId}${reqSearch ? `?search=${reqSearch}` : ""}`).then((r) => r.data),
    enabled: open && step === "requested" && !!receiverId,
  });

  async function findReceiver() {
    setReceiverError("");
    try {
      const { data } = await axios.get(`/api/user/search?username=${receiverUsername}`);
      setReceiverId(data.id);
      setStep("offered");
    } catch {
      setReceiverError("유저를 찾을 수 없습니다.");
    }
  }

  function toggleOffered(uc: UserCard) {
    setOfferedCards((prev) => {
      const exists = prev.find((c) => c.cardId === uc.card.id);
      if (exists) return prev.filter((c) => c.cardId !== uc.card.id);
      return [...prev, { cardId: uc.card.id, quantity: 1, name: uc.card.name, imageSmall: uc.card.imageSmall, tier: uc.card.tier }];
    });
  }

  function toggleRequested(uc: UserCard) {
    setRequestedCards((prev) => {
      const exists = prev.find((c) => c.cardId === uc.card.id);
      if (exists) return prev.filter((c) => c.cardId !== uc.card.id);
      return [...prev, { cardId: uc.card.id, quantity: 1, name: uc.card.name, imageSmall: uc.card.imageSmall, tier: uc.card.tier }];
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await axios.post("/api/trade", {
        receiverId,
        offeredCards: offeredCards.map((c) => ({ cardId: c.cardId, quantity: c.quantity })),
        requestedCards: requestedCards.map((c) => ({ cardId: c.cardId, quantity: c.quantity })),
        message: message || null,
      });
      onCreated();
      handleClose();
    } catch (e) {
      if (axios.isAxiosError(e)) alert(e.response?.data?.error ?? "전송 실패");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setStep("receiver");
    setReceiverUsername("");
    setReceiverId("");
    setOfferedCards([]);
    setRequestedCards([]);
    setMessage("");
    setMySearch("");
    setReqSearch("");
    onClose();
  }

  const STEPS = ["receiver", "offered", "requested", "message"];
  const stepIndex = STEPS.indexOf(step);

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
            className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-full max-w-lg max-h-[85vh] flex flex-col gap-5"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white">트레이드 제안</h2>
                <div className="flex gap-1 mt-1">
                  {STEPS.map((s, i) => (
                    <div key={s} className={`h-1 rounded-full transition-all ${i <= stepIndex ? "w-8 bg-yellow-500" : "w-4 bg-zinc-700"}`} />
                  ))}
                </div>
              </div>
              <button onClick={handleClose} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: 상대방 찾기 */}
            {step === "receiver" && (
              <div className="space-y-4">
                <p className="text-sm text-white/50">트레이드할 유저의 닉네임을 입력하세요</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    placeholder="닉네임 입력..."
                    value={receiverUsername}
                    onChange={(e) => setReceiverUsername(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && findReceiver()}
                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-800 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-500/50"
                  />
                </div>
                {receiverError && <p className="text-red-400 text-sm">{receiverError}</p>}
                <Button onClick={findReceiver} disabled={!receiverUsername} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold">
                  찾기
                </Button>
              </div>
            )}

            {/* Step 2: 내가 줄 카드 */}
            {step === "offered" && (
              <div className="space-y-3 overflow-hidden flex flex-col flex-1">
                <p className="text-sm text-white/50">내가 줄 카드를 선택하세요</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="text" placeholder="검색..." value={mySearch} onChange={(e) => setMySearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-zinc-800 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none" />
                </div>
                {offeredCards.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {offeredCards.map((c) => (
                      <div key={c.cardId} className="relative w-9 h-12 rounded-lg overflow-hidden">
                        <Image src={c.imageSmall} alt={c.name} fill className="object-cover" sizes="36px" />
                        <div className="absolute inset-0 bg-blue-500/30" />
                      </div>
                    ))}
                  </div>
                )}
                <div className="overflow-y-auto flex-1 space-y-1.5 pr-1">
                  {myCards.map((uc) => {
                    const selected = offeredCards.some((c) => c.cardId === uc.card.id);
                    return (
                      <button key={uc.id} onClick={() => toggleOffered(uc)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left ${selected ? "bg-blue-500/20 border border-blue-500/30" : "bg-zinc-800 hover:bg-zinc-700"}`}>
                        <div className="relative w-9 h-12 rounded-lg overflow-hidden shrink-0">
                          <Image src={uc.card.imageSmall} alt={uc.card.name} fill className="object-cover" sizes="36px" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{uc.card.name}</p>
                          <div className="flex gap-2 mt-0.5">
                            <TierBadge tier={uc.card.tier} className="text-[9px]" />
                            <span className="text-xs text-white/30">×{uc.quantity}</span>
                          </div>
                        </div>
                        {selected && <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0"><Plus className="w-3 h-3 text-white rotate-45" /></div>}
                      </button>
                    );
                  })}
                </div>
                <Button onClick={() => setStep("requested")} disabled={offeredCards.length === 0}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold">
                  다음 ({offeredCards.length}장 선택)
                </Button>
              </div>
            )}

            {/* Step 3: 상대방에게 원하는 카드 */}
            {step === "requested" && (
              <div className="space-y-3 overflow-hidden flex flex-col flex-1">
                <p className="text-sm text-white/50">상대방에게 원하는 카드를 선택하세요</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="text" placeholder="검색..." value={reqSearch} onChange={(e) => setReqSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-zinc-800 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none" />
                </div>
                {requestedCards.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {requestedCards.map((c) => (
                      <div key={c.cardId} className="relative w-9 h-12 rounded-lg overflow-hidden">
                        <Image src={c.imageSmall} alt={c.name} fill className="object-cover" sizes="36px" />
                        <div className="absolute inset-0 bg-green-500/30" />
                      </div>
                    ))}
                  </div>
                )}
                <div className="overflow-y-auto flex-1 space-y-1.5 pr-1">
                  {theirCards.length === 0 ? (
                    <p className="text-center text-white/30 py-8 text-sm">상대방이 보유한 카드가 없습니다</p>
                  ) : (
                    theirCards.map((uc) => {
                      const selected = requestedCards.some((c) => c.cardId === uc.card.id);
                      return (
                        <button key={uc.id} onClick={() => toggleRequested(uc)}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left ${selected ? "bg-green-500/20 border border-green-500/30" : "bg-zinc-800 hover:bg-zinc-700"}`}>
                          <div className="relative w-9 h-12 rounded-lg overflow-hidden shrink-0">
                            <Image src={uc.card.imageSmall} alt={uc.card.name} fill className="object-cover" sizes="36px" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{uc.card.name}</p>
                            <TierBadge tier={uc.card.tier} className="text-[9px]" />
                          </div>
                          {selected && <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0"><Plus className="w-3 h-3 text-white rotate-45" /></div>}
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setStep("offered")} variant="outline" className="border-white/20 text-white/50">이전</Button>
                  <Button onClick={() => setStep("message")} disabled={requestedCards.length === 0}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold">
                    다음 ({requestedCards.length}장 선택)
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: 메시지 */}
            {step === "message" && (
              <div className="space-y-4">
                <p className="text-sm text-white/50">상대방에게 메시지를 남겨보세요 (선택)</p>
                <textarea
                  placeholder="메시지 입력... (선택사항)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-500/50 resize-none"
                />
                <div className="flex gap-2">
                  <Button onClick={() => setStep("requested")} variant="outline" className="border-white/20 text-white/50">이전</Button>
                  <Button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold">
                    {submitting ? "전송 중..." : "트레이드 제안"}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
