# Young Master Challenge — campaign landing pages

Conversion-focused Meta Ads landing pages for the **Young Master Challenge**, each written
natively for its market — not translated from English.

| Market | Repo path | Live URL | Language |
| --- | --- | --- | --- |
| Mexico | `mx/` | `youngmaster.org/lp/mx` | Spanish (es-MX) |
| Brazil | `br/` | `youngmaster.org/lp/br` | Portuguese (pt-BR) |
| UAE | `ae/` | `youngmaster.org/lp/ae` | Arabic (ar, RTL) |
| Saudi Arabia | `sa/` | `youngmaster.org/lp/sa` | Arabic (ar, RTL) |
| Qatar | `qa/` | `youngmaster.org/lp/qa` | Arabic (ar, RTL) |
| International | `global/` | `youngmaster.org/lp/global` | English (any country) |

Audience: **teachers, academic coordinators, principals and school owners** who enter a group
of their students into the online round. The pages do not address parents or students.

**Deploying the Arabic and international pages for the first time: see [DEPLOY-GULF.md](DEPLOY-GULF.md).**

---

## Where these pages actually run

> **The live pages are served from youngmaster.org on Apache/PHP — not from Vercel.**
> Deploying this repo to Vercel produces a preview only; it never reaches the live pages.
> Going live means the Young Master developer copying files into `/lp/` on the host.

The Vercel deployment (`ym-lp.vercel.app`) exists as a **visual reference** for review and for
sharing with the client. On the preview the form will not submit: the PHP endpoint is not there
and the reCAPTCHA key is bound to the youngmaster.org domain. That is expected.

`vercel.json` rewrites `/lp/:path*` to `/:path*` so the preview can serve the same `/lp/...`
asset paths the live pages use. This keeps one set of paths across both environments.

---

## Stack

Static HTML + CSS + one small JS file. No build step, no framework, no dependencies.

That is a conversion decision, not a shortcut — the pages paint almost instantly on a mid-range
Android over mobile data, which is what most of this traffic is.

```
.
├── index.html               Market chooser (the root URL — for sharing with the client)
├── mx/index.html            Mexico (es-MX)
├── br/index.html            Brazil (pt-BR)
├── ae/index.html            UAE (ar, RTL)
├── sa/index.html            Saudi Arabia (ar, RTL)
├── qa/index.html            Qatar (ar, RTL)
├── global/index.html        International (en) — country calling-code picker
├── assets/
│   ├── css/site.css         Shared stylesheet (brand tokens at the top) — LTR
│   ├── css/site-rtl.css     RTL overrides, loaded only by the Arabic pages
│   ├── js/site.js           Two-step form, validation, reCAPTCHA v3, Meta Pixel events
│   └── img/                 Event photography (WebP) + logo variants
├── ads/                     Ad creatives and the script that renders them
├── api/lead.js              Vercel-preview lead endpoint (NOT the live one — see below)
├── DEPLOY-GULF.md           Handover instructions for the Young Master developer
└── vercel.json              Clean URLs, the /lp rewrite, caching, security headers
```

`mx/`, `br/`, `assets/css/site.css` and `assets/js/site.js` in this repo are kept
**byte-identical to the live site**. Before editing any of them, re-sync from live first —
the live version has been ahead of this repo before, and overwriting it loses work.

---

## Meta Pixel

Live and firing on all pages. Dataset **1876285623353605**, installed inline in each page head.

| Event | Fires when |
| --- | --- |
| `PageView` | Page load |
| `CTAClick` | Any CTA that scrolls to the form |
| `FormStarted` | Visitor types in the first field |
| `FormStep2` | Visitor reaches step 2 |
| `ScrollDepth` | 50% and 90% scroll |
| `Lead` | Form saved successfully |
| `CompleteRegistration` | Form saved successfully |

Optimise the ad set for **Lead**. `FormStarted` is a useful audience signal while volume is low.

`Lead` fires **only** after the endpoint returns `ok: true`, so the reported lead count cannot
drift above the saved lead count. A failed save shows the visitor an error and records nothing.

**Not yet in place: the Conversions API.** Everything is browser-side, so iOS and
tracking-prevention losses are unmeasured. Sending a server-side `Lead` from `lead.php`
(hashed email + phone) would recover part of that. Worth doing before budgets scale.

---

## Where the leads go

**Live:** the form POSTs JSON to `/lp/api/lead.php`, which is maintained by the Young Master
developer, along with reCAPTCHA v3 verification.

**In this repo:** `api/lead.js` is the older Vercel serverless function, kept only for the
preview environment. It is **not** what runs in production and its field whitelist does not
match the Arabic pages. Do not treat it as the source of truth.

