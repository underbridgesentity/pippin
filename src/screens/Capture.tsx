import { useEffect, useMemo, useRef, useState } from 'react'
import { FOOD_BY_ID, QUICK_ADD_IDS, searchFoods, type Food } from '../lib/foods'
import { frameFromVideo, dataUrlFromFile } from '../lib/image'
import { mealTypeFor } from '../lib/selectors'
import { num } from '../lib/format'
import { actions } from '../lib/store'
import { analyzeMeal, analyzerAvailable } from '../lib/analyze'
import type { LoggedFood, MealType } from '../lib/types'

const MEAL_TYPES: { id: MealType; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snack' },
]

function toLogged(food: Food, servings: number): LoggedFood {
  return {
    foodId: food.id,
    name: food.name,
    emoji: food.emoji,
    servings,
    kcal: Math.round(food.kcal * servings),
    protein: Math.round(food.protein * servings),
    carbs: Math.round(food.carbs * servings),
    fat: Math.round(food.fat * servings),
  }
}

// Fold analyzer-detected items into whatever is already logged, summing servings
// for foods that appear in both.
function mergeDetected(prev: LoggedFood[], detected: LoggedFood[]): LoggedFood[] {
  const byId = new Map(prev.map((i) => [i.foodId, i]))
  for (const d of detected) {
    const existing = byId.get(d.foodId)
    byId.set(d.foodId, existing ? toLogged(FOOD_BY_ID[d.foodId], existing.servings + d.servings) : d)
  }
  return [...byId.values()]
}

