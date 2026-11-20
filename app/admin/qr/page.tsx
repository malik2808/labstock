import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PrintButton from "./PrintButton";

export default async function QrSheetPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/components");

  const baseUrl = (
    process.env.APP_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");

  const components = await prisma.component.findMany({
    include: { category: true },
    orderBy: { name: "asc" },
  });

  const items = await Promise.all(
    components.map(async (c) => ({
      id: c.id,
      name: c.name,
      category: c.category.name,
      url: `${baseUrl}/components/${c.id}`,
      qr: await QRCode.toDataURL(`${baseUrl}/components/${c.id}`, {
        width: 240,
        margin: 1,
      }),
    }))
  );

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-6">
      <header className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-semibold">QR labels</h1>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="underline">
            Back to admin
          </Link>
          <PrintButton />
        </div>
      </header>

      <p className="text-sm text-gray-600 print:hidden">
        These codes point to {baseUrl}. Print the real labels only after the
        app is deployed and APP_URL is set to your website address.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {items.map((i) => (
          <div
            key={i.id}
            className="break-inside-avoid rounded border p-3 text-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={i.qr} alt={`QR code for ${i.name}`} className="mx-auto" />
            <p className="mt-2 font-semibold">{i.name}</p>
            <p className="text-sm text-gray-600">{i.category}</p>
          </div>
        ))}
        {items.length === 0 && <p>No components yet.</p>}
      </div>
    </main>
  );
}