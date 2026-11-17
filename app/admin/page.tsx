import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/components");

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Admin dashboard</h1>
      <p>Only lab admins can see this page.</p>
    </main>
  );
}