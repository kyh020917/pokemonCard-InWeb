import { prisma } from "@/lib/prisma";
import { PackCard } from "@/components/pack/PackCard";

export const dynamic = "force-dynamic";

export default async function PackPage() {
  const sets = await prisma.cardSet.findMany({
    where: { isActive: true },
    orderBy: { releaseDate: "desc" },
    include: { _count: { select: { cards: true } } },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">팩 뽑기</h1>
        <p className="text-gray-500 mt-1">원하는 팩을 선택해서 카드를 뽑아보세요</p>
      </div>

      {sets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-gray-400">
          <span className="text-6xl mb-4">📦</span>
          <p className="text-lg font-medium">등록된 팩이 없습니다</p>
          <p className="text-sm mt-1">관리자가 TCG 데이터를 동기화하면 여기에 표시됩니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sets.map((set, i) => (
            <PackCard
              key={set.id}
              id={set.id}
              name={set.name}
              series={set.series}
              logoUrl={set.logoUrl}
              packPrice={set.packPrice}
              cardCount={set._count.cards}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
