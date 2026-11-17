import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SignOutButton from "./SignOutButton";
import AddComponentForm from "./AddComponentForm";

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

  const isAdmin = session.user.role === "ADMIN";

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Components</h1>
          <p className="text-sm text-gray-600">
            Signed in as {session.user.email} ({session.user.role})
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Link href="/admin" className="underline">
              Admin page
            </Link>
          )}
          <SignOutButton />
        </div>
      </header>

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
              <th className="p-2">Quantity</th>
              <th className="p-2">Reorder point</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {components.map((c) => (
              <tr key={c.id} className="border-b">
                <td className="p-2">{c.name}</td>
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
              </tr>
            ))}
            {components.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
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