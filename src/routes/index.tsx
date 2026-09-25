import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2, MessageCircle, ShieldCheck, Truck } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/ProductCard";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";
import { STORE_NAME } from "@/config/store";
import { CATEGORIES } from "@/config/categories";
import { cn } from "@/lib/utils";

type IndexSearch = { category?: string | undefined; q?: string | undefined };

const benefits = [
  {
    icon: Truck,
    title: "Free delivery",
    subtitle: "On 2+ items",
  },
  {
    icon: ShieldCheck,
    title: "BenefitPay",
    subtitle: "Pay after you order",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp checkout",
    subtitle: "Confirm in minutes",
  },
];

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): IndexSearch => ({
    category: typeof search["category"] === "string" ? (search["category"] as string) : undefined,
    q: typeof search["q"] === "string" ? (search["q"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: `${STORE_NAME} — Premium eyewear in Bahrain` },
      {
        name: "description",
        content: "Premium eyewear and sunglasses in Bahrain. Order on WhatsApp with BenefitPay.",
      },
      { property: "og:title", content: `${STORE_NAME} — Premium eyewear in Bahrain` },
      {
        property: "og:description",
        content: "A clearer perspective. Premium eyewear, ordered on WhatsApp in Bahrain.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { category, q } = Route.useSearch();
  const {
    data: products,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProducts(50),
  });
  const [active, setActive] = useState(
    category && CATEGORIES.some((c) => c.label === category) ? category : "All",
  );

  useEffect(() => {
    if (category && CATEGORIES.some((c) => c.label === category)) {
      setActive(category);
    }
  }, [category]);

  const available = useMemo(() => {
    if (!products) return CATEGORIES.slice(0, 1);
    return CATEGORIES.filter(
      (c) => c.label === "All" || products.some((p: ShopifyProduct) => c.match(p.node)),
    );
  }, [products]);

  const filtered = useMemo(() => {
    if (!products) return [];
    const cat = CATEGORIES.find((c) => c.label === active);
    let result = cat ? products.filter((p: ShopifyProduct) => cat.match(p.node)) : products;
    if (q && q.trim()) {
      const needle = q.trim().toLowerCase();
      result = result.filter((p: ShopifyProduct) => p.node.title.toLowerCase().includes(needle));
    }
    return result;
  }, [products, active, q]);

  const searching = Boolean(q?.trim());

  return (
    <div className="min-h-screen bg-[#3b3c39] text-[#f4eee3]">
      <SiteHeader />

      {!searching && (
        <>
          <section className="relative mx-auto max-w-[1500px] overflow-hidden bg-[#25231f]">
            <div className="relative min-h-[680px] sm:min-h-[760px] lg:min-h-[830px]">
              <img
                src="/vue-hero-eyewear.jpg"
                alt="Premium eyewear campaign"
                className="absolute inset-0 h-full w-full object-cover object-[62%_center]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(59,60,57,0.82)_0%,rgba(59,60,57,0.46)_40%,rgba(59,60,57,0.08)_72%)]" />
              <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/40 to-transparent" />

              <div className="relative z-10 flex min-h-[680px] max-w-[560px] flex-col justify-center px-8 py-16 sm:min-h-[760px] sm:px-12 lg:min-h-[830px]">
                <p className="mb-6 max-w-[260px] text-[14px] font-medium uppercase leading-[1.9] tracking-[0.48em] text-[#f4eee3]/90">
                  A clearer perspective
                </p>
                <h1 className="font-display text-[72px] font-semibold leading-[0.72] tracking-[-0.04em] text-[#f4eee3] sm:text-[104px]">
                  See
                  <br />
                  More
                </h1>
                <p className="mt-6 max-w-[330px] text-[13px] font-medium uppercase leading-[1.85] tracking-[0.44em] text-[#f4eee3]/90">
                  Premium eyewear for a brighter you
                </p>
                <a
                  href="#shop"
                  className="mt-8 inline-flex w-fit items-center gap-4 rounded-full border border-[#f4eee3]/90 px-6 py-3 text-[15px] font-medium tracking-wide text-[#f4eee3] transition-colors hover:bg-[#f4eee3] hover:text-[#343532]"
                >
                  Shop all <ArrowRight className="h-6 w-6" strokeWidth={1.4} />
                </a>
              </div>

              <p className="pointer-events-none absolute bottom-16 right-10 hidden max-w-[150px] rotate-[-8deg] font-['Caveat'] text-[42px] font-medium leading-[0.82] text-[#f4eee3] drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)] lg:block">
                Good
                <br />
                Vision
                <br />
                Better
                <br />
                Days
              </p>
            </div>
          </section>

          <section className="mx-auto max-w-[1500px] bg-[#eee9df] px-6 py-9 text-[#343532] sm:px-10">
            <div className="grid gap-8 sm:grid-cols-3 sm:divide-x sm:divide-[#cfc8bb]">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.title}
                    className="flex items-center justify-center gap-6 sm:px-6"
                  >
                    <Icon className="h-11 w-11 shrink-0" strokeWidth={1.45} />
                    <div>
                      <h3 className="font-sans text-[12px] font-bold uppercase tracking-[0.32em] text-[#343532]">
                        {benefit.title}
                      </h3>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.24em] text-[#343532]/65">
                        {benefit.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      <main id="shop" className="mx-auto max-w-[1500px] bg-[#3d3e3b] px-7 py-14 sm:px-10 sm:py-20">
        {searching && (
          <p className="mb-8 text-sm text-[#f4eee3]/70">
            Results for{" "}
            <span className="font-semibold text-[#f4eee3]">&quot;{q?.trim()}&quot;</span>
          </p>
        )}

        <div className="mb-8 flex items-end justify-between gap-6 pb-2">
          <h2 className="font-sans text-[34px] font-medium uppercase leading-none tracking-[0.18em] text-[#f4eee3] sm:text-[48px]">
            {searching ? "Search results" : active === "All" ? "Best seller" : active}
          </h2>
          {active !== "All" && (
            <button
              type="button"
              onClick={() => setActive("All")}
              className="inline-flex items-center gap-3 text-[13px] font-medium uppercase tracking-[0.28em] text-[#f4eee3]/90 transition-opacity hover:opacity-60"
            >
              View all <ArrowRight className="h-5 w-5" strokeWidth={1.4} />
            </button>
          )}
        </div>

        <nav className="-mx-1 mb-10 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {available.map((c) => (
            <button
              key={c.label}
              onClick={() => setActive(c.label)}
              className={cn(
                "shrink-0 rounded-full border px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors",
                c.label === "Offers"
                  ? active === c.label
                    ? "border-[#c45c4a] bg-[#c45c4a] text-white"
                    : "border-[#c45c4a]/70 text-[#f0c2b8] hover:bg-[#c45c4a]/20"
                  : active === c.label
                    ? "border-[#f4eee3] bg-[#f4eee3] text-[#343532]"
                    : "border-[#f4eee3]/40 text-[#f4eee3] hover:border-[#f4eee3]",
              )}
            >
              {c.label}
            </button>
          ))}
        </nav>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-[#f4eee3]/60" />
          </div>
        ) : isError ? (
          <p className="py-24 text-center text-[#f4eee3]/70">
            Couldn&apos;t load products. Please try again.
          </p>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.node.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="py-24 text-center text-[#f4eee3]/70">No products found</p>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
