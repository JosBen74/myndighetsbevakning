/**
 * Unit test for Category 1 workflow logic
 * Run: node test-category1.js
 */

const https = require('https');
const http = require('http');

const SOURCES = [
  { name: 'PTS News', url: 'https://pts.se/nyheter-och-pressmeddelanden/' },
  { name: 'PTS Reports', url: 'https://pts.se/dokument/rapporter/' },
  { name: 'MSB News', url: 'https://www.msb.se/sv/aktuellt/nyheter/' },
  { name: 'MSB Publications', url: 'https://www.msb.se/sv/publikationer/?sortOrder=DescendingYear' },
  { name: 'Försvarsmakten', url: 'https://www.forsvarsmakten.se/sv/om-forsvarsmakten/dokument/' },
  { name: 'MTFA', url: 'https://www.mtfa.se/publikationer/', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
];

async function fetchUrl(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...headers
      },
      timeout: 15000
    };

    const req = client.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function extractLinks(html, baseUrl) {
  const linkPattern = /<a[^>]*href="([^"]+)"[^>]*>([^<]{10,})<\/a>/gi;
  const matches = [...html.matchAll(linkPattern)];
  return matches.slice(0, 10).map(m => ({
    url: m[1].startsWith('http') ? m[1] : new URL(m[1], baseUrl).href,
    title: m[2].trim()
  }));
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('Category 1 Workflow - Unit Tests');
  console.log('='.repeat(60));
  console.log();

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const source of SOURCES) {
    process.stdout.write(`Testing ${source.name}... `);

    try {
      const response = await fetchUrl(source.url, source.headers || {});

      if (response.status === 200) {
        const links = extractLinks(response.data, source.url);

        if (links.length > 0) {
          console.log(`✅ OK (${links.length} links found)`);
          passed++;
          results.push({
            source: source.name,
            status: 'PASS',
            links: links.length,
            sample: links[0]?.title?.substring(0, 50)
          });
        } else {
          console.log(`⚠️  WARN (no links extracted, but page loaded)`);
          passed++;
          results.push({
            source: source.name,
            status: 'WARN',
            links: 0,
            note: 'Page loaded but parser found no links'
          });
        }
      } else if (response.status === 403) {
        console.log(`❌ BLOCKED (403 Forbidden)`);
        failed++;
        results.push({
          source: source.name,
          status: 'FAIL',
          error: '403 Forbidden - site blocks scraping'
        });
      } else {
        console.log(`❌ ERROR (HTTP ${response.status})`);
        failed++;
        results.push({
          source: source.name,
          status: 'FAIL',
          error: `HTTP ${response.status}`
        });
      }
    } catch (err) {
      console.log(`❌ ERROR (${err.message})`);
      failed++;
      results.push({
        source: source.name,
        status: 'FAIL',
        error: err.message
      });
    }
  }

  console.log();
  console.log('='.repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));
  console.log();

  // Summary table
  console.log('Source'.padEnd(20) + 'Status'.padEnd(10) + 'Links'.padEnd(8) + 'Sample');
  console.log('-'.repeat(60));
  for (const r of results) {
    console.log(
      r.source.padEnd(20) +
      r.status.padEnd(10) +
      (r.links || '-').toString().padEnd(8) +
      (r.sample || r.error || r.note || '').substring(0, 30)
    );
  }

  // Return exit code
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
