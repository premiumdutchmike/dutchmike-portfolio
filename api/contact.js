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
 *   CONTACT_FROM_EMAIL — defaults to "Dutch Mike <contact@dutchmike.com>" (domain must be verified in Resend)
 */

import { Resend } from 'resend';

const TO = process.env.CONTACT_TO_EMAIL || 'info@dutchmike.com';
const FROM = process.env.CONTACT_FROM_EMAIL || 'Dutch Mike <contact@dutchmike.com>';

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

  const firstName = esc(name.trim().split(/\s+/)[0]);

  const replyHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Got your message — Dutch Mike</title>
<!--
  Subject A: Got your message — Dutch Mike
  Subject B: Your message landed — Dutch Mike
  Preview: I'll get back to you within 1–2 business days.
-->
</head>
<body style="margin:0;padding:0;background:#ffffff;">
<!-- preheader -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">I'll get back to you within 1–2 business days.&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;">
  <tr>
    <td align="center" style="padding:48px 16px 48px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;">

        <!-- wordmark -->
        <tr>
          <td style="padding-bottom:40px;">
            <a href="https://dutchmike.com" style="font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:400;letter-spacing:-0.01em;color:#0a0a0a;text-decoration:none;">dutchmike.com</a>
          </td>
        </tr>

        <!-- body -->
        <tr>
          <td style="font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;font-size:17px;line-height:1.6;color:#0a0a0a;">
            <p style="margin:0 0 20px;">Hi ${firstName},</p>
            <p style="margin:0 0 20px;">Thanks for reaching out — got your message and I'll get back to you within 1–2 business days.</p>
            <p style="margin:0 0 20px;">If it's time-sensitive, feel free to reply directly to this email.</p>
            <p style="margin:0;">Talk soon,<br>Mike</p>
          </td>
        </tr>

        <!-- divider -->
        <tr>
          <td style="padding:40px 0 0;">
            <div style="height:1px;background:#e8e6e0;"></div>
          </td>
        </tr>

        <!-- footer -->
        <tr>
          <td style="padding:24px 0 0;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#6b6b66;line-height:1.5;">
            <a href="https://dutchmike.com" style="color:#6b6b66;text-decoration:none;">dutchmike.com</a>
            &nbsp;&middot;&nbsp;
            <a href="https://linkedin.com/in/dutchmike" style="color:#6b6b66;text-decoration:none;">LinkedIn</a>
            &nbsp;&middot;&nbsp;
            <a href="https://github.com/dutchmike" style="color:#6b6b66;text-decoration:none;">GitHub</a>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const replyText = `Hi ${firstName},\n\nThanks for reaching out — got your message and I'll get back to you within 1–2 business days.\n\nIf it's time-sensitive, feel free to reply directly to this email.\n\nTalk soon,\nMike\n\n—\ndutchmike.com`;

  try {
    const [notifyResult, replyResult] = await Promise.all([
      resend.emails.send({
        from: FROM,
        to: [TO],
        replyTo: email,
        subject: `[dutchmike.com] ${subject}`,
        text,
        html,
      }),
      resend.emails.send({
        from: FROM,
        to: [email],
        replyTo: TO,
        subject: `Got your message — Dutch Mike`,
        text: replyText,
        html: replyHtml,
      }),
    ]);

    if (notifyResult.error) {
      console.error('Resend notify error:', notifyResult.error);
      return bad(res, 502, 'Email service rejected the send.');
    }
    if (replyResult.error) {
      // Non-fatal — the main notification went through; log but don't fail the request
      console.error('Resend auto-reply error:', replyResult.error);
    }

    return res.status(200).json({ ok: true, id: notifyResult.data?.id });
  } catch (err) {
    console.error('contact handler error:', err);
    return bad(res, 500, 'Unexpected server error.');
  }
}
