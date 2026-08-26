import { FormEvent, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, Search, UserRound } from "lucide-react";
import { CartDrawer } from "@/components/CartDrawer";
import { STORE_NAME } from "@/config/store";

export function SiteHeader() {
  const [query, setQuery] = useState("");

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = query.trim();
    window.location.href = value ? `/?q=${encodeURIComponent(value)}` : "/";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#343532]/95 text-[#f4eee3] shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur">
      <div className="relative mx-auto flex h-[86px] max-w-[1500px] items-center justify-between px-7 sm:h-[104px] sm:px-10">
        <div className="flex items-center gap-7">
          <button aria-label="Open menu" className="transition-opacity hover:opacity-60">
            <Menu className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={1.35} />
          </button>

          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <button type="submit" aria-label="Search products" className="transition-opacity hover:opacity-60">
              <Search className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={1.35} />
            </button>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              aria-label="Search products"
              className="hidden w-28 bg-transparent text-xs uppercase tracking-[0.18em] outline-none placeholder:text-[#f4eee3]/55 md:block"
            />
          </form>
        </div>

        <Link
          to="/"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-[44px] font-semibold leading-none tracking-[0.08em] text-[#f4eee3] sm:text-[64px]"
          aria-label={STORE_NAME}
        >
          VUE
        </Link>

        <div className="flex items-center gap-6 sm:gap-8">
          <Link to="/" aria-label="Account" className="transition-opacity hover:opacity-60">
            <UserRound className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={1.35} />
          </Link>
          <CartDrawer />
        </div>
      </div>
    </header>
  );
}
