import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { MatchVideo } from '@/types'

export interface VideoPlayerHandle {
  /** Videoyu verilen saniyeye atlatır ve oynatır. `end` verilirse orada durur (highlight). */
  seek: (seconds: number, end?: number) => void
}

/**
 * Şimdilik düz <video>. Bunny/Mux/HLS'e geçince sadece bu bileşen değişir;
 * sayfalar `seek()` arayüzünü kullanmaya devam eder.
 */
export const VideoPlayer = forwardRef<VideoPlayerHandle, { video: MatchVideo; startAt?: number; endAt?: number }>(
  function VideoPlayer({ video, startAt, endAt }, ref) {
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
  },
)
