// Downscales a captured image to a small JPEG data-URL so meal photos fit inside
// localStorage. (A backend would upload the full-resolution blob instead.)

const MAX = 360
const QUALITY = 0.55

function drawToDataUrl(source: CanvasImageSource, w: number, h: number): string {
  const scale = Math.min(1, MAX / Math.max(w, h))
  const cw = Math.round(w * scale)
  const ch = Math.round(h * scale)
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(source, 0, 0, cw, ch)
  return canvas.toDataURL('image/jpeg', QUALITY)
}

export function frameFromVideo(video: HTMLVideoElement): string {
  return drawToDataUrl(video, video.videoWidth || MAX, video.videoHeight || MAX)
}

export function dataUrlFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      try {
        resolve(drawToDataUrl(img, img.naturalWidth, img.naturalHeight))
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
