import { useState, useRef, useCallback, useEffect } from "react";

// ─── STORAGE KEYS ──────────────────────────────────────────────────────────────
const STORAGE_KEY = "dce_estimates";

// ─── SYSTEM PROMPT ─────────────────────────────────────────────────────────────
const buildSystemPrompt = (location, boothSize, sqft) => `You are a senior fabrication estimator at DreamCraft Events (DCE), a world-class experiential fabrication company in Tustin, CA that builds trade show exhibits, branded activations, music festival experiences, and immersive brand environments.

BOOTH CONTEXT:
- Location: ${location.toUpperCase()}
- Size: ${boothSize} ${sqft ? `(~${sqft} sqft)` : ""}

PRICING REFERENCE:
${location === "indoor" ? `Indoor:
- Flooring: $4.25/sqft (carpet/linoleum)
- Graphics: $15-18/sqft (vinyl wrap / SEG)
- Wall: $37.50/sqft (plywood or aluminum SEG frame)
- Custom Wall: $70/sqft (shelving unit or cutout)
- Hanging Sign: $37.50/sqft
- Reception Counter: $2,500 each
- LED Video Wall: $195/sqft (rental indoor tiles)
- Counter: $600/linear ft (2-6ft range)
- Logo Lighting: $1,850-$2,600 each
- Stanchion: $40 each (tradeshow: $75 each)` : `Outdoor:
- Flooring Snap Block/Carpet: $4.25/sqft
- Rental Platform Flooring: $17.50/sqft
- Astro Turf: $4/sqft
- Graphics: $15-18/sqft (vinyl wrap / SEG)
- Wall: $37.50/sqft (plywood / aluminum SEG)
- Custom Wall: $70/sqft (shelving/cutout)
- Built Signage: $37.50/sqft
- LED Video Wall: $250/sqft (outdoor rental tiles)
- High Boy Table: $135 each
- Printed Canopy: $9/sqft
- Truss Stock: $25/linear ft (12x12)
- Stanchion: $40-75 each
- Rental Counter: $450-600 each`}

LOGISTICS BENCHMARKS:
- Warehouse outbound: $86-$96/hr, 8-20 hrs typical
- Packing/pallets/crating: $385-$485 per unit
- Transportation: local ($900-$1,800), regional ($5,000-$6,000), national ($10,000+)
- I&D labor: small ~$8,000-$15,000 | medium ~$15,000-$25,000 | large ~$25,000-$45,000+
- Labor travel: $3,500-$10,000+
- Warehouse inbound: $688-$1,152
- Sundries: $1.25/sqft
- Pre-show/PM: $2,500-$8,000
- Structural engineering (large outdoor): $3,750-$4,250

TIERING:
- AFFORDABLE: Standard materials, vinyl graphics, basic lighting, minimal custom. Max impact at lowest cost.
- MID-TIER: Quality custom fabrication, SEG graphics, custom counters, moderate LED, possible small display.
- HIGH-END: Premium custom builds, bespoke cabinetry, large LED video walls, interactive tech, full lighting.

TASK: Analyze the render (if provided), identify all elements, and produce three estimate tiers.

Respond ONLY with valid JSON — no markdown, no backticks, no preamble. Keep all string values under 100 chars. Use this exact structure:
{
  "analysis": { "detected_elements": ["string"], "assumptions": ["string"] },
  "clarifying_questions": [{ "id": "q1", "question": "string", "why_it_matters": "string", "options": ["A","B","other"] }],
  "estimates": {
    "affordable": {
      "label": "Affordable", "description": "string",
      "fabrication_items": [{ "item": "string", "qty": "string", "unit_cost": 0, "subtotal": 0 }],
      "fabrication_subtotal": 0,
      "logistics": { "warehouse_outbound": 0, "packing_materials": 0, "transportation_to_show": 0, "installation_dismantle_labor": 0, "labor_travel_expenses": 0, "freight_return": 0, "warehouse_inbound": 0, "sundries": 0, "preshow_pm": 0 },
      "logistics_subtotal": 0, "grand_total": 0, "notes": "string"
    },
    "mid_tier": { "label": "Mid-Tier", "description": "string", "fabrication_items": [{ "item": "string", "qty": "string", "unit_cost": 0, "subtotal": 0 }], "fabrication_subtotal": 0, "logistics": { "warehouse_outbound": 0, "packing_materials": 0, "transportation_to_show": 0, "installation_dismantle_labor": 0, "labor_travel_expenses": 0, "freight_return": 0, "warehouse_inbound": 0, "sundries": 0, "preshow_pm": 0 }, "logistics_subtotal": 0, "grand_total": 0, "notes": "string" },
    "high_end": { "label": "High-End", "description": "string", "fabrication_items": [{ "item": "string", "qty": "string", "unit_cost": 0, "subtotal": 0 }], "fabrication_subtotal": 0, "logistics": { "warehouse_outbound": 0, "packing_materials": 0, "transportation_to_show": 0, "installation_dismantle_labor": 0, "labor_travel_expenses": 0, "freight_return": 0, "warehouse_inbound": 0, "sundries": 0, "preshow_pm": 0 }, "logistics_subtotal": 0, "grand_total": 0, "notes": "string" }
  },
  "time_estimate": { "fabrication_weeks": "string", "install_days": "string", "dismantle_days": "string" }
}`;

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────
const BOOTH_SIZES = {
  "10x20": { sqft: 200, label: "Small – 10×20 (200 sqft)" },
  "20x20": { sqft: 400, label: "Medium – 20×20 (400 sqft)" },
  "30x30": { sqft: 900, label: "Large – 30×30 (900 sqft)" },
  "40x40": { sqft: 1600, label: "XL – 40×40 (1,600 sqft)" },
  "custom": { sqft: null, label: "Custom Size" },
};

const TIER_STYLES = {
  affordable: { accent: "#fff",    bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.12)", icon: "I" },
  mid_tier:   { accent: "#fff",    bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.2)",  icon: "II" },
  high_end:   { accent: "#fff",    bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.35)", icon: "III" },
};

const LOGISTICS_LABELS = {
  warehouse_outbound: "Warehouse Outbound",
  packing_materials: "Packing Materials",
  transportation_to_show: "Transportation to Show",
  installation_dismantle_labor: "Install & Dismantle Labor",
  labor_travel_expenses: "Labor Travel & Expenses",
  freight_return: "Freight Return",
  warehouse_inbound: "Warehouse Inbound",
  sundries: "Sundries & Incidentals",
  preshow_pm: "Pre-Show / Project Management",
};

const STATUS_STYLES = {
  draft:    { color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.05)",  label: "DRAFT" },
  sent:     { color: "rgba(255,255,255,0.7)", bg: "rgba(255,255,255,0.08)",  label: "SENT" },
  accepted: { color: "#fff",                  bg: "rgba(255,255,255,0.12)",  label: "ACCEPTED" },
  revised:  { color: "rgba(255,255,255,0.6)", bg: "rgba(255,255,255,0.07)",  label: "REVISED" },
};

