#!/usr/bin/env node
import https from 'node:https';
import http from 'node:http';

const [url, ...tokens] = process.argv.slice(2);
if (!url || tokens.length === 0 || tokens.some((token) => token.trim().length === 0)) {
  console.error('Usage: node assert-published-html.mjs <url> <required-token> [...]');
  process.exit(2);
}

let parsedUrl;
try {
  parsedUrl = new URL(url);
} catch {
  console.error('Published HTML URL must be an absolute http:// or https:// URL.');
  process.exit(2);
}
if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
  console.error('Published HTML URL must use http:// or https://.');
  process.exit(2);
}

function fetchText(target) {
  return new Promise((resolve, reject) => {
    const client = target.startsWith('https:') ? https : http;
    client.get(target, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode || 0, body }));
    }).on('error', reject);
  });
}

const { statusCode, body } = await fetchText(parsedUrl.href);
if (statusCode < 200 || statusCode >= 300) {
  console.error(`Published HTML assertion failed: HTTP ${statusCode}`);
  process.exit(1);
}

let failures = 0;
for (const token of tokens) {
  if (!body.includes(token)) {
    console.error(`Missing token: ${token}`);
    failures += 1;
  }
}

if (failures) {
  console.error(`Published HTML assertion failed: ${failures} missing token(s).`);
  process.exit(1);
}

console.log(`Published HTML assertion passed: HTTP ${statusCode}, ${tokens.length} token(s) found.`);
