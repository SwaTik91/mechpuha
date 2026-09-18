import Link from "next/link";
import { registerAction } from "../auth-actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="shell">
      <h1>Регистрация</h1>
      {error === "email_taken" && <p className="error">Аккаунт уже есть. Войдите.</p>}
      <form action={registerAction}>
        <div className="field">
          <label htmlFor="email">Почта</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="field">
          <label htmlFor="password">Пароль</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required />
        </div>
        <button className="primary" type="submit">Создать аккаунт</button>
      </form>
      <p className="link-row">
        <Link href="/login">Уже есть вход</Link>
      </p>
    </main>
  );
}
