import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ShopClient } from "@/components/shop/ShopClient";
import { ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">카드 판매</h1>
          <p className="text-gray-500 text-sm">보유한 카드를 코인으로 판매하세요</p>
        </div>
      </div>
      <ShopClient />
    </div>
  );
}
