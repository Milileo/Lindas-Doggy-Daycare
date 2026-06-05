// Vercel Serverless Function: api/approve-review.js
// Called when Linda clicks "Veröffentlichen" in the email.
// Moves the review from pending-reviews.json to reviews.json.

export default async function handler(req, res) {
  const { id, token } = req.query || {};

  if (!id || !token) {
    return res.status(400).send(page('❌ Ungültiger Link.', 'error'));
  }

  const GITHUB_TOKEN   = process.env.GH_TOKEN;
  const APPROVE_SECRET = process.env.APPROVE_SECRET || 'ldd-secret-2025';
  const REPO           = 'Milileo/Lindas-Doggy-Daycare';
  const BRANCH         = 'main';

  // Validate token
  const expectedToken = Buffer.from(`${id}:${APPROVE_SECRET}`).toString('base64url');
  if (token !== expectedToken) {
    return res.status(403).send(page('❌ Ungültiger Token.', 'error'));
  }

  // Read pending
  let pending    = [];
  let pendingSHA = '';
  try {
    const r = await fetch(
      `https://api.github.com/repos/${REPO}/contents/data/pending-reviews.json?ref=${BRANCH}`,
      { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'User-Agent': 'LDD-Bot' } }
    );
    const d = await r.json();
    pendingSHA = d.sha;
    pending    = JSON.parse(Buffer.from(d.content, 'base64').toString('utf-8'));
  } catch (e) {
    return res.status(500).send(page('❌ Fehler beim Lesen der ausstehenden Bewertungen.', 'error'));
  }

  const review = pending.find(r => r.id === id);
  if (!review) {
    return res.status(404).send(page('⚠️ Bewertung nicht gefunden oder bereits veröffentlicht.', 'warn'));
  }

  // Read approved reviews
  let approved    = [];
  let approvedSHA = '';
  try {
    const r = await fetch(
      `https://api.github.com/repos/${REPO}/contents/data/reviews.json?ref=${BRANCH}`,
      { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'User-Agent': 'LDD-Bot' } }
    );
    const d = await r.json();
    approvedSHA = d.sha;
    approved    = JSON.parse(Buffer.from(d.content, 'base64').toString('utf-8'));
  } catch (e) {
    // If file doesn't exist yet, start fresh
    approved    = [];
    approvedSHA = '';
  }

  // Add to approved (without internal token field)
  const { token: _t, ...cleanReview } = review;
  approved.push({ ...cleanReview, approved: true });

  // Remove from pending
  const newPending = pending.filter(r => r.id !== id);

  // Write approved reviews.json
  const approvedContent = Buffer.from(JSON.stringify(approved, null, 2)).toString('base64');
  const writeApproved   = await fetch(
    `https://api.github.com/repos/${REPO}/contents/data/reviews.json`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'LDD-Bot',
      },
      body: JSON.stringify({
        message: `feat: publish review by ${review.name}`,
        content: approvedContent,
        sha: approvedSHA || undefined,
        branch: BRANCH,
      }),
    }
  );

  if (!writeApproved.ok) {
    const err = await writeApproved.json();
    console.error('Write approved error:', err);
    return res.status(500).send(page('❌ Fehler beim Speichern der Bewertung.', 'error'));
  }

  // Write updated pending-reviews.json
  const pendingContent = Buffer.from(JSON.stringify(newPending, null, 2)).toString('base64');
  await fetch(
    `https://api.github.com/repos/${REPO}/contents/data/pending-reviews.json`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'LDD-Bot',
      },
      body: JSON.stringify({
        message: `chore: remove pending review ${id}`,
        content: pendingContent,
        sha: pendingSHA,
        branch: BRANCH,
      }),
    }
  );

  return res.status(200).send(page(
    `✅ Bewertung von <strong>${escHtml(review.name)}</strong> wurde erfolgreich veröffentlicht! 🐾`,
    'success',
    review
  ));
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function page(msg, type, review = null) {
  const colors = { success: '#6b8a91', error: '#c0392b', warn: '#e67e22' };
  const color  = colors[type] || '#6b8a91';
  const stars  = review ? '★'.repeat(review.stars) + '☆'.repeat(5 - review.stars) : '';
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Linda's Doggy Daycare</title>
  <style>
    body{font-family:'Segoe UI',sans-serif;background:#8da4aa;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
    .card{background:#fff;border-radius:18px;padding:2.5rem 2.5rem;max-width:480px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.15)}
    h2{color:${color};margin-bottom:0.5rem}
    p{color:#555;font-size:0.95rem;margin-bottom:0.4rem}
    .stars{color:#ffd700;font-size:1.4rem;margin:0.4rem 0}
    a{display:inline-block;margin-top:1.4rem;background:${color};color:#fff;padding:0.75rem 2rem;border-radius:50px;text-decoration:none;font-weight:700}
  </style>
</head>
<body>
  <div class="card">
    <h2>${msg}</h2>
    ${review ? `<div class="stars">${stars}</div><p><em>"${escHtml(review.text)}"</em></p>` : ''}
    <a href="https://lindas-doggy-daycare.vercel.app/#reviews">← Zur Website</a>
  </div>
</body>
</html>`;
}
