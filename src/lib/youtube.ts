/** YouTube link yardımcıları */

/** Linkten 11 karakterlik YouTube video kimliğini çıkarır. Bulamazsa null. */
export function youtubeId(input: string): string | null {
  const trimmed = input.trim()
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed
  try {
    const url = new URL(trimmed)
    if (url.hostname === 'youtu.be') return url.pathname.slice(1, 12) || null
    const v = url.searchParams.get('v')
    if (v) return v
    const m = /\/(?:shorts|embed|live)\/([\w-]{11})/.exec(url.pathname)
    return m ? m[1] : null
  } catch {
    return null
  }
}

export function youtubeThumbnail(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}
