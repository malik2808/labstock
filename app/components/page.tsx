import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SignOutButton from "./SignOutButton";
import AddComponentForm from "./AddComponentForm";
import CheckoutControls from "./CheckoutControls";
import { isLowStock } from "@/lib/stock";

export default async function ComponentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { q = "", category = "" } = await searchParams;

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const components = await prisma.component.findMany({
    where: {
      ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
      ...(category ? { categoryId: category } : {}),
    },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  // How many of each component this user currently holds
  const grouped = await prisma.transaction.groupBy({
    by: ["componentId", "type"],
    where: { userId: session.user.id },
    _sum: { qty: true },
  });
  const held = new Map<string, number>();
  for (const g of grouped) {
    const sign = g.type === "CHECKOUT" ? 1 : -1;
    held.set(
      g.componentId,
      (held.get(g.componentId) ?? 0) + sign * (g._sum.qty ?? 0)
    );
  }

  const isAdmin = session.user.role === "ADMIN";
    const lowCount = isAdmin
    ? (
        await prisma.component.findMany({
          select: { quantity: true, reorderPoint: true },
        })
      ).filter((c) => isLowStock(c.quantity, c.reorderPoint)).length
    : 0;

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Components</h1>
          <p className="text-sm text-gray-600">
            Signed in as {session.user.email} ({session.user.role})
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/history" className="underline">
            {isAdmin ? "All activity" : "My activity"}
          </Link>
          {isAdmin && (
            <Link href="/admin" className="underline">
              Admin page
            </Link>
          )}
          <SignOutButton />
        </div>
      </header>

      {isAdmin && lowCount > 0 && (
        <div className="rounded border border-red-300 bg-red-100 p-3 text-red-800">
          {lowCount} component{lowCount === 1 ? "" : "s"} low on stock.{" "}
          <Link href="/admin" className="underline">
            See what to reorder
          </Link>
        </div>
      )}

      {isAdmin && <AddComponentForm />}

      <form method="get" className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name"
          className="rounded border p-2"
        />
        <select
          name="category"
          defaultValue={category}
          className="rounded border p-2"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button className="rounded bg-black px-3 py-2 text-white">Search</button>
        <Link href="/components" className="self-center underline">
          Clear
        </Link>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Category</th>
              <th className="p-2">In stock</th>
              <th className="p-2">Reorder point</th>
              <th className="p-2">Status</th>
              <th className="p-2">You hold</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {components.map((c) => {
              const mine = held.get(c.id) ?? 0;
              return (
                <tr key={c.id} className="border-b align-top">
                  <td className="p-2">
                    <Link href={`/components/${c.id}`} className="underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="p-2">{c.category.name}</td>
                  <td className="p-2">{c.quantity}</td>
                  <td className="p-2">{c.reorderPoint}</td>
                  <td className="p-2">
                    {c.quantity <= c.reorderPoint ? (
                      <span className="rounded bg-red-100 px-2 py-1 text-red-700">
                        Low stock
                      </span>
                    ) : (
                      <span className="text-green-700">OK</span>
                    )}
                  </td>
                  <td className="p-2">{mine}</td>
                  <td className="p-2">
                    <CheckoutControls componentId={c.id} held={mine} />
                  </td>
                </tr>
              );
            })}
            {components.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  No components found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}