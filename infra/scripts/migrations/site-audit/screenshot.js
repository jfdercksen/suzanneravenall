const puppeteer = require('puppeteer');
const path = require('path');

const BASE_URL = 'https://suzanneravenall.com';
const DESKTOP_DIR = path.join(__dirname, 'screenshots/desktop');
const MOBILE_DIR = path.join(__dirname, 'screenshots/mobile');

const PAGES = [
  { slug: 'homepage', path: '/' },
  { slug: 'about', path: '/about' },
  { slug: 'guided-programmes', path: '/guided-programmes' },
  { slug: 'services-private', path: '/services/private-sessions' },
  { slug: 'services-group', path: '/services/group-sessions' },
  { slug: 'shop', path: '/shop' },
  { slug: 'blog', path: '/blog' },
  { slug: 'articles', path: '/articles' },
  { slug: 'contact', path: '/contact' },
  { slug: 'masterclass2', path: '/masterclass2' },
  { slug: 'media', path: '/media' },
  { slug: 'speaking', path: '/speaking' },
  { slug: 'assessments', path: '/assessments' },
  { slug: 'awards', path: '/awards' },
  { slug: 'transformation-pathways', path: '/transformation-pathways' },
  { slug: 'private-session', path: '/private-session' },
  { slug: 'emotional-nervous-system-mastery', path: '/emotional-nervous-system-mastery' },
  { slug: 'health-energy-intelligence', path: '/health-energy-intelligence' },
  { slug: 'identity-purpose-activation', path: '/identity-purpose-activation' },
  { slug: 'intuition-as-patterned-intelligence', path: '/intuition-as-patterned-intelligence' },
  { slug: 'leadership-high-performance', path: '/leadership-high-performance' },
  { slug: 'life-transitions-reinvention', path: '/life-transitions-reinvention' },
  { slug: 'next-level-health-vitality-longevity', path: '/next-level-health-vitality-longevity' },
  { slug: 'relationships-attachment-patterns', path: '/relationships-attachment-patterns' },
  // Products
  { slug: 'product-book', path: '/product/the-latest-book-by-suzanne' },
  { slug: 'product-coaching-app', path: '/product/suzanne-ravenall-coaching-app' },
  { slug: 'product-bringing-energy-back', path: '/product/bringing-your-energy-back' },
  { slug: 'product-relaxation-energy', path: '/product/relaxation-energy-reclamation' },
  { slug: 'product-energetic-alignment', path: '/product/energetic-alignment-inner-neutrality' },
  { slug: 'product-coherence-muscle-testing', path: '/product/coherence-muscle-testing-self-study-online-2' },
  { slug: 'product-rr-basic-live', path: '/product/resonance-repatterning-full-basic-training-series-programs-1-5-live-via-zoom' },
  { slug: 'product-rr-basic-self-study', path: '/product/resonance-repatterning-full-basic-training-programs-1-5-demos-resources-self-study' },
  { slug: 'product-akashic-basic', path: '/product/akashic-navigator-intuitive-coaching-fundamentals-clearing-self-level-1-live-via-zoom' },
  { slug: 'product-akashic-advanced', path: '/product/akashic-navigator-intuitive-coaching-advanced-clearing-others-level-2-live-via-zoom' },
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
    console.log(`✅ ${filepath.split('/').pop()}`);
  } catch (err) {
    console.error(`❌ Failed: ${url} — ${err.message}`);
  } finally {
    await page.close();
  }
}

async function main() {
  console.log(`Taking screenshots of ${PAGES.length} pages (${PAGES.length * 2} total)...\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  let desktopCount = 0;
  let mobileCount = 0;

  for (const page of PAGES) {
    const url = `${BASE_URL}${page.path}`;
    const desktopPath = path.join(DESKTOP_DIR, `${page.slug}-desktop.png`);
    const mobilePath = path.join(MOBILE_DIR, `${page.slug}-mobile.png`);

    await captureScreenshot(browser, url, desktopPath, DESKTOP_VIEWPORT);
    desktopCount++;

    await captureScreenshot(browser, url, mobilePath, MOBILE_VIEWPORT);
    mobileCount++;
  }

  await browser.close();
  console.log(`\nDone. ${desktopCount} desktop + ${mobileCount} mobile screenshots saved.`);
}

main().catch(console.error);
