import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  const session = await auth();
  const adminId = process.env.ADMIN_USER_ID;
  if (!session?.user || session.user.id !== adminId) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
  }

  const { setId } = await params;
  const { packPrice, isActive } = await req.json();

  const data: { packPrice?: number; isActive?: boolean } = {};
  if (packPrice !== undefined) {
    if (typeof packPrice !== "number" || packPrice < 0) {
      return NextResponse.json({ error: "유효하지 않은 가격입니다." }, { status: 400 });
    }
    data.packPrice = packPrice;
  }
  if (isActive !== undefined) data.isActive = isActive;

  const updated = await prisma.cardSet.update({
    where: { id: setId },
    data,
    select: { id: true, packPrice: true, isActive: true },
  });

  return NextResponse.json(updated);
}