// ─── UTILS ─────────────────────────────────────────────────────────────────────
const fmt = (n) => (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const genId = () => Math.random().toString(36).slice(2, 10);

// Detect MIME type robustly — never pass empty string to API
function getSafeMimeType(file) {
  if (file.type && file.type.startsWith("image/")) {
    // HEIC/HEIF not supported by Anthropic — convert label to jpeg
    if (file.type === "image/heic" || file.type === "image/heif") return "image/jpeg";
    return file.type;
  }
  // Guess from filename extension
  const ext = (file.name || "").split(".").pop().toLowerCase();
  const map = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };
  return map[ext] || "image/jpeg"; // safe fallback
}

// Resize + compress image to max 1024px on longest side, JPEG quality 0.82
// This keeps file sizes small enough to send multiple images in one API call
function fileToBase64(file) {
  return new Promise((res, rej) => {
    const MAX_PX = 1024;
    const QUALITY = 0.82;
    const reader = new FileReader();
    reader.onerror = () => rej(new Error("Could not read file — try a JPG or PNG."));
    reader.onload = (e) => {
      const dataUrl = e.target?.result;
      if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
        rej(new Error("FileReader returned invalid data — try a JPG or PNG.")); return;
      }
      const img = new Image();
      let settled = false;
      const fail = (msg) => { if (!settled) { settled = true; rej(new Error(msg)); } };
      const succeed = (b64) => { if (!settled) { settled = true; res(b64); } };
      // Timeout in case neither onload nor onerror fires (some browsers/formats)
      const timer = setTimeout(() => fail("Image decode timed out — try saving as JPG or PNG."), 8000);
      img.onerror = () => { clearTimeout(timer); fail("Could not decode image — try saving as JPG or PNG."); };
      img.onload = () => {
        clearTimeout(timer);
        try {
          let { width, height } = img;
          if (!width || !height) { fail("Image has zero dimensions."); return; }
          if (width > MAX_PX || height > MAX_PX) {
            if (width >= height) { height = Math.round(height * MAX_PX / width); width = MAX_PX; }
            else { width = Math.round(width * MAX_PX / height); height = MAX_PX; }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          const out = canvas.toDataURL("image/jpeg", QUALITY);
          const parts = out.split(",");
          if (!parts[1]) { fail("Canvas export failed — try a different image."); return; }
          succeed(parts[1]);
        } catch (err) { fail("Image resize failed: " + err.message); }
      };
      img.src = dataUrl;
    };
    try { reader.readAsDataURL(file); }
    catch (e) { rej(new Error("Could not open file: " + e.message)); }
  });
}

