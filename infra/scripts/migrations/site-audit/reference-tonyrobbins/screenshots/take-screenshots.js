/**
 * Tony Robbins Reference Site — Screenshot Capture Script
 *
 * Takes desktop (1440px) and mobile (390px) screenshots of key pages.
 * Run from this directory: node take-screenshots.js
 *
 * Prerequisites:
 *   npm install puppeteer
 *   (downloads Chromium — ~170MB one-time download)
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const PAGES = [
  { name: 'homepage', url: 'https://www.tonyrobbins.com' },
  { name: 'about', url: 'https://www.tonyrobbins.com/about' },
  { name: 'events', url: 'https://www.tonyrobbins.com/events' },
  { name: 'coaching', url: 'https://www.tonyrobbins.com/coaching' },
  { name: 'store', url: 'https://www.tonyrobbins.com/store' },
  { name: 'podcast', url: 'https://www.tonyrobbins.com/podcast' },
  { name: 'blog', url: 'https://www.tonyrobbins.com/blog' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, dir: 'desktop' },
  { name: 'mobile', width: 390, height: 844, dir: 'mobile', isMobile: true },
];

const SCRIPT_DIR = __dirname;
const SCREENSHOTS_DIR = SCRIPT_DIR;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(browser, page, url, outputPath, viewport) {
  const tab = await browser.newPage();

  try {
    await tab.setViewport({
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      isMobile: viewport.isMobile || false,
      hasTouch: viewport.isMobile || false,
    });

    await tab.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log(`  Navigating to ${url}...`);
    await tab.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for lazy-loaded content
    await delay(2000);

    // Scroll to trigger lazy loading
    await tab.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await delay(1000);
    await tab.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await delay(500);

    // Full-page screenshot
    await tab.screenshot({
      path: outputPath,
      fullPage: true,
    });

    console.log(`  Saved: ${path.basename(outputPath)}`);
  } catch (err) {
    console.error(`  ERROR on ${url}: ${err.message}`);
  } finally {
    await tab.close();
  }
}

async function main() {
  console.log('Tony Robbins Reference Site — Screenshot Capture');
  console.log('='.repeat(50));

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (const viewport of VIEWPORTS) {
      const outputDir = path.join(SCREENSHOTS_DIR, viewport.dir);
      fs.mkdirSync(outputDir, { recursive: true });

      console.log(`\n[${viewport.name.toUpperCase()} — ${viewport.width}px]`);

      for (const page of PAGES) {
        const filename = `${page.name}-${viewport.name}.png`;
        const outputPath = path.join(outputDir, filename);
        await takeScreenshot(browser, page, page.url, outputPath, viewport);
      }
    }
  } finally {
    await browser.close();
  }

  console.log('\nDone. Screenshots saved to:');
  console.log(`  ${path.join(SCREENSHOTS_DIR, 'desktop')}`);
  console.log(`  ${path.join(SCREENSHOTS_DIR, 'mobile')}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
