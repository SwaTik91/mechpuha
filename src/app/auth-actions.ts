"use server";

import { redirect } from "next/navigation";
import { readSession, signSession } from "../auth/session";
import { DomainError } from "../domain/errors";
import type { FamilyId, PersonId, RelativeKind } from "../domain/types";
import { actions, SESSION_SECRET } from "./deps";
import { readSessionCookie, setSessionCookie } from "./session-cookie";

async function requireUserId(): Promise<string> {
  const token = await readSessionCookie();
  if (!token) redirect("/login");
  const userId = readSession(token, SESSION_SECRET);
  if (!userId) redirect("/login");
  return userId;
}

export async function registerAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  try {
    const userId = await actions.register(email, password);
    await setSessionCookie(signSession(userId, SESSION_SECRET));
  } catch (error) {
    if (error instanceof DomainError && error.code === "EMAIL_TAKEN") {
      const nextQuery = next ? `&next=${encodeURIComponent(next)}` : "";
      redirect(`/register?error=email_taken${nextQuery}`);
    }
    throw error;
  }

  if (next.startsWith("/") && !next.startsWith("//")) {
    redirect(next);
  }
  redirect("/");
}

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  try {
    const token = await actions.login(email, password);
    await setSessionCookie(token);
  } catch (error) {
    if (error instanceof DomainError && error.code === "INVALID_CREDENTIALS") {
      const nextQuery = next ? `&next=${encodeURIComponent(next)}` : "";
      redirect(`/login?error=1${nextQuery}`);
    }
    throw error;
  }

  if (next.startsWith("/") && !next.startsWith("//")) {
    redirect(next);
  }
  redirect("/");
}

export async function updatePersonCardAction(
  familyId: FamilyId,
  personId: PersonId,
  card: { name: string; clan: string; origin: string }
): Promise<{ error?: string }> {
  const userId = await requireUserId();

  try {
    await actions.updatePersonCardAction(userId, familyId, personId, card);
    return {};
  } catch (error) {
    if (error instanceof DomainError) {
      if (error.code === "NAME_REQUIRED") {
        return { error: "Укажите имя" };
      }
      if (error.code === "PERSON_NOT_FOUND") {
        return { error: "Человек не найден" };
      }
      if (error.code === "FORBIDDEN") {
        redirect("/");
      }
    }
    throw error;
  }
}

export async function addRelativeAction(
  familyId: FamilyId,
  fromId: PersonId,
  kind: RelativeKind,
  card: { name: string; clan: string; origin: string }
): Promise<{ error?: string }> {
  const userId = await requireUserId();

  try {
    await actions.addRelativeAction(userId, familyId, fromId, kind, card);
    return {};
  } catch (error) {
    if (error instanceof DomainError) {
      if (error.code === "NAME_REQUIRED") {
        return { error: "Укажите имя" };
      }
      if (error.code === "FATHER_EXISTS" || error.code === "MOTHER_EXISTS") {
        return { error: "Такой родитель уже есть" };
      }
      if (error.code === "SPOUSE_EXISTS") {
        return { error: "Супруг(а) уже добавлен(а)" };
      }
      if (error.code === "FORBIDDEN") {
        redirect("/");
      }
    }
    throw error;
  }
}

export async function issueKeyAction(
  familyId: FamilyId,
  kind: "helper" | "view" | "claim"
): Promise<{ url?: string; error?: string }> {
  const userId = await requireUserId();

  try {
    let token: string;
    if (kind === "helper") {
      token = await actions.issueHelperAction(userId, familyId);
    } else if (kind === "view") {
      token = await actions.issueViewAction(userId, familyId);
    } else {
      token = await actions.issueClaimAction(userId, familyId);
    }
    const path = kind === "view" ? `/poster/${token}` : `/invite/${token}`;
    return { url: path };
  } catch (error) {
    if (error instanceof DomainError) {
      if (error.code === "FORBIDDEN") {
        redirect("/");
      }
      if (error.code === "ALREADY_OWNED") {
        return { error: "Дом уже забран" };
      }
    }
    throw error;
  }
}

export async function acceptHelperAction(token: string): Promise<{ error?: string }> {
  const userId = await requireUserId();

  try {
    await actions.acceptHelperAction(userId, token);
    return {};
  } catch (error) {
    if (error instanceof DomainError && error.code === "KEY_INVALID") {
      return { error: "Приглашение недействительно" };
    }
    throw error;
  }
}

export async function respondClaimAction(
  token: string,
  answer: "yes" | "no"
): Promise<{ error?: string }> {
  const userId = await requireUserId();

  try {
    await actions.respondClaimAction(userId, token, answer);
    return {};
  } catch (error) {
    if (error instanceof DomainError) {
      if (error.code === "KEY_INVALID") {
        return { error: "Приглашение недействительно" };
      }
      if (error.code === "CARD_TAKEN") {
        return { error: "Карточка уже занята" };
      }
    }
    throw error;
  }
}

export async function createFamilyAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "");
  const clan = String(formData.get("clan") ?? "");
  const origin = String(formData.get("origin") ?? "");

  try {
    const familyId = await actions.createFamilyAction(userId, { name, clan, origin });
    redirect(`/family/${familyId}`);
  } catch (error) {
    if (error instanceof DomainError && error.code === "NAME_REQUIRED") {
      redirect("/create?error=name");
    }
    throw error;
  }
}
