import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardClient, UserItinerary } from "./DashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Itineraries - ndaloop",
  description: "View and manage all your saved day itineraries.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  const rawItineraries = await db.itinerary.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      items: {
        select: {
          id: true,
          isCompleted: true,
        },
      },
    },
  });

  const itineraries: UserItinerary[] = rawItineraries.map((itin) => ({
    id: itin.id,
    title: itin.title,
    date: itin.date,
    shareSlug: itin.shareSlug,
    editToken: itin.editToken,
    updatedAt: itin.updatedAt.toISOString(),
    itemCount: itin.items.length,
    completedCount: itin.items.filter((i) => i.isCompleted).length,
  }));

  return <DashboardClient user={user} initialItineraries={itineraries} />;
}
