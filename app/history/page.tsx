import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";

  const rows = await prisma.transaction.findMany({
    where: isAdmin ? {} : { userId: session.user.id },
    include: {
      user: { select: { name: true } },
      component: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {isAdmin ? "All activity" : "My activity"}
        </h1>
        <Link href="/components" className="underline">
          Back to components
        </Link>
      </header>

      <table className="w-full text-left text-sm">
        <thead className="border-b">
          <tr>
            <th className="p-2">When</th>
            {isAdmin && <th className="p-2">Who</th>}
            <th className="p-2">Component</th>
            <th className="p-2">Action</th>
            <th className="p-2">Qty</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="p-2">
                {r.createdAt.toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                })}
              </td>
              {isAdmin && <td className="p-2">{r.user.name}</td>}
              <td className="p-2">{r.component.name}</td>
              <td className="p-2">
                {r.type === "CHECKOUT" ? "Checked out" : "Returned"}
              </td>
              <td className="p-2">{r.qty}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-500">
                No activity yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}