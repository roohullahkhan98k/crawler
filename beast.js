const { chromium } = require('playwright');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const SAVE_DIR = path.join(__dirname, 'data');
fs.ensureDirSync(SAVE_DIR);
const M3U_PATH = path.join(SAVE_DIR, 'live-tvs.m3u');
const JSON_PATH = path.join(SAVE_DIR, 'live-tvs.json');

let liveLinks = fs.existsSync(JSON_PATH) ? fs.readJsonSync(JSON_PATH) : {};

const pasteLinks = [
  'https://iptv-org.github.io/iptv/index.m3u',
  'https://iptv-org.github.io/iptv/channels/us.m3u',
  'https://iptv-org.github.io/iptv/categories/entertainment.m3u',
  'https://iptv-org.github.io/iptv/categories/movies.m3u',
  'https://iptv-org.github.io/iptv/categories/sports.m3u'
];

const dorkQueries = [
  'filetype:m3u8 HBO OR SHOWTIME OR STARZ OR ESPN',
  'filetype:m3u8 extinf hbo',
  'filetype:m3u8 extinf showtime',
  'filetype:m3u8 extinf starz',
  'filetype:m3u8 espn OR fox sports',
  'inurl:get.php?username= AND password=',
  'intitle:"index of" m3u8'
];

function formatLiveTitle(link) {
  const l = link.toLowerCase();
  if (l.includes('hbo')) return 'LIVE: HBO HD';
  if (l.includes('showtime')) return 'LIVE: SHOWTIME HD';
  if (l.includes('starz')) return 'LIVE: STARZ HD';
  if (l.includes('cinemax')) return 'LIVE: CINEMAX HD';
  if (l.includes('espn')) return 'LIVE: ESPN HD';
  if (l.includes('fox')) return 'LIVE: FOX SPORTS HD';
  return 'LIVE: Unknown Channel';
}

async function extractFromPage(url) {
  try {
    const res = await axios.get(url, { timeout: 10000 });
    const text = res.data;
    const links = text.match(/https?:\/\/[^\s"'<>]+/g) || [];
    return links.filter(link =>
      link.includes('.m3u8') ||
      link.includes('get.php?username=')
    );
  } catch (err) {
    console.log(`❌ Failed to load ${url}`);
    return [];
  }
}

async function searchGoogleDork(dork) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const searchURL = `https://www.google.com/search?q=${encodeURIComponent(dork)}`;
  await page.goto(searchURL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  const links = await page.$$eval('a', as =>
    as.map(a => a.href)
      .filter(href => href.includes('/url?q='))
      .map(href => href.split('/url?q=')[1].split('&')[0])
      .filter(url => !url.includes('google'))
  );

  await browser.close();
  return links;
}

function saveLiveLinks() {
  fs.writeJsonSync(JSON_PATH, liveLinks, { spaces: 2 });
  const m3u = Object.entries(liveLinks)
    .map(([link, obj]) => `#EXTINF:-1,${obj.title}\n${link}`)
    .join('\n');
  fs.writeFileSync(M3U_PATH, m3u, 'utf8');
}

async function runCrawler() {
  console.log(`🔥 IPTV BEAST BOT – ${new Date().toLocaleTimeString()}`);
  let newCount = 0;

  for (const paste of pasteLinks) {
    const links = await extractFromPage(paste);
    for (const link of links) {
      if (!liveLinks[link]) {
        const title = formatLiveTitle(link);
        liveLinks[link] = { title, source: paste, time: new Date().toISOString() };
        newCount++;
        console.log(`📡 [GITHUB] ${title} → ${link}`);
      }
    }
  }

  for (const q of dorkQueries) {
    const pages = await searchGoogleDork(q);
    for (const page of pages) {
      const links = await extractFromPage(page);
      for (const link of links) {
        if (!liveLinks[link]) {
          const title = formatLiveTitle(link);
          liveLinks[link] = { title, source: page, time: new Date().toISOString() };
          newCount++;
          console.log(`🔍 [GOOGLE] ${title} → ${link}`);
        }
      }
    }
  }

  if (newCount === 0) {
    console.log('❌ No new links found.');
  } else {
    saveLiveLinks();
    console.log(`✅ Saved ${newCount} new LIVE streams.`);
  }

  console.log('🔁 Scanning again in 60s...');
  setTimeout(runCrawler, 60000);
}

runCrawler();
