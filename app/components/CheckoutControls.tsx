"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutControls({
  componentId,
  held,
}: {
  componentId: string;
  held: number;
}) {
  const router = useRouter();
  const [qty, setQty] = useState("1");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(type: "CHECKOUT" | "RETURN") {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentId, type, qty }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-16 rounded border p-1"
        />
        <button
          disabled={busy}
          onClick={() => send("CHECKOUT")}
          className="rounded bg-black px-2 py-1 text-white disabled:opacity-50"
        >
          Check out
        </button>
        <button
          disabled={busy || held === 0}
          onClick={() => send("RETURN")}
          className="rounded border px-2 py-1 disabled:opacity-50"
        >
          Return
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}