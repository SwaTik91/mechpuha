"use client";

import { hasChild, hasFather, hasMother, hasSpouse, layoutGenerations } from "../domain/layout";
import { personDisplayName } from "../domain/person";
import type { FamilyGraph, PersonId, RelativeKind } from "../domain/types";

type GenerationTreeProps = {
  graph: FamilyGraph;
  rootId: PersonId;
  selectedId: PersonId;
  onSelect: (id: PersonId) => void;
  onVacancy: (personId: PersonId, kind: RelativeKind) => void;
};

function PersonCard({
  graph,
  id,
  selected,
  onSelect,
}: {
  graph: FamilyGraph;
  id: PersonId;
  selected: boolean;
  onSelect: () => void;
}) {
  const person = graph.persons.find((p) => p.id === id);
  return (
    <button
      type="button"
      className={`tree-card${selected ? " tree-card--selected" : ""}`}
      onClick={onSelect}
    >
      <span className="tree-card__name">{person ? personDisplayName(person) : "—"}</span>
      {person?.birthPlace && <span className="tree-card__meta">{person.birthPlace}</span>}
    </button>
  );
}

function VacancyCard({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="tree-card tree-card--vacancy" onClick={onClick}>
      {label}
    </button>
  );
}

function PersonWithVacancies({
  graph,
  id,
  selected,
  onSelect,
  onVacancy,
}: {
  graph: FamilyGraph;
  id: PersonId;
  selected: boolean;
  onSelect: () => void;
  onVacancy: (personId: PersonId, kind: RelativeKind) => void;
}) {
  const showVacancies = selected;
  const showFather = showVacancies && !hasFather(graph, id);
  const showMother = showVacancies && !hasMother(graph, id);
  const showSpouse = showVacancies && !hasSpouse(graph, id);
  const showChild = showVacancies && !hasChild(graph, id);

  return (
    <div className="tree-person">
      {(showFather || showMother) && (
        <div className="tree-row tree-row--vacancy">
          {showFather && <VacancyCard label="отец" onClick={() => onVacancy(id, "father")} />}
          {showMother && <VacancyCard label="мать" onClick={() => onVacancy(id, "mother")} />}
        </div>
      )}
      <div className="tree-row tree-row--couple">
        <PersonCard graph={graph} id={id} selected={selected} onSelect={onSelect} />
        {showSpouse && (
          <VacancyCard label="супруг(а)" onClick={() => onVacancy(id, "spouse")} />
        )}
      </div>
      {showChild && (
        <div className="tree-row tree-row--vacancy">
          <VacancyCard label="ребёнок" onClick={() => onVacancy(id, "son")} />
        </div>
      )}
    </div>
  );
}

function GenerationRow({
  graph,
  ids,
  selectedId,
  onSelect,
  onVacancy,
  root,
}: {
  graph: FamilyGraph;
  ids: PersonId[];
  selectedId: PersonId;
  onSelect: (id: PersonId) => void;
  onVacancy: (personId: PersonId, kind: RelativeKind) => void;
  root?: boolean;
}) {
  return (
    <div className={`tree-row${root ? " tree-row--root" : ""}`}>
      {ids.map((id) => (
        <PersonWithVacancies
          key={id}
          graph={graph}
          id={id}
          selected={id === selectedId}
          onSelect={() => onSelect(id)}
          onVacancy={onVacancy}
        />
      ))}
    </div>
  );
}

export function GenerationTree({
  graph,
  rootId,
  selectedId,
  onSelect,
  onVacancy,
}: GenerationTreeProps) {
  const { ancestors, rootLevel, descendants } = layoutGenerations(graph, rootId);

  return (
    <div className="generation-tree">
      {ancestors.map((level, i) => (
        <GenerationRow
          key={`a-${i}`}
          graph={graph}
          ids={level}
          selectedId={selectedId}
          onSelect={onSelect}
          onVacancy={onVacancy}
        />
      ))}
      <GenerationRow
        graph={graph}
        ids={rootLevel}
        selectedId={selectedId}
        onSelect={onSelect}
        onVacancy={onVacancy}
        root
      />
      {descendants.map((level, i) => (
        <GenerationRow
          key={`d-${i}`}
          graph={graph}
          ids={level}
          selectedId={selectedId}
          onSelect={onSelect}
          onVacancy={onVacancy}
        />
      ))}
    </div>
  );
}
