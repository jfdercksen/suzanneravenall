/**
 * Generate 301 redirect map from WordPress sitemap URLs to new Next.js routes.
 * Run: node generate-redirects.js
 * Output: redirects-complete.json
 */

const fs = require('fs');
const path = require('path');

const urlsFile = path.join(__dirname, 'content/sitemap-all-urls.txt');
const outputFile = path.join(__dirname, 'redirects-complete.json');

const raw = fs.readFileSync(urlsFile, 'utf8');
const urls = raw.split('\n')
  .map(l => l.trim())
  .filter(l => l && !l.startsWith('#'))
  .map(l => l.replace('https://suzanneravenall.com', '').replace(/\/$/, '') || '/');

// Slugify: strip URL encoding for readability in destination paths
function decodeSlug(str) {
  try { return decodeURIComponent(str); } catch { return str; }
}

// Blog post slugs (newsletter/article/award/conference post types)
const BLOG_POST_PATTERNS = [
  /^\/(newsletter|article|award|conference|trauma-to-transcend|protecting-your|embracing-our|becoming|getting-unstuck|become-an-energy|nice-or-not-nice|love-relationships|second-time-around|overcoming-the-need|being-a-great|be-an-energy-ninja|energy-clearing-2|energy-clearing-clear|shedding-excess|body-talk|energetic-clear|group-family|how-to-muscle|intuition-in|akashic-clear|teacher|functional-integrative|artile|women-magazine|meditation|mental-health|blog-post|professional-speaker|love-relationships-session|achieving-work|resonance-repatterning-session|rapid-repatterning-2|rapid-repatterning-3|beyond-outsourcing|trauma-to-transcendence-2|recycling|creative-concepts|rapid-repatterning\/|resonance-repatterning\/|resonance-repatterning-0[6789]|conversations|mindfulness|transformational-behavioural|consciousness|speaking-info|mediator|energy-clearing\/|akashic-navigator\/|akashic-navigator-adv|intuition-in-business|exploring-the-alpha|transformational-coach|finding-my-life|top-performance)/,
];

function isBlogPost(path) {
  return BLOG_POST_PATTERNS.some(p => p.test(path));
}

// Transformation pathway individual pages
const PATHWAY_PAGES = [
  '/break-the-loop',
  '/reclaim-your-power',
  '/reinvent-your-life',
  '/upgrade-your-operating-system',
  '/trauma-to-breakthrough',
  '/resilience-fortification',
  '/pattern-mastery',
  '/children-young-people-foundations-for-life',
  '/emotional-mastery-for-young-minds',
  '/pattern-foundations',
  '/inner-compass',
];

function mapUrl(src) {
  const s = src === '' ? '/' : src;

  // Exact mappings
  const exact = {
    '/': '/',
    '/about': '/about',
    '/contact': '/contact',
    '/shop': '/shop',
    '/blog': '/blog',
    '/blog-2': '/blog',
    '/articles': '/blog',
    '/media': '/about',
    '/awards': '/about',
    '/speaking': '/about',
    '/assessments': '/about',
    '/newsletters': '/blog',
    '/guided-programmes': '/services',
    '/transformation-pathways': '/services',
    '/programmes': '/services',
    '/private-session': '/services',
    '/masterclass2': '/masterclass',
    '/masterclass-register': '/masterclass',
    '/masterclass-viewing': '/masterclass',
    '/masterclass-steps': '/masterclass',
    '/services': '/services',
    '/services/masterclass': '/masterclass',
    '/services/private-sessions': '/services',
    '/services/group-sessions': '/services',
    '/services/transformational-coaching': '/services',
    '/services/true-transformation': '/services',
    '/services/akashic-coaching': '/services',
    '/services/rapid-repatterning': '/services',
    '/services/rapid-transformational-therapy': '/services',
    '/services/group-sessions/money-mastery': '/services',
    '/services/group-sessions/love-and-relationships': '/services',
    '/services/group-sessions/career-progression': '/services',
    '/services/group-sessions/develop-super-confidence': '/services',
    '/services/group-sessions/attraction-frequency': '/services',
    '/services/private-sessions/akashic-clearing': '/services',
    '/services/private-sessions/transformational-behavioural-coaching': '/services',
    '/what-i-do': '/services',
    '/qualifications': '/about',
    '/memberships': '/portal',
    '/my-account': '/portal',
    '/programmes/user-dashboard': '/portal',
    '/courses': '/portal',
    '/affiliate-area': '/portal',
    '/my-acuity-bookings': '/portal',
    '/basket': '/shop',
    '/checkout': '/shop',
    '/speaking-shop': '/shop',
    '/careers': '/contact',
    '/privacy-policy': '/privacy-policy',
    '/terms-and-conditions': '/terms-and-conditions',
    '/disclaimer': '/disclaimer',
    '/unsubscribe': '/',
    '/home': '/',
    '/login-customizer': '/portal',
    '/dates': '/',
    '/dates-repository': '/',
    '/notices': '/',
    '/events-calendar': '/',
    '/events/unleash-the-power-within': '/',
    '/akashic': '/services',
    '/trauma-to-transcendance': '/services',
    '/energy-clearing': '/services',
    '/testacuityapi': '/',
    '/test-page': '/',
    '/masterclass-test-page': '/masterclass',
    '/duplicated-programmes-582': '/services',
    '/duplicated-duplicated-programmes-1730-3141': '/services',
    '/masterclass-register': '/masterclass',
  };

  if (exact[s]) return exact[s];

  // Product pages → /shop/[slug]
  if (s.startsWith('/product/')) {
    const slug = s.replace('/product/', '');
    return `/shop/${slug}`;
  }

  // Product category pages → /shop
  if (s.startsWith('/product-category/')) {
    return '/shop';
  }

  // Product tag pages → /shop
  if (s.startsWith('/product-tag/')) {
    return '/shop';
  }

  // WordPress category archive pages → /blog
  if (s.startsWith('/category/')) {
    return '/blog';
  }

  // Datesrepo (internal WP scheduling) → /
  if (s.startsWith('/datesrepo/')) {
    return '/';
  }

  // Jet-menu (internal) → /
  if (s.startsWith('/jet-menu/')) {
    return '/';
  }

  // Individual transformation pathway pages → /services
  if (PATHWAY_PAGES.includes(s)) {
    return '/services';
  }

  // Blog/newsletter/article/award posts
  if (isBlogPost(s)) {
    return `/blog${s}`;
  }

  // Fallback
  return '/';
}

const redirects = [];
const seen = new Set();

for (const src of urls) {
  if (src === '/' || seen.has(src)) continue;
  seen.add(src);

  const destination = mapUrl(src);

  // Skip self-redirects
  if (src === destination) continue;

  redirects.push({
    source: src,
    destination,
    permanent: true,
    statusCode: 301,
  });
}

// Sort by source for readability
redirects.sort((a, b) => a.source.localeCompare(b.source));

const output = {
  generated: new Date().toISOString().split('T')[0],
  source_site: 'suzanneravenall.com (WordPress)',
  total_redirects: redirects.length,
  note: 'Import into apps/web/next.config.mjs redirects() function for Task 1.9',
  redirects,
};

fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
console.log(`Generated ${redirects.length} redirects → ${outputFile}`);

// Summary breakdown
const destCounts = {};
for (const r of redirects) {
  destCounts[r.destination] = (destCounts[r.destination] || 0) + 1;
}
console.log('\nRedirect destinations:');
Object.entries(destCounts).sort((a,b) => b[1]-a[1]).forEach(([d,c]) => {
  console.log(`  ${c.toString().padStart(4)}  →  ${d}`);
});
