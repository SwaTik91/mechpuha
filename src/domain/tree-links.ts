import { getSpouseId } from "./layout";
import type { FamilyGraph, ParentRelation, PersonId } from "./types";

export type PersonBox = {
  id: PersonId;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SpouseLink = {
  kind: "spouse";
  a: PersonId;
  b: PersonId;
  label: "супруги";
};

export type ParentageLink = {
  kind: "parentage";
  parents: PersonId[];
  children: PersonId[];
  label: "отец" | "мать" | "родители" | "родитель";
};

export type TreeLink = SpouseLink | ParentageLink;

export type ConnectorLabel = { text: string; x: number; y: number };

export type ConnectorPath = {
  d: string;
  label: ConnectorLabel;
};

function parentRelations(graph: FamilyGraph): ParentRelation[] {
  return graph.relations.filter((r): r is ParentRelation => r.type === "parent");
}

function parentageLabel(roles: Array<ParentRelation["role"]>): ParentageLink["label"] {
  if (roles.length > 1) return "родители";
  if (roles[0] === "father") return "отец";
  if (roles[0] === "mother") return "мать";
  return "родитель";
}

export function coupleRowGroups(graph: FamilyGraph, ids: PersonId[]): PersonId[][] {
  const used = new Set<PersonId>();
  const groups: PersonId[][] = [];

  for (const id of ids) {
    if (used.has(id)) continue;
    const spouseId = getSpouseId(graph, id);
    if (spouseId && ids.includes(spouseId) && !used.has(spouseId)) {
      const first = ids.indexOf(id) < ids.indexOf(spouseId) ? id : spouseId;
      const second = first === id ? spouseId : id;
      groups.push([first, second]);
      used.add(first);
      used.add(second);
      continue;
    }
    groups.push([id]);
    used.add(id);
  }

  return groups;
}

export function collectTreeLinks(graph: FamilyGraph): TreeLink[] {
  const links: TreeLink[] = [];

  for (const relation of graph.relations) {
    if (relation.type !== "spouse") continue;
    links.push({ kind: "spouse", a: relation.a, b: relation.b, label: "супруги" });
  }

  const parentsByChild = new Map<PersonId, ParentRelation[]>();
  for (const relation of parentRelations(graph)) {
    const current = parentsByChild.get(relation.childId) ?? [];
    current.push(relation);
    parentsByChild.set(relation.childId, current);
  }

  const groups = new Map<
    string,
    { parents: PersonId[]; children: PersonId[]; roles: Array<ParentRelation["role"]> }
  >();

  for (const [childId, relations] of parentsByChild) {
    const parents = [...new Set(relations.map((r) => r.parentId))];
    const key = [...parents].sort().join("+");
    const group = groups.get(key);
    if (group) {
      group.children.push(childId);
      continue;
    }
    groups.set(key, {
      parents,
      children: [childId],
      roles: relations.map((r) => r.role),
    });
  }

  for (const group of groups.values()) {
    links.push({
      kind: "parentage",
      parents: group.parents,
      children: group.children,
      label: parentageLabel(group.roles),
    });
  }

  return links;
}

function boxCenterX(box: PersonBox): number {
  return box.x + box.width / 2;
}

function boxCenterY(box: PersonBox): number {
  return box.y + box.height / 2;
}

function boxById(boxes: PersonBox[], id: PersonId): PersonBox | undefined {
  return boxes.find((box) => box.id === id);
}

function pathCommand(parts: Array<string | number>): string {
  return parts
    .map((part) => (typeof part === "number" ? String(part) : part))
    .join(" ")
    .replace(/ ([ML])/g, " $1")
    .trim();
}

export function layoutTreeConnectors(links: TreeLink[], boxes: PersonBox[]): ConnectorPath[] {
  const paths: ConnectorPath[] = [];

  for (const link of links) {
    if (link.kind === "spouse") {
      const a = boxById(boxes, link.a);
      const b = boxById(boxes, link.b);
      if (!a || !b) continue;
      const left = a.x <= b.x ? a : b;
      const right = left === a ? b : a;
      const y = boxCenterY(left);
      const x1 = left.x + left.width;
      const x2 = right.x;
      paths.push({
        d: pathCommand(["M", x1, y, "L", x2, y]),
        label: { text: link.label, x: (x1 + x2) / 2, y },
      });
      continue;
    }

    const parents = link.parents.map((id) => boxById(boxes, id));
    const children = link.children.map((id) => boxById(boxes, id));
    if (parents.some((box) => !box) || children.some((box) => !box)) continue;
    const parentBoxes = parents as PersonBox[];
    const childBoxes = children as PersonBox[];

    const startX =
      parentBoxes.reduce((sum, box) => sum + boxCenterX(box), 0) / parentBoxes.length;
    const startY = Math.max(...parentBoxes.map((box) => box.y + box.height));
    const childTop = Math.min(...childBoxes.map((box) => box.y));
    const barY = (startY + childTop) / 2;
    const childCenters = childBoxes.map(boxCenterX);

    const commands: Array<string | number> = ["M", startX, startY, "L", startX, barY];

    if (childBoxes.length === 1) {
      const childX = childCenters[0];
      if (childX !== startX) {
        commands.push("L", childX, barY);
      }
      commands.push("L", childX, childBoxes[0].y);
    } else {
      const barLeft = Math.min(startX, ...childCenters);
      const barRight = Math.max(startX, ...childCenters);
      commands.push("M", barLeft, barY, "L", barRight, barY);
      for (const child of childBoxes) {
        const x = boxCenterX(child);
        commands.push("M", x, barY, "L", x, child.y);
      }
    }

    paths.push({
      d: pathCommand(commands),
      label: { text: link.label, x: startX, y: (startY + barY) / 2 },
    });
  }

  return paths;
}