function extractJSON(text) {
  let clean = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  const start = clean.indexOf("{");
  if (start === -1) throw new Error("No JSON found in response");
  let depth = 0, end = -1;
  for (let i = start; i < clean.length; i++) {
    if (clean[i] === "{") depth++;
    else if (clean[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) throw new Error("Response was cut off. The estimate was too complex — try a smaller booth size or reduce render complexity, then refine with the questions.");
  return JSON.parse(clean.slice(start, end + 1));
}

function recalcTotals(tier) {
  const fabrication_subtotal = (tier.fabrication_items || []).reduce((s, i) => s + (Number(i.subtotal) || 0), 0);
  const logistics_subtotal = Object.values(tier.logistics || {}).reduce((s, v) => s + (Number(v) || 0), 0);
  return { ...tier, fabrication_subtotal, logistics_subtotal, grand_total: fabrication_subtotal + logistics_subtotal };
}

// ─── PDF GENERATION ────────────────────────────────────────────────────────────
function generatePDF(estimate) {
  const tier = estimate.estimates[estimate.selectedTier];
  if (!tier) return;

  const quoteNum = estimate.quoteNumber || `DCE-${Date.now().toString().slice(-5)}`;
  const clientName = estimate.clientName || "CLIENT";
  const projectName = estimate.projectName || "PROJECT";
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const expiry = new Date(Date.now() + 14 * 86400000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const rows = (tier.fabrication_items || []).map(item => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#fff;">${item.item}</td>
      <td style="padding:10px 8px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:rgba(255,255,255,0.45);text-align:center;">${item.qty || ""}</td>
      <td style="padding:10px 8px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:rgba(255,255,255,0.45);text-align:right;">${fmt(item.unit_cost)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;font-weight:600;color:#fff;text-align:right;">${fmt(item.subtotal)}</td>
    </tr>`).join("");

  const logRows = Object.entries(tier.logistics || {}).filter(([, v]) => v > 0).map(([k, v]) => `
    <tr>
      <td style="padding:9px 8px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:rgba(255,255,255,0.7);" colspan="3">${LOGISTICS_LABELS[k] || k}</td>
      <td style="padding:9px 8px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;font-weight:600;color:#fff;text-align:right;">${fmt(v)}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>DCE Quote ${quoteNum}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;700;800&family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter',sans-serif; background: #fff; color: #fff; }
  .page { max-width: 860px; margin: 0 auto; padding: 48px 52px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 32px; border-bottom: 1px solid rgba(255,255,255,0.15); margin-bottom: 36px; }
  .logo-block { display: flex; align-items: center; gap: 14px; }
  .logo-box { display: none; }
  .co-name { font-size: 20px; font-weight: 800; color: #fff; letter-spacing: 0.02em; }
  .co-addr { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 3px; }
  .quote-meta { text-align: right; }
  .quote-label { font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.4); }
  .quote-num { font-size: 26px; font-weight: 800; color: #fff; letter-spacing: 0.02em; margin-top: 2px; }
  .bill-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin-bottom: 32px; }
  .bill-col { padding: 20px 24px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); }
  .bill-col:first-child { }
  .bill-col:last-child { }
  .bill-label { font-size: 9px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.35); margin-bottom: 8px; }
  .bill-name { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 4px; }
  .bill-detail { font-size: 12px; color: rgba(255,255,255,0.45); line-height: 1.6; }
  .project-bar { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); color: #fff; padding: 14px 24px; margin-bottom: 28px; display: flex; gap: 32px; flex-wrap: wrap; }
  .project-field { }
  .project-field-label { font-size: 9px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(255,255,255,0.35); margin-bottom: 3px; }
  .project-field-value { font-size: 13px; font-weight: 600; color: #fff; }
  .tier-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  thead tr { background: #000; }
  thead th { padding: 11px 8px; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.7); }
  thead th:first-child { text-align: left; padding-left: 14px; border-radius: 8px 0 0 0; }
  thead th:last-child { text-align: right; padding-right: 14px; border-radius: 0 8px 0 0; }
  thead th:not(:first-child):not(:last-child) { text-align: center; }
  .section-header td { padding: 12px 8px 6px; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.45); border-bottom: 1px solid rgba(255,255,255,0.1); padding-left: 0; }
  .subtotal-row td { padding: 11px 8px; font-size: 13px; font-weight: 700; background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.6); }
  .subtotal-row td:last-child { text-align: right; padding-right: 0; }
  .grand-total { display: flex; justify-content: space-between; align-items: center; padding: 18px 0; border-top: 1px solid rgba(255,255,255,0.2); border-bottom: 1px solid rgba(255,255,255,0.2); margin-top: 20px; }
  .gt-label { font-family: "Barlow Condensed", sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(255,255,255,0.4); }
  .gt-value { font-family: "Barlow Condensed", sans-serif; font-size: 36px; font-weight: 700; color: #fff; letter-spacing: 0.04em; }
  .timeline { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-top: 20px; }
  .tl-box { border: 1px solid rgba(255,255,255,0.12); padding: 14px 16px; text-align: center; }
  .tl-label { font-size: 9px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 5px; }
  .tl-val { font-size: 15px; font-weight: 800; color: #fff; }
  .notes-box { margin-top: 20px; padding: 14px 18px; border-left: 2px solid rgba(255,255,255,0.2); }
  .notes-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 5px; }
  .notes-text { font-size: 12px; color: rgba(255,255,255,0.55); line-height: 1.6; }
  .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.12); display: flex; justify-content: space-between; align-items: center; }
  .footer-legal { font-size: 11px; color: rgba(255,255,255,0.3); line-height: 1.6; max-width: 420px; }
  .footer-logo { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #cbd5e1; }
  @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="logo-block">
      <div>
        <div class="co-name"><strong>DREAM</strong>CRAFT</div>
        <div class="co-addr">1111 Bell Avenue, Suite A · Tustin, CA 92780 · www.dce-usa.com</div>
      </div>
    </div>
    <div class="quote-meta">
      <div class="quote-label">Quote Number</div>
      <div class="quote-num">${quoteNum}</div>
    </div>
  </div>

  <!-- Billing Grid -->
  <div class="bill-grid">
    <div class="bill-col">
      <div class="bill-label">From</div>
      <div class="bill-name">Daniel Roberts</div>
      <div class="bill-detail">DCE USA (DreamCraft Events)<br/>droberts@dce-usa.com</div>
    </div>
    <div class="bill-col">
      <div class="bill-label">To</div>
      <div class="bill-name">${clientName}</div>
      <div class="bill-detail">Date: ${today}<br/>Expiry: ${expiry}</div>
    </div>
  </div>

  <!-- Project Bar -->
  <div class="project-bar">
    <div class="project-field">
      <div class="project-field-label">Project</div>
      <div class="project-field-value">${projectName}</div>
    </div>
    <div class="project-field">
      <div class="project-field-label">Location Type</div>
      <div class="project-field-value">${estimate.location?.toUpperCase() || "—"}</div>
    </div>
    <div class="project-field">
      <div class="project-field-label">Booth Size</div>
      <div class="project-field-value">${estimate.boothSize || "—"}</div>
    </div>
    <div class="project-field">
      <div class="project-field-label">Tier</div>
      <div class="project-field-value">${tier.label}</div>
    </div>
  </div>

  <!-- Line Items Table -->
  <table>
    <thead>
      <tr>
        <th style="text-align:left;padding-left:14px;">Description</th>
        <th>Qty</th>
        <th>Unit Cost</th>
        <th style="text-align:right;padding-right:14px;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      <tr class="section-header"><td colspan="4">FABRICATION</td></tr>
      ${rows}
      <tr class="subtotal-row">
        <td colspan="3" style="color:rgba(255,255,255,0.4);font-size:12px;">Fabrication Subtotal</td>
        <td style="text-align:right;padding-right:0;">${fmt(tier.fabrication_subtotal)}</td>
      </tr>
      <tr class="section-header"><td colspan="4">LABOR &amp; LOGISTICS</td></tr>
      ${logRows}
      <tr class="subtotal-row">
        <td colspan="3" style="color:rgba(255,255,255,0.4);font-size:12px;">Labor &amp; Logistics Subtotal</td>
        <td style="text-align:right;padding-right:0;">${fmt(tier.logistics_subtotal)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Grand Total -->
  <div class="grand-total">
    <span class="gt-label">Total Estimate</span>
    <span class="gt-value">${fmt(tier.grand_total)}</span>
  </div>

  ${estimate.result?.time_estimate ? `
  <!-- Timeline -->
  <div class="timeline">
    <div class="tl-box"><div class="tl-label">Fabrication</div><div class="tl-val">${estimate.result.time_estimate.fabrication_weeks}</div></div>
    <div class="tl-box"><div class="tl-label">Install</div><div class="tl-val">${estimate.result.time_estimate.install_days}</div></div>
    <div class="tl-box"><div class="tl-label">Dismantle</div><div class="tl-val">${estimate.result.time_estimate.dismantle_days}</div></div>
  </div>` : ""}

  ${tier.notes ? `
  <div class="notes-box">
    <div class="notes-label">Notes</div>
    <div class="notes-text">${tier.notes}</div>
  </div>` : ""}

  <!-- Footer -->
  <div class="footer">
    <div class="footer-legal">
      This estimate is valid for 14 days from the date of issue. Pricing is subject to final scope confirmation, site survey, and engineering review. Labor rates may vary based on union jurisdiction. All prices exclude applicable taxes.
    </div>
    <div class="footer-logo">DreamCraft Events · dce-usa.com</div>
  </div>

</div>
</body>
</html>`;

  // Build images section HTML if images exist
  const imagesHtml = (() => {
    const imgs = estimate.imagesB64 || (estimate.imageB64 ? [{ b64: estimate.imageB64, mimeType: "image/jpeg", name: "render" }] : []);
    if (!imgs.length) return "";
    const thumbs = imgs.map(img =>
      `<img src="data:${img.mimeType || "image/jpeg"};base64,${img.b64}" style="width:${imgs.length === 1 ? "100%" : "calc(50% - 6px)"};border-radius:0;object-fit:cover;max-height:280px;display:inline-block;margin-bottom:12px;" />`
    ).join(" ");
    return `<div style="margin-bottom:28px;"><div style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:10px;">PROJECT RENDERS</div><div style="display:flex;flex-wrap:wrap;gap:12px;">${thumbs}</div></div>`;
  })();

  // Insert images after project bar, before table
  const htmlWithImages = html.replace("<!-- Line Items Table -->", imagesHtml + "<!-- Line Items Table -->");

  // Use blob URL + anchor click — works without popup blocker issues
  const blob = new Blob([htmlWithImages], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener";
  a.click();
  // Revoke after a delay so the tab has time to load
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.draft;
  return (
    <span style={{ padding: "3px 10px", borderRadius: 0, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function TierPill({ tier, isActive, onClick }) {
  const s = TIER_STYLES[tier];
  const labels = { affordable: "I — Affordable", mid_tier: "II — Mid-Tier", high_end: "III — High-End" };
  return (
    <button onClick={onClick} style={{
      padding: "6px 14px", borderRadius: 0, fontSize: 12, fontWeight: 700, cursor: "pointer",
      background: isActive ? s.bg : "transparent",
      border: `1px solid ${isActive ? s.accent : "rgba(255,255,255,0.1)"}`,
      color: isActive ? s.accent : "rgba(255,255,255,0.4)",
      transition: "all 0.15s",
    }}>{s.icon} {labels[tier]}</button>
  );
}

function Accordion({ label, children, subtotal, accent, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 14 }}>
      <div onClick={() => setOpen(o => !o)} style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.08)", cursor: "pointer",
      }}>
        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: accent }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 700, color: "#fff", fontSize: 13 }}>{fmt(subtotal)}</span>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>
      {open && <div style={{ paddingTop: 4 }}>{children}</div>}
    </div>
  );
}

