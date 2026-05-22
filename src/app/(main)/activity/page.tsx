import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ActivityClient } from "@/components/activity/ActivityClient";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">활동</h1>
        <p className="text-white/50 mt-1">출석체크, 미션, 추천인 혜택을 확인하세요</p>
      </div>
      <ActivityClient />
    </div>
  );
}
