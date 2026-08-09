import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export interface PolicySection {
  number: number;
  title: string;
  body: ReactNode;
}

export function PolicyPage({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: PolicySection[];
}) {
  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">آخر تحديث: {updated}</p>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.number}>
              <span className="label-caps inline-block rounded-md bg-foreground px-4 py-1.5 text-xs text-background">
                {section.number}. {section.title}
              </span>
              <div className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/90">{section.body}</div>
            </section>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
