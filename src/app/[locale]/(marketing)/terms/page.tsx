import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

const content = {
  tr: {
    title: "Kullanım Koşulları",
    updated: "Son güncelleme: 4 Temmuz 2026",
    sections: [
      {
        heading: "Hizmet tanımı",
        body: "ReklamlarAI, kullanıcıların yükledikleri ürün görselleri, videolar veya yazdıkları kısa açıklamalar temel alınarak yapay zeka modelleriyle reklam videosu üretilmesini sağlayan bir yazılım hizmetidir (SaaS). Hizmeti kullanarak bu koşulları kabul etmiş sayılırsınız.",
      },
      {
        heading: "Krediler ve iade politikası",
        body: "Her video üretimi, seçilen yapay zeka modeline ve video süresine göre belirlenen miktarda kredi harcar. Bir üretim teknik bir hata nedeniyle başarısız olursa, harcanan krediler otomatik olarak hesabınıza iade edilir. Başarıyla tamamlanmış üretimler için kredi iadesi yapılmaz.",
      },
      {
        heading: "Ticari kullanım hakları",
        body: "Ücretli bir plana abone olan kullanıcılar, ürettikleri videoları reklam kampanyaları dahil her türlü mecrada ticari olarak kullanma hakkına sahiptir. Ücretsiz plan kapsamında üretilen filigranlı önizlemeler ticari kullanım için uygun değildir.",
      },
      {
        heading: "Abonelik ve iptal",
        body: "Abonelikler istediğiniz zaman, ek ücret ödemeden tek tıkla iptal edilebilir. İptal işlemi mevcut faturalama döneminin sonunda yürürlüğe girer; o zamana kadar hesabınızdaki krediler kullanılmaya devam edebilir.",
      },
      {
        heading: "Sorumluluk sınırlaması",
        body: "ReklamlarAI, yapay zeka tarafından üretilen içeriğin doğruluğunu, özgünlüğünü veya belirli bir amaca uygunluğunu garanti etmez. Üretilen içeriğin yayınlanmadan önce gözden geçirilmesi kullanıcının sorumluluğundadır.",
      },
    ],
  },
  en: {
    title: "Terms of Service",
    updated: "Last updated: July 4, 2026",
    sections: [
      {
        heading: "Service description",
        body: "ReklamlarAI is a software-as-a-service platform that generates advertising videos with AI models based on product images, videos, or text descriptions that users upload or write. By using the service, you agree to these terms.",
      },
      {
        heading: "Credits and refund policy",
        body: "Each video generation spends a number of credits determined by the selected AI model and the video duration. If a generation fails due to a technical error, the spent credits are automatically refunded to your account. Successfully completed generations are not eligible for a credit refund.",
      },
      {
        heading: "Commercial usage rights",
        body: "Users subscribed to a paid plan may use the videos they generate commercially in any medium, including paid advertising campaigns. Watermarked previews generated on the free plan are not suitable for commercial use.",
      },
      {
        heading: "Subscription and cancellation",
        body: "Subscriptions can be canceled at any time, with one click and no additional fees. Cancellation takes effect at the end of the current billing period; credits on your account remain usable until then.",
      },
      {
        heading: "Limitation of liability",
        body: "ReklamlarAI does not guarantee the accuracy, originality, or fitness for a particular purpose of AI-generated content. It is the user's responsibility to review generated content before publishing it.",
      },
    ],
  },
  ja: {
    title: "利用規約",
    updated: "最終更新日: 2026年7月4日",
    sections: [
      {
        heading: "サービスの概要",
        body: "ReklamlarAIは、ユーザーがアップロードした商品画像・動画、または入力した短い説明文をもとに、AIモデルで広告動画を生成するSaaS（サービスとしてのソフトウェア）です。本サービスを利用することで、本規約に同意したものとみなされます。",
      },
      {
        heading: "クレジットと返金ポリシー",
        body: "動画の生成には、選択したAIモデルと動画の長さに応じたクレジットが消費されます。技術的なエラーにより生成が失敗した場合、消費されたクレジットは自動的にアカウントへ返還されます。正常に完了した生成についてはクレジットの返金は行われません。",
      },
      {
        heading: "商用利用の権利",
        body: "有料プランに加入しているユーザーは、生成した動画を広告キャンペーンを含むあらゆる媒体で商用利用できます。無料プランで生成されたウォーターマーク付きプレビューは商用利用には適していません。",
      },
      {
        heading: "サブスクリプションと解約",
        body: "サブスクリプションは、追加料金なしでいつでもワンクリックで解約できます。解約は現在の請求期間の終了時に有効となり、それまではアカウント内のクレジットを引き続き利用できます。",
      },
      {
        heading: "責任の制限",
        body: "ReklamlarAIは、AIが生成したコンテンツの正確性、独自性、または特定目的への適合性を保証しません。生成されたコンテンツを公開する前に確認することは、ユーザーの責任です。",
      },
    ],
  },
} as const;

export default async function TermsPage({ params }: Props) {
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
