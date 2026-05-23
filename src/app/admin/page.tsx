import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SyncClient } from "@/components/admin/SyncClient";
import { Database } from "lucide-react";

export default async function AdminPage() {
  const session = await auth();
  const adminId = process.env.ADMIN_USER_ID;

  if (!session?.user || session.user.id !== adminId) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <Database className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">카드 세트 관리</h1>
            <p className="text-white/40 text-sm">포켓몬 TCG API에서 카드 데이터를 동기화합니다</p>
          </div>
        </div>
        <SyncClient />
      </div>
    </div>
  );
}
