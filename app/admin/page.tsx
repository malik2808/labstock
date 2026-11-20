import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/components");

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Admin dashboard</h1>
      <p>Only lab admins can see this page.</p>
      <ul className="list-disc space-y-1 pl-5">
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
        <li>
          <Link href="/components" className="underline">
            Back to components
          </Link>
        </li>
      </ul>
    </main>
  );
}