export interface CategoryDef {
  label: string;
  match: (title: string) => boolean;
}

export const CATEGORIES: CategoryDef[] = [
  { label: "Pants", match: (t) => /pant|sweat|sportssuit|jogger/.test(t) },
  { label: "Oversize", match: (t) => /oversize|oversized/.test(t) },
  { label: "Compression", match: (t) => /compression/.test(t) },
  { label: "Accessories", match: (t) => /strap|belt|glove|shaker|accessor/.test(t) },
];
