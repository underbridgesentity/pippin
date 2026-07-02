// Supabase Edge Function: send-welcome
//
// Sends the Pip-branded welcome email to the SIGNED-IN user's own address via
// Resend (from pip@pippin.co.za). The client fires this once after a
// successful sign-up. Idempotent: a welcome_sent flag in the user's auth
// metadata guards against repeats, so calling it twice cannot spam.
//
// Setup:
//   supabase secrets set RESEND_API_KEY=your_resend_key
//   supabase functions deploy send-welcome

import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

function welcomeHtml(name: string): string {
  const first = (name || 'friend').trim().split(/\s+/)[0]
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#F1EDE4;font-family:-apple-system,'Segoe UI',sans-serif">
  <div style="max-width:480px;margin:0 auto">
    <div style="background:#ffffff;border-radius:24px;padding:32px 28px;box-shadow:0 10px 26px rgba(48,38,22,0.07)">
      <div style="font-size:44px;line-height:1">🍏</div>
      <h1 style="color:#2FC36B;font-size:28px;margin:10px 0 4px">Welcome to Pippin, ${first}!</h1>
      <p style="color:#231E16;font-size:15px;line-height:1.55;margin:0 0 18px">
        Pip here. You just planted a seed, and I grow every time you do.
        Snap a meal and I will count the calories, join a challenge with your
        squad, and keep that streak alive.
      </p>
      <ul style="color:#736D60;font-size:14px;line-height:1.7;margin:0 0 22px;padding-left:18px">
        <li>📸 Snap your meals, I do the counting</li>
        <li>🏆 Join challenges and earn badges</li>
        <li>🔥 Build a streak, watch me grow with you</li>
      </ul>
      <a href="https://www.pippin.co.za" style="display:inline-block;background:#2FC36B;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 28px;border-radius:999px">Open Pippin</a>
    </div>
    <p style="color:#ABA493;font-size:12px;text-align:center;margin:16px 0 0">
      Sent by Pippin because you created an account. Reach your goals, together.
    </p>
  </div>
</body></html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) return json({ error: 'email not configured' })

  // Act as the calling user: their JWT scopes everything to their own account.
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  const user = userData?.user
  if (userErr || !user?.email) return json({ error: 'not signed in' }, 401)
  if (user.user_metadata?.welcome_sent) return json({ ok: true, skipped: 'already welcomed' })

  const name = (user.user_metadata?.name as string) || 'friend'
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Pip at Pippin <pip@pippin.co.za>',
      to: [user.email],
      subject: `Welcome to Pippin, ${name.split(' ')[0]} 🌱`,
      html: welcomeHtml(name),
    }),
  })
  if (!r.ok) return json({ error: `resend ${r.status}` })

  // Mark as welcomed so repeat calls are no-ops.
  await supabase.auth.updateUser({ data: { welcome_sent: true } })
  return json({ ok: true })
})
