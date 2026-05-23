import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ShopClient } from "@/components/shop/ShopClient";
import { ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { coins: true },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">카드 상점</h1>
          <p className="text-white/40 text-sm">코인으로 원하는 등급의 카드를 구매하세요</p>
        </div>
      </div>
      <ShopClient userCoins={user?.coins ?? 0} />
    </div>
  );
}
