import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

const content = {
  tr: {
    title: "Gizlilik Politikası",
    updated: "Son güncelleme: 4 Temmuz 2026",
    sections: [
      {
        heading: "Topladığımız veriler",
        body: "Hesap bilgilerinizi (ad, e-posta), yüklediğiniz ürün görseli veya video dosyalarını, oluşturduğunuz reklam videolarının üretim geçmişini ve faturalama işlemlerinize ait meta verileri topluyoruz.",
      },
      {
        heading: "Kullandığımız hizmet sağlayıcılar",
        body: "Kimlik doğrulama, veritabanı ve dosya depolama için Supabase'i; reklam videolarınızın yapay zeka ile üretilmesi için fal.ai gibi model altyapı sağlayıcılarını kullanıyoruz. Bu sağlayıcılar verilerinizi yalnızca hizmeti sunmak amacıyla işler.",
      },
      {
        heading: "Verilerinizi satmıyoruz",
        body: "Kişisel verileriniz hiçbir koşulda üçüncü taraflara satılmaz, kiralanmaz veya pazarlama amacıyla paylaşılmaz.",
      },
      {
        heading: "Veri saklama",
        body: "Yüklediğiniz medya dosyaları ve ürettiğiniz videolar, hesabınız aktif olduğu sürece saklanır. Hesabınızın silinmesini talep ettiğinizde verileriniz makul bir süre içinde sistemlerimizden kaldırılır.",
      },
      {
        heading: "İletişim",
        body: "Gizlilikle ilgili sorularınız veya talepleriniz için bize privacy@reklamai.com adresinden ulaşabilirsiniz.",
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    updated: "Last updated: July 4, 2026",
    sections: [
      {
        heading: "Data we collect",
        body: "We collect your account information (name, email), the product images or videos you upload, the generation history of your ad videos, and metadata related to your billing transactions.",
      },
      {
        heading: "Service providers we use",
        body: "We use Supabase for authentication, database, and file storage, and model infrastructure providers such as fal.ai to generate your ad videos with AI. These providers process your data solely to deliver the service.",
      },
      {
        heading: "We do not sell your data",
        body: "Your personal data is never sold, rented, or shared with third parties for marketing purposes, under any circumstances.",
      },
      {
        heading: "Data retention",
        body: "Media files you upload and videos you generate are retained for as long as your account remains active. If you request account deletion, your data is removed from our systems within a reasonable timeframe.",
      },
      {
        heading: "Contact",
        body: "For any privacy-related questions or requests, you can reach us at privacy@reklamai.com.",
      },
    ],
  },
} as const;

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const data = locale === "en" ? content.en : content.tr;

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h1 className="text-4xl font-bold text-ink-900">{data.title}</h1>
      <p className="mt-2 text-sm text-ink-400">{data.updated}</p>
      <div className="mt-10 space-y-8">
        {data.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-semibold text-ink-900">{section.heading}</h2>
            <p className="mt-2 text-ink-600">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
