# ReklamlarAI

AI destekli reklam videosu stüdyosu. İşletmeler ürün görsellerinden veya kısa bir
açıklamadan, sektörlerine özel kurguyla saniyeler içinde reklam videosu üretir;
isteğe bağlı seslendirme ve müzik eklenir.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase — auth, Postgres (RLS), storage, realtime
- fal.ai — video / görsel / TTS / müzik üretimi (queue + webhook)
- Polar — abonelik ve kredi paketi satışı (Stripe adaptörü de mevcut)
- next-intl — TR/EN

## Geliştirme

```bash
npm install
cp .env.example .env.local   # değerleri doldurun
npm run dev
```

Veritabanı şeması `supabase/migrations/` altında; sırasıyla çalıştırın.

## Mimari notlar

- Video üretimi asenkron: iş fal.ai kuyruğuna webhook URL'siyle gönderilir,
  tamamlanınca `/api/webhooks/fal` çıktıyı Supabase Storage'a taşır.
- Krediler append-only bir defterde tutulur; rezerv/harcama/iade işlemleri
  `SECURITY DEFINER` RPC'lerle atomiktir, başarısız üretimler otomatik iade edilir.
- Model fiyatları `model_catalog` tablosunda sunucu tarafında tutulur;
  istemciden gelen maliyet değerlerine güvenilmez.
- `/api/cron/reconcile` takılı işleri süpürür (kaçan webhook telafisi).
