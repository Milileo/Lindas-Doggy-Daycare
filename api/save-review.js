// /api/save-review.js
// Saves a new review to pending-reviews.json via GitHub API
// and sends email notification via Resend

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GH_TOKEN     = process.env.GH_TOKEN;
  const RESEND_KEY   = process.env.RESEND_API_KEY;
  const REPO         = 'Milileo/Lindas-Doggy-Daycare';
  const BRANCH       = 'main';
  const FILE_PATH    = 'data/pending-reviews.json';
  const BASE_URL     = 'https://lindasdoggydaycare.com';
  const NOTIFY_EMAIL = 'mili6limi@gmail.com'; // Linda's email

  if (!GH_TOKEN) {
    console.error('[save-review] GH_TOKEN missing');
    return res.status(500).json({ error: 'Server configuration error: GH_TOKEN missing' });
  }

  let name, stars, text, reviewId;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    name     = String(body.name  || '').trim();
    stars    = parseInt(body.stars, 10);
    text     = String(body.text  || '').trim();
    reviewId = String(body.id    || Date.now().toString(36)).trim();
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  if (!name || !text || isNaN(stars) || stars < 1 || stars > 5) {
    return res.status(400).json({ error: 'Missing or invalid fields' });
  }

  const date = new Date().toLocaleDateString('de-DE');
  const publishUrl = `${BASE_URL}/api/publish-review?id=${reviewId}`;
  const starsText = '★'.repeat(stars) + '☆'.repeat(5 - stars);

  // ── 1. Read current pending-reviews.json ────────────────────────────────────
  let pending = [];
  let currentSHA = '';
  try {
    const ghRes = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
      { headers: { Authorization: `Bearer ${GH_TOKEN}`, 'User-Agent': 'LDD-Bot', Accept: 'application/vnd.github+json' } }
    );
    if (ghRes.ok) {
      const ghData = await ghRes.json();
      currentSHA = ghData.sha;
      pending = JSON.parse(Buffer.from(ghData.content, 'base64').toString('utf-8'));
      if (!Array.isArray(pending)) pending = [];
    }
  } catch (e) {
    console.error('[save-review] Read error:', e.message);
  }

  // ── 2. Append new review ────────────────────────────────────────────────────
  const newReview = { id: reviewId, name, stars, text, date, publishUrl };
  pending.push(newReview);

  // ── 3. Write to GitHub ──────────────────────────────────────────────────────
  const putBody = {
    message: `feat: new pending review from ${name}`,
    content: Buffer.from(JSON.stringify(pending, null, 2)).toString('base64'),
    branch: BRANCH,
  };
  if (currentSHA) putBody.sha = currentSHA;

  const writeRes = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${GH_TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'LDD-Bot', Accept: 'application/vnd.github+json' },
      body: JSON.stringify(putBody),
    }
  );

  if (!writeRes.ok) {
    const err = await writeRes.json().catch(() => ({}));
    console.error('[save-review] GitHub write error:', JSON.stringify(err));
    return res.status(500).json({ error: 'Could not save review to GitHub', detail: err.message || '' });
  }

  // ── 4. Send email via Resend ────────────────────────────────────────────────
  if (RESEND_KEY) {
    try {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: "Linda's Doggy Daycare <onboarding@resend.dev>",
          to: [NOTIFY_EMAIL],
          subject: `⭐ Neue Bewertung von ${name} (${stars}/5)`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff8f0;border-radius:12px;">
              <h2 style="color:#b5651d;margin-top:0;">🐾 Neue Bewertung eingegangen</h2>
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px 0;font-weight:bold;color:#555;width:120px;">Name:</td><td style="padding:8px 0;">${name}</td></tr>
                <tr><td style="padding:8px 0;font-weight:bold;color:#555;">Bewertung:</td><td style="padding:8px 0;color:#f0a500;font-size:20px;">${starsText} (${stars}/5)</td></tr>
                <tr><td style="padding:8px 0;font-weight:bold;color:#555;">Datum:</td><td style="padding:8px 0;">${date}</td></tr>
              </table>
              <div style="background:#fff;border-left:4px solid #b5651d;padding:16px;margin:16px 0;border-radius:4px;">
                <p style="margin:0;color:#333;font-style:italic;">"${text}"</p>
              </div>
              <a href="${publishUrl}" style="display:inline-block;background:#b5651d;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px;">
                ✅ Bewertung veröffentlichen
              </a>
              <p style="color:#999;font-size:12px;margin-top:24px;">Linda's Doggy Daycare — automatische Benachrichtigung</p>
            </div>
          `
        })
      });

      if (emailRes.ok) {
        console.log('[save-review] ✅ Email sent via Resend to', NOTIFY_EMAIL);
      } else {
        const errText = await emailRes.text();
        console.warn('[save-review] Resend warning:', errText);
      }
    } catch (emailErr) {
      console.warn('[save-review] Resend error (non-fatal):', emailErr.message);
    }
  } else {
    console.warn('[save-review] RESEND_API_KEY not set — email skipped');
  }

  console.log(`[save-review] Review ${reviewId} saved for "${name}"`);
  return res.status(200).json({ success: true, id: reviewId, publishUrl });
};
