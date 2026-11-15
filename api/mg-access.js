/**
 * POST /api/mg-access  { id: "<email or phone>" }
 *
 * Gate for the private Mean Girls (VJM Fall Show 2026) download page /meangirls.
 * Parents paid by Venmo; their email or phone is on a private list in Vercel env vars,
 * so no customer data lives in this public repo.
 *
 * Env vars (Vercel, Production):
 *   MG_ALLOW     emails and/or phone numbers, separated by commas or new lines
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, MG_OBJECT_KEY
 *                the video sits in a PRIVATE Cloudflare R2 bucket; each match gets a fresh
 *                signed link that dies after LINK_TTL seconds, so a forwarded link stops working.
 */
import crypto from 'node:crypto';

const LINK_TTL = 2 * 60 * 60;
const enc = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
const hmac = (k, s) => crypto.createHmac('sha256', k).update(s).digest();
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

// AWS SigV4 query-string presign for a GET on R2's S3 API (no SDK needed)
export function presign({ account, keyId, secret, bucket, key, filename, ttl = LINK_TTL, now = new Date() }) {
  const host = `${account}.r2.cloudflarestorage.com`;
  const path = `/${enc(bucket)}/${key.split('/').map(enc).join('/')}`;
  const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const day = amzDate.slice(0, 8);
  const scope = `${day}/auto/s3/aws4_request`;
  const q = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${keyId}/${scope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(ttl),
    'X-Amz-SignedHeaders': 'host',
  };
  if (filename) q['response-content-disposition'] = `attachment; filename="${filename}"`;
  const qs = Object.keys(q).sort().map((k) => `${enc(k)}=${enc(q[k])}`).join('&');
  const creq = ['GET', path, qs, `host:${host}\n`, 'host', 'UNSIGNED-PAYLOAD'].join('\n');
  const sts = ['AWS4-HMAC-SHA256', amzDate, scope, sha(creq)].join('\n');
  const kSig = hmac(hmac(hmac(hmac('AWS4' + secret, day), 'auto'), 's3'), 'aws4_request');
  return `https://${host}${path}?${qs}&X-Amz-Signature=${crypto.createHmac('sha256', kSig).update(sts).digest('hex')}`;
}

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

  const e = process.env;
  if (!e.R2_ACCOUNT_ID || !e.R2_ACCESS_KEY_ID || !e.R2_SECRET_ACCESS_KEY || !e.R2_BUCKET || !e.MG_OBJECT_KEY)
    return res.status(503).json({ ok: false, error: 'not_ready' });
  const url = presign({
    account: e.R2_ACCOUNT_ID, keyId: e.R2_ACCESS_KEY_ID, secret: e.R2_SECRET_ACCESS_KEY,
    bucket: e.R2_BUCKET, key: e.MG_OBJECT_KEY, filename: 'Mean Girls - VJM Fall Show 2026.mp4',
  });
  return res.status(200).json({ ok: true, url, expiresIn: LINK_TTL });
}
