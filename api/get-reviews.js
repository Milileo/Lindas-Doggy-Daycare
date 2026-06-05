// Vercel Serverless Function: api/get-reviews.js
// Returns the approved reviews from data/reviews.json in the GitHub repo.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const GITHUB_TOKEN = process.env.GH_TOKEN;
  const REPO         = 'Milileo/Lindas-Doggy-Daycare';
  const BRANCH       = 'main';

  try {
    const ghRes = await fetch(
      `https://api.github.com/repos/${REPO}/contents/data/reviews.json?ref=${BRANCH}`,
      { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'User-Agent': 'LDD-Bot' } }
    );

    if (!ghRes.ok) {
      return res.status(200).json([]);
    }

    const data    = await ghRes.json();
    const reviews = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
    return res.status(200).json(reviews);
  } catch (e) {
    return res.status(200).json([]);
  }
}
