// Renders a shareable "story" card for a meal onto a canvas (1080x1920, the
// standard vertical story size). Drawn with the Canvas 2D API so it uses the
// page's real fonts and needs no extra libraries; Pip is rasterised from a
// self-contained SVG (shapes only, so it renders faithfully). The same canvas
// backs both the on-screen preview and the exported PNG, so what you approve is
// exactly what gets saved or shared.
import type { MealEntry } from './types'
import type { Celebration } from './store'

const W = 1080
const H = 1920
const BG = '#F1EDE4'
const INK = '#231E16'
const DIM = '#736D60'
const ACCENT = '#2FC36B'
const AMBER = '#FF9F43'
const BLUE = '#4F9DF7'
const DISPLAY = '"Bricolage Grotesque"'
const BODY = '"Hanken Grotesk"'

// Pip built as a self-contained SVG string (no external fonts) so it rasterises
// faithfully onto the canvas. mood + stage mirror the Mascot component.
const PIP_BASE = '<ellipse cx="47" cy="105" rx="11" ry="6.5" fill="#1FA557"/><ellipse cx="73" cy="105" rx="11" ry="6.5" fill="#1FA557"/><path d="M24 72c-9 1-14 7-12 15 8 0 14-5 17-10z" fill="#1FA557"/><path d="M96 72c9 1 14 7 12 15-8 0-14-5-17-10z" fill="#1FA557"/><path d="M60 24C83 24 100 42 100 66c0 23-18 40-40 40S20 89 20 66C20 42 37 24 60 24Z" fill="#37C76F"/><path d="M60 106c-20 0-35-13-39-31 9 13 23 18 39 18s30-5 39-18c-4 18-19 31-39 31z" fill="#1FA557" opacity=".25"/><ellipse cx="44" cy="48" rx="16" ry="12" fill="#fff" opacity=".22"/><circle cx="33" cy="42" r="4" fill="#fff" opacity=".3"/><path d="M60 26C60 18 60 12 62 8" stroke="#9A6A44" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M63 13c8-9 22-9 29-5-4 12-18 16-30 9z" fill="#5FD98C"/>'
const PIP_CHEEKS = '<circle cx="34" cy="74" r="7.5" fill="#FF8FA3" opacity=".5"/><circle cx="86" cy="74" r="7.5" fill="#FF8FA3" opacity=".5"/>'
const FACE_HAPPY = '<circle cx="48" cy="60" r="13" fill="#fff"/><circle cx="72" cy="60" r="13" fill="#fff"/><circle cx="50" cy="62" r="6.4" fill="#24372F"/><circle cx="74" cy="62" r="6.4" fill="#24372F"/><circle cx="48" cy="59.5" r="2.4" fill="#fff"/><circle cx="72" cy="59.5" r="2.4" fill="#fff"/><path d="M49 79c3 10 19 10 22 0-4 7-18 7-22 0z" fill="#2B3A33"/><path d="M55 85c1-3 9-3 10 0 0 3-2 5-5 5s-5-2-5-5z" fill="#FF6F8B"/>'
const FACE_CHEER = '<path d="M41 62 Q48 52 55 62" stroke="#24372F" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M65 62 Q72 52 79 62" stroke="#24372F" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M46 78c4 12 24 12 28 0-6 8-22 8-28 0z" fill="#2B3A33"/><path d="M54 84c1.5-3.5 10.5-3.5 12 0 0 3.5-2.5 6-6 6s-6-2.5-6-6z" fill="#FF6F8B"/><path d="M28 40l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="#FFC93C"/><path d="M93 47l1.3 3.3 3.3 1.3-3.3 1.3-1.3 3.3-1.3-3.3-3.3-1.3 3.3-1.3z" fill="#FFC93C"/>'
const BLOOM = '<circle cx="42" cy="20" r="5" fill="#FF9FD0"/><circle cx="36.5" cy="27.6" r="5" fill="#FF9FD0"/><circle cx="27.5" cy="24.7" r="5" fill="#FF9FD0"/><circle cx="27.5" cy="15.3" r="5" fill="#FF9FD0"/><circle cx="36.5" cy="12.4" r="5" fill="#FF9FD0"/><circle cx="34" cy="20" r="4.5" fill="#FFC93C"/>'
const CROWN = '<path d="M40 24l3-12 8 7 9-11 9 11 8-7 3 12z" fill="#FFC93C" stroke="#E8A91F" stroke-width="2" stroke-linejoin="round"/>'

