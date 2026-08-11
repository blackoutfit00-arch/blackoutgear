import { toast } from "sonner";

export const SHOPIFY_API_VERSION = "2026-07";
export const SHOPIFY_STORE_PERMANENT_DOMAIN = "d4j9k1-5v.myshopify.com";
export const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
export const SHOPIFY_STOREFRONT_TOKEN = "b9759d7207807e17d9f0e0ffedb92923";

export interface ShopifyProduct {
  node: {
    id: string; title: string; description: string; descriptionHtml: string; handle: string;
    priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
    compareAtPriceRange: { minVariantPrice: { amount: string; currencyCode: string } };
    images: { edges: Array<{ node: { url: string; altText: string | null } }> };
    variants: { edges: Array<{ node: { id: string; title: string; price: { amount: string; currencyCode: string }; availableForSale: boolean; selectedOptions: Array<{ name: string; value: string }>; image: { url: string; altText: string | null } | null } }> };
    options: Array<{ name: string; values: string[] }>;
  };
}

const PRODUCT_FIELDS = `
  id title description descriptionHtml handle
  priceRange { minVariantPrice { amount currencyCode } }
  compareAtPriceRange { minVariantPrice { amount currencyCode } }
  images(first: 250) { edges { node { url altText } } }
  variants(first: 50) { edges { node { id title price { amount currencyCode } availableForSale selectedOptions { name value } image { url altText } } } }
  options { name values }
`;
export const STOREFRONT_QUERY = `query GetProducts($first: Int!, $query: String) { products(first: $first, query: $query) { edges { node { ${PRODUCT_FIELDS} } } } }`;
export const HOMEPAGE_COLLECTION_QUERY = `query GetHomepageCollection($first: Int!) { collectionByHandle(handle: "homepage") { products(first: $first) { edges { node { ${PRODUCT_FIELDS} } } } } }`;
export const PRODUCT_BY_HANDLE_QUERY = `query GetProduct($handle: String!) { productByHandle(handle: $handle) { ${PRODUCT_FIELDS} } }`;

export async function storefrontApiRequest(query: string, variables: Record<string, unknown> = {}) {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, { method: "POST", headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN }, body: JSON.stringify({ query, variables }) });
  if (response.status === 402) { toast.error("Shopify: Payment required"); return; }
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  if (data.errors) throw new Error(`Error calling Shopify: ${data.errors.map((e: { message: string }) => e.message).join(", ")}`);
  return data;
}
export async function fetchProducts(first = 50): Promise<ShopifyProduct[]> {
  const data = await storefrontApiRequest(HOMEPAGE_COLLECTION_QUERY, { first });
  const collectionProducts = data?.data?.collectionByHandle?.products?.edges;
  if (collectionProducts?.length) return collectionProducts;
  const fallback = await storefrontApiRequest(STOREFRONT_QUERY, { first });
  return fallback?.data?.products?.edges ?? [];
}
export async function fetchProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
  const node = data?.data?.productByHandle;
  return node ? { node } : null;
}
export function formatMoney(amount: string | number, currencyCode: string) {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  const decimals = currencyCode === "BHD" || currencyCode === "KWD" || currencyCode === "OMR" ? 3 : 2;
  return `${value.toFixed(decimals)} ${currencyCode}`;
}
