"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import { useState } from "react";

interface PackCardProps {
  id: string;
  name: string;
  series: string;
  logoUrl: string | null;
  packPrice: number;
  cardCount: number;
  index: number;
}

export function PackCard({
  id,
  name,
  series,
  logoUrl,
  packPrice,
  cardCount,
  index,
}: PackCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
    >
      <Link href={`/pack/${id}`}>
        <motion.div
          whileHover={{ y: -6, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group bg-zinc-800 border border-zinc-700 rounded-2xl p-5 flex flex-col items-center gap-4 hover:border-yellow-500/50 hover:bg-zinc-700 transition-colors cursor-pointer shadow-md hover:shadow-xl"
        >
          <div className="relative w-full h-28">
            {logoUrl && !imgError ? (
              <Image
                src={logoUrl}
                alt={name}
                fill
                className="object-contain drop-shadow-lg group-hover:drop-shadow-2xl transition-all"
                sizes="200px"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                <span className="text-4xl">🎴</span>
                <span className="text-xs text-white/30 font-medium">{name}</span>
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-xs text-yellow-400/70 font-medium">{series}</p>
            <h3 className="font-bold text-white text-sm mt-0.5 leading-tight">{name}</h3>
            <p className="text-xs text-white/30 mt-1">{cardCount}종 카드</p>
          </div>

          <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-3 py-1.5">
            <Coins className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs font-bold text-yellow-300">
              {packPrice.toLocaleString()}
            </span>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
