// =============================================================
// Vercel Serverless Function: /api/save-review.js
// Receives a new review and saves it to /data/pending-reviews.json
// via the GitHub Contents API.
// =============================================================
export const runtime = 'nodejs20.x';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ---- Config ----
  const GH_TOKEN  = process.env.GH_TOKEN;
  const REPO      = 'Milileo/Lindas-Doggy-Daycare';
  const BRANCH    = 'main';
  const FILE_PATH = 'data/pending-reviews.json';
  const BASE_URL  = 'https://lindas-doggy-daycare.vercel.app';

  if (!GH_TOKEN) {
    console.error('[save-review] GH_TOKEN is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // ---- Parse body ----
  let name, stars, text, reviewId;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    name     = String(body.name  || '').trim();
    stars    = parseInt(body.stars, 10);
    text     = String(body.text  || '').trim();
    reviewId = String(body.id    || '').trim();
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  if (!name || !text || !reviewId || isNaN(stars) || stars < 1 || stars > 5) {
    return res.status(400).json({ error: 'Missing or invalid fields: name, stars (1-5), text, id' });
  }

  const date = new Date().toLocaleDateString('de-DE');
  const publishUrl = `${BASE_URL}/api/publish-review?id=${reviewId}`;

  // ---- Read current pending-reviews.json ----
  let pending    = [];
  let currentSHA = '';
  try {
    const ghRes = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
      {
        headers: {
          Authorization: `Bearer ${GH_TOKEN}`,
          'User-Agent':  'LDD-ReviewBot',
          Accept:        'application/vnd.github+json',
        },
      }
    );
    if (ghRes.ok) {
      const ghData = await ghRes.json();
      currentSHA   = ghData.sha;
      pending      = JSON.parse(Buffer.from(ghData.content, 'base64').toString('utf-8'));
    }
    // If 404 → file doesn't exist yet, start with empty array (currentSHA stays '')
  } catch (e) {
    console.error('[save-review] Error reading pending-reviews.json:', e.message);
  }

  // ---- Append new review ----
  const newReview = { id: reviewId, name, stars, text, date, publishUrl };
  pending.push(newReview);

  // ---- Write back to GitHub ----
  const newContent = Buffer.from(JSON.stringify(pending, null, 2)).toString('base64');
  const putBody    = {
    message: `feat: new pending review from ${name} (${reviewId})`,
    content: newContent,
    branch:  BRANCH,
  };
  if (currentSHA) putBody.sha = currentSHA;

  const writeRes = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
    {
      method: 'PUT',
      headers: {
        Authorization:  `Bearer ${GH_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent':   'LDD-ReviewBot',
        Accept:         'application/vnd.github+json',
      },
      body: JSON.stringify(putBody),
    }
  );

  if (!writeRes.ok) {
    const err = await writeRes.json();
    console.error('[save-review] GitHub write error:', err);
    return res.status(500).json({ error: 'Could not save review to GitHub' });
  }

  console.log(`[save-review] Review ${reviewId} saved for "${name}"`);
  return res.status(200).json({ success: true, id: reviewId, publishUrl });
}
