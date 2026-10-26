import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { PublicItineraryClient, PublicItineraryData } from "./PublicItineraryClient";
import type { Metadata } from "next";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareSlug: string }>;
}): Promise<Metadata> {
  const { shareSlug } = await params;
  const itinerary = await db.itinerary.findUnique({
    where: { shareSlug },
    include: { items: true },
  });

  if (!itinerary) {
    return {
      title: "Itinerary Not Found - ndaloop",
    };
  }

  const dateFormatted = formatDate(itinerary.date);
  const description = `${itinerary.items.length} stop${
    itinerary.items.length === 1 ? "" : "s"
  } planned${dateFormatted ? ` for ${dateFormatted}` : ""}. View the day schedule on ndaloop.`;

  return {
    title: `${itinerary.title} - Day Itinerary`,
    description,
    openGraph: {
      title: `${itinerary.title} - Day Itinerary`,
      description,
      type: "website",
    },
  };
}

export default async function PublicPage({
  params,
}: {
  params: Promise<{ shareSlug: string }>;
}) {
  const { shareSlug } = await params;

  const itinerary = await db.itinerary.findUnique({
    where: { shareSlug },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!itinerary) {
    notFound();
  }

  const initialData: PublicItineraryData = {
    id: itinerary.id,
    shareSlug: itinerary.shareSlug,
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

  return <PublicItineraryClient itinerary={initialData} />;
}
