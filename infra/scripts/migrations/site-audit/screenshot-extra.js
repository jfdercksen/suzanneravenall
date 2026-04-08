const puppeteer = require('puppeteer');
const path = require('path');

const BASE_URL = 'https://suzanneravenall.com';
const DESKTOP_DIR = path.join(__dirname, 'screenshots/desktop');
const MOBILE_DIR = path.join(__dirname, 'screenshots/mobile');

// New pages found in sitemap not captured in first run
const PAGES = [
  { slug: 'break-the-loop', path: '/break-the-loop' },
  { slug: 'reclaim-your-power', path: '/reclaim-your-power' },
  { slug: 'reinvent-your-life', path: '/reinvent-your-life' },
  { slug: 'upgrade-your-operating-system', path: '/upgrade-your-operating-system' },
  { slug: 'trauma-to-breakthrough', path: '/trauma-to-breakthrough' },
  { slug: 'resilience-fortification', path: '/resilience-fortification' },
  { slug: 'pattern-mastery', path: '/pattern-mastery' },
  { slug: 'children-young-people-foundations', path: '/children-young-people-foundations-for-life' },
  { slug: 'emotional-mastery-young-minds', path: '/emotional-mastery-for-young-minds' },
  { slug: 'pattern-foundations', path: '/pattern-foundations' },
  { slug: 'inner-compass', path: '/inner-compass' },
  { slug: 'qualifications', path: '/qualifications' },
  { slug: 'memberships', path: '/memberships' },
  { slug: 'services-transformational-coaching', path: '/services/transformational-coaching' },
  { slug: 'services-akashic-coaching', path: '/services/akashic-coaching' },
  { slug: 'services-rapid-repatterning', path: '/services/rapid-repatterning' },
  { slug: 'services-rapid-transformation-therapy', path: '/services/rapid-transformational-therapy' },
  { slug: 'services-masterclass', path: '/services/masterclass' },
  { slug: 'newsletters', path: '/newsletters' },
];

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const MOBILE_VIEWPORT = { width: 390, height: 844, isMobile: true, hasTouch: true };

async function captureScreenshot(browser, url, filepath, viewport) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: filepath, fullPage: true, type: 'png' });
    console.log(`✅ ${filepath.split('\\').pop()}`);
  } catch (err) {
    console.error(`❌ Failed: ${url} — ${err.message}`);
  } finally {
    await page.close();
  }
}

async function main() {
  console.log(`Capturing ${PAGES.length} additional pages (${PAGES.length * 2} screenshots)...\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  for (const page of PAGES) {
    const url = `${BASE_URL}${page.path}`;
    await captureScreenshot(browser, url, path.join(DESKTOP_DIR, `${page.slug}-desktop.png`), DESKTOP_VIEWPORT);
    await captureScreenshot(browser, url, path.join(MOBILE_DIR, `${page.slug}-mobile.png`), MOBILE_VIEWPORT);
  }

  await browser.close();
  console.log(`\nDone. ${PAGES.length} desktop + ${PAGES.length} mobile screenshots saved.`);
}

main().catch(console.error);
