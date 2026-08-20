import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";
import { WHATSAPP_NUMBER, STORE_NAME } from "@/config/store";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: `الاسترجاع والاستبدال — ${STORE_NAME}` },
      { name: "description", content: "سياسة الاسترجاع والاستبدال في متجر Vue." },
    ],
  }),
  component: ReturnsPage,
});

function ReturnsPage() {
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}`;

  return (
    <PolicyPage
      title="الاسترجاع والاستبدال"
      updated="أغسطس 2025"
      sections={[
        {
          number: 1,
          title: "التوصيل",
          body: <p>التوصيل خلال 8 إلى 15 يوم من تأكيد الطلب. يرجى معاينة المنتج قبل الاستلام النهائي.</p>,
        },
        {
          number: 2,
          title: "الاسترجاع",
          body: <p>لا يوجد استرجاع للمنتجات بعد إتمام الطلب.</p>,
        },
        {
          number: 3,
          title: "الاستبدال",
          body: (
            <p>
              لا يوجد استبدال للمنتجات بعد إتمام الطلب. يرجى التأكد من مقاس الإطار ولون النظارة ونوع العدسة بعناية
              قبل تأكيد الطلب، بالرجوع لتفاصيل كل منتج.
            </p>
          ),
        },
        {
          number: 4,
          title: "للاستفسارات",
          body: (
            <p>
              لأي استفسار بخصوص طلبك يرجى التواصل معنا عبر{" "}
              <a href={waLink} target="_blank" rel="noreferrer" className="text-primary underline">
                واتساب
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
