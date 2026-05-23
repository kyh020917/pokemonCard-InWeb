"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { RefreshCw, CheckCircle2, Circle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
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

  const { data: sets = [], isLoading } = useQuery<SetInfo[]>({
    queryKey: ["adminSets"],
    queryFn: () => axios.get("/api/admin/sets").then((r) => r.data.sets),
  });

  const { mutate: syncSet } = useMutation({
    mutationFn: (setId: string) =>
      axios.post<SyncResult>("/api/admin/sync", { setId }).then((r) => r.data),
    onMutate: (setId) => setSyncingId(setId),
    onSuccess: (data, setId) => {
      setSyncingId(null);
      setResults((prev) => ({ ...prev, [setId]: data }));
      qc.invalidateQueries({ queryKey: ["adminSets"] });
      toast.success(`${data.setName} 동기화 완료! 신규 ${data.newCards}장 추가`);
    },
    onError: (err, setId) => {
      setSyncingId(null);
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? "동기화 실패"
        : "동기화 실패";
      toast.error(msg);
    },
  });

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
                        </div>
                        <div className="text-xs text-white/40 mt-0.5">
                          {set.releaseDate} · 총 {set.total}장
                          {set.synced && (
                            <span className="text-green-400 ml-2">
                              DB {set.syncedCount}장
                            </span>
                          )}
                          {result && (
                            <span className="text-yellow-400 ml-2">
                              +{result.newCards}장 추가됨
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 상태 + 버튼 */}
                      <div className="flex items-center gap-3 shrink-0">
                        {set.synced ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-white/20" />
                        )}
                        <Button
                          size="sm"
                          onClick={() => syncSet(set.id)}
                          disabled={isSyncing || syncingId !== null}
                          className={
                            set.synced
                              ? "bg-zinc-700 hover:bg-zinc-600 text-white/70"
                              : "bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
                          }
                        >
                          {isSyncing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                          {isSyncing ? "동기화 중..." : set.synced ? "재동기화" : "동기화"}
                        </Button>
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
