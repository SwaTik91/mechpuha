import Link from "next/link";
import { redirect } from "next/navigation";
import { readSession } from "../auth/session";
import { repos, SESSION_SECRET } from "./deps";
import { readSessionCookie } from "./session-cookie";

export default async function HomePage() {
  const token = await readSessionCookie();
  if (!token) redirect("/login");

  const userId = readSession(token, SESSION_SECRET);
  if (!userId) redirect("/login");

  const families = repos.listFamiliesForUser(userId);
  if (families.length === 0) redirect("/create");
  if (families.length === 1) redirect(`/family/${families[0].id}`);

  return (
    <main className="shell">
      <h1>Ваши семьи</h1>
      <ul className="family-list">
        {families.map((family) => (
          <li key={family.id}>
            <Link href={`/family/${family.id}`}>{family.rootName}</Link>
          </li>
        ))}
      </ul>
      <p className="link-row">
        <Link href="/create">Создать семью</Link>
      </p>
    </main>
  );
}
