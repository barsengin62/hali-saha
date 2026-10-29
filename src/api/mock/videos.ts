export { youtubeId, youtubeThumbnail } from '@/lib/youtube'

/**
 * Mock maçlarda gösterilecek YouTube videoları.
 *
 * Kullanım: YouTube'da videoyu aç → adres çubuğundaki linki kopyala → aşağıya ekle.
 * Şu biçimlerin hepsi çalışır:
 *   https://www.youtube.com/watch?v=XXXXXXXXXXX
 *   https://youtu.be/XXXXXXXXXXX
 *   https://www.youtube.com/shorts/XXXXXXXXXXX
 *   XXXXXXXXXXX   (sadece 11 karakterlik kimlik)
 *
 * durationSec: videonun süresi (saniye). Maçtaki gol/asist anları bu süreye
 * yayılır; doğru girersen "videoda o ana git" tıklamaları anlamlı yerlere düşer.
 * Örn. 12:30 → 750, 1:02:00 → 3720
 *
 * Liste boşsa açık lisanslı örnek video kullanılır.
 * Videolar analiz edilmiş maçlara sırayla dağıtılır (6 maç var; daha az video
 * eklersen başa dönüp tekrar kullanılır).
 */
export const YOUTUBE_VIDEOS: { url: string; durationSec: number }[] = [
  // { url: 'https://www.youtube.com/watch?v=XXXXXXXXXXX', durationSec: 3600 },
   { url: 'https://www.youtube.com/watch?v=sWj4nD-2nVg', durationSec: 4800 },
   { url: 'https://www.youtube.com/watch?v=WxqsdASGXd0&t=1415s', durationSec: 5400 },
   { url: 'https://www.youtube.com/watch?v=jwl_m14BeL8&t=3457s', durationSec: 5100 },
]
