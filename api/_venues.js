// Shared by /api/fixtures and /api/results. The leading underscore keeps
// Vercel from exposing this file as its own endpoint.

// Venues from the club's official 2026/27 fixture list (Inqaku doesn't publish them).
// Only the venue comes from here: Inqaku is the source of truth for dates,
// opponents, home/away and scores, and wins wherever the two disagree.
// Keyed by match date, as ABC FC plays once per matchday.
const VENUES = {
  // 1st round
  '2026-10-03': 'Makonde Stadium',
  '2026-10-10': 'Makonde Stadium',
  '2026-10-17': 'Makonde Stadium',
  '2026-10-24': 'Kutama Sinthumule Stadium',
  '2026-10-31': 'Makonde Stadium',
  '2026-11-07': 'Phalaborwa United Sports Ground',
  '2026-11-14': 'Makonde Stadium',
  '2026-11-21': 'Makhado Show Ground',
  '2026-11-28': 'Makonde Stadium',
  '2026-12-05': 'Rabali Stadium',
  '2026-12-12': 'Makonde Stadium',
  // 2nd round
  '2027-01-16': 'Selwana Sports Complex',
  '2027-01-23': 'Makonde Stadium',
  '2027-01-30': 'Nkowankowa Stadium',
  '2027-02-06': 'Makonde Stadium',
  '2027-02-13': 'Nkowankowa Stadium',
  '2027-02-20': 'Makonde Stadium',
  '2027-02-27': 'Musina Rugby Stadium',
  '2027-03-06': 'Makonde Stadium',
  '2027-03-13': 'Mpheni Ground',
  '2027-03-20': 'Makonde Stadium',
  '2027-03-27': 'Lulekani Stadium',
};

const MONTHS = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };

// "Sat 3 Oct 2026" -> "2026-10-03"
function isoDate(dateStr) {
  const m = (dateStr || '').match(/(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/);
  if (!m) return null;
  const month = MONTHS[m[2].toLowerCase()];
  if (month === undefined) return null;
  return `${m[3]}-${String(month + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

function venueFor(dateStr, isHome) {
  return VENUES[isoDate(dateStr)] || (isHome ? 'Makonde Stadium' : 'Away — TBC');
}

module.exports = { venueFor };
