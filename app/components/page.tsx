import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import SignOutButton from "./SignOutButton";

export default async function ComponentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Components</h1>
      <p>
        Signed in as {session.user.email} ({session.user.role})
      </p>
      {session.user.role === "ADMIN" && (
        <Link href="/admin" className="underline">
          Go to admin page
        </Link>
      )}
      <div>
        <SignOutButton />
      </div>
    </main>
  );
}