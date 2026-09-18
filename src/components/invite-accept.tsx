"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Person } from "../domain/types";

type InviteAcceptProps = {
  token: string;
  type: "helper" | "claim";
  person: Person | null;
  acceptHelper: (token: string) => Promise<{ error?: string }>;
  respondClaim: (token: string, answer: "yes" | "no") => Promise<{ error?: string }>;
};

export function InviteAccept({ token, type, person, acceptHelper, respondClaim }: InviteAcceptProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleHelper() {
    setError(null);
    startTransition(async () => {
      const result = await acceptHelper(token);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  function handleClaim(answer: "yes" | "no") {
    setError(null);
    startTransition(async () => {
      const result = await respondClaim(token, answer);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  if (type === "helper") {
    return (
      <div className="invite-accept">
        {error && <p className="error">{error}</p>}
        <button className="primary" type="button" onClick={handleHelper} disabled={pending}>
          Войти в эту книгу
        </button>
      </div>
    );
  }

  return (
    <div className="invite-accept">
      <div className="invite-card">
        <span className="invite-card__name">{person?.name ?? "—"}</span>
        {person?.clan && <span className="invite-card__meta">{person.clan}</span>}
        {person?.origin && <span className="invite-card__meta">{person.origin}</span>}
      </div>
      <p className="invite-question">Это вы?</p>
      {error && <p className="error">{error}</p>}
      <div className="invite-actions">
        <button className="primary" type="button" onClick={() => handleClaim("yes")} disabled={pending}>
          Да
        </button>
        <button className="text-action" type="button" onClick={() => handleClaim("no")} disabled={pending}>
          Нет
        </button>
      </div>
    </div>
  );
}
