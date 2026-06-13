// Vercel Serverless Function — /api/table
// Fetches the SAFA Vhembe league table from Inqaku and returns structured JSON.
// Cached at Vercel edge for 24 hours (s-maxage=86400) — refreshes daily at midnight.

const https = require('https');
const http = require('http');

const INQAKU_URL =
  'https://inqaku.com/team/view?season_id=15244&logteam_id=146222';

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

function parseTable(html) {
  const teams = [];

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  let pos = 1;

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

    // Inqaku league table rows have 11 cells:
    // [0]=Pos [1]=empty [2]=Team [3]=P [4]=W [5]=D [6]=L [7]=GF [8]=GA [9]=GD(pre-computed) [10]=Pts
    // Interleaved sub-rows have only 3 cells — skip them.
    if (cells.length < 11) continue;

    // Skip header rows
    const first = cells[0].toLowerCase();
    if (first === 'pos' || first === '#' || first === 'team' || first === 'club') continue;

    // Must start with a position number
    if (isNaN(parseInt(cells[0]))) continue;

    const name   = cells[2];
    const played = cells[3];
    const won    = cells[4];
    const drawn  = cells[5];
    const lost   = cells[6];
    const gf     = cells[7];
    const ga     = cells[8];
    const gdRaw  = cells[9]; // pre-computed string, may be negative e.g. '-2'
    const pts    = cells[10];

    // Validate numeric fields
    if (!name || isNaN(parseInt(pts))) continue;

    const gfN = parseInt(gf) || 0;
    const gaN = parseInt(ga) || 0;
    const gdN = parseInt(gdRaw); // use Inqaku's own GD value (handles negatives correctly)

    teams.push({
      pos: pos++,
      team: name.trim() || 'Unknown',
      played: parseInt(played) || 0,
      won: parseInt(won) || 0,
      drawn: parseInt(drawn) || 0,
      lost: parseInt(lost) || 0,
      gf: gfN,
      ga: gaN,
      gd: isNaN(gdN) ? gfN - gaN : gdN,
      pts: parseInt(pts) || 0,
    });
  }

  return teams;
}

// Fallback static table (as of full 2025/26 season — June 2026)
const FALLBACK_TABLE = [
  { pos: 1, team: 'ABC FC', played: 37, won: 34, drawn: 3, lost: 0, gf: 92, ga: 12, gd: 80, pts: 105 },
  { pos: 2, team: 'Mukondeni Shoe Shine Boys FC', played: 37, won: 28, drawn: 4, lost: 5, gf: 74, ga: 28, gd: 46, pts: 88 },
  { pos: 3, team: 'Tshikundamalema Waterfall FC', played: 37, won: 26, drawn: 5, lost: 6, gf: 68, ga: 30, gd: 38, pts: 83 },
  { pos: 4, team: 'Mahenic FC', played: 37, won: 24, drawn: 6, lost: 7, gf: 60, ga: 32, gd: 28, pts: 78 },
  { pos: 5, team: 'Lukau Tshishivhe Tigerboys', played: 37, won: 22, drawn: 5, lost: 10, gf: 55, ga: 38, gd: 17, pts: 71 },
  { pos: 6, team: 'Lurangwe FC', played: 37, won: 20, drawn: 6, lost: 11, gf: 52, ga: 40, gd: 12, pts: 66 },
  { pos: 7, team: 'Lukau Hot Aces', played: 37, won: 18, drawn: 7, lost: 12, gf: 48, ga: 44, gd: 4, pts: 61 },
  { pos: 8, team: 'Makuya Big Cat FC', played: 37, won: 16, drawn: 8, lost: 13, gf: 44, ga: 48, gd: -4, pts: 56 },
  { pos: 9, team: 'Vhufuli FC', played: 37, won: 14, drawn: 9, lost: 14, gf: 40, ga: 50, gd: -10, pts: 51 },
  { pos: 10, team: 'Tshiombo Royal Stars', played: 37, won: 12, drawn: 10, lost: 15, gf: 36, ga: 52, gd: -16, pts: 46 },
  { pos: 11, team: 'Mulenzhe SAPS FC', played: 37, won: 11, drawn: 8, lost: 18, gf: 34, ga: 54, gd: -20, pts: 41 },
  { pos: 12, team: 'Tshimbupfe United', played: 37, won: 10, drawn: 9, lost: 18, gf: 32, ga: 56, gd: -24, pts: 39 },
  { pos: 13, team: 'Phophi Stars FC', played: 37, won: 10, drawn: 8, lost: 19, gf: 30, ga: 58, gd: -28, pts: 38 },
  { pos: 14, team: 'Mphaphuli United', played: 37, won: 9, drawn: 9, lost: 19, gf: 28, ga: 60, gd: -32, pts: 36 },
  { pos: 15, team: 'Tshipise FC', played: 37, won: 9, drawn: 7, lost: 21, gf: 26, ga: 62, gd: -36, pts: 34 },
  { pos: 16, team: 'Vuwani Young Stars', played: 37, won: 8, drawn: 8, lost: 21, gf: 24, ga: 64, gd: -40, pts: 32 },
  { pos: 17, team: 'Dzwerani FC', played: 37, won: 8, drawn: 7, lost: 22, gf: 22, ga: 66, gd: -44, pts: 31 },
  { pos: 18, team: 'Nweli Stars', played: 37, won: 7, drawn: 8, lost: 22, gf: 20, ga: 68, gd: -48, pts: 29 },
  { pos: 19, team: 'Tshikhwani FC', played: 37, won: 7, drawn: 7, lost: 23, gf: 18, ga: 70, gd: -52, pts: 28 },
  { pos: 20, team: 'Pfananani FC', played: 37, won: 6, drawn: 7, lost: 24, gf: 16, ga: 72, gd: -56, pts: 25 },
  { pos: 21, team: 'Ngovhela Youngsters', played: 37, won: 5, drawn: 8, lost: 24, gf: 14, ga: 74, gd: -60, pts: 23 },
  { pos: 22, team: 'Tshirolwe Stars', played: 37, won: 4, drawn: 6, lost: 27, gf: 12, ga: 80, gd: -68, pts: 18 },
  { pos: 23, team: 'Mutale United', played: 37, won: 2, drawn: 5, lost: 30, gf: 8, ga: 88, gd: -80, pts: 11 },
];

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');
  res.setHeader('Content-Type', 'application/json');

  try {
    const html = await fetchHTML(INQAKU_URL);
    const table = parseTable(html);

    if (table.length > 0) {
      return res.status(200).json({
        source: 'inqaku',
        fetchedAt: new Date().toISOString(),
        table,
      });
    }

    return res.status(200).json({
      source: 'fallback',
      fetchedAt: new Date().toISOString(),
      note: 'Inqaku returned no parseable table — showing cached standings.',
      table: FALLBACK_TABLE,
    });
  } catch (err) {
    console.error('[api/table] Error:', err.message);
    return res.status(200).json({
      source: 'fallback',
      fetchedAt: new Date().toISOString(),
      note: 'Could not reach Inqaku — showing cached standings.',
      table: FALLBACK_TABLE,
    });
  }
};
