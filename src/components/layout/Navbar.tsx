"use client";

import Link from "next/link";
import Image from "next/image";
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
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/pack", label: "팩 뽑기", icon: Package },
  { href: "/shop", label: "상점", icon: ShoppingBag },
  { href: "/collection", label: "도감", icon: BookOpen },
  { href: "/market", label: "거래소", icon: Store },
  { href: "/trade", label: "트레이드", icon: ArrowLeftRight },
  { href: "/activity", label: "활동", icon: Zap },
];

function CoinBadge({ coins }: { coins: number }) {
  return (
    <div className="flex items-center gap-1.5 bg-yellow-400/20 border border-yellow-400/40 rounded-full px-3 py-1">
      <Coins className="w-4 h-4 text-yellow-500" />
      <span className="text-sm font-bold text-yellow-600">
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
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-9 h-9">
            <Image
              src="/pokeball.png"
              alt="포켓볼 로고"
              fill
              className="object-contain"
              sizes="36px"
            />
          </div>
          <span className="text-xl font-black tracking-tight bg-gradient-to-r from-red-500 to-orange-400 bg-clip-text text-transparent">
            카드깡
          </span>
        </Link>

        {/* 데스크탑 메뉴 */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors font-medium"
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
                  <Button variant="ghost" size="sm" className="gap-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100">
                    <User className="w-4 h-4" />
                    {session.user.username ?? session.user.name ?? "트레이너"}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white font-bold">
                로그인
              </Button>
            </Link>
          )}

          {/* 모바일 햄버거 */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="md:hidden" render={
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                <Menu className="w-5 h-5" />
              </Button>
            } />
            <SheetContent side="right" className="bg-white border-gray-200">
              <div className="flex flex-col gap-2 mt-6">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 font-medium"
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </Link>
                ))}
                {session && (
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left text-red-500"
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
