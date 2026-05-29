# Deploy + contact form setup

The site is static HTML + one Vercel serverless function (`/api/contact.js`)
that relays the contact form through [Resend](https://resend.com).

## 1. Resend setup

1. Create a Resend account → https://resend.com.
2. Add and verify the domain `dutchmike.com` (Resend will give you DNS
   records to add: SPF, DKIM, and a return-path CNAME).
3. Generate an API key at https://resend.com/api-keys.

## 2. Local dev

```bash
cp .env.example .env.local
# edit .env.local and paste the Resend API key

npm install
npx vercel dev
```

Open `http://localhost:3000/contact` and submit the form. Check the inbox
configured in `CONTACT_TO_EMAIL`.

## 3. Production (Vercel)

```bash
npx vercel link        # link this directory to the Vercel project
npx vercel env add RESEND_API_KEY production   # paste the key when prompted
npx vercel env add CONTACT_TO_EMAIL production # optional override
npx vercel env add CONTACT_FROM_EMAIL production # optional override
npx vercel --prod
```

Or set the env vars via the Vercel dashboard → Project → Settings →
Environment Variables.

## 4. Verification checklist

- [ ] `POST /api/contact` returns `{ ok: true }` with a valid body.
- [ ] Email arrives at `CONTACT_TO_EMAIL`.
- [ ] Replying to the email goes back to the sender (Reply-To is set).
- [ ] Honeypot: submitting with a value in `_hp` returns 200 but no email.
- [ ] Bad email rejected with 400.

## Files

- `api/contact.js` — POST handler.
- `package.json` — `resend` dependency.
- `vercel.json` — cache headers + clean URLs.
- `.env.example` — env vars template (do not commit `.env.local`).
- `contact.html` — form + inline submit handler.
