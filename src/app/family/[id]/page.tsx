import { redirect } from "next/navigation";
import { readSession } from "../../../auth/session";
import { FamilyBook } from "../../../components/family-book";
import { actions, SESSION_SECRET } from "../../deps";
import { addRelativeAction } from "../../auth-actions";
import { readSessionCookie } from "../../session-cookie";

export default async function FamilyPage({ params }: { params: Promise<{ id: string }> }) {
  const token = await readSessionCookie();
  if (!token) redirect("/login");
  const userId = readSession(token, SESSION_SECRET);
  if (!userId) redirect("/login");

  const { id } = await params;

  let doc;
  try {
    doc = await actions.loadFamilyForUser(userId, id);
  } catch {
    redirect("/");
  }

  return (
    <main className="shell shell--wide">
      <FamilyBook doc={doc} addRelative={addRelativeAction} />
    </main>
  );
}
