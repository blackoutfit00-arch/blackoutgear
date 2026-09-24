import { Link } from "@tanstack/react-router";
import { CartDrawer } from "@/components/CartDrawer";
import { SearchButton } from "@/components/SearchButton";
import { SiteMenu } from "@/components/SiteMenu";
import { STORE_NAME } from "@/config/store";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-header text-header-foreground">
      <div className="mx-auto grid h-24 max-w-7xl grid-cols-3 items-center px-5 sm:h-28 sm:px-8">
        <div className="flex items-center gap-2 sm:gap-5">
          <SiteMenu />
          <SearchButton />
        </div>
        <Link to="/" className="flex items-center justify-center">
          <img src="/bg-logo-header.png" alt={STORE_NAME} className="h-11 w-auto object-contain sm:h-14" />
        </Link>
        <div className="flex items-center justify-end">
          <CartDrawer />
        </div>
      </div>
    </header>
  );
}
