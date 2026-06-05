// Vercel Serverless Function: api/submit-review.js
// Receives a new review, appends to pending-reviews.json via GitHub API,
// and sends a notification email via Brevo (formerly Sendinblue) SMTP REST API.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, stars, text } = req.body || {};

  if (!name || !stars || !text) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const GITHUB_TOKEN = process.env.GH_TOKEN;
  const REPO         = 'Milileo/Lindas-Doggy-Daycare';
  const BRANCH       = 'main';
  const FILE_PATH    = 'data/pending-reviews.json';
  const APPROVE_SECRET = process.env.APPROVE_SECRET || 'ldd-secret-2025';

  // 1. Read current pending-reviews.json from GitHub
  let currentSHA = '';
  let pending    = [];
  try {
    const ghRes = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
      { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'User-Agent': 'LDD-Bot' } }
    );
    if (ghRes.ok) {
      const ghData = await ghRes.json();
      currentSHA   = ghData.sha;
      pending      = JSON.parse(Buffer.from(ghData.content, 'base64').toString('utf-8'));
    }
  } catch (e) {
    console.error('Read pending error:', e);
  }

  // 2. Create new review entry
  const id   = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const date = new Date().toLocaleDateString('de-DE');

  // Simple HMAC-like token using btoa
  const token = Buffer.from(`${id}:${APPROVE_SECRET}`).toString('base64url');

  const newReview = { id, name, stars: parseInt(stars), text, date, token };
  pending.push(newReview);

  // 3. Write back to GitHub
  const newContent = Buffer.from(JSON.stringify(pending, null, 2)).toString('base64');
  const ghWriteRes = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'LDD-Bot',
      },
      body: JSON.stringify({
        message: `feat: new pending review from ${name}`,
        content: newContent,
        sha: currentSHA,
        branch: BRANCH,
      }),
    }
  );

  if (!ghWriteRes.ok) {
    const err = await ghWriteRes.json();
    console.error('GitHub write error:', err);
    return res.status(500).json({ error: 'Could not save review' });
  }

  // 4. Build approve URL
  const baseUrl    = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://lindas-doggy-daycare.vercel.app';
  const approveUrl = `${baseUrl}/api/approve-review?id=${id}&token=${token}`;

  // 5. Send email via Brevo (Sendinblue) REST API
  const BREVO_KEY = process.env.BREVO_API_KEY;
  if (BREVO_KEY) {
    const starsStr = '★'.repeat(parseInt(stars)) + '☆'.repeat(5 - parseInt(stars));
    const emailBody = {
      sender:      { name: 'Linda\'s Doggy Daycare', email: 'noreply@lindas-doggy-daycare.vercel.app' },
      to:          [{ email: 'l.m@hotmail.ch', name: 'Linda' }],
      subject:     `⭐ Neue Bewertung von ${name} (${starsStr})`,
      htmlContent: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f5f5f5;border-radius:12px">
  <h2 style="color:#6b8a91;margin-bottom:8px">🐾 Neue Bewertung eingegangen</h2>
  <p style="color:#333"><strong>Name:</strong> ${escHtml(name)}</p>
  <p style="color:#333"><strong>Bewertung:</strong> ${starsStr}</p>
  <p style="color:#333"><strong>Nachricht:</strong><br>${escHtml(text)}</p>
  <p style="color:#888;font-size:0.85em"><strong>Datum:</strong> ${date}</p>
  <div style="margin-top:24px;text-align:center">
    <a href="${approveUrl}"
       style="display:inline-block;background:#6b8a91;color:#fff;padding:14px 32px;border-radius:50px;font-weight:bold;text-decoration:none;font-size:1rem">
      ✅ Bewertung veröffentlichen
    </a>
  </div>
  <p style="color:#aaa;font-size:0.75em;margin-top:16px;text-align:center">
    Linda's Doggy Daycare · Choulou, Paphos, Cyprus
  </p>
</div>`,
    };

    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailBody),
    });
  }

  return res.status(200).json({ success: true });
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
