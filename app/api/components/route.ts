import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const categoryName = String(body.category ?? "").trim();
  const quantity = Number(body.quantity);
  const reorderPoint = Number(body.reorderPoint ?? 5);

  if (
    !name ||
    !categoryName ||
    !Number.isInteger(quantity) ||
    quantity < 0 ||
    !Number.isInteger(reorderPoint) ||
    reorderPoint < 0
  ) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const component = await prisma.component.create({
    data: {
      name,
      quantity,
      reorderPoint,
      category: {
        connectOrCreate: {
          where: { name: categoryName },
          create: { name: categoryName },
        },
      },
    },
  });

  return NextResponse.json(component, { status: 201 });
}