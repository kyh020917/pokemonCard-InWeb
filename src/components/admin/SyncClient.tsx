"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { RefreshCw, CheckCircle2, Circle, Loader2, ChevronDown, ChevronUp, X, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface SetInfo {
  id: string;
  name: string;
  series: string;
  total: number;
  releaseDate: string;
  logoUrl: string | null;
  synced: boolean;
  syncedCount: number;
  packPrice: number;
  isActive: boolean;
}

interface SyncResult {
  setName: string;
  totalCards: number;
  newCards: number;
}

export function SyncClient() {
  const qc = useQueryClient();
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, SyncResult>>({});
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set(["Scarlet & Violet"]));
  const abortRef = useRef<AbortController | null>(null);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState("");

  const { data: sets = [], isLoading } = useQuery<SetInfo[]>({
    queryKey: ["adminSets"],
    queryFn: () => axios.get("/api/admin/sets").then((r) => r.data.sets),
  });

  async function handleCancel() {
    const id = syncingId;
    abortRef.current?.abort();
    abortRef.current = null;
    setSyncingId(null);
    if (id) {
      try {
        await axios.patch(`/api/admin/sets/${id}`, { isActive: false });
        qc.invalidateQueries({ queryKey: ["adminSets"] });
      } catch {
        // ignore
      }
    }
    toast.info("동기화가 취소되었습니다.");
  }

  const { mutate: syncSet } = useMutation({
    mutationFn: (setId: string) => {
      const controller = new AbortController();
      abortRef.current = controller;
      return axios
        .post<SyncResult>("/api/admin/sync", { setId }, { signal: controller.signal })
        .then((r) => r.data);
    },
    onMutate: (setId) => setSyncingId(setId),
    onSuccess: (data, setId) => {
      setSyncingId(null);
      abortRef.current = null;
      setResults((prev) => ({ ...prev, [setId]: data }));
      qc.invalidateQueries({ queryKey: ["adminSets"] });
      toast.success(`${data.setName} 동기화 완료! 신규 ${data.newCards}장 추가`);
    },
    onError: (err, setId) => {
      if (axios.isCancel(err)) return; // 취소는 에러 토스트 없이
      setSyncingId(null);
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? "동기화 실패"
        : "동기화 실패";
      toast.error(msg);
    },
  });

  const { mutate: updatePrice } = useMutation({
    mutationFn: ({ setId, packPrice }: { setId: string; packPrice: number }) =>
      axios.patch(`/api/admin/sets/${setId}`, { packPrice }).then((r) => r.data),
    onSuccess: (_, { setId, packPrice }) => {
      setEditingPrice(null);
      qc.invalidateQueries({ queryKey: ["adminSets"] });
      toast.success(`가격이 ${packPrice.toLocaleString()} 코인으로 변경되었습니다.`);
    },
    onError: () => toast.error("가격 변경 실패"),
  });

  function startEditPrice(setId: string, currentPrice: number) {
    setEditingPrice(setId);
    setPriceInput(String(currentPrice));
  }

  function savePrice(setId: string) {
    const price = parseInt(priceInput);
    if (isNaN(price) || price < 0) {
      toast.error("올바른 숫자를 입력해주세요.");
      return;
    }
    updatePrice({ setId, packPrice: price });
  }

  // 시리즈별 그룹화
  const grouped = sets.reduce<Record<string, SetInfo[]>>((acc, s) => {
    if (!acc[s.series]) acc[s.series] = [];
    acc[s.series].push(s);
    return acc;
  }, {});

  const toggleSeries = (series: string) => {
    setExpandedSeries((prev) => {
      const next = new Set(prev);
      if (next.has(series)) next.delete(series);
      else next.add(series);
      return next;
    });
  };

  const syncedCount = sets.filter((s) => s.synced).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-white/40 gap-3">
        <Loader2 className="w-5 h-5 animate-spin" />
        세트 목록 불러오는 중...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 요약 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "전체 세트", value: sets.length },
          { label: "동기화 완료", value: syncedCount },
          { label: "미동기화", value: sets.length - syncedCount },
        ].map((stat) => (
          <div key={stat.label} className="bg-zinc-900 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-white">{stat.value}</p>
            <p className="text-xs text-white/40 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 시리즈별 목록 */}
      {Object.entries(grouped).map(([series, seriesSets]) => {
        const isExpanded = expandedSeries.has(series);
        const seriesSynced = seriesSets.filter((s) => s.synced).length;

        return (
          <div key={series} className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
            {/* 시리즈 헤더 */}
            <button
              onClick={() => toggleSeries(series)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-white">{series}</span>
                <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded-full">
                  {seriesSynced}/{seriesSets.length} 동기화
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-white/40" />
              ) : (
                <ChevronDown className="w-4 h-4 text-white/40" />
              )}
            </button>

            {/* 세트 목록 */}
            {isExpanded && (
              <div className="border-t border-white/10 divide-y divide-white/5">
                {seriesSets.map((set) => {
                  const isSyncing = syncingId === set.id;
                  const result = results[set.id];

                  return (
                    <div
                      key={set.id}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-white/5 transition-colors"
                    >
                      {/* 로고 */}
                      <div className="w-12 h-8 relative shrink-0">
                        {set.logoUrl ? (
                          <Image
                            src={set.logoUrl}
                            alt={set.name}
                            fill
                            className="object-contain"
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-800 rounded flex items-center justify-center text-xs">
                            🎴
                          </div>
                        )}
                      </div>

                      {/* 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white text-sm truncate">{set.name}</span>
                          <span className="text-xs text-white/30 shrink-0">{set.id}</span>
                          {set.synced && !set.isActive && (
                            <span className="text-xs bg-red-500/20 border border-red-500/40 text-red-400 px-1.5 py-0.5 rounded-full shrink-0">
                              비활성
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5 flex-wrap">
                          <span>{set.releaseDate} · 총 {set.total}장</span>
                          {set.synced && (
                            <span className="text-green-400">DB {set.syncedCount}장</span>
                          )}
                          {result && (
                            <span className="text-yellow-400">+{result.newCards}장 추가됨</span>
                          )}
                          {/* 가격 편집 */}
                          {set.synced && (
                            editingPrice === set.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={priceInput}
                                  onChange={(e) => setPriceInput(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && savePrice(set.id)}
                                  className="w-20 bg-zinc-700 border border-yellow-500/50 rounded px-2 py-0.5 text-white text-xs outline-none"
                                  autoFocus
                                />
                                <span className="text-white/30">코인</span>
                                <button onClick={() => savePrice(set.id)} className="text-green-400 hover:text-green-300">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditingPrice(null)} className="text-white/30 hover:text-white/60">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEditPrice(set.id, set.packPrice)}
                                className="flex items-center gap-1 text-yellow-400/80 hover:text-yellow-300 transition-colors"
                              >
                                <span>💰 {set.packPrice.toLocaleString()} 코인</span>
                                <Pencil className="w-3 h-3" />
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {/* 상태 + 버튼 */}
                      <div className="flex items-center gap-2 shrink-0">
                        {set.synced ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-white/20" />
                        )}
                        {isSyncing ? (
                          <Button
                            size="sm"
                            onClick={handleCancel}
                            className="bg-red-600 hover:bg-red-500 text-white font-bold"
                          >
                            <X className="w-3 h-3" />
                            취소
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => syncSet(set.id)}
                            disabled={syncingId !== null}
                            className={
                              set.synced && !set.isActive
                                ? "bg-orange-600 hover:bg-orange-500 text-white font-bold"
                                : set.synced
                                ? "bg-zinc-700 hover:bg-zinc-600 text-white/70"
                                : "bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
                            }
                          >
                            <RefreshCw className="w-3 h-3" />
                            {set.synced && !set.isActive ? "재활성화" : set.synced ? "재동기화" : "동기화"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
