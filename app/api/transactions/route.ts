import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

class StockError extends Error {}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const body = await req.json();
  const componentId = String(body.componentId ?? "");
  const type = body.type;
  const qty = Number(body.qty);

  if (
    !componentId ||
    (type !== "CHECKOUT" && type !== "RETURN") ||
    !Number.isInteger(qty) ||
    qty < 1 ||
    qty > 1000
  ) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const entry = await prisma.$transaction(
      async (tx) => {
        if (type === "CHECKOUT") {
          // Lower stock only if enough is left (check + change in one command)
          const updated = await tx.component.updateMany({
            where: { id: componentId, quantity: { gte: qty } },
            data: { quantity: { decrement: qty } },
          });
          if (updated.count === 0) {
            const exists = await tx.component.findUnique({
              where: { id: componentId },
              select: { id: true },
            });
            throw new StockError(
              exists ? "Not enough stock" : "Component not found"
            );
          }
        } else {
          // Return: only what this user still has checked out
          const out = await tx.transaction.aggregate({
            where: { userId: session.user.id, componentId, type: "CHECKOUT" },
            _sum: { qty: true },
          });
          const back = await tx.transaction.aggregate({
            where: { userId: session.user.id, componentId, type: "RETURN" },
            _sum: { qty: true },
          });
          const outstanding = (out._sum.qty ?? 0) - (back._sum.qty ?? 0);
          if (qty > outstanding) {
            throw new StockError(`You only have ${outstanding} checked out`);
          }
          await tx.component.update({
            where: { id: componentId },
            data: { quantity: { increment: qty } },
          });
        }

        // The log entry is saved in the same transaction
        return tx.transaction.create({
          data: { userId: session.user.id, componentId, type, qty },
        });
      },
      { maxWait: 10000, timeout: 15000 }
    );

    return NextResponse.json(entry, { status: 201 });
  } catch (e) {
    if (e instanceof StockError) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}