"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Plus, Inbox, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TradeItem } from "./TradeItem";
import { CreateTradeModal } from "./CreateTradeModal";
import { Tier } from "@prisma/client";

interface TradeCardItem { cardId: string; quantity: number }
interface Trade {
  id: string;
  offeredCards: TradeCardItem[];
  requestedCards: TradeCardItem[];
  message: string | null;
  createdAt: string;
  proposer?: { id: string; username: string };
  receiver?: { id: string; username: string };
}
interface CardMini { id: string; name: string; tier: Tier; imageSmall: string }

export function TradeClient() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useQuery<{ incoming: Trade[]; outgoing: Trade[]; cardMap: Record<string, CardMini> }>({
    queryKey: ["trades"],
    queryFn: () => axios.get("/api/trade").then((r) => r.data),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      axios.patch(`/api/trade/${id}`, { action }),
    onSuccess: (_, { action }) => {
      const msg = action === "accept" ? "트레이드 수락!" : action === "decline" ? "거절했습니다." : "취소했습니다.";
      toast.success(msg);
      qc.invalidateQueries({ queryKey: ["trades"] });
      qc.invalidateQueries({ queryKey: ["collection"] });
    },
    onError: (e) => {
      if (axios.isAxiosError(e)) toast.error(e.response?.data?.error ?? "처리 실패");
    },
  });

  const incoming = data?.incoming ?? [];
  const outgoing = data?.outgoing ?? [];
  const cardMap = data?.cardMap ?? {};

  const Spinner = () => (
    <div className="flex justify-center py-20">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold">
          <Plus className="w-4 h-4" />
          트레이드 제안
        </Button>
      </div>

      <Tabs defaultValue="incoming">
        <TabsList className="bg-zinc-800 border border-white/10">
          <TabsTrigger value="incoming" className="gap-2 data-[state=active]:bg-zinc-700">
            <Inbox className="w-4 h-4" />
            받은 제안
            {incoming.length > 0 && (
              <span className="ml-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {incoming.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="gap-2 data-[state=active]:bg-zinc-700">
            <Send className="w-4 h-4" />
            보낸 제안
            {outgoing.length > 0 && (
              <span className="ml-1 bg-zinc-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {outgoing.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="mt-6">
          {isLoading ? <Spinner /> : incoming.length === 0 ? (
            <Empty text="받은 트레이드 제안이 없습니다" />
          ) : (
            <div className="space-y-4">
              {incoming.map((trade, i) => (
                <TradeItem
                  key={trade.id}
                  trade={trade}
                  cardMap={cardMap}
                  direction="incoming"
                  onAccept={(id) => actionMutation.mutate({ id, action: "accept" })}
                  onDecline={(id) => actionMutation.mutate({ id, action: "decline" })}
                  index={i}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="outgoing" className="mt-6">
          {isLoading ? <Spinner /> : outgoing.length === 0 ? (
            <Empty text="보낸 트레이드 제안이 없습니다" />
          ) : (
            <div className="space-y-4">
              {outgoing.map((trade, i) => (
                <TradeItem
                  key={trade.id}
                  trade={trade}
                  cardMap={cardMap}
                  direction="outgoing"
                  onCancel={(id) => actionMutation.mutate({ id, action: "cancel" })}
                  index={i}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateTradeModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => qc.invalidateQueries({ queryKey: ["trades"] })}
      />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-white/30">
      <span className="text-5xl mb-3">🤝</span>
      <p className="font-medium">{text}</p>
    </div>
  );
}
