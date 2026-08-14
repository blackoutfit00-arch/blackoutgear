import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Menu, Search } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES } from "@/config/categories";
import { STORE_NAME } from "@/config/store";

export function SiteMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const goToCategory = (category: (typeof CATEGORIES)[number]) => {
    setIsOpen(false);
    navigate({ to: "/category/$slug", params: { slug: category.slug } });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpen(false);
    navigate({ to: "/", search: { q: query.trim() || undefined } });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-sm">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Search products and browse categories</SheetDescription>

        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <img src="/bg-logo-header.png" alt={STORE_NAME} className="h-8 w-auto object-contain" />
        </div>

        <form onSubmit={handleSearch} className="border-b border-border p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="h-11 rounded-full pl-9"
            />
          </div>
        </form>

        <nav className="flex-1 overflow-y-auto px-2 py-2">
          <button
            onClick={() => { setIsOpen(false); navigate({ to: "/", search: { q: undefined } }); }}
            className="label-caps block w-full px-4 py-3.5 text-left text-sm tracking-wide text-foreground transition-colors hover:text-primary"
          >
            Home
          </button>
          <button
            onClick={() => goToCategory(CATEGORIES.find((c) => c.slug === "all")!)}
            className="label-caps block w-full px-4 py-3.5 text-left text-sm tracking-wide text-foreground transition-colors hover:text-primary"
          >
            All Products
          </button>
          <div className="my-1 border-t border-border" />
          {CATEGORIES.filter((c) => c.slug !== "all").map((c) => (
            <button
              key={c.label}
              onClick={() => goToCategory(c)}
              className="label-caps block w-full px-4 py-3.5 text-left text-sm tracking-wide text-foreground transition-colors hover:text-primary"
            >
              {c.label}
            </button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
