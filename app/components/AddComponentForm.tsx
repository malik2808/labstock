"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddComponentForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reorderPoint, setReorderPoint] = useState("5");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/components", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category, quantity, reorderPoint }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }

    setName("");
    setCategory("");
    setQuantity("");
    setReorderPoint("5");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded border p-4">
      <h2 className="font-semibold">Add a component (admin)</h2>
      <div className="grid gap-3 sm:grid-cols-4">
        <input
          className="rounded border p-2"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="rounded border p-2"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />
        <input
          className="rounded border p-2"
          type="number"
          min="0"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
        <input
          className="rounded border p-2"
          type="number"
          min="0"
          placeholder="Reorder point"
          value={reorderPoint}
          onChange={(e) => setReorderPoint(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="rounded bg-black px-3 py-2 text-white">Add</button>
    </form>
  );
}