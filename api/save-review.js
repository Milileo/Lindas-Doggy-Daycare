// /api/save-review.js
// Saves a new review to pending-reviews.json via GitHub API
// and triggers EmailJS notification to Linda

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GH_TOKEN  = process.env.GH_TOKEN;
  const REPO      = 'Milileo/Lindas-Doggy-Daycare';
  const BRANCH    = 'main';
  const FILE_PATH = 'data/pending-reviews.json';
  const BASE_URL  = 'https://lindasdoggydaycare.com';

  // EmailJS config
  const EMAILJS_SERVICE_ID  = 'service_1539ux8';
  const EMAILJS_TEMPLATE_ID = 'template_nofngog';
  const EMAILJS_PUBLIC_KEY  = 'LuDSHg4BJcWmmZ4WP';

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

  // Read current pending-reviews.json
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

  // Append new review
  const newReview = { id: reviewId, name, stars, text, date, publishUrl };
  pending.push(newReview);

  // Write to GitHub
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

  // Send EmailJS notification to Linda
  const starsText = '★'.repeat(stars) + '☆'.repeat(5 - stars);
  try {
    const emailRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id:  EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id:     EMAILJS_PUBLIC_KEY,
        template_params: {
          name,
          stars: starsText,
          message: text,
          publish_url: publishUrl,
          to_email: 'l.m@hotmail.ch',
        }
      })
    });
    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.warn('[save-review] EmailJS warning:', errText);
    } else {
      console.log('[save-review] Email sent to Linda');
    }
  } catch (emailErr) {
    console.warn('[save-review] EmailJS error (non-fatal):', emailErr.message);
  }

  console.log(`[save-review] Review ${reviewId} saved for "${name}"`);
  return res.status(200).json({ success: true, id: reviewId, publishUrl });
};
