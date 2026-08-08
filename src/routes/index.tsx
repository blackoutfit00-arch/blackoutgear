import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/ProductCard";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";
import { STORE_NAME, STORE_TAGLINE } from "@/config/store";
import { CATEGORIES } from "@/config/categories";
import { cn } from "@/lib/utils";

type IndexSearch = { category?: string | undefined; q?: string | undefined };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): IndexSearch => ({
    category: typeof search["category"] === "string" ? (search["category"] as string) : undefined,
    q: typeof search["q"] === "string" ? (search["q"] as string) : undefined,
  }),
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
  const { category, q } = Route.useSearch();
  const { data: products, isLoading, isError } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProducts(50),
  });
  const [active, setActive] = useState(category && CATEGORIES.some((c) => c.label === category) ? category : "All");

  useEffect(() => {
    if (category && CATEGORIES.some((c) => c.label === category)) {
      setActive(category);
    }
  }, [category]);

  const available = useMemo(() => {
    if (!products) return CATEGORIES.slice(0, 1);
    return CATEGORIES.filter(
      (c) => c.label === "All" || products.some((p: ShopifyProduct) => c.match(p.node.title.toLowerCase())),
    );
  }, [products]);

  const filtered = useMemo(() => {
    if (!products) return [];
    const cat = CATEGORIES.find((c) => c.label === active);
    let result = cat ? products.filter((p: ShopifyProduct) => cat.match(p.node.title.toLowerCase())) : products;
    if (q && q.trim()) {
      const needle = q.trim().toLowerCase();
      result = result.filter((p: ShopifyProduct) => p.node.title.toLowerCase().includes(needle));
    }
    return result;
  }, [products, active, q]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section
        className="relative border-b border-border bg-cover bg-center"
        style={{ backgroundImage: "url(/hero-gym.jpg)" }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
          <p className="label-caps text-xs text-primary">Bahrain</p>
          <h1 className="mt-3 text-5xl text-white sm:text-6xl">{STORE_NAME}</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-neutral-200 sm:text-base">{STORE_TAGLINE}</p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-12">
        <nav className="-mx-4 mb-8 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {available.map((c) => (
            <button
              key={c.label}
              onClick={() => setActive(c.label)}
              className={cn(
                "label-caps shrink-0 border px-5 py-2.5 text-sm transition-colors",
                active === c.label
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-transparent text-muted-foreground hover:border-primary/60 hover:text-foreground",
              )}
            >
              {c.label}
            </button>
          ))}
        </nav>

        {q && q.trim() && (
          <p className="mb-4 text-sm text-muted-foreground">
            Results for <span className="font-semibold text-foreground">"{q.trim()}"</span>
          </p>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="py-20 text-center text-muted-foreground">Couldn't load products. Please try again.</p>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.node.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="py-20 text-center text-muted-foreground">No products found</p>
        )}
      </main>


      <SiteFooter />
    </div>
  );
}
