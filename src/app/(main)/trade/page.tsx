import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { TradeClient } from "@/components/trade/TradeClient";

export const dynamic = "force-dynamic";

export default async function TradePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">트레이드</h1>
        <p className="text-gray-500 mt-1">다른 유저와 카드를 교환해보세요</p>
      </div>
      <TradeClient />
    </div>
  );
}
