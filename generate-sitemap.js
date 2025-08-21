// generate-sitemap.js
const fs = require('fs');
const path = require('path');

// List of all 50 article slugs (from your learn.html)
const articles = [
  'parallel-park', 'parking-meters', 'handicap-parking', 'residential-permits',
  'time-limits', 'fire-hydrants', 'tow-away-zones', 'parking-signs',
  'avoid-tickets', 'meter-extensions',

  'parking-apps', 'smart-parking', 'robotic-parking', 'ai-parking',
  'self-parking-cars', 'ev-parking', 'contactless-payments', 'geolocation',
  'pwa-benefits', 'evolution',

  'parking-tickets', 'dispute-ticket', 'parking-laws', 'urban-cost',
  'pay-smart', 'public-vs-private', 'hidden-costs', 'lot-rights',
  'towing-legal', 'future-enforcement',

  'solving-parking', 'urban-development', 'sustainable-solutions', 'traffic-congestion',
  'garages-vs-street', 'design-lot', 'park-and-ride', 'impact-businesses',
  'parking-permits', 'challenge-planners',

  'car-safety', 'avoid-robbery', 'good-lighting', 'vehicle-alarms',
  'witness-crime', 'parking-scams', 'security-cameras', 'safest-place-night',
  'dents-scratches', 'emergency-preparedness'
];

const baseUrl = 'https://parking-pwa-eight.vercel.app';
const now = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD

let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/learn.html</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;

articles.forEach(slug => {
  sitemap += `  <url>
    <loc>${baseUrl}/article/${slug}.html</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
});

sitemap += '</urlset>';

// Write to dist/sitemap.xml (or public/, www/, etc. — your output folder)
const outputDir = path.join(__dirname, 'dist');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), sitemap);
console.log('✅ Sitemap generated: dist/sitemap.xml');