import { DomainError } from "../../../domain/errors";
import { PosterTree } from "../../../components/poster-tree";
import { actions } from "../../deps";

export default async function PosterPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  try {
    const { rootPersonId, graph } = await actions.loadPoster(token);
    const root = graph.persons.find((p) => p.id === rootPersonId);
    const title = root?.clan ?? `Семья ${root?.name ?? "—"}`;

    return (
      <main className="shell shell--wide poster">
        <h1>{title}</h1>
        <PosterTree graph={graph} rootId={rootPersonId} />
      </main>
    );
  } catch (error) {
    if (error instanceof DomainError && error.code === "KEY_INVALID") {
      return (
        <main className="shell poster">
          <h1>Ссылка больше не действует</h1>
          <p className="poster-message">Попросите семью прислать новую ссылку.</p>
        </main>
      );
    }
    throw error;
  }
}
