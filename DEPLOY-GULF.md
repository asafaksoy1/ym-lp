# Deploying the new landing pages (UAE · Saudi Arabia · Qatar · International)

Four new landing pages are ready in this repo — three in Arabic and one in English for
every other country. They are built to drop into the existing `/lp/` setup on
youngmaster.org with **no changes to the shared CSS or JS**, so the live Mexico and Brazil
pages are not affected.

| Market | Repo path | Goes live at |
| --- | --- | --- |
| UAE | `ae/index.html` | `youngmaster.org/lp/ae` |
| Saudi Arabia | `sa/index.html` | `youngmaster.org/lp/sa` |
| Qatar | `qa/index.html` | `youngmaster.org/lp/qa` |
| International (English) | `global/index.html` | `youngmaster.org/lp/global` |

---

## 1. Files to copy

**New files:**

```
ae/index.html              → /lp/ae/index.html
sa/index.html              → /lp/sa/index.html
qa/index.html              → /lp/qa/index.html
global/index.html          → /lp/global/index.html
assets/css/site-rtl.css    → /lp/assets/css/site-rtl.css
```

The international page needs no extra CSS or JS file: its country-code picker is
self-contained in the page.

**Unchanged — do not overwrite with an older copy:**

```
assets/css/site.css        already live, byte-identical in this repo
assets/js/site.js          already live, byte-identical in this repo
assets/img/*               no new images; the Arabic pages reuse the existing ones
```

> The `mx/` and `br/` pages in this repo have been re-synced from the current live site
> (including the reCAPTCHA wiring and the content corrections). Pulling this branch will
> not regress them. That was not true of earlier commits.

### Why a separate RTL stylesheet

Arabic needs a right-to-left layout. Rather than touch `site.css`, the Arabic pages load
`site-rtl.css` after it, and every rule in that file is scoped to `[dir="rtl"]`. Nothing in
it can apply to `/lp/mx` or `/lp/br`. If you ever refactor, please keep that property.

---

## 2. The one thing that needs server-side work

The form markup, the two-step flow, the validation, the reCAPTCHA v3 call and the Meta
Pixel events are all already in place and driven by the existing `site.js` — there is
nothing to wire on the front end.

**But `/lp/api/lead.php` will drop the new fields unless its whitelist is extended.**

The Arabic pages use neutral English field names, the same ten on all three pages:

| `name` attribute | Field |
| --- | --- |
| `name` | Full name |
| `whatsapp` | WhatsApp number |
| `email` | Email |
| `english_proficiency` | Do you speak English? (None / Intermediate / Fluent) |
| `school` | School name |
| `city` | City |
| `role` | Role at the school |
| `subject` | Subject of interest |
| `students` | Approximate number of students |
| `consent` | Consent checkbox |

The international page sends those same ten **plus one more**:

| `name` attribute | Field |
| --- | --- |
| `country` | Country, set by the calling-code picker (e.g. `Spain`) |

Plus the keys `site.js` adds automatically, exactly as it already does for MX and BR:
`locale`, `market` (`AE` / `SA` / `QA` / `INT`), `page`, `referrer`, `utm_source`,
`utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `fbclid`, `recaptcha_token`.

Please add the eleven field names above to the `lead.php` field whitelist and make sure
leads with `market` = `AE`, `SA`, `QA` or `INT` reach the same destination as the Mexico
and Brazil ones.

On the international page the `whatsapp` value arrives as a full international number with
the dial code already prepended — `+34 612 345 678` — because the visitor picks their
country from the selector. No parsing needed on your side.

The success state only renders when `lead.php` returns `ok: true`, and the `Lead` pixel
event only fires on that same condition — so if the whitelist is wrong, the visitor sees an
error and Meta records nothing. That is deliberate: it means the reported lead count cannot
drift from the saved lead count.

---

## 3. Already configured — nothing to do

- **Meta Pixel** — dataset `1876285623353605`, same inline snippet and placement as the live
  Mexico page. Fires `PageView`, `ScrollDepth`, `FormStarted`, `FormStep2`, `CTAClick`, and
  `Lead` + `CompleteRegistration` on a successful save.
- **reCAPTCHA v3** — site key `6LdognctAAAAALEtPb6OBdb1SQTpcvaTKAgoO8LS`, the same key the
  Mexico and Brazil pages use. It is registered for youngmaster.org, so it works as-is on
  the new paths. Action names are `landing_ae`, `landing_sa`, `landing_qa`, `landing_int`.
- **Asset paths** — all `/lp/assets/...`, matching the live pages.
- **`robots: noindex, follow`** — matching the existing campaign pages. Tell us if you would
  rather these were indexable; it is a one-line change per page.

---

## 4. Test checklist before going live

For each of the four pages:

1. Page loads at `/lp/ae`, `/lp/sa`, `/lp/qa` and `/lp/global`. On the three Arabic pages the
   layout is right-to-left — logo, hero, form labels, tables and the WhatsApp button all mirrored.
   On `/lp/global`, open the country selector next to the phone field, type a few letters and
   confirm you can find and pick a country.
2. Check at 360px width. There should be no horizontal scrolling.
3. Meta Pixel Helper shows the pixel firing `PageView` on load.
4. Submit a real test lead. You should see the success state, **and** that lead should arrive
   wherever MX and BR leads arrive, with `market` set correctly.
5. Confirm `/lp/mx` and `/lp/br` still render and submit correctly — the RTL stylesheet must
   not have leaked.
6. On `/lp/global`, check the saved lead has the full international number in `whatsapp` and
   the chosen country in `country`.

Once these pass we will point the Meta campaigns at the four URLs.

---

## Questions

Anything unclear, or if `lead.php` needs a different field naming convention than the one
above, tell us and we will change the markup rather than have you patch around it.
