const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');

const SAVE_DIR = path.join(__dirname, 'data');
fs.ensureDirSync(SAVE_DIR);
const M3U_PATH = path.join(SAVE_DIR, 'movies.m3u');
const JSON_PATH = path.join(SAVE_DIR, 'movies.json');

// Load existing movie links
let movies = fs.existsSync(JSON_PATH) ? fs.readJsonSync(JSON_PATH) : {};

const headers = {
  headers: { 'User-Agent': 'Mozilla/5.0' }
};

const pasteLinks = [
  'https://pastebin.com/raw/zBedZMta',
  'https://pastebin.com/raw/22SVbdrR',
  'https://pastebin.com/raw/nBVmnst7',
  'https://controlc.com/4d1e6e3b',
  'https://pastebin.com/raw/A9kqX67n',
  'https://iptv-org.github.io/iptv/categories/movies.m3u'
];

const dorkQueries = [
  'site:pastebin.com movies m3u',
  'filetype:m3u intext:cinema',
  'iptv film hd playlist',
  'iptv movie server get.php',
  'iptv movies intitle:"index of" extinf',
];

function isMovieStream(title) {
  const keyWords = ['movie', 'film', 'cinema', 'action', 'thriller', 'comedy', 'drama'];
  return keyWords.some(word => title.toLowerCase().includes(word));
}

function formatTitle(link) {
  const l = link.toLowerCase();
  if (l.includes('sky') && l.includes('action')) return 'UK: SKY Cinema Action HD';
  if (l.includes('film4')) return 'UK: FILM 4 HD';
  if (l.includes('b4u')) return 'UK: B4U Movies HD';
  if (l.includes('thriller')) return 'UK: SKY Cinema Thriller HD';
  if (l.includes('comedy')) return 'UK: SKY Cinema Comedy HD';
  if (l.includes('crime')) return 'UK: SKY Crime HD';
  return 'UK: Movie Channel';
}

async function extractFromPage(url) {
  try {
    const res = await axios.get(url, headers);
    const text = res.data;
    const links = text.match(/https?:\/\/[^\s"'<>]+/g) || [];
    return links.filter(link =>
      link.includes('.m3u8') ||
      link.includes('.ts') ||
      link.includes('get.php?username=') ||
      link.includes('film') ||
      link.includes('movie') ||
      link.includes('cinema')
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
        if (!clean.includes('google')) links.push(clean);
      }
    });
    return links;
  } catch {
    return [];
  }
}

function saveMovies() {
  fs.writeJsonSync(JSON_PATH, movies, { spaces: 2 });
  const m3u = Object.entries(movies)
    .map(([link, obj]) => `#EXTINF:-1,${obj.title}\n${link}`)
    .join('\n');
  fs.writeFileSync(M3U_PATH, m3u, 'utf8');
}

async function runMoviesBot() {
  console.log(`🎬 Movie IPTV Bot – ${new Date().toLocaleTimeString()}`);
  let newCount = 0;

  // From pastebin links
  for (const paste of pasteLinks) {
    const links = await extractFromPage(paste);
    for (const link of links) {
      if (!movies[link]) {
        const title = formatTitle(link);
        movies[link] = { title, source: paste, time: new Date().toISOString() };
        newCount++;
        console.log(`🎞️ [PASTE] ${title} → ${link}`);
      }
    }
  }

  // From google dorks
  for (const q of dorkQueries) {
    const resultPages = await searchGoogleDork(q);
    for (const page of resultPages) {
      const links = await extractFromPage(page);
      for (const link of links) {
        if (!movies[link]) {
          const title = formatTitle(link);
          movies[link] = { title, source: page, time: new Date().toISOString() };
          newCount++;
          console.log(`🎥 [DORK] ${title} → ${link}`);
        }
      }
    }
  }

  if (newCount === 0) {
    console.log('❌ No new movie links found this round.');
  } else {
    saveMovies();
    console.log(`🍿 Saved ${newCount} new movie streams.`);
  }

  console.log('⏱️ Next scan in 20 seconds...\n');
  setTimeout(runMoviesBot, 20000);
}

runMoviesBot();
