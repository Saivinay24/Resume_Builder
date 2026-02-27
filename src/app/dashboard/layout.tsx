import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardNav } from "@/components/DashboardNav";

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin?callbackUrl=/dashboard");
  return (
    <div className="min-h-screen flex flex-col">
      <DashboardNav user={session.user} />
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
