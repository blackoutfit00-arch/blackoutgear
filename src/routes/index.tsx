import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Loader2, ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/ProductCard";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";
import { STORE_NAME, STORE_TAGLINE } from "@/config/store";
import { CATEGORIES } from "@/config/categories";

type IndexSearch = { q?: string | undefined };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): IndexSearch => ({
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

const HOME_SHELVES = ["T-Shirt", "Compression", "Pants", "Accessories"];

function Index() {
  const { q } = Route.useSearch();
  const { data: products, isLoading, isError } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProducts(50),
  });

  const searchResults = useMemo(() => {
    if (!products || !q || !q.trim()) return [];
    const needle = q.trim().toLowerCase();
    return products.filter((p: ShopifyProduct) => p.node.title.toLowerCase().includes(needle));
  }, [products, q]);

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

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {q && q.trim() ? (
          <>
            <p className="mb-5 text-sm text-muted-foreground">
              Results for <span className="font-semibold text-foreground">"{q.trim()}"</span>
            </p>
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : isError ? (
              <p className="py-20 text-center text-muted-foreground">Couldn't load products. Please try again.</p>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {searchResults.map((product) => (
                  <ProductCard key={product.node.id} product={product} />
                ))}
              </div>
            ) : (
              <p className="py-20 text-center text-muted-foreground">No products found</p>
            )}
          </>
        ) : isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="py-20 text-center text-muted-foreground">Couldn't load products. Please try again.</p>
        ) : (
          <div className="space-y-12">
            {HOME_SHELVES.map((label) => {
              const category = CATEGORIES.find((c) => c.label === label);
              if (!category) return null;
              const shelfProducts = products?.filter((p: ShopifyProduct) => category.match(p.node)) ?? [];
              if (shelfProducts.length === 0) return null;
              return (
                <section key={label} aria-labelledby={`shelf-${label}`}>
                  <div className="mb-5 flex items-center justify-between">
                    <Link
                      id={`shelf-${label}`}
                      to="/category/$slug"
                      params={{ slug: category.slug }}
                      className="group flex items-center gap-2 text-2xl font-medium text-foreground sm:text-3xl"
                    >
                      {label}
                      <ChevronRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Link
                      to="/category/$slug"
                      params={{ slug: category.slug }}
                      className="text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="-mx-1 flex gap-5 overflow-x-auto px-1 pb-3 snap-x snap-mandatory scrollbar-none">
                    {shelfProducts.slice(0, 5).map((product) => (
                      <div key={product.node.id} className="snap-start">
                        <ProductCard product={product} compact />
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
