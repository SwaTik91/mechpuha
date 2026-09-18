import Link from "next/link";
import { loginAction } from "../auth-actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <main className="shell">
      <h1>Вход</h1>
      {error && <p className="error">Неверная почта или пароль</p>}
      <form action={loginAction}>
        {next && <input type="hidden" name="next" value={next} />}
        <div className="field">
          <label htmlFor="email">Почта</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="field">
          <label htmlFor="password">Пароль</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        <button className="primary" type="submit">Войти</button>
      </form>
      <p className="link-row">
        <Link href="/register">Создать аккаунт</Link>
      </p>
    </main>
  );
}
