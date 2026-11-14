/**
 * POST /api/mg-access  { id: "<email or phone>" }
 *
 * Gate for the private Mean Girls (VJM Fall Show 2026) download page /meangirls.
 * Parents paid by Venmo; their email or phone is on a private list in Vercel env vars,
 * so no customer data lives in this public repo.
 *
 * Env vars (Vercel, Production):
 *   MG_ALLOW     emails and/or phone numbers, separated by commas or new lines
 *   MG_FILE_URL  the download link handed out on a match
 */

function norm(s) {
  s = String(s || '').trim().toLowerCase();
  if (!s) return '';
  if (s.includes('@')) return s;
  let d = s.replace(/\D/g, '');
  if (d.length === 11 && d[0] === '1') d = d.slice(1);
  return d.length >= 10 ? d.slice(-10) : '';
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const key = norm(body.id);
  const allow = new Set((process.env.MG_ALLOW || '').split(/[\n,;]+/).map(norm).filter(Boolean));

  await new Promise((r) => setTimeout(r, 400)); // slows down guessing
  if (!key || !allow.has(key)) return res.status(403).json({ ok: false, error: 'not_found' });

  const url = process.env.MG_FILE_URL;
  if (!url) return res.status(503).json({ ok: false, error: 'not_ready' });
  return res.status(200).json({ ok: true, url });
}
