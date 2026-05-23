import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileClient } from "@/components/profile/ProfileClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, image: true, createdAt: true },
  });

  if (!user) notFound();

  const displayUsername = user.username ?? username;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">{displayUsername}의 컬렉션</h1>
        <p className="text-white/50 mt-1">공개 카드 컬렉션</p>
      </div>
      <ProfileClient
        userId={user.id}
        username={displayUsername}
        image={user.image}
        createdAt={user.createdAt.toISOString()}
      />
    </div>
  );
}
