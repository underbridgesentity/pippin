import { useState } from 'react'
import { GOAL_OPTIONS } from '../data'
import { Mascot } from '../components/Mascot'
import { actions, type ApiError } from '../lib/store'
import { api, type SocialProvider } from '../lib/api'
import { T, card, inset } from '../lib/theme'
import type { Goal } from '../lib/types'

const GRAPE = T.accent
const CTA = ['Get started', 'Continue', 'Continue', 'Create account']

type Mode = 'onboard' | 'login'
type Err = { field?: 'name' | 'email' | 'password'; message: string } | null

export function Auth() {
  const [mode, setMode] = useState<Mode>('onboard')
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState<Goal>('eat')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<Err>(null)
  const [busy, setBusy] = useState(false)
  const hasSocial = api.socialProviders.length > 0

  async function submitSignup() {
    setBusy(true)
    setErr(null)
    try {
      await actions.signUp({ name, email, password, goal })
    } catch (e) {
      const ae = e as ApiError
      setErr({ field: ae.field, message: ae.message })
    } finally {
      setBusy(false)
    }
  }

  async function submitLogin() {
    setBusy(true)
    setErr(null)
    try {
      await actions.logIn({ email, password })
    } catch (e) {
      setErr({ message: (e as ApiError).message })
    } finally {
      setBusy(false)
    }
  }

  async function social(provider: SocialProvider) {
    setBusy(true)
    setErr(null)
    try {
      await actions.socialAuth(provider, goal)
    } catch (e) {
      setErr({ message: (e as ApiError).message })
      setBusy(false)
    }
  }

  function next() {
    setErr(null)
    if (step < 3) setStep(step + 1)
    else submitSignup()
  }

  function back() {
    setErr(null)
    if (mode === 'login') {
      setMode('onboard')
      setStep(0)
    } else if (step > 0) {
      setStep(step - 1)
    }
  }

  const canBack = mode === 'login' || (mode === 'onboard' && step > 0)

  if (mode === 'login') {
    return (
      <Shell>
        <Header canBack onBack={back} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <Mascot stage="Sprout" size={88} float />
            <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 32, color: GRAPE, marginTop: 6 }}>Welcome back</div>
            <div style={{ fontFamily: T.body, fontWeight: 700, fontSize: 14, color: T.dim }}>Log in to keep your streak alive.</div>
          </div>
          {hasSocial && (
            <>
              <SocialButtons busy={busy} onPick={social} />
              <Divider />
            </>
          )}
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@email.com" autoFocus />
          <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="Your password" onEnter={submitLogin} />
          {err && <ErrorNote>{err.message}</ErrorNote>}
        </div>
        <PrimaryButton onClick={submitLogin} disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </PrimaryButton>
        <LinkButton onClick={() => { setMode('onboard'); setStep(0); setErr(null) }}>New here? Create an account</LinkButton>
      </Shell>
    )
  }

  return (
    <Shell>
      <Header canBack={canBack} onBack={back} step={step} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: step === 0 ? 'center' : 'flex-start', paddingTop: step === 0 ? 0 : 20, textAlign: 'center' }}>
        {step === 0 && <Welcome />}
        {step === 1 && <GoalPicker goal={goal} onPick={setGoal} />}
        {step === 2 && <HowItWorks />}
        {step === 3 && (
          <SignupForm name={name} email={email} password={password} err={err} setName={setName} setEmail={setEmail} setPassword={setPassword} onEnter={next} />
        )}
      </div>

      <PrimaryButton onClick={next} disabled={busy}>
        {busy ? 'Creating account…' : CTA[step]}
      </PrimaryButton>

      {step === 0 && (
        <>
          {hasSocial && (
            <>
              <Divider />
              <SocialButtons busy={busy} onPick={social} />
            </>
          )}
          <LinkButton onClick={() => { setMode('login'); setErr(null) }}>I already have an account</LinkButton>
        </>
      )}
    </Shell>
  )
}

// ── chrome ──────────────────────────────────────────────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fettle-scroll"
      style={{ position: 'absolute', inset: 0, zIndex: 90, background: `radial-gradient(circle at 50% 18%,${T.solid},${T.bg} 60%)`, display: 'flex', flexDirection: 'column', padding: '56px 26px 26px', overflowY: 'auto' }}
    >
      {children}
    </div>
  )
}

