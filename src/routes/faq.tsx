import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";
import { WHATSAPP_NUMBER, STORE_NAME } from "@/config/store";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: `الأسئلة الشائعة — ${STORE_NAME}` },
      { name: "description", content: "إجابات عن أكثر الأسئلة تكراراً حول المقاسات والتوصيل والدفع وطريقة الطلب." },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}`;

  return (
    <PolicyPage
      title="الأسئلة الشائعة"
      updated="أغسطس 2025"
      sections={[
        {
          number: 1,
          title: "كيف أطلب من الموقع؟",
          body: (
            <p>
              اختر المنتج والمقاس واللون وأضفه للسلة، ثم اضغط "إتمام الطلب" وعبّي بياناتك (الاسم، رقم الواتساب،
              والعنوان). بعد تأكيد الطلب راح تظهر لك تفاصيل الدفع عبر BenefitPay، وبعد التحويل أرسل إيصال الدفع لنا
              عبر واتساب لتأكيد طلبك وتجهيزه للشحن.
            </p>
          ),
        },
        {
          number: 2,
          title: "كيف أختار المقاس الصحيح؟",
          body: (
            <p>
              كل منتج فيه جدول مقاسات ضمن صور المنتج (يبين الطول والعرض بالسنتيمتر). لو محتاج مساعدة زيادة في اختيار
              المقاس المناسب، تواصل معنا على{" "}
              <a href={waLink} target="_blank" rel="noreferrer" className="text-primary underline">
                واتساب
              </a>{" "}
              قبل ما تطلب.
            </p>
          ),
        },
        {
          number: 3,
          title: "كم مدة التوصيل؟",
          body: <p>التوصيل داخل البحرين خلال 8 إلى 15 يوم من تأكيد الطلب. التوصيل حالياً مجاني على جميع الطلبات.</p>,
        },
        {
          number: 4,
          title: "شنو طرق الدفع المتاحة؟",
          body: (
            <p>
              الدفع متاح حالياً عن طريق <strong>BenefitPay فقط</strong>. بعد تأكيد طلبك راح تظهر لك تفاصيل الدفع،
              وبعد إتمام التحويل أرسل صورة إيصال الدفع عبر واتساب لتأكيد الطلب. لا يتوفر التحويل البنكي كطريقة دفع.
            </p>
          ),
        },
        {
          number: 5,
          title: "كيف أعرف إن طلبي تأكد؟",
          body: <p>بعد ما تكمل بياناتك وتتم عملية الدفع عبر BenefitPay وترسل إيصال الدفع على واتساب، فريقنا يراجع الطلب ويؤكده قبل الشحن.</p>,
        },
        {
          number: 6,
          title: "هل تقدرون تستبدلون أو ترجعون منتج؟",
          body: (
            <p>
              لا يوجد استرجاع للمنتجات حالياً — شوف صفحة{" "}
              <a href="/returns" className="text-primary underline">
                الاسترجاع والاستبدال
              </a>{" "}
              لمزيد من التفاصيل.
            </p>
          ),
        },
        {
          number: 7,
          title: "عندي سؤال ثاني، كيف أتواصل معكم؟",
          body: (
            <p>
              تواصل معنا في أي وقت عبر{" "}
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
