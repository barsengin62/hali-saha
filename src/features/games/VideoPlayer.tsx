import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { youtubeId } from '@/lib/youtube'
import type { GameVideo } from '@/types'

export interface VideoPlayerHandle {
  /** Videoyu verilen saniyeye atlatır ve oynatır. `end` verilirse orada durur (highlight). */
  seek: (seconds: number, end?: number) => void
}

interface Props {
  video: GameVideo
  startAt?: number
  endAt?: number
}

/**
 * Sağlayıcıya göre doğru oynatıcıyı seçer. Sayfalar sadece `seek()` arayüzünü
 * kullanır; YouTube, dosya veya ileride Bunny/HLS fark etmez.
 */
export const VideoPlayer = forwardRef<VideoPlayerHandle, Props>(function VideoPlayer(props, ref) {
  return props.video.provider === 'youtube' ? <YouTubePlayer {...props} ref={ref} /> : <FilePlayer {...props} ref={ref} />
})

// ---------------------------------------------------------------------------
// Düz video dosyası (<video>)
// ---------------------------------------------------------------------------
const FilePlayer = forwardRef<VideoPlayerHandle, Props>(function FilePlayer({ video, startAt, endAt }, ref) {
  const el = useRef<HTMLVideoElement>(null)
  const stopAt = useRef<number | undefined>(endAt)

  useImperativeHandle(ref, () => ({
    seek(seconds, end) {
      const v = el.current
      if (!v) return
      stopAt.current = end
      v.currentTime = seconds
      void v.play().catch(() => {
        /* tarayıcı otomatik oynatmayı engelleyebilir; sorun değil */
      })
      v.scrollIntoView({ behavior: 'smooth', block: 'center' })
    },
  }))

  // URL'de ?t= varsa video hazır olunca oraya git
  useEffect(() => {
    const v = el.current
    if (!v || startAt === undefined) return
    const go = () => {
      v.currentTime = startAt
    }
    if (v.readyState >= 1) go()
    else v.addEventListener('loadedmetadata', go, { once: true })
    return () => v.removeEventListener('loadedmetadata', go)
  }, [startAt])

  function onTimeUpdate() {
    const v = el.current
    if (v && stopAt.current !== undefined && v.currentTime >= stopAt.current) {
      v.pause()
      stopAt.current = undefined
    }
  }

  return (
    <video
      ref={el}
      src={video.url}
      controls
      preload="metadata"
      playsInline
      onTimeUpdate={onTimeUpdate}
      className="aspect-video w-full rounded-lg bg-black"
    />
  )
})

// ---------------------------------------------------------------------------
// YouTube (resmi IFrame Player API — gömme, YouTube kullanım koşullarına uygundur)
// ---------------------------------------------------------------------------

/** IFrame API'nin kullandığımız küçük kısmı */
interface YTPlayer {
  seekTo(seconds: number, allowSeekAhead: boolean): void
  playVideo(): void
  pauseVideo(): void
  getCurrentTime(): number
  destroy(): void
}
interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string
      host?: string
      width?: string
      height?: string
      playerVars?: Record<string, number | string>
      events?: { onReady?: () => void }
    },
  ) => YTPlayer
}
declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

/** API betiğini bir kez yükler; birden fazla oynatıcı aynı Promise'i bekler. */
let ytApiPromise: Promise<YTNamespace> | null = null
function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        previous?.()
        resolve(window.YT!)
      }
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      document.head.appendChild(script)
    })
  }
  return ytApiPromise
}

const YouTubePlayer = forwardRef<VideoPlayerHandle, Props>(function YouTubePlayer({ video, startAt, endAt }, ref) {
  const container = useRef<HTMLDivElement>(null)
  const wrapper = useRef<HTMLDivElement>(null)
  const player = useRef<YTPlayer | null>(null)
  const ready = useRef(false)
  const pendingSeek = useRef<{ seconds: number; end?: number } | null>(null)
  const stopAt = useRef<number | undefined>(endAt)
  const id = video.youtube_id ?? youtubeId(video.url)

  // Oynatıcıyı oluştur / video değişince yeniden kur
  useEffect(() => {
    if (!id || !container.current) return
    let cancelled = false
    const mount = document.createElement('div')
    container.current.replaceChildren(mount)

    loadYouTubeApi().then((YT) => {
      if (cancelled) return
      player.current = new YT.Player(mount, {
        videoId: id,
        host: 'https://www.youtube-nocookie.com', // çerezsiz gömme modu
        width: '100%',
        height: '100%',
        playerVars: {
          start: Math.floor(startAt ?? 0),
          rel: 0,
          playsinline: 1,
          modestbranding: 1,
        },
        events: {
          onReady: () => {
            ready.current = true
            if (pendingSeek.current) {
              const { seconds, end } = pendingSeek.current
              pendingSeek.current = null
              doSeek(seconds, end)
            }
          },
        },
      })
    })

    return () => {
      cancelled = true
      ready.current = false
      player.current?.destroy()
      player.current = null
    }
    // startAt sadece ilk kurulumda kullanılır
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Highlight bitişinde durdur: IFrame API'de timeupdate olayı yok, yokluyoruz
  useEffect(() => {
    const timer = window.setInterval(() => {
      const p = player.current
      if (!p || !ready.current || stopAt.current === undefined) return
      if (p.getCurrentTime() >= stopAt.current) {
        p.pauseVideo()
        stopAt.current = undefined
      }
    }, 300)
    return () => window.clearInterval(timer)
  }, [])

  function doSeek(seconds: number, end?: number) {
    stopAt.current = end
    player.current?.seekTo(seconds, true)
    player.current?.playVideo()
  }

  useImperativeHandle(ref, () => ({
    seek(seconds, end) {
      wrapper.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      if (ready.current) doSeek(seconds, end)
      else pendingSeek.current = { seconds, end }
    },
  }))

  if (!id) {
    return (
      <div className="grid aspect-video w-full place-items-center rounded-lg bg-black text-sm text-white/70">
        Geçersiz YouTube linki
      </div>
    )
  }

  return (
    <div ref={wrapper} className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <div ref={container} className="h-full w-full [&>iframe]:h-full [&>iframe]:w-full" />
    </div>
  )
})
