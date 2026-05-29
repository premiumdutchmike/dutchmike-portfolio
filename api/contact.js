/**
 * POST /api/contact
 *
 * Vercel serverless function that relays contact-form submissions through
 * Resend (https://resend.com). Expects JSON: { name, email, subject, message, _hp }.
 * `_hp` is a hidden honeypot field — if it has a value, we silently 200 and drop.
 *
 * Required env vars on Vercel (and in .env.local for `vercel dev`):
 *   RESEND_API_KEY     — get from https://resend.com/api-keys
 *   CONTACT_TO_EMAIL   — defaults to info@dutchmike.com
 *   CONTACT_FROM_EMAIL — defaults to "Portfolio <contact@dutchmike.com>" (domain must be verified in Resend)
 */

import { Resend } from 'resend';

const TO = process.env.CONTACT_TO_EMAIL || 'info@dutchmike.com';
const FROM = process.env.CONTACT_FROM_EMAIL || 'Portfolio <contact@dutchmike.com>';

function bad(res, code, message) {
  res.status(code).json({ ok: false, error: message });
}

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return bad(res, 405, 'POST only');

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return bad(res, 500, 'RESEND_API_KEY not configured on the server.');

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { name = '', email = '', subject = '', message = '', _hp = '' } = body;

  // Honeypot — if a bot filled the hidden field, pretend it worked.
  if (_hp) return res.status(200).json({ ok: true });

  // Required fields
  if (!name.trim()) return bad(res, 400, 'Missing name.');
  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(res, 400, 'Invalid email.');
  if (!subject.trim()) return bad(res, 400, 'Missing subject.');

  // Length caps
  if (name.length > 200 || subject.length > 200) return bad(res, 400, 'Field too long.');
  if (message.length > 5000) return bad(res, 400, 'Message too long.');

  const resend = new Resend(apiKey);

  const html = `
    <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 560px;">
      <h2 style="font-weight: 500; letter-spacing: -0.02em;">New contact-form note</h2>
      <table style="border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 6px 12px 6px 0; color: #6b6b66; font-size: 13px;">Name</td><td style="padding: 6px 0;">${esc(name)}</td></tr>
        <tr><td style="padding: 6px 12px 6px 0; color: #6b6b66; font-size: 13px;">Email</td><td style="padding: 6px 0;"><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
        <tr><td style="padding: 6px 12px 6px 0; color: #6b6b66; font-size: 13px;">Subject</td><td style="padding: 6px 0;">${esc(subject)}</td></tr>
      </table>
      <div style="border-top: 1px solid #d9d7d0; padding-top: 16px; white-space: pre-wrap; font-size: 15px; line-height: 1.55;">${esc(message)}</div>
      <p style="color: #6b6b66; font-size: 12px; margin-top: 24px;">Sent from dutchmike.com/contact</p>
    </div>
  `;

  const text = `New contact-form note\n\nFrom: ${name} <${email}>\nSubject: ${subject}\n\n${message}\n\n— sent from dutchmike.com/contact`;

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: [TO],
      replyTo: email,
      subject: `[dutchmike.com] ${subject}`,
      text,
      html,
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return bad(res, 502, 'Email service rejected the send.');
    }
    return res.status(200).json({ ok: true, id: result.data?.id });
  } catch (err) {
    console.error('contact handler error:', err);
    return bad(res, 500, 'Unexpected server error.');
  }
}
