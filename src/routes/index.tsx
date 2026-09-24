import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Loader2, ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/ProductCard";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";
import { STORE_NAME } from "@/config/store";
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
        className="relative h-[42vh] min-h-72 border-b border-border bg-cover bg-center sm:h-[55vh]"
        style={{ backgroundImage: "url(/hero-gym.jpg)" }}
      >
        <h1 className="sr-only">{STORE_NAME}</h1>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-12 sm:px-8 sm:py-16">
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
          <div className="space-y-16">
            {HOME_SHELVES.map((label) => {
              const category = CATEGORIES.find((c) => c.label === label);
              if (!category) return null;
              const shelfProducts = products?.filter((p: ShopifyProduct) => category.match(p.node)) ?? [];
              if (shelfProducts.length === 0) return null;
              return (
                <section key={label} aria-labelledby={`shelf-${label}`}>
                  <div className="mb-9 flex items-center justify-between">
                    <Link
                      id={`shelf-${label}`}
                      to="/category/$slug"
                      params={{ slug: category.slug }}
                      className="group flex items-center gap-2 text-[13px] font-medium uppercase text-foreground"
                    >
                      {label}
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none">
                    {shelfProducts.slice(0, 5).map((product) => (
                      <div key={product.node.id} className="snap-start">
                        <ProductCard product={product} compact />
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 h-px bg-border" aria-hidden="true">
                    <div className="h-px w-1/2 bg-foreground" />
                  </div>
                  <Link
                    to="/category/$slug"
                    params={{ slug: category.slug }}
                    className="label-caps mt-8 flex h-14 w-full items-center justify-center bg-primary px-6 text-[11px] font-bold text-primary-foreground transition-colors hover:bg-primary/85"
                  >
                    View all
                  </Link>
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
