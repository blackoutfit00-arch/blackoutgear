import type { ShopifyProduct } from "@/lib/shopify";

export interface CategoryDef {
  label: string;
  slug: string;
  match: (product: ShopifyProduct["node"]) => boolean;
}

function isOnOffer(product: ShopifyProduct["node"]): boolean {
  const price = parseFloat(product.priceRange?.minVariantPrice?.amount ?? "0");
  const compareAt = parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount ?? "0");
  return compareAt > price;
}

export const CATEGORIES: CategoryDef[] = [
  { label: "All", slug: "all", match: () => true },
  { label: "Offers", slug: "offers", match: isOnOffer },
  { label: "Pants", slug: "pants", match: (p) => /pant|sweat|sportssuit|jogger/.test(p.title.toLowerCase()) },
  { label: "Compression", slug: "compression", match: (p) => /compression/.test(p.title.toLowerCase()) },
  { label: "T-Shirt", slug: "t-shirts", match: (p) => /t-?shirt|\btees?\b|jersey/.test(p.title.toLowerCase()) && !/compression/.test(p.title.toLowerCase()) },
  { label: "Accessories", slug: "accessories", match: (p) => /strap|belt|glove|shaker|accessor/.test(p.title.toLowerCase()) },
];