function pipSvg(mood: 'happy' | 'cheer', stage: string): string {
  const flourish = stage === 'Bloomer' ? BLOOM : stage === 'Legend' ? CROWN : ''
  const face = mood === 'cheer' ? FACE_CHEER : FACE_HAPPY
  return `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">${PIP_BASE}${flourish}${face}${PIP_CHEEKS}</svg>`
}

function loadPip(mood: 'happy' | 'cheer', stage: string): Promise<HTMLImageElement> {
  return loadImage('data:image/svg+xml;utf8,' + encodeURIComponent(pipSvg(mood, stage)))
}

export type StoryOptions = { meal: MealEntry; name: string; showMacros: boolean; showName: boolean }

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// object-fit: cover, drawn into the given rect.
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
}

function drawFallback(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, emoji: string) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h)
  g.addColorStop(0, '#DFF3E6')
  g.addColorStop(1, '#EBE4D6')
  ctx.fillStyle = g
  ctx.fillRect(x, y, w, h)
  ctx.font = '360px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, x + w / 2, y + h / 2)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

function drawPill(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
  ctx.font = `700 34px ${BODY}`
  const tw = ctx.measureText(text).width
  const padX = 28
  const h = 68
  ctx.fillStyle = 'rgba(20,15,8,0.55)'
  roundRect(ctx, x, y, tw + padX * 2, h, h / 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + padX, y + h / 2 + 2)
  ctx.textBaseline = 'alphabetic'
}

function drawMacro(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, grams: number, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x + 12, y - 16, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = INK
  ctx.font = `700 46px ${BODY}`
  ctx.fillText(`${Math.round(grams)}g`, x + 36, y)
  ctx.fillStyle = DIM
  ctx.font = `700 28px ${BODY}`
  ctx.fillText(label, x + 36, y + 40)
}

