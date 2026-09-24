import type { ShopifyProduct } from "@/lib/shopify";

export interface CategoryDef {
  label: string;
  match: (product: ShopifyProduct["node"]) => boolean;
}

function isOnOffer(product: ShopifyProduct["node"]): boolean {
  const price = parseFloat(product.priceRange?.minVariantPrice?.amount ?? "0");
  const compareAt = parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount ?? "0");
  return compareAt > price;
}

export const CATEGORIES: CategoryDef[] = [
  { label: "All", match: () => true },
  { label: "Offers", match: isOnOffer },
  { label: "Pants", match: (p) => /pant|sweat|sportssuit|jogger/.test(p.title.toLowerCase()) },
  { label: "Compression", match: (p) => /compression/.test(p.title.toLowerCase()) },
  { label: "Oversize", match: (p) => /oversize|oversized/.test(p.title.toLowerCase()) },
  { label: "Accessories", match: (p) => /strap|belt|glove|shaker|accessor/.test(p.title.toLowerCase()) },
];
