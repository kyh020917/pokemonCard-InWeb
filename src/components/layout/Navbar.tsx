"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Package,
  BookOpen,
  Store,
  ArrowLeftRight,
  Coins,
  LogOut,
  User,
  Menu,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/pack", label: "팩 뽑기", icon: Package },
  { href: "/collection", label: "도감", icon: BookOpen },
  { href: "/market", label: "거래소", icon: Store },
  { href: "/trade", label: "트레이드", icon: ArrowLeftRight },
  { href: "/activity", label: "활동", icon: Zap },
];

function CoinBadge({ coins }: { coins: number }) {
  return (
    <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-3 py-1">
      <Coins className="w-4 h-4 text-yellow-400" />
      <span className="text-sm font-bold text-yellow-300">
        {coins.toLocaleString()}
      </span>
    </div>
  );
}

export function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const { data: userData } = useQuery({
    queryKey: ["userCoins"],
    queryFn: () => axios.get("/api/user/me").then((r) => r.data),
    enabled: !!session,
    refetchInterval: 30000,
  });

  const coins = userData?.coins ?? session?.user?.coins ?? 0;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            카드깡
          </span>
        </Link>

        {/* 데스크탑 메뉴 */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <CoinBadge coins={coins} />
              <div className="hidden md:flex items-center gap-2">
                <Link href={`/profile/${session.user.username ?? session.user.id}`}>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    {session.user.username ?? session.user.name ?? "트레이너"}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-white/50 hover:text-white"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm" className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold">
                로그인
              </Button>
            </Link>
          )}

          {/* 모바일 햄버거 */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="md:hidden" render={
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            } />
            <SheetContent side="right" className="bg-zinc-900 border-white/10">
              <div className="flex flex-col gap-2 mt-6">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </Link>
                ))}
                {session && (
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 text-left text-red-400"
                  >
                    <LogOut className="w-5 h-5" />
                    로그아웃
                  </button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
