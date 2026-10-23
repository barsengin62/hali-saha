# Halı Saha — Web (React + Tailwind)

Maç videolarından çıkarılan istatistikleri (gol, asist, kurtarış…) kullanıcılara gösteren arayüz.
Veri girişi Laravel + Filament admin panelinden yapılır; bu proje kullanıcı tarafıdır.

## Kurulum

```bash
npm install
cp .env.example .env   # VITE_USE_MOCK=true ile backend olmadan çalışır
npm run dev            # http://localhost:5173
```

Demo modunda herhangi bir e-posta ve en az 6 karakterli bir şifreyle giriş yapabilirsin.

## Teknoloji

| Paket | Kullanım |
|---|---|
| Vite + React 19 + TypeScript | Uygulama iskeleti |
| Tailwind CSS v4 | Stil (`src/index.css` içinde tema token'ları, açık/koyu mod) |
| shadcn/ui uyumlu bileşenler | `src/components/ui` (aynı API, `npx shadcn add …` ile değiştirilebilir) |
| React Router 7 | Sayfa yönlendirme, korumalı rotalar |
| Redux Toolkit | Oturum ve kullanıcı ayarları (`src/store`) |
| Axios | Laravel Sanctum ile cookie tabanlı API istemcisi |
| react-i18next | Türkçe / Almanca / İngilizce |
| `.env` (Vite) | `VITE_API_URL`, `VITE_USE_MOCK` |

## Klasör yapısı

```
src/
  api/
    client.ts        axios + Sanctum CSRF + 401 yakalama
    index.ts         tek API yüzeyi (mock ↔ gerçek otomatik seçilir)
    mock/            sahte veri ve hesaplamalar (puan durumu, gol krallığı)
  components/
    ui/              Button, Input, Card… (shadcn tarzı)
    layout/          AppLayout, AuthLayout, ProtectedRoute/GuestRoute
    MatchCard, HighlightCard, Leaderboard, TeamBadge, AsyncState
  features/
    auth/            Login, Şifremi unuttum, Şifre sıfırlama
    home/            Son maçlar, highlight'lar, gol krallığı
    matches/         Maç detayı: video + maç akışı + istatistik + kadrolar
    organizations/   Liste, puan durumu, dinamik istatistik liderlik tablosu
    players/         Oyuncu kartı ve toplam istatistikler
    highlights/      Önemli anlar akışı
    profile/         Profil + (oyuncuya bağlıysa) kendi istatistikleri
    settings/        Dil, tema, bildirim, şifre değiştirme
  hooks/useAsync.ts  basit veri çekme (ileride RTK Query'ye taşınabilir)
  i18n/              tr / de / en çevirileri
  types/             Laravel API Resource'larıyla eşleşen tipler
```

## Rotalar

| Yol | Erişim |
|---|---|
| `/login`, `/forgot-password` | Sadece misafir |
| `/reset-password/:token?email=` | Herkes |
| `/`, `/organizations`, `/organizations/:slug`, `/matches/:id`, `/players/:id`, `/highlights` | Giriş gerekli |
| `/profile`, `/settings` | Giriş gerekli |

`/matches/:id?t=120&end=132` → video 120. saniyeden başlar, 132'de durur (highlight oynatma).

## Video ve highlight mantığı

- Her olay (`match_events`) `video_time_sec` taşır. Maç akışında bir olaya tıklayınca video o ana (5 sn öncesine) atlar.
- Highlight'lar ayrı dosya değil, ana videonun `start_sec`–`end_sec` aralığıdır. Ayrı klip üretmek gerekirse
  Laravel tarafında FFmpeg kuyruğu eklenir; frontend değişmez.
- Oynatıcı `features/matches/VideoPlayer.tsx` içinde. Bunny Stream / HLS'e geçince sadece bu dosya değişir.

## Laravel'e bağlanırken

1. `.env` → `VITE_USE_MOCK=false`
2. Laravel: Sanctum (SPA) + Fortify kur. `config/sanctum.php` → `stateful` içine `localhost:5173` ekle,
   `config/cors.php` → `supports_credentials => true`.
3. `vite.config.ts` içindeki proxy, `/api`, `/sanctum`, `/login`… isteklerini `localhost:8000`'e yönlendirir.
4. Beklenen endpoint'ler ve JSON şekilleri: `src/api/index.ts` ve `src/types/index.ts`.
5. Şifre sıfırlama e-postasındaki linki frontend'e çevirmek için `AppServiceProvider` içinde:
   ```php
   ResetPassword::createUrlUsing(fn ($user, string $token) =>
       config('app.frontend_url')."/reset-password/{$token}?email=".urlencode($user->email));
   ```

## Örnek video

Mock veride açık lisanslı örnek video kullanılır (Big Buck Bunny, © Blender Foundation, CC BY 3.0).
