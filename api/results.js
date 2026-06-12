// Vercel Serverless Function — /api/results
// Fetches ABC FC recent results from Inqaku and returns structured JSON.
// Cached at Vercel edge for 5 minutes (s-maxage=300).

const https = require('https');
const http = require('http');

const INQAKU_URL =
  'https://inqaku.com/team/view?season_id=15244&logteam_id=146222&tab=results';

function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; ABC-FC-Bot/1.0; +https://abc-fc-foundation.vercel.app)',
          Accept: 'text/html,application/xhtml+xml',
        },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchHTML(res.headers.location).then(resolve).catch(reject);
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      }
    );
    req.on('error', reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
  });
}

function parseResults(html) {
  const results = [];
  const abcNames = ['abc fc', 'abc football', 'african by choice'];

  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;

  let rowMatch;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowHTML = rowMatch[1];
    const cells = [];
    let cellMatch;
    const cellPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    while ((cellMatch = cellPattern.exec(rowHTML)) !== null) {
      const text = cellMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .trim();
      cells.push(text);
    }

    if (cells.length < 4) continue;
    if (cells[0].toLowerCase().includes('date') || cells[0].toLowerCase().includes('match')) continue;

    const dateStr = cells[0];
    if (!dateStr || dateStr.length < 3) continue;

    let homeTeam = '';
    let awayTeam = '';
    let score = '';

    if (cells.length >= 5) {
      homeTeam = cells[1];
      score = cells[2]; // e.g. "3 - 0" or "3:0"
      awayTeam = cells[3];
    } else if (cells.length === 4) {
      homeTeam = cells[1];
      score = '';
      awayTeam = cells[2];
    }

    const homeLower = homeTeam.toLowerCase();
    const awayLower = awayTeam.toLowerCase();
    const isABC = abcNames.some(n => homeLower.includes(n) || awayLower.includes(n));
    if (!isABC) continue;

    const isHome = abcNames.some(n => homeLower.includes(n));
    const opponent = isHome ? awayTeam : homeTeam;

    // Parse score to determine W/D/L from ABC FC's perspective
    let outcome = '';
    let abcGoals = '';
    let oppGoals = '';

    if (score) {
      // Score formats: "3 - 0", "3:0", "3-0"
      const scoreMatch = score.match(/(\d+)\s*[-:]\s*(\d+)/);
      if (scoreMatch) {
        const homeGoals = parseInt(scoreMatch[1]);
        const awayGoals = parseInt(scoreMatch[2]);
        abcGoals = isHome ? scoreMatch[1] : scoreMatch[2];
        oppGoals = isHome ? scoreMatch[2] : scoreMatch[1];
        const abcG = isHome ? homeGoals : awayGoals;
        const oppG = isHome ? awayGoals : homeGoals;
        if (abcG > oppG) outcome = 'W';
        else if (abcG === oppG) outcome = 'D';
        else outcome = 'L';
      }
    }

    results.push({
      date: dateStr,
      opponent: opponent || 'TBC',
      score: score || '-',
      abcGoals,
      oppGoals,
      outcome,
      isHome,
      type: isHome ? 'HOME' : 'AWAY',
    });
  }

  return results;
}

// Fallback static results (last 10 results from the season)
const FALLBACK_RESULTS = [
  { date: 'Sun 8 Jun', opponent: 'Mukondeni Shoe Shine Boys FC', score: '3 - 0', abcGoals: '3', oppGoals: '0', outcome: 'W', isHome: false, type: 'AWAY' },
  { date: 'Sat 7 Jun', opponent: 'Tshikundamalema Waterfall FC', score: '4 - 1', abcGoals: '4', oppGoals: '1', outcome: 'W', isHome: true, type: 'HOME' },
  { date: 'Sun 1 Jun', opponent: 'Mahenic FC', score: '2 - 0', abcGoals: '2', oppGoals: '0', outcome: 'W', isHome: true, type: 'HOME' },
  { date: 'Sat 31 May', opponent: 'Lurangwe FC', score: '5 - 0', abcGoals: '5', oppGoals: '0', outcome: 'W', isHome: true, type: 'HOME' },
  { date: 'Sun 25 May', opponent: 'Makuya Big Cat FC', score: '3 - 1', abcGoals: '3', oppGoals: '1', outcome: 'W', isHome: true, type: 'HOME' },
  { date: 'Sat 24 May', opponent: 'Lukau Tshishivhe Tigerboys', score: '2 - 0', abcGoals: '2', oppGoals: '0', outcome: 'W', isHome: false, type: 'AWAY' },
  { date: 'Sun 18 May', opponent: 'Lukau Hot Aces', score: '4 - 0', abcGoals: '4', oppGoals: '0', outcome: 'W', isHome: false, type: 'AWAY' },
  { date: 'Sat 17 May', opponent: 'Vhufuli FC', score: '1 - 1', abcGoals: '1', oppGoals: '1', outcome: 'D', isHome: true, type: 'HOME' },
  { date: 'Sun 11 May', opponent: 'Tshiombo Royal Stars', score: '3 - 0', abcGoals: '3', oppGoals: '0', outcome: 'W', isHome: false, type: 'AWAY' },
  { date: 'Sat 10 May', opponent: 'Mulenzhe SAPS FC', score: '2 - 0', abcGoals: '2', oppGoals: '0', outcome: 'W', isHome: true, type: 'HOME' },
];

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
  res.setHeader('Content-Type', 'application/json');

  try {
    const html = await fetchHTML(INQAKU_URL);
    const results = parseResults(html);

    if (results.length > 0) {
      return res.status(200).json({
        source: 'inqaku',
        fetchedAt: new Date().toISOString(),
        results: results.slice(0, 10), // last 10
      });
    }

    return res.status(200).json({
      source: 'fallback',
      fetchedAt: new Date().toISOString(),
      note: 'Inqaku returned no parseable results — showing cached data.',
      results: FALLBACK_RESULTS,
    });
  } catch (err) {
    console.error('[api/results] Error:', err.message);
    return res.status(200).json({
      source: 'fallback',
      fetchedAt: new Date().toISOString(),
      note: 'Could not reach Inqaku — showing cached results.',
      results: FALLBACK_RESULTS,
    });
  }
};
