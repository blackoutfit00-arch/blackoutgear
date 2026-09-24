import { Link } from "@tanstack/react-router";
import { STORE_NAME, WHATSAPP_NUMBER } from "@/config/store";

const INSTAGRAM_HANDLE = "blackoutgear.bh";

const CUSTOMER_CARE_LINKS = [
  { label: "FAQs", to: "/faq" as const },
  { label: "Returns & Replacements", to: "/returns" as const },
  { label: "Privacy Policy", to: "/privacy" as const },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-8 py-14 sm:px-10 sm:py-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2">
          <div>
            <p className="label-caps text-[10px] font-bold text-foreground">Customer Care</p>
            <ul className="mt-7 space-y-5">
              {CUSTOMER_CARE_LINKS.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="label-caps text-[10px] font-bold text-foreground">Connect</p>
            <ul className="mt-7 space-y-5">
              <li>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  WhatsApp · +973 3532 9797
                </a>
              </li>
              <li>
                <a
                  href={`https://instagram.com/${INSTAGRAM_HANDLE}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Instagram · @{INSTAGRAM_HANDLE}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-9">
          <p className="max-w-xl text-[11px] italic leading-relaxed text-muted-foreground">
            {STORE_NAME.toUpperCase()} is an independent retailer. All trademarks belong to their respective owners.
          </p>
          <p className="mt-5 text-[9px] uppercase text-muted-foreground">© 2026 {STORE_NAME}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
