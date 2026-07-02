import { useState } from 'react'
import { Auth } from './Auth'
import { CenterFrame } from '../components/CenterFrame'
import { IOSDevice } from '../components/IOSDevice'
import { Mascot } from '../components/Mascot'
import { T, card, eyebrow, hexA } from '../lib/theme'

/**
 * Marketing landing for logged-out visitors, responsive from phone to
 * widescreen (layout classes live in styles.css under "Landing").
 * The design leans on asymmetry, sticker-like rotated elements and real
 * product vignettes rather than uniform icon cards.
 */
export function Landing() {
  const [auth, setAuth] = useState<null | 'signup' | 'login'>(null)

  if (auth) {
    return (
      <CenterFrame>
        <Auth initialView={auth} onExit={() => setAuth(null)} />
      </CenterFrame>
    )
  }

  const start = () => setAuth('signup')
  const login = () => setAuth('login')

  return (
    <div className="ld-root pippin-scroll">
      <Nav onStart={start} onLogin={login} />
      <Hero onStart={start} />
      <Marquee />
      <Features />
      <MeetPip />
      <HowItWorks />
      <CtaBanner onStart={start} />
      <Footer onStart={start} onLogin={login} />
    </div>
  )
}

// ── nav ──────────────────────────────────────────────────────────────────────

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function Nav({ onStart, onLogin }: { onStart: () => void; onLogin: () => void }) {
  return (
    <div className="ld-nav">
      <div className="ld-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Mascot stage="Sprout" size={34} />
          <span style={{ fontFamily: T.display, fontWeight: 700, fontSize: 24, color: T.text, letterSpacing: '-0.02em' }}>Pippin</span>
        </div>

        <div className="ld-nav-links">
          <button className="ld-nav-link" onClick={() => scrollTo('features')}>Features</button>
          <button className="ld-nav-link" onClick={() => scrollTo('pip')}>Meet Pip</button>
          <button className="ld-nav-link" onClick={() => scrollTo('how')}>How it works</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onLogin}
            className="pressable"
            style={{ background: 'transparent', border: 'none', borderRadius: T.r.pill, padding: '10px 16px', fontFamily: T.body, fontWeight: 700, fontSize: 14.5, color: T.text, cursor: 'pointer' }}
          >
            Log in
          </button>
          <button
            onClick={onStart}
            className="pressable"
            style={{ background: T.accent, color: T.ink, border: 'none', borderRadius: T.r.pill, padding: '11px 20px', fontFamily: T.display, fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: '0 10px 24px rgba(35,179,95,0.3)', ['--press-y' as string]: '2px' }}
          >
            Get started
          </button>
        </div>
      </div>
    </div>
  )
}

// ── hero ─────────────────────────────────────────────────────────────────────

/** Hand-drawn underline squiggle. */
function Squiggle({ color = T.accent }: { color?: string }) {
  return (
    <svg viewBox="0 0 220 14" preserveAspectRatio="none" style={{ position: 'absolute', left: '2%', bottom: -8, width: '96%', height: 14, overflow: 'visible' }}>
      <path d="M4 10 Q 32 2 62 8 T 122 7 T 178 8 T 216 6" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

function Hero({ onStart }: { onStart: () => void }) {
  return (
    <div className="ld-wrap">
      <div className="ld-hero">
        <div className="ld-hero-copy">
          <div
            className="ld-up"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: T.solid, borderRadius: T.r.pill, padding: '8px 16px', boxShadow: '0 8px 22px rgba(48,38,22,0.09)', transform: 'rotate(-2deg)', fontFamily: T.display, fontWeight: 600, fontSize: 14, color: T.dim, animationDelay: '0s' }}
          >
            <span style={{ fontSize: 17 }}>🍏</span> The fun way to get healthy
          </div>
          <h1 className="ld-h1 ld-up" style={{ animationDelay: '.06s' }}>
            Reach your goals.
            <br />
            <span style={{ position: 'relative', display: 'inline-block', color: T.accent }}>
              Together.
              <Squiggle />
            </span>
          </h1>
          <p className="ld-sub ld-up" style={{ animationDelay: '.12s', margin: '0 auto 26px' }}>
            Pippin is a health tracker that feels like play. Snap your meals, crush challenges
            with friends, keep your streak, and grow Pip from a tiny seed into a legend.
          </p>
          <div className="ld-hero-ctas ld-up" style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', animationDelay: '.18s' }}>
            <button
              onClick={onStart}
              className="pressable"
              style={{ background: T.accent, color: T.ink, border: 'none', borderRadius: T.r.pill, padding: '17px 34px', fontFamily: T.display, fontWeight: 700, fontSize: 18, cursor: 'pointer', boxShadow: '0 14px 34px rgba(35,179,95,0.36)', ['--press-y' as string]: '3px' }}
            >
              Start growing
            </button>
            <button
              onClick={() => scrollTo('how')}
              style={{ background: 'none', border: 'none', padding: 0, fontFamily: T.body, fontWeight: 800, fontSize: 15, color: T.dim, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: hexA(T.text, 0.25), textUnderlineOffset: 4 }}
            >
              See how it works ↓
            </button>
          </div>
          <div className="ld-up" style={{ marginTop: 18, fontFamily: T.body, fontWeight: 700, fontSize: 13.5, color: T.faint, animationDelay: '.24s' }}>
            Free · Right in your browser · No app store
          </div>
        </div>

        <HeroPhone />
      </div>
    </div>
  )
}

