"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { Copy, Users, Check, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  myCode: string | null;
  hasUsedReferral: boolean;
}

export function ReferralCard({ myCode, hasUsedReferral }: Props) {
  const queryClient = useQueryClient();
  const [inputCode, setInputCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(myCode ?? "");
    setCopied(true);
    toast.success("추천인 코드가 복사되었습니다!");
    setTimeout(() => setCopied(false), 2000);
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (code: string) =>
      axios.post("/api/user/referral", { code }).then((r) => r.data),
    onSuccess: (data) => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["userCoins"] });
      queryClient.invalidateQueries({ queryKey: ["userMe"] });
      toast.success(`추천인 코드 적용! +${data.reward} 코인`);
    },
    onError: (err) => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.error ?? "오류가 발생했습니다.");
      }
    },
  });

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <Users className="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900">추천인</h2>
          <p className="text-xs text-gray-400">친구를 초대하거나 코드를 입력하세요</p>
        </div>
      </div>

      {/* 내 추천인 코드 */}
      <div className="space-y-2">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">내 추천인 코드</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono text-lg font-black text-yellow-600 tracking-widest text-center">
            {myCode}
          </div>
          <Button
            onClick={copyCode}
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 shrink-0"
          >
            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-500" />}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
          <div>
            <p className="text-gray-400">내가 받는 보상</p>
            <p className="text-yellow-600 font-bold">없음 (이미 가입됨)</p>
          </div>
          <div>
            <p className="text-gray-400">추천한 친구 보상</p>
            <p className="text-green-600 font-bold">+500 코인</p>
          </div>
        </div>
      </div>

      {/* 구분선 */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">추천인 코드 입력</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* 추천인 코드 입력 */}
      <AnimatePresence mode="wait">
        {hasUsedReferral || success ? (
          <motion.div
            key="used"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3"
          >
            <Check className="w-5 h-5 text-green-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-700">추천인 코드 적용 완료</p>
              <p className="text-xs text-gray-400">이미 추천인 혜택을 받으셨습니다.</p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="input" className="space-y-2">
            <div className="flex gap-2">
              <input
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="추천인 코드 입력"
                maxLength={8}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-purple-400 font-mono tracking-widest uppercase"
              />
              <Button
                onClick={() => inputCode.trim() && mutate(inputCode.trim())}
                disabled={!inputCode.trim() || isPending}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 rounded-xl shrink-0"
              >
                {isPending ? "..." : "적용"}
              </Button>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2">
              <Gift className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <span>추천인 코드 입력 시 <span className="text-purple-600 font-bold">+500 코인</span> 즉시 지급</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
