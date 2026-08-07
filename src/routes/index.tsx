import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { ProductCard } from "@/components/ProductCard";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";
import { STORE_NAME, STORE_TAGLINE } from "@/config/store";
import { cn } from "@/lib/utils";

const CATEGORIES: Array<{ label: string; match: (title: string) => boolean }> = [
  { label: "All", match: () => true },
  { label: "Pants", match: (t) => /pant|sweatpant|sportssuit|jogger/.test(t) },
  { label: "Oversize", match: (t) => /oversize|oversized/.test(t) },
  { label: "YoungLA", match: (t) => /youngla|yla/.test(t) },
  { label: "Gymshark", match: (t) => /gymshark|onyx/.test(t) },
  { label: "Compression", match: (t) => /compression/.test(t) },
  { label: "Gym Accessories", match: (t) => /strap|belt|glove|sleeve|shaker|accessor/.test(t) },
];


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Blackout Gear — Gym Apparel & Lifting Gear in Bahrain" },
      {
        name: "description",
        content:
          "Shop oversized tees, jerseys, compression tops and lifting straps. Order on WhatsApp with delivery across Bahrain.",
      },
      { property: "og:title", content: "Blackout Gear — Gym Apparel & Lifting Gear in Bahrain" },
      {
        property: "og:description",
        content: "Oversized tees, jerseys, compression tops and lifting straps. Order on WhatsApp, delivered in Bahrain.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: products, isLoading, isError } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProducts(50),
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border bg-gradient-to-b from-card to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <p className="label-caps text-xs text-primary">Bahrain · WhatsApp orders</p>
          <h1 className="mt-3 text-5xl sm:text-6xl">{STORE_NAME}</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">{STORE_TAGLINE}</p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="label-caps mb-6 text-2xl">Shop all</h2>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="py-20 text-center text-muted-foreground">Couldn't load products. Please try again.</p>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.node.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="py-20 text-center text-muted-foreground">No products found</p>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {STORE_NAME}
      </footer>
    </div>
  );
}
