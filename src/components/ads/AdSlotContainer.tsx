import { prisma } from "@/lib/prisma";
import AdSlot, { type AdPosition } from "./AdSlot";

export default async function AdSlotContainer({ position }: { position: AdPosition }) {
  const now = new Date();

  const ad = await prisma.adBanner.findFirst({
    where: {
      position,
      active: true,
      OR: [{ startDate: null }, { startDate: { lte: now } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
    },
    orderBy: { id: "asc" },
  });

  return <AdSlot position={position} ad={ad} />;
}