export function Capture({ onClose }: { onClose: () => void }) {
  const [stage, setStage] = useState<'view' | 'log'>('view')
  const [photo, setPhoto] = useState<string | undefined>()
  const [items, setItems] = useState<LoggedFood[]>([])
  const [type, setType] = useState<MealType>(mealTypeFor())
  const [analyzing, setAnalyzing] = useState(false)

  // A snapped photo goes straight to the log screen, then (if the backend is
  // configured) gets analyzed in the background and its results pre-filled.
  async function onCaptured(p: string) {
    setPhoto(p)
    setStage('log')
    if (!analyzerAvailable()) return
    setAnalyzing(true)
    try {
      const detected = await analyzeMeal(p)
      if (detected.length) setItems((prev) => mergeDetected(prev, detected))
    } finally {
      setAnalyzing(false)
    }
  }

  function addFood(food: Food) {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.foodId === food.id)
      if (i >= 0) {
        const next = [...prev]
        next[i] = toLogged(food, next[i].servings + 1)
        return next
      }
      return [...prev, toLogged(food, 1)]
    })
  }
  function setServings(foodId: string, servings: number) {
    setItems((prev) => {
      if (servings <= 0) return prev.filter((x) => x.foodId !== foodId)
      const food = FOOD_BY_ID[foodId]
      return prev.map((x) => (x.foodId === foodId ? toLogged(food, servings) : x))
    })
  }

  const totals = items.reduce(
    (t, i) => ({ kcal: t.kcal + i.kcal, protein: t.protein + i.protein, carbs: t.carbs + i.carbs, fat: t.fat + i.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  )

  function save() {
    if (!items.length) return
    actions.logMeal({ items, type, photo })
    onClose()
  }

  return (
    <div data-screen-label="Meal Capture" style={{ position: 'absolute', inset: 0, zIndex: 95, background: '#15102A', display: 'flex', flexDirection: 'column' }}>
      {stage === 'view' ? (
        <Viewfinder
          onClose={onClose}
          onCaptured={onCaptured}
          onManual={() => { setPhoto(undefined); setStage('log') }}
        />
      ) : (
        <LogScreen
          photo={photo}
          type={type}
          setType={setType}
          items={items}
          totals={totals}
          analyzing={analyzing}
          onRetake={() => setStage('view')}
          onClose={onClose}
          addFood={addFood}
          setServings={setServings}
          onSave={save}
        />
      )}
    </div>
  )
}

// ── Camera ──────────────────────────────────────────────────────────────────
function Viewfinder({
  onClose,
  onCaptured,
  onManual,
}: {
  onClose: () => void
  onCaptured: (photo: string) => void
  onManual: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'loading' | 'live' | 'off'>('loading')
  const live = status === 'live'

  useEffect(() => {
    let stream: MediaStream | null = null
    let cancelled = false
    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        // The <video> is always mounted (see render), so the ref exists here and
        // the feed attaches right away instead of being stuck behind the placeholder.
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        setStatus('live')
      } catch {
        setStatus('off') // permission denied / unavailable → manual fallback
      }
    }
    start()
    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  function shoot() {
    if (live && videoRef.current) {
      try {
        onCaptured(frameFromVideo(videoRef.current))
        return
      } catch {
        /* fall through to file picker */
      }
    }
    fileRef.current?.click()
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      onCaptured(await dataUrlFromFile(file))
    } catch {
      onManual()
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '60px 20px 0' }}>
        <button onClick={onClose} aria-label="Close" style={iconBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 17, color: '#fff' }}>Snap your meal</span>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ position: 'relative', width: 300, height: 300 }}>
          <video ref={videoRef} playsInline muted autoPlay style={{ position: 'absolute', inset: 18, width: 'calc(100% - 36px)', height: 'calc(100% - 36px)', objectFit: 'cover', borderRadius: 24, background: '#000', opacity: live ? 1 : 0, transition: 'opacity .25s ease' }} />
          {!live && (
            <div style={{ position: 'absolute', inset: 18 }}>
              <div style={{ position: 'absolute', inset: 18, borderRadius: '50%', background: 'radial-gradient(circle at 40% 35%,#FFFFFF,#EFE9F5)', boxShadow: '0 20px 50px rgba(0,0,0,.4)' }} />
              <div style={{ position: 'absolute', left: 70, top: 92, width: 88, height: 64, borderRadius: '40% 40% 45% 45%', background: 'linear-gradient(135deg,#E8A65C,#C9763A)' }} />
              <div style={{ position: 'absolute', left: 142, top: 116, width: 64, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#F3E2A8,#E7C96B)' }} />
              <div style={{ position: 'absolute', left: 88, top: 150, width: 34, height: 34, borderRadius: '50%', background: '#3FA85B' }} />
            </div>
          )}
          {/* corner brackets */}
          <div style={{ position: 'absolute', left: 0, top: 0, width: 36, height: 36, borderTop: '4px solid #FF6CB6', borderLeft: '4px solid #FF6CB6', borderRadius: '14px 0 0 0' }} />
          <div style={{ position: 'absolute', right: 0, top: 0, width: 36, height: 36, borderTop: '4px solid #FF6CB6', borderRight: '4px solid #FF6CB6', borderRadius: '0 14px 0 0' }} />
          <div style={{ position: 'absolute', left: 0, bottom: 0, width: 36, height: 36, borderBottom: '4px solid #FF6CB6', borderLeft: '4px solid #FF6CB6', borderRadius: '0 0 0 14px' }} />
          <div style={{ position: 'absolute', right: 0, bottom: 0, width: 36, height: 36, borderBottom: '4px solid #FF6CB6', borderRight: '4px solid #FF6CB6', borderRadius: '0 0 14px 0' }} />
        </div>
      </div>

      <div style={{ textAlign: 'center', fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,.7)', padding: '0 40px 22px' }}>
        {live ? 'Center your plate in the frame, then tap to capture.' : status === 'loading' ? 'Starting camera...' : 'Snap a photo or log it manually, your call.'}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, padding: '0 0 46px' }}>
        <button onClick={() => fileRef.current?.click()} aria-label="Choose photo" style={squareBtn}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 16l5-4 4 3 4-4 5 4" /></svg>
        </button>
        <button onClick={shoot} aria-label="Capture" style={{ width: 80, height: 80, borderRadius: '50%', background: '#fff', border: '5px solid rgba(255,255,255,.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 62, height: 62, borderRadius: '50%', background: 'linear-gradient(135deg,#FF6CB6,#FF4D6D)' }} />
        </button>
        <button onClick={onManual} aria-label="Log without photo" style={squareBtn}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFile} style={{ display: 'none' }} />
    </div>
  )
}

// ── Log / food search ─────────────────────────────────────────────────────────
function LogScreen({
  photo, type, setType, items, totals, onRetake, onClose, addFood, setServings, onSave, analyzing,
}: {
  photo?: string
  type: MealType
  setType: (t: MealType) => void
  items: LoggedFood[]
  totals: { kcal: number; protein: number; carbs: number; fat: number }
  onRetake: () => void
  onClose: () => void
  addFood: (f: Food) => void
  setServings: (id: string, s: number) => void
  onSave: () => void
  analyzing?: boolean
}) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => searchFoods(query, 24), [query])
  const quick = QUICK_ADD_IDS.map((id) => FOOD_BY_ID[id]).filter(Boolean)

  return (
    <div className="fettle-scroll" style={{ flex: 1, overflowY: 'auto', background: '#F4EFFF', position: 'relative' }}>
      {/* header with photo */}
      <div style={{ position: 'relative', height: 168, background: photo ? '#000' : 'radial-gradient(circle at 45% 42%,#FFF,#E8E0F0)', overflow: 'hidden' }}>
        {photo && <img src={photo} alt="Your meal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        <button onClick={onClose} aria-label="Close" style={{ ...iconBtn, position: 'absolute', left: 18, top: 54, background: 'rgba(36,21,68,.55)' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <button onClick={onRetake} style={{ position: 'absolute', right: 16, top: 56, background: 'rgba(36,21,68,.55)', border: 'none', borderRadius: 14, padding: '8px 14px', color: '#fff', fontFamily: 'Fredoka', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8h2.5l1.3-2h6.4l1.3 2H19a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" /><circle cx="12" cy="13" r="3.2" /></svg>
          {photo ? 'Retake' : 'Add photo'}
        </button>
      </div>

      <div style={{ padding: '16px 18px 150px' }}>
        {analyzing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg,#7C3AF6,#9B5CFF)', borderRadius: 16, padding: '12px 14px', marginBottom: 14, boxShadow: '0 6px 16px rgba(124,58,246,.22)' }}>
            <span style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,.4)', borderTopColor: '#fff', display: 'inline-block', animation: 'pep-spin .8s linear infinite', flex: 'none' }} />
            <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 14, color: '#fff' }}>Reading your plate, this takes a sec...</span>
          </div>
        )}
        {/* meal type */}
        <div style={{ display: 'flex', gap: 6, background: '#EDE6FA', borderRadius: 16, padding: 4, marginBottom: 16 }}>
          {MEAL_TYPES.map((m) => (
            <button
              key={m.id}
              onClick={() => setType(m.id)}
              style={{ flex: 1, textAlign: 'center', background: type === m.id ? '#fff' : 'transparent', borderRadius: 12, padding: '9px 4px', fontFamily: 'Fredoka', fontWeight: 600, fontSize: 13, color: type === m.id ? '#7C3AF6' : '#6E6596', border: 'none', cursor: 'pointer', boxShadow: type === m.id ? '0 2px 6px rgba(120,60,180,.12)' : 'none' }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* selected items */}
        {items.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 22, padding: 14, marginBottom: 14, boxShadow: '0 6px 16px rgba(120,60,180,.06)' }}>
            {items.map((it) => (
              <div key={it.foodId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F4EFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flex: 'none' }}>{it.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 15, color: '#241544', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name}</div>
                  <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 12, color: '#6E6596' }}>{it.kcal} kcal · {FOOD_BY_ID[it.foodId]?.serving}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Stepper onClick={() => setServings(it.foodId, it.servings - 1)} label="−" />
                  <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 15, color: '#241544', minWidth: 20, textAlign: 'center' }}>{it.servings}</span>
                  <Stepper onClick={() => setServings(it.foodId, it.servings + 1)} label="+" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B6AEC9" strokeWidth="2.4" strokeLinecap="round" style={{ position: 'absolute', left: 16, top: 15 }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search foods…"
            autoFocus
            style={{ width: '100%', background: '#fff', border: '2.5px solid #ECE6FA', borderRadius: 16, padding: '13px 16px 13px 44px', fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, color: '#241544', outline: 'none' }}
          />
        </div>

        {!query && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {quick.map((f) => (
              <button key={f.id} onClick={() => addFood(f)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '2px solid #ECE6FA', borderRadius: 14, padding: '8px 12px', cursor: 'pointer', fontFamily: 'Nunito', fontWeight: 800, fontSize: 13, color: '#241544' }}>
                <span style={{ fontSize: 16 }}>{f.emoji}</span> {f.name}
              </button>
            ))}
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 22, overflow: 'hidden', boxShadow: '0 6px 16px rgba(120,60,180,.06)' }}>
          {results.map((f, i) => (
            <button
              key={f.id}
              onClick={() => addFood(f)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', background: 'none', border: 'none', borderTop: i ? '1px solid #F2ECFB' : 'none', padding: '12px 14px', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F4EFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flex: 'none' }}>{f.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 15, color: '#241544' }}>{f.name}</div>
                <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 12, color: '#6E6596' }}>{f.kcal} kcal · {f.serving} · {f.category}</div>
              </div>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EFE7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7C3AF6" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              </div>
            </button>
          ))}
          {results.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: '#6E6596' }}>No foods match "{query}".</div>
          )}
        </div>
      </div>

      {/* footer total + log */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 18px 26px', background: 'linear-gradient(180deg,transparent,#F4EFFF 26%)' }}>
        {items.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 4px' }}>
            <span style={{ fontFamily: 'Fredoka', fontWeight: 700, fontSize: 22, color: '#241544' }}>{num(totals.kcal)} <span style={{ fontSize: 14, color: '#6E6596' }}>kcal</span></span>
            <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 12, color: '#6E6596' }}>P {totals.protein}g · C {totals.carbs}g · F {totals.fat}g</span>
          </div>
        )}
        <button
          onClick={onSave}
          disabled={!items.length}
          className="pressable"
          style={{ background: items.length ? '#18C98A' : '#C9BFE0', color: '#fff', border: 'none', borderRadius: 20, padding: 17, fontFamily: 'Fredoka', fontWeight: 600, fontSize: 19, boxShadow: items.length ? '0 5px 0 #0E9E6C' : 'none', cursor: items.length ? 'pointer' : 'default', width: '100%', ['--press-y' as string]: '3px', ['--press-shadow' as string]: '0 2px 0 #0E9E6C' }}
        >
          {items.length ? 'Log meal · +45 XP' : 'Add a food to log'}
        </button>
      </div>
    </div>
  )
}

function Stepper({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} style={{ width: 30, height: 30, borderRadius: 10, background: '#F1ECFA', border: 'none', cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 600, fontSize: 18, color: '#7C3AF6', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
      {label}
    </button>
  )
}

const iconBtn: React.CSSProperties = { width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.16)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const squareBtn: React.CSSProperties = { width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,.14)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
