import { redirect } from "next/navigation";
import { readSession } from "../../auth/session";
import { createFamilyAction } from "../auth-actions";
import { SESSION_SECRET } from "../deps";
import { readSessionCookie } from "../session-cookie";

export default async function CreateFamilyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const token = await readSessionCookie();
  if (!token) redirect("/login");
  const userId = readSession(token, SESSION_SECRET);
  if (!userId) redirect("/login");

  const { error } = await searchParams;

  return (
    <main className="shell">
      <h1>Создать семью</h1>
      {error === "name" && <p className="error">Укажите имя старшего</p>}
      <form action={createFamilyAction}>
        <div className="field">
          <label htmlFor="name">Имя</label>
          <input id="name" name="name" type="text" autoComplete="name" required />
        </div>
        <div className="field">
          <label htmlFor="surname">Фамилия</label>
          <input id="surname" name="surname" type="text" />
        </div>
        <div className="field">
          <label htmlFor="birthPlace">Место рождения</label>
          <input id="birthPlace" name="birthPlace" type="text" />
        </div>
        <button className="primary" type="submit">Открыть книгу</button>
      </form>
    </main>
  );
}
