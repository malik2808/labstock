"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded bg-black px-3 py-2 text-white print:hidden"
    >
      Print
    </button>
  );
}