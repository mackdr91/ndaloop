"use server";

import { db } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSession,
  clearSession,
  getCurrentUser,
} from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function signUpAction(data: {
  email: string;
  password: string;
  name?: string;
}) {
  const email = data.email.trim().toLowerCase();
  const password = data.password;
  const name = data.name?.trim() || null;

  if (!email || !email.includes("@")) {
    return { error: "Please provide a valid email address." };
  }

  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  try {
    const existing = await db.user.findUnique({
      where: { email },
    });

    if (existing) {
      return { error: "An account with this email already exists." };
    }

    const passwordHash = await hashPassword(password);
    const user = await db.user.create({
      data: {
        email,
        name,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    await createSession(user.id);

    revalidatePath("/", "layout");
    return { success: true, user };
  } catch (error) {
    console.error("Sign up failed:", error);
    return { error: "Failed to create account. Please try again." };
  }
}

export async function signInAction(data: {
  email: string;
  password: string;
}) {
  const email = data.email.trim().toLowerCase();
  const password = data.password;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { error: "Invalid email or password." };
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return { error: "Invalid email or password." };
    }

    await createSession(user.id);

    revalidatePath("/", "layout");
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  } catch (error) {
    console.error("Sign in failed:", error);
    return { error: "Failed to sign in. Please try again." };
  }
}

export async function signOutAction() {
  await clearSession();
  revalidatePath("/", "layout");
  return { success: true };
}

export async function getSessionUserAction() {
  return getCurrentUser();
}

export async function claimItineraryAction(editToken: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be signed in to save this itinerary to your account." };
  }

  try {
    const itinerary = await db.itinerary.findUnique({
      where: { editToken },
    });

    if (!itinerary) {
      return { error: "Itinerary not found." };
    }

    if (itinerary.userId && itinerary.userId !== user.id) {
      return { error: "This itinerary is already claimed by another user." };
    }

    await db.itinerary.update({
      where: { editToken },
      data: { userId: user.id },
    });

    revalidatePath(`/edit/${editToken}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to claim itinerary:", error);
    return { error: "Failed to link itinerary to account." };
  }
}