/** Static, hand-posed mock of the Home screen inside the device frame. */
function HeroPhone() {
  return (
    <div className="ld-phone ld-up" style={{ animationDelay: '.15s' }}>
      <div className="ld-phone-box">
        <div className="ld-phone-scale" style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <IOSDevice>
            <MockHome />
          </IOSDevice>
        </div>
      </div>

      <div className="ld-chip" style={{ top: '21%', left: '2%', transform: 'rotate(-5deg)', animationDelay: '.4s' }}>
        <span style={{ fontSize: 19 }}>🔥</span> 12 day streak
      </div>
      <div className="ld-chip" style={{ top: '38%', right: '0%', transform: 'rotate(3deg)', animationDelay: '1.3s' }}>
        <span style={{ fontSize: 19 }}>⚡</span> +20 XP · Meal snapped
      </div>
      <div className="ld-chip" style={{ bottom: '14%', left: '4%', transform: 'rotate(-2.5deg)', animationDelay: '2.2s' }}>
        <span style={{ fontSize: 19 }}>👏</span> Maya cheered you on
      </div>
    </div>
  )
}

function MockHome() {
  return (
    <div style={{ height: '100%', background: `radial-gradient(circle at 50% -8%, ${T.bgElev}, ${T.bg} 58%)`, padding: '76px 18px 0', display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>
      {/* greeting */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ ...eyebrow, fontSize: 10.5 }}>Wednesday, 2 July</div>
          <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 26, color: T.text }}>Good morning, Maya ☀️</div>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 16, background: `linear-gradient(140deg, ${T.rose}, ${T.amber})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.ink, fontFamily: T.display, fontWeight: 700, fontSize: 18 }}>M</div>
      </div>

      {/* calories ring card */}
      <div style={{ ...card, padding: 18, display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ position: 'relative', width: 108, height: 108, flex: 'none' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `conic-gradient(${T.accent} 0 65%, ${hexA(T.accent, 0.14)} 65% 100%)` }} />
          <div style={{ position: 'absolute', inset: 11, borderRadius: '50%', background: T.solid, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: T.display, fontWeight: 700, fontSize: 22, color: T.text, lineHeight: 1 }}>1,240</span>
            <span style={{ fontFamily: T.body, fontWeight: 700, fontSize: 10.5, color: T.faint }}>of 1,900 kcal</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <MockStat emoji="🥗" label="3 meals snapped" tint={T.accent} />
          <MockStat emoji="👟" label="6,204 steps" tint={T.blue} />
          <MockStat emoji="⚡" label="+40 XP today" tint={T.amber} />
        </div>
      </div>

      {/* quest */}
      <div style={{ ...card, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 14, background: hexA(T.violet, 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, flex: 'none' }}>🏆</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 14.5, color: T.text }}>Veggie week challenge</div>
          <div style={{ height: 7, borderRadius: 6, background: hexA(T.violet, 0.15), marginTop: 7 }}>
            <div style={{ width: '70%', height: '100%', borderRadius: 6, background: T.violet }} />
          </div>
        </div>
        <span style={{ fontFamily: T.body, fontWeight: 800, fontSize: 12.5, color: T.violet }}>5/7</span>
      </div>

      {/* feed card */}
      <div style={{ ...card, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 13, background: `linear-gradient(140deg, ${T.blue}, ${T.violet})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.ink, fontFamily: T.display, fontWeight: 700, fontSize: 15 }}>T</div>
          <div>
            <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 14, color: T.text }}>Theo K.</div>
            <div style={{ fontFamily: T.body, fontWeight: 700, fontSize: 11, color: T.faint }}>crushed a morning 5K</div>
          </div>
        </div>
        <div style={{ display: 'inline-flex', gap: 8 }}>
          <span style={{ background: T.glass, border: `1px solid ${T.line}`, borderRadius: 12, padding: '6px 11px', fontFamily: T.body, fontWeight: 800, fontSize: 12, color: T.text }}>👏 12</span>
          <span style={{ background: T.glass, border: `1px solid ${T.line}`, borderRadius: 12, padding: '6px 11px', fontFamily: T.body, fontWeight: 800, fontSize: 12, color: T.text }}>🔥 4</span>
        </div>
      </div>

      {/* mock tab bar */}
      <div style={{ marginTop: 'auto', marginBottom: 16, background: T.solid, border: `1px solid ${T.line}`, borderRadius: 26, padding: '10px 18px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 12px 34px rgba(48,38,22,0.14)' }}>
        {['🏠', '🏆'].map((e) => (
          <span key={e} style={{ fontSize: 20, opacity: 0.55 }}>{e}</span>
        ))}
        <span style={{ width: 52, height: 52, borderRadius: 19, background: 'linear-gradient(160deg,#4cd884,#23b35f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 10px 22px rgba(35,179,95,0.4)' }}>📸</span>
        {['👯', '🙂'].map((e) => (
          <span key={e} style={{ fontSize: 20, opacity: 0.55 }}>{e}</span>
        ))}
      </div>
    </div>
  )
}

