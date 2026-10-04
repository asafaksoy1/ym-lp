/**
 * POST /api/lead — lead capture for the Mexico, Brazil, UAE, Saudi and Qatar
 * landing pages.
 *
 * CURRENT MODE: demo. Every submission is validated and written to the Vercel
 * function logs (Vercel dashboard -> the project -> Logs), and nothing else.
 *
 * TO GO LIVE, set ONE environment variable in the Vercel project settings —
 * no code change needed:
 *
 *   LEAD_WEBHOOK_URL   Any URL that accepts a JSON POST. Each lead is forwarded
 *                      to it as JSON. Works with a Google Apps Script web app,
 *                      a Zapier / Make catch hook, n8n, a CRM endpoint, etc.
 *
 * Leads are never lost on a forwarding failure: the full record is always
 * printed to the logs first, and the visitor always sees the success state.
 */

const FIELDS = [
  "nombre", "nome", "name",         // name (MX / BR / AE-SA-QA)
  "whatsapp", "email",
  "english_proficiency",
  "escuela", "escola", "school",    // school (MX / BR / AE-SA-QA)
  "ciudad", "cidade", "city",       // city (MX / BR / AE-SA-QA)
  "country",                        // country, from the picker on the international page
  "cargo", "role",                  // role (MX-BR / AE-SA-QA)
  "materia", "disciplina", "subject",   // subject (MX / BR / AE-SA-QA)
  "alumnos", "alunos", "students",      // student count (MX / BR / AE-SA-QA)
  "consentimiento", "consentimento", "consent",
  "locale", "market", "page", "referrer",
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"
];

// Strip control characters, collapse whitespace, cap length.
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

function clean(value) {
  if (typeof value !== "string") return "";
  return value.replace(CONTROL_CHARS, " ").replace(/\s+/g, " ").trim().slice(0, 300);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  if (!body || typeof body !== "object") body = {};

  const lead = {};
  for (const key of FIELDS) {
    const value = clean(body[key]);
    if (value) lead[key] = value;
  }

  const name = lead.nombre || lead.nome || lead.name || "";
  const contact = lead.whatsapp || lead.email || "";
  if (!name || !contact) {
    return res.status(400).json({ ok: false, error: "missing_required_fields" });
  }

  lead.receivedAt = new Date().toISOString();
  lead.ip = req.headers["x-forwarded-for"] || "";
  lead.userAgent = req.headers["user-agent"] || "";

  // Always log first — this is the record of truth in demo mode.
  console.log("[YM LEAD]", JSON.stringify(lead));

  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (webhook) {
    try {
      const upstream = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead)
      });
      if (!upstream.ok) {
        console.error("[YM LEAD] webhook responded", upstream.status);
      }
    } catch (err) {
      console.error("[YM LEAD] webhook failed:", err && err.message);
    }
  }

  return res.status(200).json({ ok: true });
}
