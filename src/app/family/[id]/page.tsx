import { redirect } from "next/navigation";
import { readSession } from "../../../auth/session";
import { FamilyBook } from "../../../components/family-book";
import { DomainError } from "../../../domain/errors";
import { actions, SESSION_SECRET } from "../../deps";
import { addRelativeAction, issueKeyAction, updatePersonCardAction } from "../../auth-actions";
import { readSessionCookie } from "../../session-cookie";

export default async function FamilyPage({ params }: { params: Promise<{ id: string }> }) {
  const token = await readSessionCookie();
  if (!token) redirect("/login");
  const userId = readSession(token, SESSION_SECRET);
  if (!userId) redirect("/login");

  const { id } = await params;

  try {
    const doc = await actions.loadFamilyForUser(userId, id);
    return (
      <main className="shell shell--wide">
        <FamilyBook
          doc={doc}
          addRelative={addRelativeAction}
          updatePersonCard={updatePersonCardAction}
          issueKey={issueKeyAction}
        />
      </main>
    );
  } catch (error) {
    if (error instanceof DomainError && error.code === "FORBIDDEN") {
      return (
        <main className="shell">
          <h1>Нет доступа</h1>
        </main>
      );
    }
    throw error;
  }
}
