export interface CategoryDef {
  label: string;
  match: (title: string) => boolean;
}

export const CATEGORIES: CategoryDef[] = [
  { label: "All", match: () => true },
  { label: "Pants", match: (t) => /pant|sweatpant|sportssuit|jogger/.test(t) },
  { label: "Oversize", match: (t) => /oversize|oversized/.test(t) },
  { label: "YoungLA", match: (t) => /youngla|yla/.test(t) },
  { label: "Gymshark", match: (t) => /gymshark|onyx/.test(t) },
  { label: "Compression", match: (t) => /compression/.test(t) },
  { label: "Gym Accessories", match: (t) => /strap|belt|glove|sleeve|shaker|accessor/.test(t) },
];
