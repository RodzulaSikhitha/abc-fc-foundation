// Vercel Serverless Function — /api/fixtures
// Fetches ABC FC upcoming fixtures from Inqaku and returns structured JSON.
// Cached at Vercel edge for 5 minutes (s-maxage=300) to avoid hammering Inqaku.

const https = require('https');
const http = require('http');

const INQAKU_URL =
  'https://inqaku.com/team/view?season_id=15244&logteam_id=146222&tab=fixtures';

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
 * Parse fixture rows from Inqaku HTML.
 * Inqaku renders a <table> with columns: Date | Home | Score | Away | Venue | Time
 * We identify ABC FC as home or away and build a normalised fixture object.
 */
function parseFixtures(html) {
  const fixtures = [];

  // Extract all table rows (tr) containing fixture data
  // Inqaku fixture rows typically look like:
  // <tr><td>14 Jun 2026</td><td>Team A</td><td> v </td><td>Team B</td><td>Venue</td><td>15:30</td></tr>
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;

  let rowMatch;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const rowHTML = rowMatch[1];
    const cells = [];
    let cellMatch;
    const cellPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    while ((cellMatch = cellPattern.exec(rowHTML)) !== null) {
      // Strip inner HTML tags and decode basic entities
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

    // We expect at least 5 cells: date, home, separator/score, away, venue/time
    if (cells.length < 4) continue;

    // Skip header rows
    if (cells[0].toLowerCase().includes('date') || cells[0].toLowerCase().includes('match')) continue;

    // Attempt to extract date (first cell, e.g. "Sat 13 Jun 2026" or "13/06/2026")
    const dateStr = cells[0];
    if (!dateStr || dateStr.length < 3) continue;

    // Home team (cell 1), Away team (cell 3 if separator at cell 2, else cell 2)
    let homeTeam = '';
    let awayTeam = '';
    let venue = '';
    let time = '';

    if (cells.length >= 5) {
      homeTeam = cells[1];
      awayTeam = cells[3];
      venue = cells[4] || 'TBC';
      time = cells[5] || '15:30';
    } else if (cells.length === 4) {
      homeTeam = cells[1];
      awayTeam = cells[2];
      venue = cells[3] || 'TBC';
    }

    // Only include rows that mention ABC FC
    const abcNames = ['abc fc', 'abc football', 'african by choice'];
    const homeLower = homeTeam.toLowerCase();
    const awayLower = awayTeam.toLowerCase();
    const isABC = abcNames.some(n => homeLower.includes(n) || awayLower.includes(n));
    if (!isABC) continue;

    const isHome = abcNames.some(n => homeLower.includes(n));
    const opponent = isHome ? awayTeam : homeTeam;

    fixtures.push({
      date: dateStr,
      opponent: opponent || 'TBC',
      isHome,
      venue: isHome ? 'Makonde Stadium' : (venue !== 'TBC' ? venue : 'Away — TBC'),
      time: time || '15:30',
      type: isHome ? 'HOME' : 'AWAY',
    });
  }

  // Strip fixtures whose date has already passed
  return fixtures.filter(f => isFutureOrToday(f.date));
}

// Returns true if dateStr is today or in the future.
// Handles: "Tue 16 Jun 2026", "16 Jun 2026", "16 Jun", "16/06/2026", "2026-06-16"
function isFutureOrToday(dateStr) {
  const s = (dateStr || '').trim();
  const today = new Date(); today.setHours(0,0,0,0);

  // Try DD/MM/YYYY or DD-MM-YYYY
  let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return new Date(+m[3], +m[2]-1, +m[1]) >= today;

  // Try YYYY-MM-DD (ISO)
  m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (m) return new Date(+m[1], +m[2]-1, +m[3]) >= today;

  // Try word-based: "Tue 16 Jun 2026", "16 Jun 2026", "16 Jun", etc.
  const months = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
  const parts = s.toLowerCase().split(/[\s,\/\-]+/);
  let day = null, month = null, year = new Date().getFullYear();
  for (const p of parts) {
    if (/^\d{4}$/.test(p))                              year  = parseInt(p);
    else if (/^\d{1,2}$/.test(p) && +p >= 1 && +p <= 31) day = parseInt(p);
    else { for (const [mn, idx] of Object.entries(months)) { if (p.startsWith(mn)) { month = idx; break; } } }
  }
  if (day === null || month === null) return true; // keep if unparseable
  return new Date(year, month, day) >= today;
}

// Fallback static fixtures (used when Inqaku is unreachable)
// Filtered by isFutureOrToday at runtime so past dates are never shown.
const FALLBACK_FIXTURES_RAW = [
  { date: 'Sat 12 Jul 2026', opponent: 'TBC',           isHome: true,  venue: 'Makonde Stadium',  time: '15:30', type: 'HOME' },
  { date: 'Sat 19 Jul 2026', opponent: 'TBC',           isHome: false, venue: 'Away — TBC',       time: '15:30', type: 'AWAY' },
];

module.exports = async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Set Vercel Edge cache: serve cached response for 5 min, allow stale for 1 min while revalidating
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
  res.setHeader('Content-Type', 'application/json');

  try {
    const html = await fetchHTML(INQAKU_URL);
    const fixtures = parseFixtures(html);

    if (fixtures.length > 0) {
      return res.status(200).json({
        source: 'inqaku',
        fetchedAt: new Date().toISOString(),
        fixtures,
      });
    }

    // Parser returned nothing — fall back to static data
    const fallback = FALLBACK_FIXTURES_RAW.filter(f => isFutureOrToday(f.date));
    return res.status(200).json({
      source: 'fallback',
      fetchedAt: new Date().toISOString(),
      note: 'Inqaku returned no parseable fixture data — showing cached fixtures.',
      fixtures: fallback,
    });
  } catch (err) {
    console.error('[api/fixtures] Error:', err.message);
    const fallback = FALLBACK_FIXTURES_RAW.filter(f => isFutureOrToday(f.date));
    return res.status(200).json({
      source: 'fallback',
      fetchedAt: new Date().toISOString(),
      note: 'Could not reach Inqaku — showing cached fixtures.',
      fixtures: fallback,
    });
  }
};
