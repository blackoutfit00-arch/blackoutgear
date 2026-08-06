import { Link } from "@tanstack/react-router";
import { CartDrawer } from "@/components/CartDrawer";
import { STORE_NAME } from "@/config/store";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link to="/" className="label-caps text-2xl leading-none">
          {STORE_NAME}
        </Link>
        <CartDrawer />
      </div>
    </header>
  );
}
