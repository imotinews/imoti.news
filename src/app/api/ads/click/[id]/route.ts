import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ad = await prisma.adBanner.findUnique({ where: { id } });

  if (!ad?.targetUrl) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  await prisma.adBanner.update({
    where: { id },
    data: { clicks: { increment: 1 } },
  });

  return NextResponse.redirect(ad.targetUrl);
}
