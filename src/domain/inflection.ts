/** Heuristic Russian name inflection for sheet titles (v1). */

function stem(name: string): { base: string; last: string } {
  return { base: name.slice(0, -1), last: name.slice(-1).toLowerCase() };
}

export function toGenitive(name: string): string {
  if (!name || name === "—") return name;

  const { base, last } = stem(name);
  if (last === "а") return `${base}ы`;
  if (last === "я") return `${base}и`;
  if (last === "й") return `${base}я`;
  if (last === "ь") return name;
  return `${name}а`;
}

export function toDative(name: string): string {
  if (!name || name === "—") return name;

  const { base, last } = stem(name);
  if (last === "а") return `${base}е`;
  if (last === "я") return `${base}е`;
  if (last === "й") return `${base}ю`;
  if (last === "ь") return name;
  return `${name}у`;
}
