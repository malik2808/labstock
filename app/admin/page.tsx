import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isLowStock, suggestedReorder } from "@/lib/stock";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/components");

  const all = await prisma.component.findMany({
    include: { category: true },
    orderBy: { name: "asc" },
  });

  // Fewest remaining relative to the reorder point first
  const low = all
    .filter((c) => isLowStock(c.quantity, c.reorderPoint))
    .sort(
      (a, b) => a.quantity - a.reorderPoint - (b.quantity - b.reorderPoint)
    );

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
        <Link href="/components" className="underline">
          Back to components
        </Link>
      </header>

      <ul className="flex flex-wrap gap-6">
        <li>
          <Link href="/admin/qr" className="underline">
            Print QR labels
          </Link>
        </li>
        <li>
          <Link href="/history" className="underline">
            All activity
          </Link>
        </li>
      </ul>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Low stock ({low.length} of {all.length} components)
        </h2>

        {low.length === 0 ? (
          <p className="rounded border p-4 text-green-700">
            Everything is above its reorder point.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b">
                <tr>
                  <th className="p-2">Component</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">In stock</th>
                  <th className="p-2">Reorder point</th>
                  <th className="p-2">Suggested order</th>
                </tr>
              </thead>
              <tbody>
                {low.map((c) => (
                  <tr key={c.id} className="border-b">
                    <td className="p-2">
                      <Link href={`/components/${c.id}`} className="underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="p-2">{c.category.name}</td>
                    <td className="p-2">
                      <span
                        className={
                          c.quantity === 0
                            ? "rounded bg-red-600 px-2 py-1 text-white"
                            : "rounded bg-red-100 px-2 py-1 text-red-700"
                        }
                      >
                        {c.quantity === 0 ? "Out of stock" : c.quantity}
                      </span>
                    </td>
                    <td className="p-2">{c.reorderPoint}</td>
                    <td className="p-2">
                      {suggestedReorder(c.quantity, c.reorderPoint)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}