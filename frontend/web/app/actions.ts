"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  createApplication,
  createReminder,
  createTask,
  deleteApplication,
  deleteReminder,
  deleteTask,
  signIn,
  signUp,
  updateApplication,
  updateSettings,
  updateTask,
} from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/session";

async function setSessionCookie(payload: { token: string; user: { id: string; email: string; name: string } }) {
  const store = await cookies();
  store.set(
    SESSION_COOKIE,
    JSON.stringify({
      token: payload.token,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    },
  );
}

function requireValue(formData: FormData, key: string) {
  const value = formData.get(key)?.toString().trim();
  if (!value) {
    throw new Error(`${key} is required.`);
  }
  return value;
}

export async function signInAction(formData: FormData) {
  const email = requireValue(formData, "email");
  const password = requireValue(formData, "password");
  const payload = await signIn(email, password);
  await setSessionCookie(payload);
  redirect("/");
}

export async function signUpAction(formData: FormData) {
  const name = requireValue(formData, "name");
  const email = requireValue(formData, "email");
  const password = requireValue(formData, "password");
  const payload = await signUp(email, password, name);
  await setSessionCookie(payload);
  redirect("/");
}

export async function signOutAction() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  redirect("/");
}

export async function createApplicationAction(formData: FormData) {
  await createApplication({
    company: requireValue(formData, "company"),
    title: requireValue(formData, "title"),
    status: formData.get("status")?.toString() || "saved",
    location: formData.get("location")?.toString() || undefined,
    notes: formData
      .get("notes")
      ?.toString()
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean),
  });
  revalidatePath("/");
  revalidatePath("/applications");
}

export async function updateApplicationStageAction(formData: FormData) {
  await updateApplication(requireValue(formData, "application_id"), {
    status: requireValue(formData, "status"),
  });
  revalidatePath("/");
  revalidatePath("/applications");
}

export async function updateApplicationDetailsAction(formData: FormData) {
  await updateApplication(requireValue(formData, "application_id"), {
    status: requireValue(formData, "status"),
    location: formData.get("location")?.toString() || null,
    notes: formData
      .get("notes")
      ?.toString()
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean) ?? [],
  });
  revalidatePath("/");
  revalidatePath("/applications");
}

export async function deleteApplicationAction(formData: FormData) {
  await deleteApplication(requireValue(formData, "application_id"));
  revalidatePath("/");
  revalidatePath("/applications");
}

export async function createTaskAction(formData: FormData) {
  await createTask({
    title: requireValue(formData, "title"),
    application_id: formData.get("application_id")?.toString() || undefined,
    due_at: formData.get("due_at")?.toString() || undefined,
  });
  revalidatePath("/");
  revalidatePath("/tasks");
}

export async function toggleTaskAction(formData: FormData) {
  await updateTask(requireValue(formData, "task_id"), {
    completed: formData.get("completed")?.toString() === "true",
  });
  revalidatePath("/");
  revalidatePath("/tasks");
}

export async function deleteTaskAction(formData: FormData) {
  await deleteTask(requireValue(formData, "task_id"));
  revalidatePath("/");
  revalidatePath("/tasks");
}

export async function createReminderAction(formData: FormData) {
  await createReminder({
    title: requireValue(formData, "title"),
    application_id: formData.get("application_id")?.toString() || undefined,
    task_id: formData.get("task_id")?.toString() || undefined,
    scheduled_for: requireValue(formData, "scheduled_for"),
    channel: formData.get("channel")?.toString() || "push",
  });
  revalidatePath("/");
  revalidatePath("/tasks");
}

export async function deleteReminderAction(formData: FormData) {
  await deleteReminder(requireValue(formData, "reminder_id"));
  revalidatePath("/");
  revalidatePath("/tasks");
}

export async function updateSettingsAction(formData: FormData) {
  await updateSettings({
    timezone: requireValue(formData, "timezone"),
    theme: requireValue(formData, "theme"),
    weekly_summary: formData.get("weekly_summary")?.toString() === "on",
  });
  revalidatePath("/");
  revalidatePath("/settings");
}