function firstName(name: string): string {
  return (name || 'You').trim().split(/\s+/)[0]
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function dateLabel(at: number): string {
  const d = new Date(at)
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export async function renderMealStory(canvas: HTMLCanvasElement, opts: StoryOptions) {
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  // Ensure the brand fonts are ready before any fillText.
  try {
    await Promise.all([document.fonts.load(`600 100px ${DISPLAY}`), document.fonts.load(`700 100px ${BODY}`)])
  } catch {
    /* fall back to system fonts */
  }

  const { meal } = opts
  const macros = meal.items.reduce((a, i) => ({ p: a.p + i.protein, c: a.c + i.carbs, f: a.f + i.fat }), { p: 0, c: 0, f: 0 })
  const title = meal.items.length === 1 ? meal.items[0].name : `${meal.items[0]?.name ?? 'Meal'} +${meal.items.length - 1}`
  const emoji = meal.items[0]?.emoji ?? '🍽️'

  ctx.fillStyle = BG
  ctx.fillRect(0, 0, W, H)

  // Hero photo (or a branded fallback when the meal has no photo).
  const M = 56
  const pw = W - 2 * M
  const ph = 1160
  ctx.save()
  roundRect(ctx, M, M, pw, ph, 56)
  ctx.clip()
  if (meal.photo) {
    try {
      drawCover(ctx, await loadImage(meal.photo), M, M, pw, ph)
    } catch {
      drawFallback(ctx, M, M, pw, ph, emoji)
    }
  } else {
    drawFallback(ctx, M, M, pw, ph, emoji)
  }
  ctx.restore()

  if (opts.showName) drawPill(ctx, M + 36, M + 36, `${firstName(opts.name)} · ${dateLabel(meal.at)}`)

  // Info block below the photo.
  let y = M + ph + 96
  ctx.fillStyle = DIM
  ctx.font = `700 30px ${BODY}`
  ctx.fillText(`${meal.type.toUpperCase()}  ·  PIPPIN`, M + 6, y)

  y += 30
  ctx.fillStyle = INK
  ctx.font = `700 210px ${DISPLAY}`
  const kcalStr = String(meal.kcal)
  ctx.fillText(kcalStr, M, y + 185)
  const kcalW = ctx.measureText(kcalStr).width
  ctx.fillStyle = DIM
  ctx.font = `700 56px ${BODY}`
  ctx.fillText('kcal', M + kcalW + 26, y + 185)

  y += 265
  ctx.fillStyle = INK
  ctx.font = `600 58px ${DISPLAY}`
  ctx.fillText(title.length > 22 ? title.slice(0, 21) + '…' : title, M, y)

  if (opts.showMacros) {
    y += 96
    drawMacro(ctx, M, y, 'Protein', macros.p, ACCENT)
    drawMacro(ctx, M + 330, y, 'Carbs', macros.c, AMBER)
    drawMacro(ctx, M + 660, y, 'Fat', macros.f, BLUE)
  }

  // Footer: Pip + wordmark.
  const pip = await loadPip('happy', 'Sprout')
  const ps = 150
  const fy = H - 190
  ctx.drawImage(pip, M, fy, ps, ps)
  ctx.fillStyle = ACCENT
  ctx.font = `700 66px ${DISPLAY}`
  ctx.fillText('Pippin', M + ps + 20, fy + 78)
  ctx.fillStyle = DIM
  ctx.font = `700 30px ${BODY}`
  ctx.fillText('counted by Pippin', M + ps + 22, fy + 122)
}

export type MilestoneOptions = { celebration: Celebration; name: string; showName: boolean }

const KIND_EYEBROW: Record<Celebration['kind'], string> = {
  level: 'LEVEL UP',
  badge: 'BADGE UNLOCKED',
  streak: 'STREAK MILESTONE',
}

// Fixed confetti scatter (x, y, r, colour index) so the card is deterministic.
const CONFETTI: [number, number, number, number][] = [
  [140, 250, 16, 0], [300, 160, 12, 1], [520, 220, 18, 2], [760, 150, 14, 3], [940, 260, 16, 4],
  [90, 520, 12, 2], [990, 520, 14, 1], [180, 900, 14, 3], [900, 940, 16, 0], [120, 1300, 16, 4],
  [960, 1320, 12, 2], [220, 1620, 14, 1], [860, 1640, 16, 3], [520, 1720, 12, 0],
]

export async function renderMilestoneStory(canvas: HTMLCanvasElement, opts: MilestoneOptions) {
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  try {
    await Promise.all([document.fonts.load(`600 100px ${DISPLAY}`), document.fonts.load(`700 100px ${BODY}`)])
  } catch {
    /* fall back to system fonts */
  }

  const cel = opts.celebration

  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#E9F7EE')
  bg.addColorStop(1, '#F1EDE4')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  const cols = [ACCENT, AMBER, BLUE, '#FF6F8B', '#8C7CF5']
  for (const [x, y, r, ci] of CONFETTI) {
    ctx.fillStyle = cols[ci]
    ctx.globalAlpha = 0.85
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  const pip = await loadPip('cheer', cel.stage)
  const ps = 470
  ctx.drawImage(pip, (W - ps) / 2, 360, ps, ps)

  ctx.textAlign = 'center'
  let y = 360 + ps + 110

  ctx.fillStyle = ACCENT
  ctx.font = `800 42px ${BODY}`
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '6px'
  ctx.fillText(cel.eyebrow ?? KIND_EYEBROW[cel.kind], W / 2, y)
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0px'

  const hero = cel.kind === 'badge' ? cel.subtitle : cel.title
  const sub = cel.kind === 'badge' ? '' : cel.subtitle
  y += 140
  ctx.fillStyle = INK
  ctx.font = `700 128px ${DISPLAY}`
  ctx.fillText(hero, W / 2, y)
  if (sub) {
    y += 82
    ctx.fillStyle = DIM
    ctx.font = `600 48px ${BODY}`
    ctx.fillText(sub, W / 2, y)
  }
  if (opts.showName) {
    y += 78
    ctx.fillStyle = DIM
    ctx.font = `700 42px ${BODY}`
    ctx.fillText(`${firstName(opts.name)} on Pippin`, W / 2, y)
  }

  ctx.fillStyle = ACCENT
  ctx.font = `700 74px ${DISPLAY}`
  ctx.fillText('Pippin', W / 2, H - 130)
  ctx.textAlign = 'left'
}
