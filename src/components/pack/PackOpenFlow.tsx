"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { Tier } from "@prisma/client";
import { ModeSelector, OpenMode } from "./ModeSelector";
import { CardFlip } from "./CardFlip";
import { TierBadge } from "./TierBadge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Coins, RotateCcw, BookOpen } from "lucide-react";
import Link from "next/link";
import { HoloEffect } from "./HoloEffect";

interface CardResult {
  cardId: string;
  isNew: boolean;
  card: {
    id: string;
    name: string;
    tier: Tier;
    imageSmall: string;
    imageLarge: string;
  };
}

interface PackOpenFlowProps {
  setId: string;
  setName: string;
  packPrice: number;
  logoUrl: string | null;
}

type FlowStep = "idle" | "mode_select" | "opening" | "result";

const HIGH_TIER: Tier[] = ["HR", "UR", "SR"];

export function PackOpenFlow({
  setId,
  setName,
  packPrice,
  logoUrl,
}: PackOpenFlowProps) {
  const [step, setStep] = useState<FlowStep>("idle");
  const [mode, setMode] = useState<OpenMode>("one_by_one");
  const [cards, setCards] = useState<CardResult[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const qc = useQueryClient();

  const { mutate: openPack, isPending } = useMutation({
    mutationFn: () =>
      axios.post<{ cards: CardResult[]; remainingCoins: number }>(
        "/api/pack/open",
        { setId }
      ),
    onSuccess: ({ data }) => {
      setCards(data.cards);
      qc.invalidateQueries({ queryKey: ["userCoins"] });

      const ursr = data.cards.filter((c) => HIGH_TIER.includes(c.card.tier));
      if (ursr.length > 0) {
        toast.success(`🎉 ${ursr.map((c) => c.card.name).join(", ")} 획득!`, {
          duration: 5000,
        });
      }
    },
    onError: (err: unknown) => {
      const msg =
        axios.isAxiosError(err)
          ? err.response?.data?.error ?? "뽑기에 실패했습니다."
          : "뽑기에 실패했습니다.";
      toast.error(msg);
      setStep("idle");
    },
  });

  function handleStartOpen() {
    setStep("mode_select");
  }

  function handleModeSelect(selectedMode: OpenMode) {
    setMode(selectedMode);
    setRevealedCount(0);
    setStep("opening");
    openPack();
  }

  function handleCardRevealed() {
    setRevealedCount((prev) => {
      const next = prev + 1;
      if (next >= 5) setTimeout(() => setStep("result"), 800);
      return next;
    });
  }

  function handleReset() {
    setStep("idle");
    setCards([]);
    setRevealedCount(0);
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-8">
      <AnimatePresence mode="wait">
        {/* 초기 화면 */}
        {step === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-6"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="relative w-48 h-48"
            >
              {logoUrl ? (
                <Image src={logoUrl} alt={setName} fill className="object-contain drop-shadow-2xl" />
              ) : (
                <div className="w-full h-full rounded-2xl bg-zinc-800 flex items-center justify-center text-6xl">
                  🎴
                </div>
              )}
            </motion.div>

            <div className="text-center">
              <h1 className="text-2xl font-black text-white mb-1">{setName}</h1>
              <p className="text-white/50 text-sm">5장 · R 등급 이상 1장 보장</p>
            </div>

            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-2">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-300 font-bold">{packPrice.toLocaleString()} 코인</span>
            </div>

            <Button
              size="lg"
              onClick={handleStartOpen}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-black px-12 py-6 text-lg rounded-2xl shadow-lg shadow-yellow-500/20"
            >
              팩 열기
            </Button>
          </motion.div>
        )}

        {/* 모드 선택 */}
        {step === "mode_select" && (
          <motion.div key="mode_select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ModeSelector onSelect={handleModeSelect} />
          </motion.div>
        )}

        {/* 뽑기 중 */}
        {step === "opening" && cards.length > 0 && (
          <motion.div
            key="opening"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8"
          >
            {mode === "one_by_one" && (
              <OneByOneView cards={cards} onReveal={handleCardRevealed} onDone={handleReset} />
            )}
            {mode === "all_at_once" && (
              <AllAtOnceView cards={cards} onAllRevealed={() => setTimeout(() => setStep("result"), 1000)} />
            )}
          </motion.div>
        )}

        {step === "opening" && cards.length === 0 && isPending && (
          <motion.div key="loading" className="text-white/50 flex flex-col items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-10 h-10 border-2 border-yellow-500 border-t-transparent rounded-full"
            />
            <span>팩 오픈 중...</span>
          </motion.div>
        )}

        {/* 결과 화면 */}
        {step === "result" && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-8 w-full"
          >
            <motion.h2
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-2xl font-black text-white"
            >
              획득한 카드
            </motion.h2>

            <div className="flex flex-wrap justify-center gap-4">
              {cards.map((c, i) => (
                <motion.div
                  key={c.cardId}
                  initial={{ opacity: 0, y: 30, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                  className="flex flex-col items-center gap-2"
                >
                  <HoloEffect tier={c.card.tier}>
                    <div className="relative w-32 h-44 rounded-xl overflow-hidden">
                      <Image src={c.card.imageLarge} alt={c.card.name} fill className="object-cover" sizes="128px" />
                    </div>
                  </HoloEffect>
                  <TierBadge tier={c.card.tier} />
                  <span className="text-xs text-white/60 text-center max-w-[130px] truncate">
                    {c.card.name}
                  </span>
                  {c.isNew && (
                    <span className="text-xs text-green-400 font-bold">NEW</span>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleReset}
                variant="outline"
                className="gap-2 border-white/20 hover:bg-white/10"
              >
                <RotateCcw className="w-4 h-4" />
                다시 뽑기
              </Button>
              <Link href="/collection">
                <Button className="gap-2 bg-zinc-700 hover:bg-zinc-600">
                  <BookOpen className="w-4 h-4" />
                  도감 보기
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── 한 장씩 뷰 ─── */
function OneByOneView({
  cards,
  onReveal,
  onDone,
}: {
  cards: CardResult[];
  onReveal: () => void;
  onDone: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const [shown, setShown] = useState<number[]>([]);
  const done = current >= cards.length;

  function handleFlip() {
    if (current >= cards.length) return;
    setShown((prev) => [...prev, current]);
    setCurrent((prev) => prev + 1);
    onReveal();
  }

  const card = cards[current];

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
      {/* 진행 표시 */}
      <p className="text-white/50 text-sm font-medium">
        {done ? "✨ 모두 공개되었습니다" : `${current + 1} / ${cards.length} 장`}
      </p>

      {/* 공개된 카드들 */}
      {shown.length > 0 && (
        <div className="flex gap-3 flex-wrap justify-center">
          {shown.map((idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex flex-col items-center gap-1"
            >
              <HoloEffect tier={cards[idx].card.tier}>
                <div className="relative w-24 h-32 rounded-xl overflow-hidden ring-1 ring-white/20">
                  <Image
                    src={cards[idx].card.imageLarge}
                    alt={cards[idx].card.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
              </HoloEffect>
              <TierBadge tier={cards[idx].card.tier} />
              <span className="text-[10px] text-white/50 text-center max-w-[96px] truncate">
                {cards[idx].card.name}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {/* 현재 뒤집을 카드 */}
      {!done && card && (
        <CardFlip
          key={current}
          card={{ ...card.card, isNew: card.isNew }}
          size="lg"
          onClick={handleFlip}
        />
      )}

      {!done && (
        <p className="text-white/40 text-sm animate-pulse">카드를 탭하여 공개</p>
      )}

      {/* 완료 후 버튼 */}
      {done && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3 mt-2"
        >
          <Button
            onClick={onDone}
            variant="outline"
            className="gap-2 border-white/20 hover:bg-white/10"
          >
            <RotateCcw className="w-4 h-4" />
            다시 뽑기
          </Button>
          <Link href="/collection">
            <Button className="gap-2 bg-zinc-700 hover:bg-zinc-600">
              <BookOpen className="w-4 h-4" />
              도감 보기
            </Button>
          </Link>
        </motion.div>
      )}
    </div>
  );
}

/* ─── 전체 공개 뷰 ─── */
function AllAtOnceView({
  cards,
  onAllRevealed,
}: {
  cards: CardResult[];
  onAllRevealed: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-white/50 text-sm">5장 동시 공개</p>
      <div className="flex gap-4 flex-wrap justify-center">
        {cards.map((c, i) => (
          <CardFlip
            key={c.cardId}
            card={{ ...c.card, isNew: c.isNew }}
            autoFlip
            delay={i * 300 + 200}
            size="md"
            onClick={i === 4 ? onAllRevealed : undefined}
          />
        ))}
      </div>
    </div>
  );
}
