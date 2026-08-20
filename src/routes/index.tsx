import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
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
      { name: "description", content: "Premium sports eyewear & sunglasses in Bahrain." },
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

  const featured = searchResults.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#f4efe5] text-[#122b4b]">
      <SiteHeader />

      {!q?.trim() && (
        <section className="relative overflow-hidden bg-[#f4efe5]">
          <div className="mx-auto grid min-h-[560px] max-w-[1500px] items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:py-20">
            <div className="max-w-xl">
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8b6b45]">Performance eyewear · Bahrain</p>
              <h1 className="font-display text-5xl font-semibold leading-[0.95] tracking-tight sm:text-7xl">See the game.<br />Play it your way.</h1>
              <p className="mt-7 max-w-md text-base leading-7 text-[#122b4b]/70 sm:text-lg">Premium eyewear made for movement, sunlight and everyday performance.</p>
              <a href="#shop" className="mt-9 inline-flex items-center gap-3 bg-[#122b4b] px-7 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#f5efe2] transition-transform hover:-translate-y-0.5">Shop collection <ArrowRight className="h-4 w-4" /></a>
            </div>
            <div className="relative mx-auto w-full max-w-[600px]">
              <div className="absolute inset-8 rounded-full bg-[#d9c9ad]/40 blur-3xl" />
              {featured[0]?.node.images?.edges?.[0]?.node.url ? (
                <img src={featured[0].node.images.edges[0].node.url} alt={featured[0].node.title} className="relative aspect-square w-full object-cover mix-blend-multiply" />
              ) : (
                <div className="aspect-square w-full bg-[#d9c9ad]" />
              )}
            </div>
          </div>
        </section>
      )}

      <main id="shop" className="mx-auto max-w-[1500px] px-5 py-14 sm:px-8 sm:py-20">
        {q && q.trim() && <p className="mb-8 text-sm text-[#122b4b]/60">Results for <span className="font-semibold text-[#122b4b]">"{q.trim()}"</span></p>}

        <div className="mb-10 flex items-end justify-between border-b border-[#d9d0c0] pb-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#8b6b45]">The collection</p>
            <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Featured eyewear</h2>
          </div>
          <p className="hidden text-xs uppercase tracking-[0.16em] text-[#122b4b]/50 sm:block">Built for Bahrain</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-[#122b4b]/50" /></div>
        ) : isError ? (
          <p className="py-24 text-center text-[#122b4b]/60">Couldn't load products. Please try again.</p>
        ) : searchResults.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
            {searchResults.map((product) => <ProductCard key={product.node.id} product={product} />)}
          </div>
        ) : (
          <p className="py-24 text-center text-[#122b4b]/60">No products found</p>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
