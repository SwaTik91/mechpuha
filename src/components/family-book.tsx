"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { layoutGenerations } from "../domain/layout";
import type { FamilyDocument, PersonId, RelativeKind } from "../domain/types";
import { AddSheet } from "./add-sheet";
import { GenerationTree } from "./generation-tree";

type FamilyBookProps = {
  doc: FamilyDocument;
  addRelative: (
    familyId: string,
    fromId: PersonId,
    kind: RelativeKind,
    card: { name: string; clan: string; origin: string }
  ) => Promise<{ error?: string }>;
  issueKey: (
    familyId: string,
    kind: "helper" | "view" | "claim"
  ) => Promise<{ url?: string; error?: string }>;
};

function countGenerations(doc: FamilyDocument): number {
  const { ancestors, descendants } = layoutGenerations(doc.graph, doc.rootPersonId);
  let count = 1;
  if (ancestors.length > 0) count += ancestors.length;
  if (descendants.length > 0) count += descendants.length;
  return count;
}

export function FamilyBook({ doc, addRelative, issueKey }: FamilyBookProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<PersonId>(doc.rootPersonId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetKind, setSheetKind] = useState<RelativeKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [issuedUrl, setIssuedUrl] = useState<string | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedPerson = doc.graph.persons.find((p) => p.id === selectedId);
  const showElderHint = countGenerations(doc) >= 2;

  function openSheet(personId: PersonId, kind: RelativeKind | null) {
    setSelectedId(personId);
    setSheetKind(kind);
    setError(null);
    setSheetOpen(true);
  }

  function handleSelect(id: PersonId) {
    setSelectedId(id);
    openSheet(id, null);
  }

  function handleVacancy(personId: PersonId, kind: RelativeKind) {
    openSheet(personId, kind);
  }

  function handleIssue(kind: "helper" | "view" | "claim") {
    setIssueError(null);
    startTransition(async () => {
      const result = await issueKey(doc.id, kind);
      if (result.error) {
        setIssueError(result.error);
        return;
      }
      if (result.url) {
        await navigator.clipboard.writeText(result.url);
        setIssuedUrl(result.url);
      }
    });
  }

  function handleSave(
    card: { name: string; clan: string; origin: string },
    kind: RelativeKind
  ) {
    setError(null);
    startTransition(async () => {
      const result = await addRelative(doc.id, selectedId, kind, card);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSheetOpen(false);
      setSheetKind(null);
      router.refresh();
    });
  }

  return (
    <div className={`family-book${sheetOpen ? " family-book--dimmed" : ""}`}>
      <h1>Семейная книга</h1>

      <GenerationTree
        graph={doc.graph}
        rootId={doc.rootPersonId}
        selectedId={selectedId}
        onSelect={handleSelect}
        onVacancy={handleVacancy}
      />

      <nav className="family-actions">
        <button type="button" className="text-action" onClick={() => handleIssue("helper")} disabled={pending}>
          Позвать помощника
        </button>
        <button type="button" className="text-action" onClick={() => handleIssue("view")} disabled={pending}>
          Ссылка для старшего
        </button>
        <button type="button" className="text-action" onClick={() => handleIssue("claim")} disabled={pending}>
          Пригласить забрать дом
        </button>
        {issueError && <p className="error">{issueError}</p>}
        {issuedUrl && (
          <p className="family-url" data-testid="poster-url">{issuedUrl}</p>
        )}
        {showElderHint && (
          <p className="family-hint">Можно показать старшему</p>
        )}
      </nav>

      <AddSheet
        open={sheetOpen}
        personName={selectedPerson?.name ?? "—"}
        kind={sheetKind}
        saving={pending}
        error={error}
        onClose={() => {
          setSheetOpen(false);
          setSheetKind(null);
          setError(null);
        }}
        onSave={handleSave}
        onKindChange={(k) => setSheetKind(k)}
      />
    </div>
  );
}
