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
  { label: "Sunglasses", slug: "sunglasses", match: (p) => /sunglass|shades|polarized/.test(p.title.toLowerCase()) },
  { label: "Optical Frames", slug: "optical-frames", match: (p) => /optical|eyeglass|frame|prescription/.test(p.title.toLowerCase()) },
  { label: "Sports Eyewear", slug: "sports-eyewear", match: (p) => /sport|cycling|running|ski\b/.test(p.title.toLowerCase()) },
  { label: "Accessories", slug: "accessories", match: (p) => /case|cloth|chain|strap|cleaner|accessor/.test(p.title.toLowerCase()) },
];
