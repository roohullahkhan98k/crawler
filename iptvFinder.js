const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');

const SAVE_DIR = path.join(__dirname, 'data');
fs.ensureDirSync(SAVE_DIR);
const M3U_PATH = path.join(SAVE_DIR, 'playlist.m3u');
const JSON_PATH = path.join(SAVE_DIR, 'links.json');

// preload previous results
let found = fs.existsSync(JSON_PATH) ? fs.readJsonSync(JSON_PATH) : {};

const headers = {
  headers: { 'User-Agent': 'Mozilla/5.0' }
};

// 👀 Known IPTV paste dumps
const pasteLinks = [
  'https://pastebin.com/raw/zBedZMta',
  'https://pastebin.com/raw/22SVbdrR',
  'https://pastebin.com/raw/nBVmnst7',
  'https://controlc.com/4d1e6e3b',
  'https://pastebin.com/raw/Tz7yqqAx',
  'https://pastebin.com/raw/A9kqX67n',
  'https://iptv-org.github.io/iptv/index.m3u',
  'https://iptv-org.github.io/iptv/languages/eng.m3u',
  'https://iptv-org.github.io/iptv/categories/movies.m3u'
];

// 🔍 Additional Google search keywords
const dorkQueries = [
  'site:pastebin.com m3u8',
  'filetype:m3u intext:EXTINF',
  'xtream iptv get.php?username',
  'intitle:"index of" extinf',
];

function formatTitle(url) {
  const l = url.toLowerCase();
  if (l.includes('kids')) return 'UK: Kids Channel';
  if (l.includes('sky')) return 'UK: Sky Stream';
  if (l.includes('bbc')) return 'UK: BBC HD';
  if (l.includes('movie')) return 'UK: Movie Channel';
  if (l.includes('news')) return 'UK: News HD';
  if (l.includes('get.php')) return 'Xtream IPTV';
  return 'UK: IPTV Stream';
}

async function extractFromPaste(url) {
  try {
    const res = await axios.get(url, headers);
    const text = res.data;
    const matches = text.match(/https?:\/\/[^\s"'<>]+/g) || [];
    return matches.filter(link =>
      link.includes('.m3u8') ||
      link.includes('.ts') ||
      link.includes('get.php?username=') ||
      link.endsWith('.m3u') ||
      link.includes(':8080')
    );
  } catch {
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
        if (!clean.includes('google.com')) links.push(clean);
      }
    });
    return links;
  } catch {
    return [];
  }
}

async function extractFromWebpage(url) {
  try {
    const res = await axios.get(url, headers);
    const text = res.data;
    const links = text.match(/https?:\/\/[^\s"'<>]+/g) || [];
    return links.filter(link =>
      link.includes('.m3u8') ||
      link.includes('.ts') ||
      link.includes('get.php?username=') ||
      link.includes(':8080')
    );
  } catch {
    return [];
  }
}

function saveAll() {
  fs.writeJsonSync(JSON_PATH, found, { spaces: 2 });
  const m3u = Object.entries(found)
    .map(([link, obj]) => `#EXTINF:-1,${obj.title}\n${link}`)
    .join('\n');
  fs.writeFileSync(M3U_PATH, m3u, 'utf8');
}

async function hunt() {
  console.log(`🛰️  IPTV TERMINATOR BOT – ${new Date().toLocaleTimeString()}`);
  let newLinks = 0;

  // First check known pastebins
  for (const paste of pasteLinks) {
    const links = await extractFromPaste(paste);
    for (const link of links) {
      if (!found[link]) {
        const title = formatTitle(link);
        found[link] = { title, source: paste, time: new Date().toISOString() };
        newLinks++;
        console.log(`✅ [PASTE] ${title} → ${link}`);
      }
    }
  }

  // Then use Google Dorks
  for (const q of dorkQueries) {
    const resultPages = await searchGoogleDork(q);
    for (const page of resultPages) {
      const links = await extractFromWebpage(page);
      for (const link of links) {
        if (!found[link]) {
          const title = formatTitle(link);
          found[link] = { title, source: page, time: new Date().toISOString() };
          newLinks++;
          console.log(`✅ [DORK] ${title} → ${link}`);
        }
      }
    }
  }

  if (newLinks === 0) {
    console.log("❌ No new IPTV links found this round.");
  } else {
    saveAll();
    console.log(`💾 Saved ${newLinks} new working links.`);
  }

  console.log("⏱️  Next scan in 20 seconds...\n");
  setTimeout(hunt, 20000);
}

hunt();
