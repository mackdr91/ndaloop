"use server";

import { db } from "@/lib/db";
import { generateEditToken, generateShareSlug } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function createItineraryAction(data: {
  title: string;
  date?: string;
  notes?: string;
  initialItems?: Array<{
    time?: string;
    title: string;
    location?: string;
    notes?: string;
  }>;
}) {
  const title = data.title.trim();
  if (!title) {
    return { error: "Title is required" };
  }

  const shareSlug = generateShareSlug();
  const editToken = generateEditToken();

  try {
    const itinerary = await db.itinerary.create({
      data: {
        title,
        date: data.date?.trim() || null,
        notes: data.notes?.trim() || null,
        shareSlug,
        editToken,
        items: data.initialItems && data.initialItems.length > 0
          ? {
              create: data.initialItems
                .filter((item) => item.title && item.title.trim().length > 0)
                .map((item, index) => ({
                  time: item.time?.trim() || null,
                  title: item.title.trim(),
                  location: item.location?.trim() || null,
                  notes: item.notes?.trim() || null,
                  sortOrder: index,
                  isCompleted: false,
                })),
            }
          : undefined,
      },
      include: {
        items: true,
      },
    });

    return {
      success: true,
      shareSlug: itinerary.shareSlug,
      editToken: itinerary.editToken,
      id: itinerary.id,
    };
  } catch (error) {
    console.error("Failed to create itinerary:", error);
    return { error: "Failed to create itinerary. Please try again." };
  }
}

export async function updateItineraryDetailsAction(
  editToken: string,
  data: {
    title: string;
    date?: string;
    notes?: string;
  }
) {
  const title = data.title.trim();
  if (!title) {
    return { error: "Title is required" };
  }

  try {
    const itinerary = await db.itinerary.findUnique({
      where: { editToken },
    });

    if (!itinerary) {
      return { error: "Itinerary not found or invalid token." };
    }

    const updated = await db.itinerary.update({
      where: { editToken },
      data: {
        title,
        date: data.date?.trim() || null,
        notes: data.notes?.trim() || null,
      },
    });

    revalidatePath(`/edit/${editToken}`);
    revalidatePath(`/i/${itinerary.shareSlug}`);
    return { success: true, itinerary: updated };
  } catch (error) {
    console.error("Failed to update itinerary:", error);
    return { error: "Failed to update itinerary details." };
  }
}

export async function addItemAction(
  editToken: string,
  itemData: {
    time?: string;
    title: string;
    location?: string;
    notes?: string;
  }
) {
  const title = itemData.title.trim();
  if (!title) {
    return { error: "Item title is required." };
  }

  try {
    const itinerary = await db.itinerary.findUnique({
      where: { editToken },
      include: {
        items: {
          orderBy: { sortOrder: "desc" },
          take: 1,
        },
      },
    });

    if (!itinerary) {
      return { error: "Itinerary not found." };
    }

    const highestSort = itinerary.items[0]?.sortOrder ?? -1;

    const newItem = await db.itineraryItem.create({
      data: {
        itineraryId: itinerary.id,
        title,
        time: itemData.time?.trim() || null,
        location: itemData.location?.trim() || null,
        notes: itemData.notes?.trim() || null,
        sortOrder: highestSort + 1,
        isCompleted: false,
      },
    });

    revalidatePath(`/edit/${editToken}`);
    revalidatePath(`/i/${itinerary.shareSlug}`);
    return { success: true, item: newItem };
  } catch (error) {
    console.error("Failed to add item:", error);
    return { error: "Failed to add activity item." };
  }
}

export async function updateItemAction(
  editToken: string,
  itemId: string,
  itemData: {
    title?: string;
    time?: string;
    location?: string;
    notes?: string;
    isCompleted?: boolean;
  }
) {
  try {
    const itinerary = await db.itinerary.findUnique({
      where: { editToken },
    });

    if (!itinerary) {
      return { error: "Unauthorized or invalid itinerary." };
    }

    const updatedItem = await db.itineraryItem.update({
      where: {
        id: itemId,
        itineraryId: itinerary.id,
      },
      data: {
        ...(itemData.title !== undefined ? { title: itemData.title.trim() } : {}),
        ...(itemData.time !== undefined ? { time: itemData.time?.trim() || null } : {}),
        ...(itemData.location !== undefined ? { location: itemData.location?.trim() || null } : {}),
        ...(itemData.notes !== undefined ? { notes: itemData.notes?.trim() || null } : {}),
        ...(itemData.isCompleted !== undefined ? { isCompleted: itemData.isCompleted } : {}),
      },
    });

    revalidatePath(`/edit/${editToken}`);
    revalidatePath(`/i/${itinerary.shareSlug}`);
    return { success: true, item: updatedItem };
  } catch (error) {
    console.error("Failed to update item:", error);
    return { error: "Failed to update item." };
  }
}

export async function deleteItemAction(editToken: string, itemId: string) {
  try {
    const itinerary = await db.itinerary.findUnique({
      where: { editToken },
    });

    if (!itinerary) {
      return { error: "Unauthorized or invalid itinerary." };
    }

    await db.itineraryItem.delete({
      where: {
        id: itemId,
        itineraryId: itinerary.id,
      },
    });

    revalidatePath(`/edit/${editToken}`);
    revalidatePath(`/i/${itinerary.shareSlug}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete item:", error);
    return { error: "Failed to delete item." };
  }
}

export async function reorderItemsAction(editToken: string, orderedItemIds: string[]) {
  try {
    const itinerary = await db.itinerary.findUnique({
      where: { editToken },
    });

    if (!itinerary) {
      return { error: "Unauthorized or invalid itinerary." };
    }

    await db.$transaction(
      orderedItemIds.map((id, index) =>
        db.itineraryItem.update({
          where: { id, itineraryId: itinerary.id },
          data: { sortOrder: index },
        })
      )
    );

    revalidatePath(`/edit/${editToken}`);
    revalidatePath(`/i/${itinerary.shareSlug}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to reorder items:", error);
    return { error: "Failed to reorder items." };
  }
}

// Global toggle for completion status accessible by viewers and creator
export async function toggleItemCompletedAction(itemId: string, isCompleted: boolean) {
  try {
    const item = await db.itineraryItem.findUnique({
      where: { id: itemId },
      include: { itinerary: true },
    });

    if (!item) {
      return { error: "Item not found." };
    }

    const updated = await db.itineraryItem.update({
      where: { id: itemId },
      data: { isCompleted },
    });

    revalidatePath(`/i/${item.itinerary.shareSlug}`);
    revalidatePath(`/edit/${item.itinerary.editToken}`);
    return { success: true, isCompleted: updated.isCompleted };
  } catch (error) {
    console.error("Failed to toggle completion status:", error);
    return { error: "Failed to update status." };
  }
}
