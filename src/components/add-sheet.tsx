"use client";

import { useEffect, useState } from "react";
import { toDative, toGenitive } from "../domain/inflection";
import type { RelativeKind } from "../domain/types";

const KIND_OPTIONS: { kind: RelativeKind; label: string }[] = [
  { kind: "father", label: "Отец" },
  { kind: "mother", label: "Мать" },
  { kind: "spouse", label: "Супруг(а)" },
  { kind: "son", label: "Сын" },
  { kind: "daughter", label: "Дочь" },
];

const KIND_TITLE: Record<RelativeKind, string> = {
  father: "Отец",
  mother: "Мать",
  spouse: "Супруг(а)",
  son: "Сын",
  daughter: "Дочь",
};

type AddSheetProps = {
  open: boolean;
  personName: string;
  kind: RelativeKind | null;
  mode: "choose" | "add" | "edit";
  unavailableKinds?: RelativeKind[];
  initialCard?: { name: string; clan: string; origin: string };
  saving?: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (
    card: { name: string; clan: string; origin: string },
    kind: RelativeKind
  ) => void;
  onEditSave: (card: { name: string; clan: string; origin: string }) => void;
  onKindChange?: (kind: RelativeKind) => void;
  onEdit?: () => void;
};

export function AddSheet({
  open,
  personName,
  kind,
  mode,
  unavailableKinds = [],
  initialCard,
  saving,
  error,
  onClose,
  onSave,
  onEditSave,
  onKindChange,
  onEdit,
}: AddSheetProps) {
  const [name, setName] = useState("");
  const [clan, setClan] = useState("");
  const [origin, setOrigin] = useState("");
  const [childKind, setChildKind] = useState<"son" | "daughter">("son");

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialCard) {
      setName(initialCard.name);
      setClan(initialCard.clan);
      setOrigin(initialCard.origin);
      setChildKind("son");
      return;
    }
    setName("");
    setClan("");
    setOrigin("");
    setChildKind("son");
  }, [open, kind, personName, mode, initialCard]);

  if (!open) return null;

  const resolvedKind =
    kind === "son" || kind === "daughter" ? childKind : kind;
  const title =
    mode === "edit"
      ? `Править: ${personName}`
      : kind !== null
        ? `${KIND_TITLE[resolvedKind ?? "son"]} ${toGenitive(personName)}`
        : `Добавить к ${toDative(personName)}`;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "edit") {
      onEditSave({ name, clan, origin });
      return;
    }
    if (!resolvedKind) return;
    onSave({ name, clan, origin }, resolvedKind);
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-labelledby="add-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="add-sheet-title" className="sheet__title">{title}</h2>

        {mode === "choose" && onKindChange && (
          <>
            {onEdit && (
              <button type="button" className="sheet__kind-btn sheet__kind-btn--edit" onClick={onEdit}>
                Править
              </button>
            )}
            <div className="sheet__kinds">
              {KIND_OPTIONS.map(({ kind: k, label }) => {
                const unavailable = unavailableKinds.includes(k);
                return (
                  <button
                    key={k}
                    type="button"
                    className="sheet__kind-btn"
                    disabled={unavailable}
                    onClick={() => onKindChange(k)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {(mode === "add" || mode === "edit") && (
          <form onSubmit={handleSubmit}>
            {mode === "add" && (kind === "son" || kind === "daughter") && (
              <div className="sheet__child-kind">
                <label>
                  <input
                    type="radio"
                    name="childKind"
                    checked={childKind === "son"}
                    onChange={() => setChildKind("son")}
                  />
                  Сын
                </label>
                <label>
                  <input
                    type="radio"
                    name="childKind"
                    checked={childKind === "daughter"}
                    onChange={() => setChildKind("daughter")}
                  />
                  Дочь
                </label>
              </div>
            )}

            <div className="field">
              <label htmlFor="add-name">Имя</label>
              <input
                id="add-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="add-clan">Род</label>
              <input id="add-clan" value={clan} onChange={(e) => setClan(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="add-origin">Происхождение</label>
              <input
                id="add-origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              />
            </div>

            {error && <p className="error">{error}</p>}

            <button className="primary" type="submit" disabled={saving || !name.trim()}>
              Сохранить
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
