# Plakçı

Last.fm, Claude Haiku ve Spotify ile albüm keşif uygulaması. Veriler Supabase'de, site GitHub Pages'te.

## Yapı

| Yol | Ne |
|---|---|
| `src/index.html` | Uygulamanın tamamı |
| `scripts/build.mjs` | `dist/` üretir; `config.js`'i ortam değişkenlerinden yazar |
| `scripts/setup.mjs` | Tek seferlik: şemayı uygular, sahip hesabını oluşturur |
| `supabase/schema.sql` | `app_state` tablosu + RLS |
| `.github/workflows/pages.yml` | `main`'e push'ta derleyip Pages'e yayınlar |

## Credential'lar

Hepsi `.env` (yerel, git'e girmez) ve GitHub Actions secret'larında durur.

- **Siteye gömülenler** (tarayıcıya gitmesi güvenli): `SUPABASE_URL`, `SUPABASE_ANON_KEY` (publishable), `PLAKCI_EMAIL`, `LASTFM_API_KEY`, `SPOTIFY_CLIENT_ID`
- **Asla siteye girmeyenler**: `PLAKCI_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`
- **Anthropic key**: yalnızca Ayarlar'dan girilir, sadece o tarayıcıda kalır ve veritabanına gönderilmez.

`build.mjs`, secret/service_role anahtarı yanlışlıkla `SUPABASE_ANON_KEY`'e yazılırsa derlemeyi durdurur.

## Kurulum

```bash
cp .env.example .env      # doldur
npm install
npm run setup             # şema + sahip hesabı
npm run dev               # http://127.0.0.1:5178
```

## Oturum ve kayıt

Site ilk açılışta şifre sorar (`PLAKCI_PASSWORD`). Supabase oturumu tarayıcıda saklanıp yenilendiği için tekrar sormaz; Ayarlar → Çıkış yap ile kapatılır. Beğeniler, favoriler, sonra dinle, puanlar, türler, prompt'lar ve önbellekler `app_state` tablosuna 1,5 sn gecikmeyle kaydedilir; başka cihazda giriş yapınca aynı veri gelir.

Spotify için Dashboard'a hem `http://127.0.0.1:5178/` hem de Pages adresini (`https://<kullanıcı>.github.io/plakci/`) Redirect URI olarak ekle.
