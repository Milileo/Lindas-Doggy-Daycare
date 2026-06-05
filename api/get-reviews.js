// =============================================================
// Vercel Serverless Function: /api/get-reviews.js
// Returns all published reviews from /data/reviews.json
// =============================================================
export const runtime = 'nodejs20.x';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const GH_TOKEN = process.env.GH_TOKEN;
  const REPO     = 'Milileo/Lindas-Doggy-Daycare';
  const BRANCH   = 'main';

  try {
    const ghRes = await fetch(
      `https://api.github.com/repos/${REPO}/contents/data/reviews.json?ref=${BRANCH}`,
      {
        headers: {
          Authorization: `Bearer ${GH_TOKEN}`,
          'User-Agent':  'LDD-ReviewBot',
          Accept:        'application/vnd.github+json',
        },
      }
    );
    if (!ghRes.ok) return res.status(200).json([]);
    const d       = await ghRes.json();
    const reviews = JSON.parse(Buffer.from(d.content, 'base64').toString('utf-8'));
    return res.status(200).json(reviews);
  } catch (e) {
    console.error('[get-reviews] Error:', e.message);
    return res.status(200).json([]);
  }
}
