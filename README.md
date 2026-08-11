# Young Master Challenge — LATAM landing pages

Two conversion-focused Meta Ads landing pages for the **Young Master Challenge**, each written
natively for its market (not translated from English):

| Market | Path | Language |
| --- | --- | --- |
| Mexico | `/mx` | Spanish (es-MX) |
| Brazil | `/br` | Portuguese (pt-BR) |

Audience: **teachers, academic coordinators and school directors** who enter their students into
the online round — matching the Young Master go-to-market plan.

---

## Stack

Deliberately plain: static HTML + CSS + one small JS file, plus a single serverless function for
lead capture. No build step, no framework, no dependencies.

That is a conversion decision, not a shortcut — the pages are ~150 KB and paint almost instantly
on a mid-range Android over mobile data, which is what most Meta traffic in MX and BR actually is.
Every second of load time costs roughly 5–8% of leads.

```
.
├── index.html          Market chooser (the root URL — for sharing with the client)
├── mx/index.html       Mexico landing page (es-MX)
├── br/index.html       Brazil landing page (pt-BR)
├── api/lead.js         Serverless lead capture endpoint
├── assets/
│   ├── css/site.css    Shared stylesheet (brand tokens at the top)
│   ├── js/site.js      Two-step form, validation, Meta Pixel events
│   └── img/            Event photography (WebP) + logo variants
├── vercel.json         Clean URLs, caching, security headers
└── package.json        Marks the project as ESM for the serverless function
```

---

## 1. Set the Meta Pixel (required before spending on ads)

Both pages ship with the Pixel wired up but **not switched on**. In `mx/index.html` and
`br/index.html`, find this line near the top:

```js
var YM_PIXEL_ID = 'PIXEL_ID_AQUI';
```

Replace `PIXEL_ID_AQUI` with the real Pixel ID (a ~15-digit number from Meta Events Manager).
Until you do, the pages work normally and simply fire no events.

Events already implemented:

| Event | Fires when |
| --- | --- |
| `PageView` | Page load |
| `FormStarted` | Visitor types in the first field |
| `FormStep2` | Visitor reaches step 2 of the form |
| `Lead` | Form submitted successfully |
| `CompleteRegistration` | Form submitted successfully |
| `ScrollDepth` | 50% and 90% scroll |

Optimise the ad set for **Lead**. Use `FormStarted` as a fallback audience signal while volume is
still low.

---

## 2. Where the leads go

Right now the project runs in **demo mode**: every submission is validated and written to the
Vercel function logs (Vercel dashboard → project → **Logs**, search `YM LEAD`). Nothing is emailed
or stored yet, and the visitor always sees the success state.

To send leads somewhere real, set **one environment variable** in the Vercel project settings —
no code change needed:

```
LEAD_WEBHOOK_URL = <any URL that accepts a JSON POST>
```

Each lead is then forwarded as JSON. That URL can be a Google Apps Script web app (writes straight
to a Google Sheet), a Zapier or Make catch hook, n8n, or a CRM endpoint. If forwarding fails, the
lead is still in the logs — nothing is lost.

Each lead record contains name, WhatsApp, email, school, city, role, subject, approximate student
count, consent, plus `market`, `locale`, and any `utm_*` / `fbclid` parameters carried in from the
ad click, so you can attribute leads back to the exact ad.

---

## 3. Deploying to Vercel

The project is zero-config: no build step, images are committed, `/api` is picked up
automatically. From this folder:

```bash
npx vercel --prod
```

The first run asks you to log in (it opens a browser) and to confirm the project name.
Every later deploy is just the same command again.

To regenerate the images from their originals (only needed if they are ever deleted):

```bash
npm install && npm run assets
```

## 4. Pushing to GitHub

The repo is committed locally but has no remote yet. Once you have a repo created on GitHub:

```bash
git remote add origin https://github.com/<user>/youngmaster-latam.git
git branch -M main
git push -u origin main
```

---

## Facts used on the pages

Everything factual is taken from youngmaster.org — nothing was invented:

- Categories: **Little Bee 8–11**, **Honeybee 12–15**, **Bumblebee 15–18**
- Subjects: English and Mathematics
- Certificates by score: Gold Master 90–100 (£175 off the Global Final), Silver Master 75–89
  (£125), Bronze Master 60–74 (£85), Honourable Mention 40–59
- Showdown Challenge winning teams receive extra gifts (mascot, earphones, power banks)
- 4,500+ online participants; 200+ countries
- Paths: online / local / regional round → Global Final in London
- Contact: 16-17 Grand Arcade, London N12 0EH · WhatsApp +44 7393 909302 · info@youngmaster.org
- Testimonials from Madi, Amara and Georgiana, translated from the site

**Deliberately not stated anywhere:** round dates and the per-student entry fee. The dates listed
on the current site belong to a finished season, and inventing either on a client-facing page
would be a liability. Both pages instead say a coordinator confirms dates and cost over WhatsApp,
which also raises conversion by lowering commitment at the form.

Photography is the client's own, from the shared Drive folder (Challenge Day, Excursions),
resized and converted to WebP.
