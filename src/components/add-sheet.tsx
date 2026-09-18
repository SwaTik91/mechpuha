"use client";

import { useEffect, useState } from "react";
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
  saving?: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (
    card: { name: string; clan: string; origin: string },
    kind: RelativeKind
  ) => void;
  onKindChange?: (kind: RelativeKind) => void;
};

export function AddSheet({
  open,
  personName,
  kind,
  saving,
  error,
  onClose,
  onSave,
  onKindChange,
}: AddSheetProps) {
  const [name, setName] = useState("");
  const [clan, setClan] = useState("");
  const [origin, setOrigin] = useState("");
  const [childKind, setChildKind] = useState<"son" | "daughter">("son");

  useEffect(() => {
    if (open) {
      setName("");
      setClan("");
      setOrigin("");
      setChildKind("son");
    }
  }, [open, kind, personName]);

  if (!open) return null;

  const resolvedKind =
    kind === "son" || kind === "daughter" ? childKind : kind;
  const title =
    kind !== null
      ? `${KIND_TITLE[resolvedKind ?? "son"]} ${personName}`
      : `Добавить к ${personName}`;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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

        {kind === null && onKindChange && (
          <div className="sheet__kinds">
            {KIND_OPTIONS.map(({ kind: k, label }) => (
              <button
                key={k}
                type="button"
                className="sheet__kind-btn"
                onClick={() => onKindChange(k)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {kind !== null && (
          <form onSubmit={handleSubmit}>
            {(kind === "son" || kind === "daughter") && (
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
