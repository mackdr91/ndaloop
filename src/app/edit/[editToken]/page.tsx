import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { EditItineraryClient, ItineraryData } from "./EditItineraryClient";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ editToken: string }>;
}): Promise<Metadata> {
  const { editToken } = await params;
  const itinerary = await db.itinerary.findUnique({
    where: { editToken },
    select: { title: true },
  });

  return {
    title: itinerary ? `Edit: ${itinerary.title} - ndaloop` : "Itinerary Editor",
  };
}

export default async function EditPage({
  params,
}: {
  params: Promise<{ editToken: string }>;
}) {
  const { editToken } = await params;

  const itinerary = await db.itinerary.findUnique({
    where: { editToken },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!itinerary) {
    notFound();
  }

  const initialData: ItineraryData = {
    id: itinerary.id,
    shareSlug: itinerary.shareSlug,
    editToken: itinerary.editToken,
    userId: itinerary.userId,
    title: itinerary.title,
    date: itinerary.date,
    notes: itinerary.notes,
    items: itinerary.items.map((item) => ({
      id: item.id,
      time: item.time,
      title: item.title,
      location: item.location,
      notes: item.notes,
      isCompleted: item.isCompleted,
      sortOrder: item.sortOrder,
    })),
  };

  return <EditItineraryClient initialData={initialData} />;
}
