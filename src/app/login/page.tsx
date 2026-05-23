"use client";

import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const isDev = process.env.NODE_ENV === "development";

export default function LoginPage() {
  const [devUsername, setDevUsername] = useState("trainer1");
  const [showDevLogin, setShowDevLogin] = useState(false);

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-8 p-10 bg-white border border-gray-200 rounded-3xl w-full max-w-sm shadow-lg"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex justify-center mb-4"
          >
            <div className="relative w-20 h-20">
              <Image
                src="/pokeball.png"
                alt="포켓볼"
                fill
                className="object-contain"
                sizes="80px"
              />
            </div>
          </motion.div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">
            카드깡
          </h1>
          <p className="text-gray-400 text-sm mt-2">포켓몬 TCG 카드 뽑기</p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <Button
            onClick={() => signIn("kakao", { callbackUrl: "/pack" })}
            className="w-full bg-yellow-300 hover:bg-yellow-200 text-zinc-900 font-bold py-6 rounded-xl gap-3"
          >
            <span className="text-xl">💬</span>
            카카오로 로그인
          </Button>

          {isDev && !showDevLogin && (
            <button
              onClick={() => setShowDevLogin(true)}
              className="text-xs text-gray-300 hover:text-gray-500 transition-colors text-center mt-1"
            >
              🛠 개발용 테스트 로그인
            </button>
          )}

          {isDev && showDevLogin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex flex-col gap-2 border border-gray-200 rounded-xl p-3"
            >
              <p className="text-xs text-yellow-600 font-bold">🛠 개발용 테스트 로그인</p>
              <input
                value={devUsername}
                onChange={(e) => setDevUsername(e.target.value)}
                placeholder="닉네임 (영문)"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-yellow-400/50"
              />
              <Button
                onClick={() =>
                  signIn("dev-credentials", {
                    username: devUsername,
                    callbackUrl: "/pack",
                  })
                }
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-lg"
              >
                테스트 로그인
              </Button>
            </motion.div>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center">
          로그인 시 회원가입 1,000 코인이 지급됩니다
        </p>
      </motion.div>
    </div>
  );
}
