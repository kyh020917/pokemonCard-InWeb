import { prisma } from "@/lib/prisma";
import { MarketClient } from "@/components/market/MarketClient";

export const dynamic = "force-dynamic";

export default async function MarketPage() {
  const sets = await prisma.cardSet.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { releaseDate: "desc" },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">거래소</h1>
        <p className="text-white/50 mt-1">카드를 코인으로 사고팔 수 있어요</p>
      </div>
      <MarketClient sets={sets} />
    </div>
  );
}
