const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');

const SAVE_DIR = path.join(__dirname, 'data');
fs.ensureDirSync(SAVE_DIR);
const M3U_PATH = path.join(SAVE_DIR, 'live-tvs.m3u');
const JSON_PATH = path.join(SAVE_DIR, 'live-tvs.json');

let liveLinks = fs.existsSync(JSON_PATH) ? fs.readJsonSync(JSON_PATH) : {};

const headers = {
  headers: { 'User-Agent': 'Mozilla/5.0' }
};

// Load more pastebin-style links here
const pasteLinks = [
  'https://pastebin.com/raw/zBedZMta',
  'https://pastebin.com/raw/22SVbdrR',
  'https://pastebin.com/raw/nBVmnst7',
  'https://controlc.com/4d1e6e3b',
  'https://pastebin.com/raw/A9kqX67n',
];

// General live TV dorks
const dorkQueries = [
  'filetype:m3u8 live tv',
  'filetype:m3u8 intext:US HBO SHOWTIME STARZ',
  'intitle:"index of" m3u playlist',
  'iptv sports news live m3u8',
  'filetype:m3u8 extinf live tv',
];

function formatLiveTitle(link) {
  const l = link.toLowerCase();
  if (l.includes('hbo')) return 'LIVE: HBO HD';
  if (l.includes('showtime')) return 'LIVE: SHOWTIME HD';
  if (l.includes('starz')) return 'LIVE: STARZ HD';
  if (l.includes('cinemax')) return 'LIVE: CINEMAX HD';
  if (l.includes('espn')) return 'LIVE: ESPN HD';
  if (l.includes('fox')) return 'LIVE: FOX SPORTS HD';
  if (l.includes('nbc')) return 'LIVE: NBC HD';
  if (l.includes('cbs')) return 'LIVE: CBS HD';
  return 'LIVE TV Channel';
}

async function extractFromPage(url) {
  try {
    const res = await axios.get(url, headers);
    const text = res.data;
    const links = text.match(/https?:\/\/[^\s"'<>]+/g) || [];
    return links.filter(link =>
      link.includes('.m3u8') ||
      link.includes('.ts') ||
      link.includes('get.php?username=')
    );
  } catch (err) {
    console.error(`❌ Failed to fetch ${url}`);
    return [];
  }
}

async function searchGoogleDork(term) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(term)}`;
  try {
    const res = await axios.get(url, headers);
    const $ = cheerio.load(res.data);
    const links = [];
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (href.includes('/url?q=')) {
        const clean = href.split('/url?q=')[1].split('&')[0];
        if (!clean.includes('google')) links.push(clean);
      }
    });
    return links;
  } catch (err) {
    console.error(`❌ Failed dork search: ${term}`);
    return [];
  }
}

function saveLiveLinks() {
  fs.writeJsonSync(JSON_PATH, liveLinks, { spaces: 2 });
  const m3u = Object.entries(liveLinks)
    .map(([link, obj]) => `#EXTINF:-1,${obj.title}\n${link}`)
    .join('\n');
  fs.writeFileSync(M3U_PATH, m3u, 'utf8');
}

async function runLiveTVBot() {
  console.log(`📺 LIVE TV BOT – ${new Date().toLocaleTimeString()}`);
  let newCount = 0;

  for (const paste of pasteLinks) {
    const links = await extractFromPage(paste);
    for (const link of links) {
      if (!liveLinks[link]) {
        const title = formatLiveTitle(link);
        liveLinks[link] = { title, source: paste, time: new Date().toISOString() };
        newCount++;
        console.log(`📡 [PASTE] ${title} → ${link}`);
      }
    }
  }

  for (const query of dorkQueries) {
    const resultPages = await searchGoogleDork(query);
    for (const page of resultPages) {
      const links = await extractFromPage(page);
      for (const link of links) {
        if (!liveLinks[link]) {
          const title = formatLiveTitle(link);
          liveLinks[link] = { title, source: page, time: new Date().toISOString() };
          newCount++;
          console.log(`🔍 [DORK] ${title} → ${link}`);
        }
      }
    }
  }

  if (newCount === 0) {
    console.log('❌ No new LIVE TV links found.');
  } else {
    saveLiveLinks();
    console.log(`✅ Saved ${newCount} new LIVE TV links.`);
  }

  console.log('⏱️ Scanning again in 1 minute...\n');
  setTimeout(runLiveTVBot, 60000);
}

runLiveTVBot();
