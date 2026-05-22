import { Navbar } from "@/components/layout/Navbar";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
