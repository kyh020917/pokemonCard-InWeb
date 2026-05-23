import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CollectionClient } from "@/components/collection/CollectionClient";

export const dynamic = "force-dynamic";

export default async function CollectionPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sets = await prisma.cardSet.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { releaseDate: "desc" },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">내 도감</h1>
        <p className="text-gray-500 mt-1">보유한 카드를 확인하고 세트 완성도를 체크해보세요</p>
      </div>
      <CollectionClient sets={sets} />
    </div>
  );
}
