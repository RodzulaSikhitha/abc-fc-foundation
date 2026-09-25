// Vercel Serverless Function — /api/results
// Fetches ABC FC recent results from Inqaku and returns structured JSON.
// Cached at Vercel edge for 1 minute (s-maxage=60).

const https = require('https');
const { venueFor } = require('./_venues');
const http = require('http');

const INQAKU_URL =
  'https://inqaku.com/team/view?season_id=17737&logteam_id=176424&tab=results';

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

/**
 * Parse results from Inqaku's card layout (2026/27 onwards).
 * Same card as a fixture, but the middle row holds the score instead of "VS":
 *   <div ...>Sat, 27 Jun 2026</div><div class="card cardfr">...
 *   <a class="nav-link" ...>Home Team</a> ... <a class="nav-link" ...>Away Team</a> ... <td ...>0&nbsp&nbsp&nbsp3</td>
 */
function parseCardResults(html) {
  const results = [];
  const abcNames = ['abc fc', 'abc football', 'african by choice'];
  const blockRegex =
    /<div[^>]*>\s*((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s+\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})\s*<\/div>\s*<div class="card[^"]*"([\s\S]*?)<\/table>/gi;

  let m;
  while ((m = blockRegex.exec(html)) !== null) {
    const date = m[1].replace(',', '').trim();
    const cardHTML = m[2];

    const teams = [...cardHTML.matchAll(/<a class="nav-link"[^>]*>([^<]+)<\/a>/gi)]
      .map(t => decode(t[1]).trim())
      .filter(Boolean);
    if (teams.length < 2) continue;

    const scoreMatch = cardHTML.match(/<td[^>]*>\s*(\d+)(?:\s|&nbsp;?)+(\d+)\s*<\/td>/i);
    if (!scoreMatch) continue; // not played yet

    const [homeTeam, awayTeam] = teams;
    const isHome = abcNames.some(n => homeTeam.toLowerCase().includes(n));
    const isAway = abcNames.some(n => awayTeam.toLowerCase().includes(n));
    if (!isHome && !isAway) continue;

    const homeGoals = parseInt(scoreMatch[1], 10);
    const awayGoals = parseInt(scoreMatch[2], 10);
    const abcG = isHome ? homeGoals : awayGoals;
    const oppG = isHome ? awayGoals : homeGoals;

    results.push({
      date,
      opponent: (isHome ? awayTeam : homeTeam) || 'TBC',
      score: `${homeGoals} - ${awayGoals}`,
      abcGoals: String(abcG),
      oppGoals: String(oppG),
      outcome: abcG > oppG ? 'W' : abcG === oppG ? 'D' : 'L',
      isHome,
      type: isHome ? 'HOME' : 'AWAY',
      venue: venueFor(date, isHome),
    });
  }

  return results;
}

function decode(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

function parseResults(html) {
  const cardResults = parseCardResults(html);
  if (cardResults.length > 0) return cardResults;

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

// No static fallback: showing last season's results under the new season
// would be misleading, so an empty list means "no results yet".
const FALLBACK_RESULTS = [];

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=60');
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

    // Inqaku answered but lists no played matches yet (e.g. before kick-off)
    return res.status(200).json({
      source: 'inqaku',
      fetchedAt: new Date().toISOString(),
      results: [],
    });
  } catch (err) {
    console.error('[api/results] Error:', err.message);
    return res.status(200).json({
      source: 'fallback',
      fetchedAt: new Date().toISOString(),
      note: 'Could not reach Inqaku.',
      results: FALLBACK_RESULTS,
    });
  }
};
