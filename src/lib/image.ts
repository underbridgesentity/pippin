// Produces two JPEGs from a captured frame: a small one to STORE (meal photos
// have to fit inside localStorage) and a larger, higher-quality one to ANALYZE
// (the recognizer does much better with detail, e.g. small foods or a nutrition
// label). A real backend would upload the full-resolution blob instead.

const STORE_MAX = 360
const STORE_QUALITY = 0.55
const ANALYZE_MAX = 1024
const ANALYZE_QUALITY = 0.82

export type Frames = { display: string; analysis: string }

function draw(source: CanvasImageSource, w: number, h: number, max: number, quality: number): string {
  const scale = Math.min(1, max / Math.max(w, h))
  const cw = Math.round(w * scale)
  const ch = Math.round(h * scale)
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(source, 0, 0, cw, ch)
  return canvas.toDataURL('image/jpeg', quality)
}

function frames(source: CanvasImageSource, w: number, h: number): Frames {
  return {
    display: draw(source, w, h, STORE_MAX, STORE_QUALITY),
    analysis: draw(source, w, h, ANALYZE_MAX, ANALYZE_QUALITY),
  }
}

export function frameFromVideo(video: HTMLVideoElement): Frames {
  return frames(video, video.videoWidth || STORE_MAX, video.videoHeight || STORE_MAX)
}

/** Build both frames from a data URL (native camera returns a full-res dataUrl). */
export function framesFromDataUrl(dataUrl: string): Promise<Frames> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        resolve(frames(img, img.naturalWidth, img.naturalHeight))
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = () => reject(new Error('Could not read image'))
    img.src = dataUrl
  })
}

export function dataUrlFromFile(file: File): Promise<Frames> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      try {
        resolve(frames(img, img.naturalWidth, img.naturalHeight))
      } catch (e) {
        reject(e)
      } finally {
        URL.revokeObjectURL(url)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read image'))
    }
    img.src = url
  })
}
