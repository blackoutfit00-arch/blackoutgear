import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/ProductCard";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";

 type IndexSearch = { q?: string | undefined };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): IndexSearch => ({
    q: typeof search["q"] === "string" ? (search["q"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Blackout Gear" },
      {
        name: "description",
        content: "Shop Blackout Gear products in Bahrain.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { q } = Route.useSearch();
  const { data: products, isLoading, isError } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProducts(50),
  });

  const searchResults = useMemo(() => {
    if (!products || !q || !q.trim()) return products ?? [];
    const needle = q.trim().toLowerCase();
    return products.filter((p: ShopifyProduct) => p.node.title.toLowerCase().includes(needle));
  }, [products, q]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 sm:py-14">
        {q && q.trim() && (
          <p className="mb-8 text-sm text-muted-foreground">
            Results for <span className="font-semibold text-foreground">"{q.trim()}"</span>
          </p>
        )}

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="py-24 text-center text-muted-foreground">Couldn't load products. Please try again.</p>
        ) : searchResults.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {searchResults.map((product) => (
              <ProductCard key={product.node.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="py-24 text-center text-muted-foreground">No products found</p>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