Field names sent by each page — the Arabic pages standardise on neutral English names:

| Page | Field naming |
| --- | --- |
| `mx` | Spanish (`nombre`, `escuela`, `ciudad`, `cargo`, `materia`, `alumnos`, `consentimiento`) |
| `br` | Portuguese (`nome`, `escola`, `cidade`, `cargo`, `disciplina`, `alunos`, `consentimento`) |
| `ae` `sa` `qa` | English (`name`, `whatsapp`, `email`, `english_proficiency`, `school`, `city`, `role`, `subject`, `students`, `consent`) |
| `global` | The same ten, plus `country` from the calling-code picker. `whatsapp` arrives with the dial code already prepended. |

`site.js` additionally attaches `locale`, `market`, `page`, `referrer`, `utm_source`,
`utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `fbclid` and `recaptcha_token`, so a
lead can be attributed back to the exact ad.

---

## The international page's country picker

`global/` carries a searchable calling-code selector covering 249 countries, with dial codes
taken from the `countries-list` dataset rather than typed by hand. Two details are load-bearing:

- **The dropdown markup sits outside `<form>`.** `site.js` binds to every `input` inside the
  form, so a search box in there would trip its validation and submit the form on Enter.
- **The picker's submit listener is registered before `site.js` runs**, because `site.js` is
  deferred and this script is not. That ordering is what lets the dial code be prepended to
  `whatsapp` before `site.js` reads the form. Do not add `defer` to it.

The country is detected from the visitor's timezone, falling back to their browser locale and
then to the UK, so most people never open the selector.

## Right-to-left (the Arabic pages)

`site.css` stays LTR and untouched. The Arabic pages load `assets/css/site-rtl.css` after it,
and **every rule in that file is scoped to `[dir="rtl"]`** so it cannot reach `/lp/mx` or
`/lp/br`. Please keep that property through any refactor — it is the only thing protecting the
two live Latin American pages from an RTL regression.

The Arabic pages load **Cairo** from Google Fonts instead of Poppins, which has no Arabic
coverage.

Directional characters in the markup are reversed by hand, not by CSS: a "continue" button
points `←` on an RTL page and "back" points `→`.

---

## Facts used on the pages

Taken from youngmaster.org and from the current live pages. Nothing here is invented.

- Ages **9–17**, three age categories
- Subjects: **English** and **Maths**
- **4,500+** online-round participants · **30+** countries represented
- Online rounds: 23–24 Oct 2026 · 20–21 Nov 2026 · 18–19 Dec 2026 · 22–23 Jan 2027 ·
  12–13 Feb 2027 · 5–6 Mar 2027 · 16–17 Apr 2027. Local rounds: September to January.
- Regional rounds: Kuala Lumpur 26 Sep 2026 · **Dubai 16–21 Mar 2027** · Istanbul 23–28 Mar 2027
- Grand World Final: **London, 31 July – 6 August 2027**
- Prizes, on the best score across the October–January rounds: 1st = full London package free,
  2nd = 50% off, 3rd = 25% off, Gold certificate = 10% off
- Every participant receives an international certificate regardless of score
- Contact: 16-17 Grand Arcade, London N12 0EH · WhatsApp +44 7393 909302 · info@youngmaster.org

Two things to keep straight, because both have shipped wrong before:

1. **The country count is 30.** An earlier version had a counter reading "30+ countries" beside
   body text saying "200 countries". Any number that appears twice must agree with itself.
2. **There are no GBP certificate discount prices.** The old £175 / £125 / £85 rows were removed
   because the main site does not carry them. Do not reintroduce them.

Photography is the client's own, resized and converted to WebP.

---

## Tone and register

The pages address the reader differently on purpose, because the polite default differs by market.

| Page | Form of address | Why |
| --- | --- | --- |
| `mx` | **usted** | The reader is a teacher, coordinator or director being approached with a business proposal. `tú` reads as friendly-informal and undercuts the pitch. Also the one form that is correct across all of Latin America. |
| `br` | **você** | In Brazilian Portuguese `você` *is* the neutral professional register. `o(a) senhor(a)` would sound stiff. |
| `ae` `sa` `qa` | Modern Standard Arabic, institutional register | The register a school principal expects in official correspondence — not literary, not colloquial. |

Where a direct-object pronoun would have been gendered (`contactarlo` / `contactarla`), the
Spanish copy is phrased neutrally (`comunicarnos con usted`). Most teachers in the target
audience are women, so a masculine default would have been wrong more often than right.
