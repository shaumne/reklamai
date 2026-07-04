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
        body: "Gizlilikle ilgili sorularınız veya talepleriniz için bize privacy@reklamlarai.com adresinden ulaşabilirsiniz.",
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
        body: "For any privacy-related questions or requests, you can reach us at privacy@reklamlarai.com.",
      },
    ],
  },
  ja: {
    title: "プライバシーポリシー",
    updated: "最終更新日: 2026年7月4日",
    sections: [
      {
        heading: "収集する情報",
        body: "アカウント情報（氏名、メールアドレス）、アップロードされた商品画像や動画ファイル、広告動画の生成履歴、および請求処理に関するメタデータを収集します。",
      },
      {
        heading: "利用しているサービスプロバイダー",
        body: "認証・データベース・ファイル保存にはSupabaseを、広告動画のAI生成にはfal.aiなどのモデル基盤プロバイダーを利用しています。これらのプロバイダーは、サービス提供の目的でのみお客様のデータを処理します。",
      },
      {
        heading: "データを販売しません",
        body: "お客様の個人データを第三者に販売・貸与すること、またはマーケティング目的で共有することは、いかなる場合もありません。",
      },
      {
        heading: "データの保持",
        body: "アップロードされたメディアファイルと生成された動画は、アカウントが有効な間保持されます。アカウントの削除をご希望の場合、合理的な期間内にデータをシステムから削除します。",
      },
      {
        heading: "お問い合わせ",
        body: "プライバシーに関するご質問やご要望は、privacy@reklamlarai.com までご連絡ください。",
      },
    ],
  },
} as const;

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const data = locale === "en" ? content.en : locale === "ja" ? content.ja : content.tr;

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
