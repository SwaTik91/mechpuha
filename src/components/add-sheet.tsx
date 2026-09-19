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
  initialCard?: { name: string; surname: string; birthPlace: string };
  saving?: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (
    card: { name: string; surname: string; birthPlace: string },
    kind: RelativeKind
  ) => void;
  onEditSave: (card: { name: string; surname: string; birthPlace: string }) => void;
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
  const [surname, setSurname] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [childKind, setChildKind] = useState<"son" | "daughter">("son");

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialCard) {
      setName(initialCard.name);
      setSurname(initialCard.surname);
      setBirthPlace(initialCard.birthPlace);
      setChildKind("son");
      return;
    }
    setName("");
    setSurname("");
    setBirthPlace("");
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
      onEditSave({ name, surname, birthPlace });
      return;
    }
    if (!resolvedKind) return;
    onSave({ name, surname, birthPlace }, resolvedKind);
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
              <label htmlFor="add-surname">Фамилия</label>
              <input id="add-surname" value={surname} onChange={(e) => setSurname(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="add-birthPlace">Место рождения</label>
              <input
                id="add-birthPlace"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
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
