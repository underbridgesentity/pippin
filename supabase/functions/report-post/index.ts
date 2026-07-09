// Supabase Edge Function: report-post
//
// Records a community-post report and emails the moderator (info@underbridges.co.za)
// via Resend so reports never pile up unseen. The reporter is taken from the
// verified JWT; the row is written with the service role so no broad client
// insert access is needed. Supports App Store Guideline 1.2 (act on reports).
//
// Deploy: supabase functions deploy report-post

import { createClient } from 'npm:@supabase/supabase-js@2'

const MODERATOR_EMAIL = 'info@underbridges.co.za'
const DASHBOARD_URL = 'https://supabase.com/dashboard/project/mzimtqdtfuehxlfqzajx/sql/new'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

function esc(s: string): string {
  return s.replace(/[<>&]/g, (c) => (c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&amp;'))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!serviceKey) return json({ error: 'not configured' }, 500)

  // Identify the reporter from their JWT.
  const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: u, error: uErr } = await asUser.auth.getUser()
  const reporter = u?.user?.id
  if (uErr || !reporter) return json({ error: 'not signed in' }, 401)

  const body = await req.json().catch(() => ({}))
  const postId = body?.postId as string | undefined
  const reason = (body?.reason as string | undefined) ?? null
  if (!postId) return json({ error: 'missing postId' }, 400)

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  const { error: insErr } = await admin.from('post_reports').insert({ post_id: postId, reporter, reason })
  if (insErr) return json({ error: insErr.message }, 500)

  // Gather context for the notification (best effort).
  const { data: post } = await admin
    .from('posts')
    .select('id, text, photo_url, author, profiles!posts_author_fkey(name)')
    .eq('id', postId)
    .maybeSingle()
  const { count } = await admin
    .from('post_reports')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (resendKey) {
    const authorName = (post as { profiles?: { name?: string } } | null)?.profiles?.name || 'Unknown'
    const postText = (post as { text?: string } | null)?.text || '(no text / photo only)'
    const html = `<div style="font-family:sans-serif;max-width:520px">
      <h2 style="color:#E5484D;margin:0 0 6px">🚩 A post was reported on Pippin</h2>
      <p style="color:#333;font-size:14px;margin:0 0 14px">This post now has <b>${count ?? 1}</b> report(s).</p>
      <table style="font-size:14px;color:#333;border-collapse:collapse">
        <tr><td style="padding:3px 10px 3px 0;color:#888">Author</td><td>${esc(authorName)}</td></tr>
        <tr><td style="padding:3px 10px 3px 0;color:#888;vertical-align:top">Post</td><td>${esc(postText)}</td></tr>
        <tr><td style="padding:3px 10px 3px 0;color:#888">Reason</td><td>${esc(reason || 'user report')}</td></tr>
        <tr><td style="padding:3px 10px 3px 0;color:#888">Post ID</td><td>${esc(postId)}</td></tr>
      </table>
      <p style="font-size:13px;margin:16px 0 0">Review the queue: run <code>select * from private.report_queue;</code> in the
      <a href="${DASHBOARD_URL}">Supabase SQL editor</a>. To remove it, delete the post row (its reports cascade away).</p>
    </div>`
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Pippin Moderation <pip@pippin.co.za>',
        to: [MODERATOR_EMAIL],
        subject: '🚩 Post reported on Pippin',
        html,
      }),
    }).catch(() => {})
  }

  return json({ ok: true })
})
