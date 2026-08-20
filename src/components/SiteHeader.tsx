import { FormEvent, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
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
    <header className="sticky top-0 z-50 border-b border-[#314969] bg-[#122b4b]/95 text-[#f5efe2] backdrop-blur">
      <div className="relative mx-auto flex h-[72px] max-w-[1500px] items-center px-5 sm:px-8">
        <nav className="hidden items-center gap-7 text-[11px] font-medium uppercase tracking-[0.14em] lg:flex">
          <a href="#shop" className="transition-opacity hover:opacity-60">Collections</a>
          <a href="#shop" className="transition-opacity hover:opacity-60">Accessories</a>
          <a href="#shop" className="transition-opacity hover:opacity-60">New Arrivals</a>
        </nav>

        <Link
          to="/"
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center bg-transparent p-0"
          aria-label={STORE_NAME}
        >
          <img
            src="/vue-logo.png"
            alt={STORE_NAME}
            className="block h-10 w-auto bg-transparent object-contain sm:h-11"
          />
        </Link>

        <div className="absolute right-5 top-1/2 flex -translate-y-1/2 items-center gap-4 sm:right-8">
          <span className="hidden text-[11px] uppercase tracking-[0.12em] sm:inline">Account</span>
          <form onSubmit={handleSearch} className="hidden items-center gap-2 border-b border-[#f5efe2]/50 pb-1 sm:flex">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              aria-label="Search products"
              className="w-24 bg-transparent text-xs outline-none placeholder:text-[#f5efe2]/60"
            />
            <button type="submit" aria-label="Search products">
              <Search className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </form>
          <CartDrawer />
        </div>
      </div>
    </header>
  );
}
