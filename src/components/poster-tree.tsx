import { layoutGenerations } from "../domain/layout";
import { personDisplayName } from "../domain/person";
import { coupleRowGroups } from "../domain/tree-links";
import type { FamilyGraph, PersonId } from "../domain/types";
import { TreeCanvas } from "./tree-canvas";

type PosterTreeProps = {
  graph: FamilyGraph;
  rootId: PersonId;
};

function PosterCard({ graph, id, root }: { graph: FamilyGraph; id: PersonId; root?: boolean }) {
  const person = graph.persons.find((p) => p.id === id);
  return (
    <div className={`poster-card${root ? " poster-card--root" : ""}`} data-person-id={id}>
      <span className="poster-card__name">{person ? personDisplayName(person) : "—"}</span>
      {person?.birthPlace && <span className="poster-card__meta">{person.birthPlace}</span>}
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
      {coupleRowGroups(graph, ids).map((group) => {
        const cards = group.map((id) => (
          <PosterCard key={id} graph={graph} id={id} root={root} />
        ));
        if (group.length === 2) {
          return (
            <div key={group.join("-")} className="tree-couple">
              {cards}
            </div>
          );
        }
        return cards[0];
      })}
    </div>
  );
}

export function PosterTree({ graph, rootId }: PosterTreeProps) {
  const { ancestors, rootLevel, descendants } = layoutGenerations(graph, rootId);

  return (
    <TreeCanvas graph={graph}>
      <div className="generation-tree poster-tree">
        {ancestors.map((level, i) => (
          <PosterRow key={`a-${i}`} graph={graph} ids={level} />
        ))}
        <PosterRow graph={graph} ids={rootLevel} root />
        {descendants.map((level, i) => (
          <PosterRow key={`d-${i}`} graph={graph} ids={level} />
        ))}
      </div>
    </TreeCanvas>
  );
}