// Editable line row — inline editing for item name, qty, subtotal
function EditableLineRow({ item, onUpdate, onDelete, accent }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState({ ...item });

  const save = () => {
    const subtotal = Number(local.unit_cost) * (parseFloat(local.qty) || 1);
    onUpdate({ ...local, subtotal: isNaN(subtotal) ? Number(local.subtotal) : subtotal });
    setEditing(false);
  };

  if (editing) {
    return (
      <div style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "grid", gridTemplateColumns: "1fr 80px 90px 90px 32px", gap: 6, alignItems: "center" }}>
        <input value={local.item} onChange={e => setLocal(l => ({ ...l, item: e.target.value }))}
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 0, padding: "5px 8px", color: "#fff", fontSize: 12 }} />
        <input value={local.qty} onChange={e => setLocal(l => ({ ...l, qty: e.target.value }))}
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 0, padding: "5px 8px", color: "#fff", fontSize: 12, textAlign: "center" }} />
        <input type="number" value={local.unit_cost} onChange={e => setLocal(l => ({ ...l, unit_cost: Number(e.target.value) }))}
          placeholder="Unit $"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 0, padding: "5px 8px", color: "#fff", fontSize: 12, textAlign: "right" }} />
        <input type="number" value={local.subtotal} onChange={e => setLocal(l => ({ ...l, subtotal: Number(e.target.value) }))}
          style={{ background: "rgba(255,255,255,0.07)", border: `1px solid ${accent}55`, borderRadius: 0, padding: "5px 8px", color: accent, fontSize: 12, fontWeight: 700, textAlign: "right" }} />
        <button onClick={save} style={{ background: accent, border: "none", borderRadius: 0, width: 28, height: 28, color: "#000", fontWeight: 900, fontSize: 13, cursor: "pointer" }}>✓</button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px 30px 24px", gap: 6, alignItems: "center", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{item.item}</span>
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>{item.qty}</span>
      <span style={{ fontSize: 13, color: "#fff", fontWeight: 600, textAlign: "right" }}>{fmt(item.subtotal)}</span>
      <button onClick={() => { setLocal({ ...item }); setEditing(true); }}
        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.45)", fontSize: 13, cursor: "pointer", padding: 0, transition: "color 0.15s" }}
        onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.25)'}>✎</button>
      <button onClick={onDelete}
        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.45)", fontSize: 12, cursor: "pointer", padding: 0, transition: "color 0.15s" }}
        onMouseEnter={e => e.target.style.color = "#f87171"} onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.18)"}>✕</button>
    </div>
  );
}

function EditableLogisticsRow({ logKey, value, onUpdate, accent }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);
  const save = () => { onUpdate(Number(local)); setEditing(false); };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 24px", alignItems: "center", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", gap: 8 }}>
      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{LOGISTICS_LABELS[logKey] || logKey}</span>
      {editing ? (
        <>
          <input type="number" value={local} onChange={e => setLocal(e.target.value)}
            style={{ background: "rgba(255,255,255,0.07)", border: `1px solid ${accent}55`, borderRadius: 0, padding: "5px 8px", color: accent, fontSize: 12, fontWeight: 700, textAlign: "right" }} />
          <button onClick={save} style={{ background: accent, border: "none", borderRadius: 0, width: 22, height: 22, color: "#000", fontWeight: 900, fontSize: 11, cursor: "pointer" }}>✓</button>
        </>
      ) : (
        <>
          <span style={{ fontSize: 13, color: "#fff", fontWeight: 600, textAlign: "right" }}>{fmt(value)}</span>
          <button onClick={() => { setLocal(value); setEditing(true); }}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.45)", fontSize: 12, cursor: "pointer", padding: 0 }}
            onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.22)'}>✎</button>
        </>
      )}
    </div>
  );
}

