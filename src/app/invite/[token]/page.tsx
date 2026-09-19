import { redirect } from "next/navigation";
import { readSession } from "../../../auth/session";
import { InviteAccept } from "../../../components/invite-accept";
import { DomainError } from "../../../domain/errors";
import { acceptHelperAction, respondClaimAction } from "../../auth-actions";
import { actions, hydrateStore, SESSION_SECRET } from "../../deps";
import { readSessionCookie } from "../../session-cookie";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  await hydrateStore();
  const { token } = await params;
  const nextPath = `/invite/${token}`;

  const sessionToken = await readSessionCookie();
  if (!sessionToken) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  const userId = readSession(sessionToken, SESSION_SECRET);
  if (!userId) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  try {
    const invite = await actions.loadInviteKey(token);
    if (invite.type === "view") {
      redirect(`/poster/${token}`);
    }

    return (
      <main className="shell invite">
        <h1>Приглашение</h1>
        <InviteAccept
          token={token}
          type={invite.type}
          person={invite.person}
          acceptHelper={acceptHelperAction}
          respondClaim={respondClaimAction}
        />
      </main>
    );
  } catch (error) {
    if (error instanceof DomainError && error.code === "KEY_INVALID") {
      return (
        <main className="shell invite">
          <h1>Приглашение недействительно</h1>
        </main>
      );
    }
    throw error;
  }
}
