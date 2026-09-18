import { layoutGenerations } from "../domain/layout";
import type { FamilyGraph, PersonId } from "../domain/types";

type PosterTreeProps = {
  graph: FamilyGraph;
  rootId: PersonId;
};

function PosterCard({ graph, id, root }: { graph: FamilyGraph; id: PersonId; root?: boolean }) {
  const person = graph.persons.find((p) => p.id === id);
  return (
    <div className={`poster-card${root ? " poster-card--root" : ""}`}>
      <span className="poster-card__name">{person?.name ?? "—"}</span>
      {person?.clan && <span className="poster-card__meta">{person.clan}</span>}
      {person?.origin && <span className="poster-card__meta">{person.origin}</span>}
    </div>
  );
}

function PosterRow({
  graph,
  ids,
  root,
}: {
  graph: FamilyGraph;
  ids: PersonId[];
  root?: boolean;
}) {
  return (
    <div className={`tree-row${root ? " tree-row--root" : ""}`}>
      {ids.map((id) => (
        <PosterCard key={id} graph={graph} id={id} root={root} />
      ))}
    </div>
  );
}

export function PosterTree({ graph, rootId }: PosterTreeProps) {
  const { ancestors, rootLevel, descendants } = layoutGenerations(graph, rootId);

  return (
    <div className="generation-tree poster-tree">
      {ancestors.map((level, i) => (
        <div key={`a-${i}`} className="poster-level">
          <PosterRow graph={graph} ids={level} />
          <div className="poster-connector" aria-hidden="true" />
        </div>
      ))}
      <PosterRow graph={graph} ids={rootLevel} root />
      {descendants.map((level, i) => (
        <div key={`d-${i}`} className="poster-level">
          <div className="poster-connector" aria-hidden="true" />
          <PosterRow graph={graph} ids={level} />
        </div>
      ))}
    </div>
  );
}