function Header({ canBack, onBack, step }: { canBack?: boolean; onBack?: () => void; step?: number }) {
  return (
    <div style={{ position: 'relative', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
      {canBack && (
        <button
          onClick={onBack}
          aria-label="Back"
          style={{ position: 'absolute', left: 0, width: 38, height: 38, borderRadius: 12, background: T.glassHi, border: `1px solid ${T.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
      )}
      {step !== undefined && (
        <div style={{ display: 'flex', gap: 7, justifyContent: 'center' }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ width: i === step ? 24 : 7, height: 7, borderRadius: 6, background: i <= step ? GRAPE : T.line, transition: 'width .25s ease, background .25s ease' }} />
          ))}
        </div>
      )}
    </div>
  )
}

function SocialButtons({ busy, onPick }: { busy: boolean; onPick: (p: SocialProvider) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {api.socialProviders.includes('google') && (
        <SocialButton busy={busy} onClick={() => onPick('google')} label="Continue with Google" icon={<GoogleIcon />} />
      )}
      {api.socialProviders.includes('apple') && (
        <SocialButton busy={busy} onClick={() => onPick('apple')} label="Continue with Apple" icon={<AppleIcon />} />
      )}
    </div>
  )
}

function SocialButton({ busy, onClick, label, icon }: { busy: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', background: T.glassHi, border: `1px solid ${T.line}`, borderRadius: 16, padding: 14, fontFamily: T.display, fontWeight: 600, fontSize: 16, color: T.text, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}
    >
      {icon}
      {label}
    </button>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0' }}>
      <div style={{ flex: 1, height: 1.5, background: T.lineSoft }} />
      <span style={{ fontFamily: T.body, fontWeight: 800, fontSize: 12, color: T.faint }}>or</span>
      <div style={{ flex: 1, height: 1.5, background: T.lineSoft }} />
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path fill="#4285F4" d="M23.06 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h6.19a5.3 5.3 0 0 1-2.3 3.48v2.89h3.72c2.17-2 3.45-4.95 3.45-8.38Z" />
      <path fill="#34A853" d="M12 24c3.12 0 5.73-1.04 7.64-2.81l-3.72-2.89c-1.03.7-2.35 1.1-3.92 1.1-3.01 0-5.56-2.03-6.47-4.77H1.69v2.98A11.99 11.99 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.53 14.63a7.2 7.2 0 0 1 0-4.6V7.05H1.69a12 12 0 0 0 0 10.56l3.84-2.98Z" />
      <path fill="#EA4335" d="M12 4.77c1.7 0 3.22.58 4.42 1.72l3.3-3.3C17.73 1.2 15.12 0 12 0 7.39 0 3.4 2.64 1.69 6.49l3.84 2.98C6.44 6.73 8.99 4.77 12 4.77Z" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill={T.text} aria-hidden>
      <path d="M16.37 1.43c.06 1.04-.34 2.06-1 2.81-.7.79-1.85 1.4-2.96 1.31-.08-1.02.39-2.07 1.02-2.76.7-.78 1.91-1.36 2.94-1.36ZM20.5 17.1c-.55 1.28-.82 1.85-1.53 2.98-.99 1.58-2.39 3.55-4.12 3.56-1.54.02-1.93-.99-4.02-.98-2.09.01-2.52 1-4.06.98-1.73-.01-3.05-1.79-4.04-3.37C-.05 16.66-.31 11.5 1.69 8.78c.99-1.36 2.55-2.16 4.02-2.16 1.5 0 2.44 1 3.92 1 1.44 0 2.32-1 4.05-1 1.31 0 2.69.71 3.68 1.94-3.23 1.77-2.7 6.38-.86 8.54Z" />
    </svg>
  )
}

// ── steps ───────────────────────────────────────────────────────────────────
function Welcome() {
  return (
    <div style={{ animation: 'pep-pop .5s ease' }}>
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
        <Mascot stage="Sprout" size={128} float />
      </div>
      <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 44, letterSpacing: '-1px', color: GRAPE, lineHeight: 1, marginBottom: 6 }}>Fettle</div>
      <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 23, color: T.text, lineHeight: 1.2, marginBottom: 10 }}>
        Reach your goals.
        <br />
        Together.
      </div>
      <div style={{ fontFamily: T.body, fontWeight: 700, fontSize: 15, color: T.dim, maxWidth: 280, margin: '0 auto' }}>
        Snap your meals, crush challenges with friends, and celebrate every win, big or small.
      </div>
    </div>
  )
}

function GoalPicker({ goal, onPick }: { goal: Goal; onPick: (g: Goal) => void }) {
  return (
    <div style={{ width: '100%', animation: 'pep-pop .4s ease' }}>
      <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 28, color: T.text, marginBottom: 6 }}>What's your goal?</div>
      <div style={{ fontFamily: T.body, fontWeight: 700, fontSize: 14, color: T.dim, marginBottom: 22 }}>Pick one to start, you can change it anytime.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {GOAL_OPTIONS.map((g) => {
          const sel = goal === g.id
          return (
            <button
              key={g.id}
              onClick={() => onPick(g.id as Goal)}
              style={{ display: 'flex', alignItems: 'center', gap: 14, background: sel ? T.accentDim : T.glass, border: `2.5px solid ${sel ? g.color : T.line}`, borderRadius: 20, padding: '14px 16px', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 14, background: g.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d={g.path} /></svg>
              </div>
              <span style={{ flex: 1, fontFamily: T.display, fontWeight: 600, fontSize: 18, color: T.text }}>{g.label}</span>
              <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2.5px solid ${sel ? g.color : T.line}`, background: sel ? g.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: sel ? 1 : 0 }}><path d="M4 12l5 5L20 6" /></svg>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function HowItWorks() {
  const rows = [
    { tint: T.glassHi, stroke: T.green, title: 'Snap your meals', sub: 'Fettle counts the calories instantly.', icon: <><path d="M5 8h2.5l1.3-2h6.4l1.3 2H19a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" /><circle cx="12" cy="13" r="3.2" /></> },
    { tint: T.glassHi, stroke: T.amber, title: 'Join challenges', sub: 'Team up with friends to hit goals.', icon: <><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 20h6M12 13v4" /></> },
  ]
  return (
    <div style={{ width: '100%', animation: 'pep-pop .4s ease' }}>
      <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 28, color: T.text, marginBottom: 22 }}>How Fettle works</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
        {rows.map((r) => (
          <div key={r.title} style={{ ...card, display: 'flex', alignItems: 'center', gap: 15, padding: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: r.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={r.stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">{r.icon}</svg>
            </div>
            <div>
              <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 17, color: T.text }}>{r.title}</div>
              <div style={{ fontFamily: T.body, fontWeight: 700, fontSize: 13, color: T.dim }}>{r.sub}</div>
            </div>
          </div>
        ))}
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 15, padding: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: T.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill={T.accent}><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9l6.9-.7L12 2Z" /></svg>
          </div>
          <div>
            <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 17, color: T.text }}>Earn the glory</div>
            <div style={{ fontFamily: T.body, fontWeight: 700, fontSize: 13, color: T.dim }}>Badges, levels &amp; bragging rights.</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SignupForm({
  name, email, password, err, setName, setEmail, setPassword, onEnter,
}: {
  name: string; email: string; password: string; err: Err
  setName: (v: string) => void; setEmail: (v: string) => void; setPassword: (v: string) => void; onEnter: () => void
}) {
  return (
    <div style={{ width: '100%', animation: 'pep-pop .4s ease' }}>
      <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 28, color: T.text, marginBottom: 6 }}>Create your account</div>
      <div style={{ fontFamily: T.body, fontWeight: 700, fontSize: 14, color: T.dim, marginBottom: 22 }}>Your progress saves on this device.</div>
      <Field label="Name" value={name} onChange={setName} placeholder="Your name" invalid={err?.field === 'name'} autoFocus />
      <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@email.com" invalid={err?.field === 'email'} />
      <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" invalid={err?.field === 'password'} onEnter={onEnter} />
      {err && <ErrorNote>{err.message}</ErrorNote>}
    </div>
  )
}

function Field({
  label, value, onChange, type = 'text', placeholder, invalid, autoFocus, onEnter,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; invalid?: boolean; autoFocus?: boolean; onEnter?: () => void
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && show ? 'text' : type
  return (
    <label style={{ display: 'block', textAlign: 'left', marginBottom: 14 }}>
      <span style={{ fontFamily: T.body, fontWeight: 800, fontSize: 12, color: T.dim, textTransform: 'uppercase', letterSpacing: '.4px', paddingLeft: 4 }}>{label}</span>
      <div style={{ position: 'relative', marginTop: 6 }}>
        <input
          type={inputType}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && onEnter) onEnter() }}
          placeholder={placeholder}
          style={{ width: '100%', background: T.glass, border: `1px solid ${invalid ? T.rose : T.line}`, borderRadius: 16, padding: isPassword ? '14px 46px 14px 16px' : '14px 16px', fontFamily: T.body, fontWeight: 700, fontSize: 16, color: T.text, outline: 'none' }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            style={{ position: 'absolute', right: 8, top: 8, width: 34, height: 34, borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {show ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.dim} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.dim} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.4 5.2A9.6 9.6 0 0 1 12 5c6.5 0 10 7 10 7a16.8 16.8 0 0 1-3.5 4.3M6.2 6.2A16.6 16.6 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 2.8-.4" /></svg>
            )}
          </button>
        )}
      </div>
    </label>
  )
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ ...inset, display: 'flex', alignItems: 'center', gap: 8, borderRadius: 14, padding: '10px 14px', marginTop: 2 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.rose} strokeWidth="2.4" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.5" /></svg>
      <span style={{ fontFamily: T.body, fontWeight: 800, fontSize: 13, color: T.rose }}>{children}</span>
    </div>
  )
}

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="pressable"
      style={{ background: GRAPE, color: T.ink, border: 'none', borderRadius: 20, padding: 17, fontFamily: T.display, fontWeight: 600, fontSize: 19, cursor: disabled ? 'default' : 'pointer', width: '100%', opacity: disabled ? 0.7 : 1, ['--press-y' as string]: '3px' }}
    >
      {children}
    </button>
  )
}

function LinkButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background: 'none', border: 'none', color: T.dim, fontFamily: T.body, fontWeight: 800, fontSize: 14, padding: 14, cursor: 'pointer' }}>
      {children}
    </button>
  )
}