function MockStat({ emoji, label, tint }: { emoji: string; label: string; tint: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <span style={{ width: 30, height: 30, borderRadius: 10, background: hexA(tint, 0.14), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{emoji}</span>
      <span style={{ fontFamily: T.body, fontWeight: 800, fontSize: 13, color: T.dim }}>{label}</span>
    </div>
  )
}

// ── marquee ──────────────────────────────────────────────────────────────────

const MARQUEE = [
  { label: '🥗 Snap meals', tint: T.green },
  { label: '🔥 Keep streaks', tint: T.amber },
  { label: '🏆 Win challenges', tint: T.violet },
  { label: '👏 Cheer friends', tint: T.rose },
  { label: '🍏 Grow Pip', tint: T.green },
  { label: '📸 20 seconds a day', tint: T.blue },
  { label: '⚡ Earn XP', tint: T.amber },
  { label: '🎖️ Collect badges', tint: T.violet },
]

function Marquee() {
  const pills = [...MARQUEE, ...MARQUEE]
  return (
    <div className="ld-marquee">
      <div className="ld-marquee-track">
        {pills.map((p, i) => (
          <span key={i} style={{ flex: 'none', background: hexA(p.tint, 0.1), borderRadius: T.r.pill, padding: '9px 18px', fontFamily: T.display, fontWeight: 600, fontSize: 15, color: T.text, whiteSpace: 'nowrap' }}>
            {p.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── features: bento of product vignettes ────────────────────────────────────

function Features() {
  return (
    <div id="features" className="ld-wrap" style={{ padding: '86px 22px 10px' }}>
      {/* left-aligned header, no eyebrow */}
      <div style={{ maxWidth: 560, marginBottom: 38 }}>
        <h2 style={{ fontFamily: T.display, fontWeight: 700, fontSize: 'clamp(30px, 4.4vw, 46px)', lineHeight: 1.06, letterSpacing: '-0.02em', color: T.text, margin: '0 0 12px' }}>
          Everything a habit needs{' '}
          <span style={{ position: 'relative', display: 'inline-block' }}>
            to survive
            <Squiggle color={T.amber} />
          </span>
        </h2>
        <p style={{ fontFamily: T.body, fontWeight: 600, fontSize: 16, lineHeight: 1.55, color: T.dim, margin: 0 }}>
          Tracking alone does not change behaviour. Play, friends and a growing mascot do.
        </p>
      </div>

      <div className="ld-bento">
        {/* A: snap a meal */}
        <div className="ld-card ld-b-a" style={{ ...card, padding: '26px 24px', display: 'flex', flexDirection: 'column' }}>
          <VTitle title="Snap it, Pip counts it" copy="Point your camera at any plate. Calories logged in seconds, no spreadsheet energy." />
          <div style={{ position: 'relative', marginTop: 18, flex: 1, minHeight: 210 }}>
            {/* tilted meal card */}
            <div style={{ position: 'absolute', left: '4%', top: 8, width: '72%', maxWidth: 260, transform: 'rotate(-3deg)', background: T.solid, borderRadius: 20, padding: 10, boxShadow: '0 18px 40px rgba(48,38,22,0.14)' }}>
              <div style={{ height: 110, borderRadius: 14, background: `linear-gradient(140deg, #A8D97C, #5FBF6E 55%, #3E9E63)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46 }}>🥗</div>
              <div style={{ padding: '10px 6px 4px' }}>
                <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 15.5, color: T.text }}>Buddha bowl</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 7 }}>
                  <span style={{ background: hexA(T.green, 0.13), borderRadius: 10, padding: '4px 9px', fontFamily: T.body, fontWeight: 800, fontSize: 11.5, color: '#1B9152' }}>520 kcal</span>
                  <span style={{ background: hexA(T.amber, 0.15), borderRadius: 10, padding: '4px 9px', fontFamily: T.body, fontWeight: 800, fontSize: 11.5, color: '#C57619' }}>+20 XP</span>
                </div>
              </div>
            </div>
            {/* Pip inspecting */}
            <div style={{ position: 'absolute', right: '2%', bottom: 0, transform: 'rotate(5deg)' }}>
              <Mascot stage="Sprout" size={86} mood="thinking" float />
            </div>
            <div style={{ position: 'absolute', right: '0%', top: 14, transform: 'rotate(4deg)', background: T.solid, borderRadius: 14, padding: '8px 12px', boxShadow: '0 12px 28px rgba(48,38,22,0.13)', fontFamily: T.display, fontWeight: 600, fontSize: 12.5, color: T.dim }}>
              counting…
            </div>
          </div>
        </div>

        {/* B: quests */}
        <div className="ld-card ld-b-b" style={{ ...card, padding: '26px 24px' }}>
          <VTitle title="Quests that stick" copy="Weekly challenges and badges for the days motivation does not show up." />
          <div style={{ marginTop: 16, background: T.glass, border: `1px solid ${T.lineSoft}`, borderRadius: 16, padding: '13px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.display, fontWeight: 600, fontSize: 14, color: T.text }}>
              Snap 3 meals today <span style={{ color: T.amber }}>2/3</span>
            </div>
            <div style={{ height: 8, borderRadius: 6, background: hexA(T.amber, 0.16), marginTop: 9 }}>
              <div style={{ width: '66%', height: '100%', borderRadius: 6, background: T.amber }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            {[
              { e: '🎖️', r: -6, t: T.violet },
              { e: '🔥', r: 3, t: T.amber },
              { e: '🏅', r: -2, t: T.rose },
            ].map((b) => (
              <span key={b.e} style={{ width: 46, height: 46, borderRadius: 16, background: hexA(b.t, 0.13), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, transform: `rotate(${b.r}deg)`, boxShadow: '0 8px 18px rgba(48,38,22,0.08)' }}>{b.e}</span>
            ))}
          </div>
        </div>

        {/* C: squad */}
        <div className="ld-card ld-b-c" style={{ ...card, padding: '26px 24px' }}>
          <VTitle title="A squad that cheers" copy="Share wins and photos. Healthy is easier with company." />
          <div style={{ position: 'relative', marginTop: 16 }}>
            <div style={{ transform: 'rotate(-1.5deg)', background: T.glass, border: `1px solid ${T.lineSoft}`, borderRadius: '18px 18px 18px 6px', padding: '11px 14px', maxWidth: 250 }}>
              <span style={{ fontFamily: T.body, fontWeight: 800, fontSize: 13, color: T.text }}>Maya · </span>
              <span style={{ fontFamily: T.body, fontWeight: 600, fontSize: 13, color: T.dim }}>SO proud of this streak!! 👏</span>
            </div>
            <div style={{ transform: 'rotate(1deg)', marginTop: 8, marginLeft: 26, background: hexA(T.green, 0.1), borderRadius: '18px 18px 6px 18px', padding: '11px 14px', maxWidth: 240 }}>
              <span style={{ fontFamily: T.body, fontWeight: 800, fontSize: 13, color: T.text }}>You · </span>
              <span style={{ fontFamily: T.body, fontWeight: 600, fontSize: 13, color: T.dim }}>could not have done it without you 🥹</span>
            </div>
            <div style={{ display: 'flex', gap: 7, marginTop: 12 }}>
              {['👏 12', '🔥 4', '❤️ 9'].map((r) => (
                <span key={r} style={{ background: T.solid, border: `1px solid ${T.line}`, borderRadius: 12, padding: '5px 10px', fontFamily: T.body, fontWeight: 800, fontSize: 12, color: T.text }}>{r}</span>
              ))}
            </div>
          </div>
        </div>

        {/* D: grow pip */}
        <div className="ld-card ld-b-d" style={{ ...card, background: hexA(T.green, 0.09), padding: '26px 24px' }}>
          <VTitle title="Grow Pip with you" copy="Every healthy day feeds Pip. Seed today, Legend eventually." />
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 4, marginTop: 18, maxWidth: 420 }}>
            {[
              { stage: 'Seed', size: 40 },
              { stage: 'Sprout', size: 54 },
              { stage: 'Bloomer', size: 68 },
              { stage: 'Legend', size: 84 },
            ].map((s, i) => (
              <div key={s.stage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ animation: `ld-float ${4 + i * 0.5}s ease-in-out infinite` }}>
                  <Mascot stage={s.stage} size={s.size} mood={i === 3 ? 'proud' : 'happy'} />
                </div>
                <span style={{ fontFamily: T.body, fontWeight: 800, fontSize: 11.5, color: T.dim }}>{s.stage}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function VTitle({ title, copy }: { title: string; copy: string }) {
  return (
    <div>
      <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 23, color: T.text, marginBottom: 7 }}>{title}</div>
      <div style={{ fontFamily: T.body, fontWeight: 600, fontSize: 14.5, lineHeight: 1.5, color: T.dim }}>{copy}</div>
    </div>
  )
}

// ── meet pip ─────────────────────────────────────────────────────────────────

const PIPS = [
  { mood: 'happy', label: 'Happy to see you', tint: T.green, r: -3 },
  { mood: 'cheer', label: 'Cheers every win', tint: T.amber, r: 2 },
  { mood: 'proud', label: 'Proud of your streak', tint: T.violet, r: -2 },
  { mood: 'thinking', label: 'Counting your kcal', tint: T.blue, r: 3 },
  { mood: 'sleepy', label: 'Says rest counts too', tint: T.rose, r: -1.5 },
] as const

function MeetPip() {
  return (
    <div id="pip" className="ld-wrap" style={{ padding: '86px 22px 10px' }}>
      <div style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto 40px' }}>
        <h2 style={{ fontFamily: T.display, fontWeight: 700, fontSize: 'clamp(30px, 4.4vw, 46px)', lineHeight: 1.06, letterSpacing: '-0.02em', color: T.text, margin: '0 0 12px' }}>
          Meet Pip, your pocket cheerleader
        </h2>
        <p style={{ fontFamily: T.body, fontWeight: 600, fontSize: 16, lineHeight: 1.55, color: T.dim, margin: 0 }}>
          Pip reacts to your day, celebrates your milestones, and grows as you do. Ignore your goals
          and Pip gets a little sleepy. No guilt, just vibes.
        </p>
      </div>
      <div className="ld-pips">
        {PIPS.map((p, i) => (
          <div key={p.mood} className="ld-card" style={{ ...card, background: hexA(p.tint, 0.08), padding: '22px 12px 18px', textAlign: 'center', transform: `rotate(${p.r}deg)` }}>
            <div style={{ animation: `ld-float ${4.5 + i * 0.4}s ease-in-out infinite` }}>
              <Mascot stage={i === 2 ? 'Bloomer' : 'Sprout'} size={72} mood={p.mood} />
            </div>
            <div style={{ fontFamily: T.body, fontWeight: 700, fontSize: 13, color: T.dim, marginTop: 10 }}>{p.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── how it works ─────────────────────────────────────────────────────────────

const STEPS = [
  { n: '1', tint: T.blue, title: 'Pick your goal', copy: 'Eat better, move more, or feel great. Pip shapes the journey around it.' },
  { n: '2', tint: T.amber, title: 'Snap and log', copy: 'Meals, walks, workouts, moods. About twenty seconds a day, honestly.' },
  { n: '3', tint: T.green, title: 'Grow together', copy: 'Add your squad, trade cheers, climb the leaderboard, level up Pip.' },
]

function HowItWorks() {
  return (
    <div id="how" className="ld-wrap" style={{ padding: '86px 22px 10px' }}>
      <div style={{ maxWidth: 560, marginBottom: 38 }}>
        <h2 style={{ fontFamily: T.display, fontWeight: 700, fontSize: 'clamp(30px, 4.4vw, 46px)', lineHeight: 1.06, letterSpacing: '-0.02em', color: T.text, margin: 0 }}>
          Three steps,{' '}
          <span style={{ position: 'relative', display: 'inline-block' }}>
            zero willpower
            <Squiggle color={T.rose} />
          </span>{' '}
          required
        </h2>
      </div>
      <div className="ld-steps" style={{ position: 'relative' }}>
        {/* dashed connector, desktop only */}
        <svg className="ld-steps-line" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden>
          <path d="M60 40 C 260 -20, 420 70, 560 30 S 860 10, 950 42" fill="none" stroke={hexA(T.text, 0.18)} strokeWidth="3" strokeDasharray="2 12" strokeLinecap="round" />
        </svg>
        {STEPS.map((s, i) => (
          <div key={s.n} className="ld-card" style={{ ...card, padding: '26px 24px', position: 'relative', marginTop: i === 1 ? 26 : 0, transform: `rotate(${[-1, 1.2, -0.8][i]}deg)` }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: hexA(s.tint, 0.15), color: s.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.display, fontWeight: 700, fontSize: 21, marginBottom: 14, transform: 'rotate(-4deg)' }}>{s.n}</div>
            <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 21, color: T.text, marginBottom: 7 }}>{s.title}</div>
            <div style={{ fontFamily: T.body, fontWeight: 600, fontSize: 14.5, lineHeight: 1.55, color: T.dim }}>{s.copy}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── CTA banner + footer ──────────────────────────────────────────────────────

function CtaBanner({ onStart }: { onStart: () => void }) {
  return (
    <div className="ld-wrap" style={{ padding: '110px 22px 20px' }}>
      <div style={{ position: 'relative' }}>
        {/* Pip peeks over the banner edge */}
        <div style={{ position: 'absolute', top: -74, left: '12%', zIndex: 2, transform: 'rotate(-7deg)', animation: 'ld-float 4.5s ease-in-out infinite' }}>
          <Mascot stage="Bloomer" size={104} mood="cheer" />
        </div>
        <div style={{ position: 'relative', background: 'linear-gradient(150deg, #37cd75, #1ea45a)', borderRadius: 44, padding: '58px 30px 54px', overflow: 'hidden', boxShadow: '0 30px 70px rgba(35,179,95,0.35)' }}>
          <div style={{ position: 'absolute', top: -70, left: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
          <div style={{ position: 'absolute', bottom: -90, right: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'relative', textAlign: 'center' }}>
            <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 'clamp(32px, 5vw, 50px)', color: T.ink, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Ready to grow?</div>
            <div style={{ fontFamily: T.body, fontWeight: 600, fontSize: 17, color: 'rgba(255,255,255,0.85)', maxWidth: 430, margin: '0 auto 26px' }}>
              Plant your seed today. Your squad, your streaks and one very excitable green fruit are waiting.
            </div>
            <button
              onClick={onStart}
              className="pressable"
              style={{ background: '#FFFFFF', color: '#1ea45a', border: 'none', borderRadius: T.r.pill, padding: '17px 34px', fontFamily: T.display, fontWeight: 700, fontSize: 18, cursor: 'pointer', boxShadow: '0 14px 30px rgba(0,60,25,0.25)', ['--press-y' as string]: '3px' }}
            >
              Start your streak
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Footer({ onStart, onLogin }: { onStart: () => void; onLogin: () => void }) {
  return (
    <div className="ld-wrap" style={{ padding: '40px 22px 46px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 18, borderTop: `1px solid ${T.line}`, paddingTop: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Mascot stage="Sprout" size={28} />
          <div>
            <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 19, color: T.text }}>Pippin</div>
            <div style={{ fontFamily: T.body, fontWeight: 700, fontSize: 12, color: T.faint }}>Reach your goals. Together.</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="ld-nav-link" style={{ display: 'inline-block' }} onClick={onLogin}>Log in</button>
          <button className="ld-nav-link" style={{ display: 'inline-block' }} onClick={onStart}>Get started</button>
        </div>
      </div>
      <div style={{ fontFamily: T.body, fontWeight: 600, fontSize: 12.5, color: T.faint, marginTop: 18 }}>
        © 2026 Pippin · pippin.co.za · Grown with 🍏
      </div>
    </div>
  )
}
