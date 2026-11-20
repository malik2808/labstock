import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CheckoutControls from "../CheckoutControls";

export default async function ComponentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/components/${id}`)}`);
  }

  const component = await prisma.component.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!component) notFound();

  const grouped = await prisma.transaction.groupBy({
    by: ["type"],
    where: { userId: session.user.id, componentId: id },
    _sum: { qty: true },
  });
  let held = 0;
  for (const g of grouped) {
    held += (g.type === "CHECKOUT" ? 1 : -1) * (g._sum.qty ?? 0);
  }

  const low = component.quantity <= component.reorderPoint;

  return (
    <main className="mx-auto max-w-md space-y-4 p-6">
      <Link href="/components" className="text-sm underline">
        Back to all components
      </Link>
      <h1 className="text-2xl font-semibold">{component.name}</h1>
      <p className="text-gray-600">{component.category.name}</p>

      <div className="space-y-1 rounded border p-4">
        <p>
          In stock: <strong>{component.quantity}</strong>{" "}
          {low && (
            <span className="ml-2 rounded bg-red-100 px-2 py-1 text-sm text-red-700">
              Low stock
            </span>
          )}
        </p>
        <p>
          You hold: <strong>{held}</strong>
        </p>
      </div>

      <CheckoutControls componentId={component.id} held={held} />
    </main>
  );
}