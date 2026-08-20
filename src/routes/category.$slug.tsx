import { useMemo } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ChevronLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/ProductCard";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";
import { CATEGORIES } from "@/config/categories";
import { STORE_NAME } from "@/config/store";

export const Route = createFileRoute("/category/$slug")({
  loader: ({ params }) => {
    const category = CATEGORIES.find((c) => c.slug === params.slug);
    if (!category) throw notFound();
    return { category };
  },
  head: ({ loaderData }) => {
    const label = loaderData?.category?.label ?? "Shop";
    return {
      meta: [
        { title: `${label} — ${STORE_NAME}` },
        { name: "description", content: `Shop the ${label} collection at ${STORE_NAME}. Delivered across Bahrain.` },
        { property: "og:title", content: `${label} — ${STORE_NAME}` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useLoaderData();
  const { data: products, isLoading, isError } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProducts(50),
  });

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter((p: ShopifyProduct) => category.match(p.node));
  }, [products, category]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Link
          to="/"
          className="label-caps mb-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back to shop
        </Link>

        <h1 className="mb-8 text-3xl font-medium text-foreground sm:text-4xl">{category.label}</h1>

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
          <p className="py-20 text-center text-muted-foreground">No products found in this category yet.</p>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
