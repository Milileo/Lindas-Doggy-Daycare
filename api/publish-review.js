// =============================================================
// Vercel Serverless Function: /api/publish-review.js
// Called when Linda clicks the "Veröffentlichen" link in the email.
// Moves the review from pending-reviews.json → reviews.json
// and commits both files to the GitHub repo.
// =============================================================
export const runtime = 'nodejs20.x';

export default async function handler(req, res) {
  const { id } = req.query || {};

  if (!id) {
    return res.status(400).send(renderPage('error', '❌ Keine Review-ID angegeben.'));
  }

  // ---- Config ----
  const GH_TOKEN = process.env.GH_TOKEN;
  const REPO     = 'Milileo/Lindas-Doggy-Daycare';
  const BRANCH   = 'main';

  if (!GH_TOKEN) {
    console.error('[publish-review] GH_TOKEN is not set');
    return res.status(500).send(renderPage('error', '❌ Server-Konfigurationsfehler.'));
  }

  // ---- Helper: fetch a JSON file from GitHub ----
  async function fetchGitHubFile(path) {
    const r = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`,
      {
        headers: {
          Authorization: `Bearer ${GH_TOKEN}`,
          'User-Agent':  'LDD-ReviewBot',
          Accept:        'application/vnd.github+json',
        },
      }
    );
    if (!r.ok) return { data: [], sha: '' };
    const d    = await r.json();
    const data = JSON.parse(Buffer.from(d.content, 'base64').toString('utf-8'));
    return { data, sha: d.sha };
  }

  // ---- Helper: write a JSON file to GitHub ----
  async function writeGitHubFile(path, data, sha, message) {
    const body = {
      message,
      content: Buffer.from(JSON.stringify(data, null, 2)).toString('base64'),
      branch:  BRANCH,
    };
    if (sha) body.sha = sha;

    const r = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          Authorization:  `Bearer ${GH_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent':   'LDD-ReviewBot',
          Accept:         'application/vnd.github+json',
        },
        body: JSON.stringify(body),
      }
    );
    if (!r.ok) {
      const err = await r.json();
      throw new Error(`GitHub write failed for ${path}: ${JSON.stringify(err)}`);
    }
    return true;
  }

  try {
    // ---- Read pending reviews ----
    const { data: pending, sha: pendingSHA } = await fetchGitHubFile('data/pending-reviews.json');

    // ---- Find the review ----
    const review = pending.find(r => r.id === id);
    if (!review) {
      return res.status(404).send(renderPage('warn',
        '⚠️ Bewertung nicht gefunden oder bereits veröffentlicht.'
      ));
    }

    // ---- Read approved reviews ----
    const { data: approved, sha: approvedSHA } = await fetchGitHubFile('data/reviews.json');

    // ---- Move review: add to approved, remove from pending ----
    const { publishUrl: _pu, ...cleanReview } = review;   // strip internal field
    approved.push({ ...cleanReview, approvedAt: new Date().toISOString() });
    const newPending = pending.filter(r => r.id !== id);

    // ---- Commit reviews.json ----
    await writeGitHubFile(
      'data/reviews.json',
      approved,
      approvedSHA,
      `feat: publish review by ${review.name} (${id})`
    );

    // ---- Commit pending-reviews.json ----
    await writeGitHubFile(
      'data/pending-reviews.json',
      newPending,
      pendingSHA,
      `chore: remove published review ${id}`
    );

    console.log(`[publish-review] Review ${id} published by "${review.name}"`);

    return res.status(200).send(renderPage('success',
      `✅ Bewertung von <strong>${escHtml(review.name)}</strong> wurde erfolgreich veröffentlicht! 🐾`,
      review
    ));

  } catch (e) {
    console.error('[publish-review] Error:', e.message);
    return res.status(500).send(renderPage('error', `❌ Fehler: ${escHtml(e.message)}`));
  }
}

// ---- Helpers ----
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function starsStr(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function renderPage(type, message, review = null) {
  const colors = { success: '#6b8a91', error: '#c0392b', warn: '#e67e22' };
  const color  = colors[type] || '#6b8a91';

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Linda's Doggy Daycare – Bewertung</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #8da4aa;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .card {
      background: #fff;
      border-radius: 20px;
      padding: 2.8rem 2.5rem;
      max-width: 520px;
      width: 100%;
      text-align: center;
      box-shadow: 0 12px 40px rgba(0,0,0,0.18);
    }
    .paw  { font-size: 2.8rem; margin-bottom: 0.6rem; }
    h2    { color: ${color}; font-size: 1.35rem; margin-bottom: 1rem; line-height: 1.4; }
    .stars { color: #f9c800; font-size: 1.6rem; margin: 0.4rem 0 0.8rem; }
    blockquote {
      color: #555;
      font-style: italic;
      font-size: 0.95rem;
      border-left: 3px solid ${color};
      padding: 0.5rem 0 0.5rem 1rem;
      margin: 0 auto 1.2rem;
      text-align: left;
      max-width: 400px;
    }
    .meta { color: #aaa; font-size: 0.8rem; margin-bottom: 1.6rem; }
    a.btn {
      display: inline-block;
      background: ${color};
      color: #fff;
      padding: 0.85rem 2.2rem;
      border-radius: 50px;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.95rem;
      transition: opacity 0.2s;
    }
    a.btn:hover { opacity: 0.85; }
  </style>
</head>
<body>
  <div class="card">
    <div class="paw">🐾</div>
    <h2>${message}</h2>
    ${review ? `
    <div class="stars">${starsStr(review.stars)}</div>
    <blockquote>"${escHtml(review.text)}"</blockquote>
    <p class="meta">von ${escHtml(review.name)} · ${review.date || ''}</p>
    ` : ''}
    <a class="btn" href="https://lindas-doggy-daycare.vercel.app/#reviews">← Zur Website</a>
  </div>
</body>
</html>`;
}
