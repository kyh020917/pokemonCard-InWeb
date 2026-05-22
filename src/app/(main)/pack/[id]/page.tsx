import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PackOpenFlow } from "@/components/pack/PackOpenFlow";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PackOpenPage({ params }: Props) {
  const { id } = await params;

  const cardSet = await prisma.cardSet.findUnique({
    where: { id, isActive: true },
    include: { _count: { select: { cards: true } } },
  });

  if (!cardSet) notFound();

  return (
    <div>
      <Link
        href="/pack"
        className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        팩 목록으로
      </Link>

      <PackOpenFlow
        setId={cardSet.id}
        setName={cardSet.name}
        packPrice={cardSet.packPrice}
        logoUrl={cardSet.logoUrl}
      />
    </div>
  );
}