// ─── ESTIMATE DETAIL VIEW ──────────────────────────────────────────────────────
function EstimateDetail({ estimate, onBack, onSave }) {
  const [localEst, setLocalEst] = useState(() => JSON.parse(JSON.stringify(estimate)));
  const [activeTier, setActiveTier] = useState(estimate.selectedTier || "mid_tier");
  const [showClientView, setShowClientView] = useState(false);
  const [answers, setAnswers] = useState({});
  const [refining, setRefining] = useState(false);
  const [dirty, setDirty] = useState(false);

  const s = TIER_STYLES[activeTier];
  const result = localEst.result;
  const tierData = result?.estimates?.[activeTier];

  const update = (updatedEst) => {
    setLocalEst(updatedEst);
    setDirty(true);
  };

  const updateFabItem = (tierKey, idx, newItem) => {
    const next = JSON.parse(JSON.stringify(localEst));
    next.result.estimates[tierKey].fabrication_items[idx] = newItem;
    next.result.estimates[tierKey] = recalcTotals(next.result.estimates[tierKey]);
    update(next);
  };

  const deleteFabItem = (tierKey, idx) => {
    const next = JSON.parse(JSON.stringify(localEst));
    next.result.estimates[tierKey].fabrication_items.splice(idx, 1);
    next.result.estimates[tierKey] = recalcTotals(next.result.estimates[tierKey]);
    update(next);
  };

  const addFabItem = (tierKey) => {
    const next = JSON.parse(JSON.stringify(localEst));
    next.result.estimates[tierKey].fabrication_items.push({ item: "New Line Item", qty: "1", unit_cost: 0, subtotal: 0 });
    update(next);
  };

  const updateLogistics = (tierKey, logKey, val) => {
    const next = JSON.parse(JSON.stringify(localEst));
    next.result.estimates[tierKey].logistics[logKey] = val;
    next.result.estimates[tierKey] = recalcTotals(next.result.estimates[tierKey]);
    update(next);
  };

  const updateField = (field, val) => {
    const next = { ...localEst, [field]: val };
    update(next);
  };

  const handleRefine = async () => {
    if (!result?.clarifying_questions) return;
    setRefining(true);
    try {
      const ctx = result.clarifying_questions
        .map(q => `Q: ${q.question}\nA: ${answers[q.id] || "Not specified"}`)
        .join("\n\n");

      const system = buildSystemPrompt(localEst.location, localEst.boothSize, localEst.sqft);
      const savedImgs = localEst.imagesB64 || (localEst.imageB64 ? [{ b64: localEst.imageB64, mimeType: "image/jpeg" }] : []);
      let content;
      if (savedImgs.length > 0) {
        content = [
          ...savedImgs.map(img => ({ type: "image", source: { type: "base64", media_type: img.mimeType || "image/jpeg", data: img.b64 } })),
          { type: "text", text: `Re-estimate with these clarifying answers:\n${ctx}\n\nRespond ONLY with valid JSON. No backticks.` }
        ];
      } else {
        content = `Re-estimate with these clarifying answers:\n${ctx}\n\nBooth: ${localEst.boothSize} | Location: ${localEst.location}\n\nRespond ONLY with valid JSON. No backticks.`;
      }

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 8000, system, messages: [{ role: "user", content }] }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.content?.map(b => b.text || "").join("") || "";
      const parsed = extractJSON(text);
      const next = { ...localEst, result: parsed, status: "revised", updatedAt: new Date().toISOString() };
      update(next);
    } catch (e) {
      alert("Refine failed: " + e.message);
    } finally {
      setRefining(false);
    }
  };

  const save = () => {
    const toSave = { ...localEst, selectedTier: activeTier, updatedAt: new Date().toISOString() };
    onSave(toSave);
    setDirty(false);
  };

  if (showClientView) {
    return <ClientView estimate={localEst} activeTier={activeTier} onClose={() => setShowClientView(false)} />;
  }

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", padding: "7px 14px", borderRadius: 0, fontSize: 12, fontWeight: 700 }}>← Back</button>
          <StatusBadge status={localEst.status} />
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {dirty && (
            <button onClick={save} style={{ padding: "8px 18px", borderRadius: 0, background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.35)", color: "#4ade80", fontWeight: 700, fontSize: 13 }}>
              💾 Save Changes
            </button>
          )}
          <button onClick={() => setShowClientView(true)} style={{ padding: "8px 18px", borderRadius: 0, background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.3)", color: "#60a5fa", fontWeight: 700, fontSize: 13 }}>
            👁 Client View
          </button>
          <button onClick={() => generatePDF({ ...localEst, selectedTier: activeTier })} style={{ padding: "8px 18px", borderRadius: 0, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", fontWeight: 700, fontSize: 13 }}>
            📄 Export PDF
          </button>
        </div>
      </div>

      {/* Project metadata */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
        {[
          ["Client / Company", "clientName", "e.g. Nike, Modelo"],
          ["Project Name", "projectName", "e.g. Coachella 2025"],
          ["Quote Number", "quoteNumber", `DCE-${genId().toUpperCase()}`],
        ].map(([lbl, key, ph]) => (
          <div key={key}>
            <label style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 9, letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>{lbl}</label>
            <input value={localEst[key] || ""} onChange={e => updateField(key, e.target.value)} placeholder={ph}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 0, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 13 }} />
          </div>
        ))}
      </div>

      {/* Status selector */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 9, letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Status</label>
        <div style={{ display: "flex", gap: 8 }}>
          {Object.entries(STATUS_STYLES).map(([key, val]) => (
            <button key={key} onClick={() => updateField("status", key)} style={{
              padding: "6px 14px", borderRadius: 0, fontSize: 12, fontWeight: 700, cursor: "pointer",
              background: localEst.status === key ? val.bg : "transparent",
              border: `1px solid ${localEst.status === key ? val.color : "rgba(255,255,255,0.1)"}`,
              color: localEst.status === key ? val.color : "rgba(255,255,255,0.4)",
              transition: "all 0.15s",
            }}>{val.label}</button>
          ))}
        </div>
      </div>

      {/* Render images gallery */}
      {(() => {
        const imgs = localEst.imagesB64 || (localEst.imageB64 ? [{ b64: localEst.imageB64, mimeType: "image/jpeg", name: "render" }] : []);
        if (!imgs.length) return null;
        return (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 9, letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 10 }}>
              Project Renders ({imgs.length})
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
              {imgs.map((img, i) => (
                <div key={i} style={{ borderRadius: 0, overflow: "hidden", border: "1px solid rgba(255,255,255,0.09)", aspectRatio: "4/3", background: "#111", position: "relative" }}>
                  <img
                    src={`data:${img.mimeType || "image/jpeg"};base64,${img.b64}`}
                    alt={img.name || `Render ${i + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "pointer" }}
                    onClick={() => window.open(`data:${img.mimeType || "image/jpeg"};base64,${img.b64}`, "_blank")}
                  />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "3px 7px", background: "rgba(0,0,0,0.6)", fontSize: 9, color: "rgba(255,255,255,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {img.name || `Angle ${i + 1}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Detected elements */}
      {result?.analysis?.detected_elements?.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 0, padding: "16px 20px", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 9, letterSpacing: "0.14em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 10 }}>Detected Elements</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {result.analysis.detected_elements.map((el, i) => (
              <span key={i} style={{ padding: "3px 10px", borderRadius: 0, background: "transparent", border: "1px solid rgba(255,255,255,0.15)", fontSize: 11, color: "rgba(255,255,255,0.55)", letterSpacing: "0.04em" }}>{el}</span>
            ))}
          </div>
        </div>
      )}

      {/* Clarifying questions */}
      {result?.clarifying_questions?.length > 0 && (
        <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 0, padding: "18px 20px", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span>❓</span> Clarifying Questions
            <span style={{ fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>— answer to refine estimate</span>
          </div>
          {result.clarifying_questions.map((q, i) => (
            <div key={q.id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: i < result.clarifying_questions.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{q.question}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>{q.why_it_matters}</div>
              {q.options?.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {q.options.map(opt => (
                    <button key={opt} onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))} style={{
                      padding: "5px 12px", borderRadius: 0, fontSize: 11, fontWeight: 600, cursor: "pointer",
                      background: answers[q.id] === opt ? "rgba(255,255,255,0.12)" : "transparent",
                      border: `1px solid ${answers[q.id] === opt ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.12)"}`,
                      color: answers[q.id] === opt ? "#fff" : "rgba(255,255,255,0.4)",
                    }}>{opt}</button>
                  ))}
                </div>
              ) : (
                <input value={answers[q.id] || ""} onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                  placeholder="Your answer..." style={{ width: "100%", padding: "7px 11px", borderRadius: 0, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "#fff", fontSize: 12 }} />
              )}
            </div>
          ))}
          <button onClick={handleRefine} disabled={refining} style={{
            padding: "9px 20px", borderRadius: 0, background: "rgba(245,158,11,0.13)", border: "1px solid rgba(245,158,11,0.3)",
            color: "#fff", fontWeight: 700, fontSize: 12, opacity: refining ? 0.6 : 1,
          }}>{refining ? "Refining…" : "↺ Re-run Estimate with Answers"}</button>
        </div>
      )}

      {/* Tier selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["affordable", "mid_tier", "high_end"].map(t => (
          <TierPill key={t} tier={t} isActive={activeTier === t} onClick={() => setActiveTier(t)} />
        ))}
      </div>

      {/* Tier detail + editing */}
      {tierData && (
        <div style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${s.border}`, borderRadius: 0, padding: "22px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, letterSpacing: "0.2em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 4 }}>{tierData.label} Tier</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, maxWidth: 420 }}>{tierData.description}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 9, color: "rgba(255,255,255,0.32)", letterSpacing: "0.12em", marginBottom: 3 }}>TOTAL ESTIMATE</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 40, fontWeight: 700, letterSpacing: "0.02em", color: "#fff" }}>{fmt(tierData.grand_total)}</div>
            </div>
          </div>

          {/* Fabrication editable */}
          <Accordion label="Fabrication" subtotal={tierData.fabrication_subtotal} accent={s.accent} defaultOpen={true}>
            {/* Column headers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px 30px 24px", gap: 6, padding: "4px 0 6px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Description", "Qty", "Total", "", ""].map((h, i) => (
                <span key={i} style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", textAlign: i === 2 ? "right" : i === 1 ? "center" : "left" }}>{h}</span>
              ))}
            </div>
            {(tierData.fabrication_items || []).map((item, i) => (
              <EditableLineRow key={i} item={item} accent={s.accent}
                onUpdate={(updated) => updateFabItem(activeTier, i, updated)}
                onDelete={() => deleteFabItem(activeTier, i)} />
            ))}
            <button onClick={() => addFabItem(activeTier)} style={{
              marginTop: 10, width: "100%", padding: "8px", borderRadius: 0, border: `1px dashed ${s.accent}44`,
              background: "transparent", color: s.accent, fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: 0.7,
            }}>+ Add Line Item</button>
          </Accordion>

          {/* Logistics editable */}
          <Accordion label="Labor & Logistics" subtotal={tierData.logistics_subtotal} accent={s.accent} defaultOpen={false}>
            {Object.entries(tierData.logistics || {}).map(([k, v]) => (
              <EditableLogisticsRow key={k} logKey={k} value={v} accent={s.accent}
                onUpdate={(val) => updateLogistics(activeTier, k, val)} />
            ))}
          </Accordion>

          {/* Grand total */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 18px", borderRadius: 0, background: `${s.accent}0e`, border: `1px solid ${s.border}`, marginTop: 6 }}>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Grand Total</span>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 34, fontWeight: 700, color: "#fff", letterSpacing: "0.02em" }}>{fmt(tierData.grand_total)}</span>
          </div>

          {tierData.notes && (
            <div style={{ marginTop: 12, padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 0, fontSize: 13, color: "rgba(255,255,255,0.45)", borderLeft: `3px solid ${s.accent}` }}>
              {tierData.notes}
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      {result?.time_estimate && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 16 }}>
          {[["Fabrication", result.time_estimate.fabrication_weeks], ["Install", result.time_estimate.install_days], ["Dismantle", result.time_estimate.dismantle_days]].map(([l, v]) => (
            <div key={l} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 0, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 9, letterSpacing: "0.14em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 5 }}>{l}</div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CLIENT VIEW ──────────────────────────────────────────────────────────────
function ClientView({ estimate, activeTier, onClose }) {
  const tier = estimate.result?.estimates?.[activeTier];
  if (!tier) return null;
  const s = TIER_STYLES[activeTier];

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh", fontFamily: "'Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');`}</style>

      {/* Client view top bar */}
      <div style={{ background: "#000", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#000", fontSize: 13 }}>DC</div>
          <span style={{ fontWeight: 800 }}>DREAM</span><span style={{ fontWeight: 300 }}>CRAFT</span>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: "7px 14px", borderRadius: 0, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>← Back to Editor</button>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 32px" }}>

        {/* Hero */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Fabrication Estimate</div>
          <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 48, fontWeight: 700, color: "#fff", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8, lineHeight: 1.1 }}>
            {estimate.projectName || "Your Project"}
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
            Prepared for {estimate.clientName || "Client"} · {fmtDate(estimate.createdAt)}
          </p>
        </div>

        {/* Render images */}
        {(() => {
          const imgs = estimate.imagesB64 || (estimate.imageB64 ? [{ b64: estimate.imageB64, mimeType: "image/jpeg", name: "render" }] : []);
          if (!imgs.length) return null;
          return (
            <div style={{ marginBottom: 36 }}>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>Project Renders</div>
              <div style={{ display: "grid", gridTemplateColumns: imgs.length === 1 ? "1fr" : "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {imgs.map((img, i) => (
                  <div key={i} style={{ borderRadius: 0, overflow: "hidden", border: "1px solid #e2e8f0", aspectRatio: "16/9", background: "rgba(255,255,255,0.03)" }}>
                    <img
                      src={`data:${img.mimeType || "image/jpeg"};base64,${img.b64}`}
                      alt={img.name || `Render ${i + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Tier selector — client facing */}
        <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
          {["affordable", "mid_tier", "high_end"].map(t => {
            const ts = TIER_STYLES[t];
            const td = estimate.result?.estimates?.[t];
            const isActive = t === activeTier;
            return (
              <div key={t} style={{ flex: 1, padding: "18px", borderRadius: 0, border: `2px solid ${isActive ? ts.accent : "#e2e8f0"}`, background: isActive ? "#fff" : "rgba(255,255,255,0.03)", cursor: "pointer" }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>{td?.label}</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "0.02em" }}>{fmt(td?.grand_total)}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{(td?.description || "").substring(0, 60)}…</div>
              </div>
            );
          })}
        </div>

        {/* Line items — clean client format */}
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 0, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ background: "transparent", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "10px 20px" }}>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>Fabrication</span>
          </div>
          {(tier.fabrication_items || []).map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{item.item}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{fmt(item.subtotal)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Fabrication Subtotal</span>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 700, color: "#fff" }}>{fmt(tier.fabrication_subtotal)}</span>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 0, overflow: "hidden", marginBottom: 32 }}>
          <div style={{ background: "transparent", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "10px 20px" }}>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>Labor & Logistics</span>
          </div>
          {Object.entries(tier.logistics || {}).filter(([, v]) => v > 0).map(([k, v], i) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{LOGISTICS_LABELS[k] || k}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{fmt(v)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Labor & Logistics Subtotal</span>
            <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 700, color: "#fff" }}>{fmt(tier.logistics_subtotal)}</span>
          </div>
        </div>

        {/* Grand total */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 28px", background: "#000", borderRadius: 0, marginBottom: 28 }}>
          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Total Estimate</span>
          <span style={{ fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>{fmt(tier.grand_total)}</span>
        </div>

        {/* Timeline */}
        {estimate.result?.time_estimate && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 28 }}>
            {[["Fabrication Time", estimate.result.time_estimate.fabrication_weeks], ["Installation", estimate.result.time_estimate.install_days], ["Dismantle", estimate.result.time_estimate.dismantle_days]].map(([l, v]) => (
              <div key={l} style={{ border: "1px solid #e2e8f0", borderRadius: 0, padding: "16px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 5 }}>{l}</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 20, color: "#fff" }}>{v}</div>
              </div>
            ))}
          </div>
        )}

        {tier.notes && (
          <div style={{ padding: "16px 20px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 0, marginBottom: 28 }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Notes</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>{tier.notes}</div>
          </div>
        )}

        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          This estimate is valid for 14 days. Pricing is subject to final scope confirmation, site survey, and engineering review. All prices exclude applicable taxes.
          <br />Questions? Contact us at <strong>droberts@dce-usa.com</strong> · <strong>www.dce-usa.com</strong>
        </div>
      </div>
    </div>
  );
}

// ─── ESTIMATES LIST ────────────────────────────────────────────────────────────
function EstimatesList({ estimates, onOpen, onNew, onDelete }) {
  const sorted = [...estimates].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 42, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 4 }}>Estimates</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>{estimates.length} saved estimate{estimates.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={onNew} style={{
          padding: "11px 22px", borderRadius: 0,
          background: "#fff",
          border: "none", color: "#000", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em",
        }}>+ New Estimate</button>
      </div>

      {estimates.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,0.3)" }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 64, fontWeight: 800, marginBottom: 16, opacity: 0.08, letterSpacing: "0.04em" }}>NO ESTIMATES</div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>No estimates yet</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Create your first estimate to get started</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {sorted.map(est => {
            const tier = est.estimates?.[est.selectedTier || "mid_tier"] || est.result?.estimates?.["mid_tier"];
            return (
              <div key={est.id} onClick={() => onOpen(est)} style={{
                display: "grid", gridTemplateColumns: "1fr auto auto auto", alignItems: "center", gap: 16,
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 0, padding: "16px 20px", cursor: "pointer",
                transition: "all 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                    {est.projectName || "Untitled Project"}
                    {est.clientName && <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.4)", marginLeft: 8, fontSize: 13 }}>· {est.clientName}</span>}
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{est.location?.toUpperCase()} · {est.boothSize}</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Updated {fmtDate(est.updatedAt)}</span>
                  </div>
                </div>
                <StatusBadge status={est.status} />
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: 2 }}>ESTIMATE</div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "0.02em" }}>{fmt(tier?.grand_total)}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); if (confirm("Delete this estimate?")) onDelete(est.id); }}
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.45)", fontSize: 16, cursor: "pointer", padding: "4px 6px" }}
                  onMouseEnter={e => e.target.style.color = "#f87171"} onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.2)"}>✕</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── NEW ESTIMATE WIZARD ───────────────────────────────────────────────────────
function NewEstimate({ onBack, onCreated }) {
  const [location, setLocation] = useState("indoor");
  const [boothSize, setBoothSize] = useState("20x20");
  const [customSqft, setCustomSqft] = useState("");
  // Multi-image: each entry is { file, preview, b64, name, ready }
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const sqft = boothSize === "custom" ? (parseInt(customSqft) || null) : BOOTH_SIZES[boothSize]?.sqft;

  const addFiles = useCallback((files) => {
    const all = Array.from(files || []);
    const validFiles = all.filter(file => {
      // Must be a real Blob/File with size — guards against drag-drop giving non-File objects
      if (!file || !(file instanceof Blob) || file.size === 0) return false;
      const ext = (file.name || "").split(".").pop().toLowerCase();
      const knownExts = ["jpg","jpeg","png","webp","gif","heic","heif"];
      return file.type?.startsWith("image/") || knownExts.includes(ext) || !file.type;
    });
    if (!validFiles.length) {
      if (all.length > 0) setError("No valid image files found — use JPG, PNG, or WEBP files saved to disk.");
      return;
    }

    validFiles.forEach(file => {
      let preview;
      try {
        preview = URL.createObjectURL(file);
      } catch (e) {
        setError("Could not load " + (file.name || "file") + " — try saving it as a JPG or PNG first.");
        return;
      }
      const entry = { id: genId(), file, preview, b64: null, name: file.name || "render.jpg", ready: false };
      setImages(prev => {
        if (prev.length >= 10) { setError("Maximum 10 images allowed — remove one first."); return prev; }
        return [...prev, entry];
      });
      fileToBase64(file)
        .then(b64 => {
          setImages(prev => prev.map(e => e.preview === preview ? { ...e, b64, ready: true } : e));
        })
        .catch(err => {
          setError("Could not read " + (file.name || "file") + ": " + err.message);
          setImages(prev => prev.filter(e => e.preview !== preview));
        });
    });
  }, []);

  const removeImage = useCallback((id) => {
    setImages(prev => prev.filter(e => e.id !== id));
  }, []);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      // Wait for any still-processing images (up to 2s)
      const notReady = images.filter(e => !e.ready);
      if (notReady.length > 0) {
        await new Promise(r => setTimeout(r, 1200));
        const stillNotReady = images.filter(e => !e.ready);
        if (stillNotReady.length > 0) {
          throw new Error(`${stillNotReady.length} image(s) still loading — wait a moment and try again. If this keeps happening, try JPG/PNG files.`);
        }
      }
      const system = buildSystemPrompt(location, boothSize, sqft);
      const readyImages = images.filter(e => e.ready && e.b64);
      let content;
      if (readyImages.length > 0) {
        // Send all images as content blocks, then the text prompt
        const imageBlocks = readyImages.map((img, i) => ({
          type: "image",
          source: { type: "base64", media_type: "image/jpeg", data: img.b64 }
        }));
        const angleNote = readyImages.length > 1
          ? `You have been provided ${readyImages.length} render angles of the same booth. Analyze all of them together to get a complete picture before estimating.`
          : "";
        content = [
          ...imageBlocks,
          { type: "text", text: `Analyze ${readyImages.length > 1 ? "these renders (multiple angles of the same booth)" : "this render"} and produce a full fabrication estimate.\n${angleNote}\nBooth: ${boothSize} | Location: ${location.toUpperCase()} | ${sqft ? sqft + " sqft" : "size TBD"}\n\nIMPORTANT: Respond ONLY with a single valid JSON object. No markdown, no backticks, no text before or after. Keep all string values under 100 chars.` }
        ];
      } else {
        content = `Generate a general fabrication estimate.\nBooth: ${boothSize} | Location: ${location.toUpperCase()} | ${sqft ? sqft + " sqft" : "size TBD"}\n\nIMPORTANT: Respond ONLY with valid JSON. No backticks, no preamble.`;
      }
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 8000, system, messages: [{ role: "user", content }] }),
      });
      const data = await res.json();
      if (data.error) throw new Error(`API error: ${data.error.message}`);
      const text = data.content?.map(b => b.text || "").join("") || "";
      if (!text) throw new Error("Empty response");
      const parsed = extractJSON(text);

      const now = new Date().toISOString();
      const newEst = {
        id: genId(),
        status: "draft",
        location, boothSize, sqft,
        // Store first image as primary thumbnail, all b64s for re-analysis
        imageB64: images[0]?.b64 || null,
        imagesB64: images.filter(e => e.ready).map(e => ({ b64: e.b64, name: e.name, mimeType: "image/jpeg" })),
        clientName: "", projectName: "", quoteNumber: `DCE-${Math.floor(50000 + Math.random() * 5000)}`,
        createdAt: now, updatedAt: now,
        selectedTier: "mid_tier",
        result: parsed,
        estimates: parsed.estimates,
      };
      onCreated(newEst);
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "90px 0" }}>
        <div style={{ fontSize: 44, marginBottom: 20, display: "inline-block", animation: "spin 1.8s linear infinite" }}>⚙</div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 36, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Analyzing Your Project</h2>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>Reading render, identifying elements, building three tiers…</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", padding: "7px 14px", borderRadius: 0, fontSize: 12, fontWeight: 700 }}>← Back</button>
        <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 32, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>New Estimate</h2>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 0, padding: "16px 18px", marginBottom: 22 }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, marginBottom: 5 }}>⚠ Analysis Error</div>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, lineHeight: 1.6 }}>{error}</div>
          <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Tip: Try a smaller booth size first, then refine with clarifying questions.</div>
        </div>
      )}

      {/* Multi-image drop zone */}
      <div
        onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${images.length > 0 ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.13)"}`,
          borderRadius: 0, padding: "28px 24px", textAlign: "center", cursor: "pointer",
          marginBottom: images.length > 0 ? 14 : 24,
          background: "rgba(255,255,255,0.02)", transition: "border-color 0.2s"
        }}
      >
        <div style={{ fontSize: 26, marginBottom: 7, opacity: 0.35 }}>⬆</div>
        <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 14 }}>
          {images.length === 0 ? "Drop renders here or click to upload" : `Add more angles (${images.length}/10)`}
        </div>
        <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 12 }}>
          PNG, JPG, WEBP · Up to 10 images · Multiple angles give better estimates
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
          onChange={e => addFiles(e.target.files)} />
      </div>

      {/* Thumbnails gallery */}
      {images.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 24 }}>
          {images.map(img => (
            <div key={img.id} style={{ position: "relative", borderRadius: 0, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", aspectRatio: "4/3", background: "#111" }}>
              <img src={img.preview} alt={img.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              {/* Loading overlay */}
              {!img.ready && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 18, animation: "spin 1.2s linear infinite" }}>⚙</div>
                </div>
              )}
              {/* Ready badge */}
              {img.ready && (
                <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(74,222,128,0.85)", borderRadius: 0, padding: "2px 6px", fontSize: 10, fontWeight: 700, color: "#000" }}>✓</div>
              )}
              {/* Remove button */}
              <button
                onClick={e => { e.stopPropagation(); removeImage(img.id); }}
                style={{ position: "absolute", top: 5, right: 5, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >✕</button>
              {/* Filename */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "4px 6px", background: "rgba(0,0,0,0.65)", fontSize: 9, color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {img.name}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 22 }}>
        <div>
          <label style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", display: "block", marginBottom: 9 }}>Location</label>
          <div style={{ display: "flex", gap: 10 }}>
            {[["indoor","🏢 Indoor"],["outdoor","🌿 Outdoor"]].map(([val,lbl]) => (
              <button key={val} onClick={() => setLocation(val)} style={{ flex: 1, padding: "12px 8px", borderRadius: 0, fontWeight: 700, fontSize: 13, background: location === val ? "rgba(255,107,53,0.14)" : "rgba(255,255,255,0.04)", border: `1px solid ${location === val ? "#fff" : "rgba(255,255,255,0.09)"}`, color: location === val ? "#fff" : "rgba(255,255,255,0.55)" }}>{lbl}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", display: "block", marginBottom: 9 }}>Booth Size</label>
          <select value={boothSize} onChange={e => setBoothSize(e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 0, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "#fff", fontSize: 13, fontWeight: 600, appearance: "none" }}>
            {Object.entries(BOOTH_SIZES).map(([k,v]) => <option key={k} value={k} style={{ background: "#1c1c1c" }}>{v.label}</option>)}
          </select>
        </div>
      </div>

      {boothSize === "custom" && (
        <div style={{ marginBottom: 22 }}>
          <label style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", display: "block", marginBottom: 9 }}>Custom Square Footage</label>
          <input type="number" value={customSqft} onChange={e => setCustomSqft(e.target.value)} placeholder="e.g. 2400" style={{ width: "100%", padding: "12px 14px", borderRadius: 0, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "#fff", fontSize: 14 }} />
        </div>
      )}

      <button onClick={run} style={{ width: "100%", padding: "16px", borderRadius: 0, background: "#fff", border: "none", color: "#000", fontWeight: 700, fontSize: 14, letterSpacing: "0.06em", cursor: "pointer" }}>
        {images.length > 0 ? `Analyze ${images.length} Render${images.length > 1 ? "s" : ""} & Build Estimate` : "Build General Estimate"}
      </button>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("list"); // list | new | detail
  const [estimates, setEstimates] = useState([]);
  const [openEstimate, setOpenEstimate] = useState(null);

  // Load from storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setEstimates(JSON.parse(stored));
    } catch (e) {}
  }, []);

  // Persist to storage on change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(estimates)); } catch (e) {}
  }, [estimates]);

  const saveEstimate = (est) => {
    setEstimates(prev => {
      const idx = prev.findIndex(e => e.id === est.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = est; return next; }
      return [est, ...prev];
    });
  };

  const deleteEstimate = (id) => {
    setEstimates(prev => prev.filter(e => e.id !== id));
  };

  const handleCreated = (est) => {
    saveEstimate(est);
    setOpenEstimate(est);
    setView("detail");
  };

  const handleOpen = (est) => {
    setOpenEstimate(est);
    setView("detail");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#000;color:#fff;font-family:'Inter',sans-serif;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:0;}
        input,select,textarea,button{font-family:'Inter',sans-serif;}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>

      <div style={{ minHeight: "100vh", background: "#000" }}>
        {/* Header */}
        <header style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "15px 28px", display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.02)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ width: 32, height: 32, borderRadius: 0, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, color: "#000" }}>DC</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: "-0.01em" }}>DreamCraft Events</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.14em", textTransform: "uppercase" }}>Fabrication Estimator</div>
          </div>
        </header>

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "36px 24px 80px" }}>
          {view === "list" && (
            <EstimatesList
              estimates={estimates}
              onOpen={handleOpen}
              onNew={() => setView("new")}
              onDelete={deleteEstimate}
            />
          )}
          {view === "new" && (
            <NewEstimate onBack={() => setView("list")} onCreated={handleCreated} />
          )}
          {view === "detail" && openEstimate && (
            <EstimateDetail
              estimate={openEstimate}
              onBack={() => { setView("list"); setOpenEstimate(null); }}
              onSave={(est) => { saveEstimate(est); setOpenEstimate(est); }}
            />
          )}
        </div>
      </div>
    </>
  );
}
