#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const [, , target, outDirArg] = process.argv;

if (!target || !outDirArg) {
  console.error('Usage: node audit-web-ppt-multidevice.mjs <html-path-or-url> <output-dir>');
  process.exit(2);
}

async function loadChromium() {
  try {
    const { chromium } = await import('playwright');
    return chromium;
  } catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND') {
      console.error('Web PPT multi-device audit unavailable: optional dependency "playwright" is not installed.');
      console.error('Install it locally only when browser QA is intended; no audit output was produced.');
      process.exit(3);
    }
    throw error;
  }
}

const outDir = path.resolve(outDirArg);

function resolveTarget(value) {
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return new URL(value).href;
  }
  const filePath = value.startsWith('file://') ? fileURLToPath(new URL(value)) : path.resolve(value);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    throw new Error(`Audit target is not a readable file: ${filePath}`);
  }
  return pathToFileURL(filePath).href;
}

let url;
try {
  url = resolveTarget(target);
} catch (error) {
  console.error(`Web PPT multi-device audit input error: ${error.message}`);
  process.exit(2);
}

const viewports = [
  { name: 'desktop_1920x1080', width: 1920, height: 1080, mobile: false },
  { name: 'desktop_1440x900', width: 1440, height: 900, mobile: false },
  { name: 'desktop_1440x800', width: 1440, height: 800, mobile: false },
  { name: 'macbook13_1280x800', width: 1280, height: 800, mobile: false },
  { name: 'macbook13_1280x720', width: 1280, height: 720, mobile: false },
  { name: 'iphone15pro_393x852', width: 393, height: 852, mobile: true, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' },
  { name: 'iphone_compact_393x659', width: 393, height: 659, mobile: true, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' },
  { name: 'iphone13_390x844', width: 390, height: 844, mobile: true, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
  { name: 'promax_430x932', width: 430, height: 932, mobile: true, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' },
  { name: 'android_360x780', width: 360, height: 780, mobile: true, ua: 'Mozilla/5.0 (Linux; Android 15; HUAWEI) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36' },
  { name: 'android_412x915', width: 412, height: 915, mobile: true, ua: 'Mozilla/5.0 (Linux; Android 15; HUAWEI) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36' },
  { name: 'iphone_landscape_844x390', width: 844, height: 390, mobile: true, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
];

const textSelector = [
  'h1', 'h2', 'h3', 'h4', 'p', 'b', 'span',
  '.phone-card', '.phone-deal-card', '.phone-client-section',
  '.phone-source-card', '.phone-case-row', '.phone-field',
  '.phone-result', '.deal-card', '.case-row', '.source-box',
  '.tombstone', '.ledger-row', '.action-fields'
].join(',');

async function auditViewport(browser, vp) {
  const page = await browser.newPage({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.mobile ? 3 : 1,
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
    userAgent: vp.ua,
  });

  try {
    const response = await page.goto(url, { waitUntil: 'load' });
    if (response && !response.ok()) {
      throw new Error(`Audit target returned HTTP ${response.status()}: ${url}`);
    }
    await page.waitForTimeout(900);

    const screenshot = path.join(outDir, `${vp.name}.png`);
    await page.screenshot({ path: screenshot, fullPage: false });

    const result = await page.evaluate((selector) => {
      const visible = (el) => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        const text = (el.textContent || '').replace(/\s+/g, '').trim();
        return text.length > 0 && rect.width > 2 && rect.height > 2 && style.display !== 'none' && style.visibility !== 'hidden';
      };

      const overflow = [...document.querySelectorAll(selector)]
        .filter(visible)
        .filter((el) => el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2)
        .map((el) => ({
          tag: el.tagName.toLowerCase(),
          cls: String(el.className),
          text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
          client: [el.clientWidth, el.clientHeight],
          scroll: [el.scrollWidth, el.scrollHeight],
        }));

      return {
        bodyClass: document.body.className,
        inner: [window.innerWidth, window.innerHeight],
        scrollWidth: document.documentElement.scrollWidth,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
        overflowCount: overflow.length,
        overflow: overflow.slice(0, 40),
        phonePageCount: document.querySelectorAll('.phone-page').length,
        slideCount: document.querySelectorAll('.slide').length,
      };
    }, textSelector);

    return { viewport: vp, screenshot, ...result };
  } finally {
    await page.close();
  }
}

async function main() {
  const chromium = await loadChromium();
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    handleSIGINT: false,
    handleSIGTERM: false,
    handleSIGHUP: false,
  });

  try {
    const results = [];
    for (const vp of viewports) {
      results.push(await auditViewport(browser, vp));
    }

    const report = {
      target: url,
      generatedAt: new Date().toISOString(),
      results,
      summary: {
        viewports: results.length,
        horizontalOverflow: results.filter((result) => result.horizontalOverflow).map((result) => result.viewport.name),
        overflowFindings: results.reduce((sum, result) => sum + result.overflowCount, 0),
      },
    };

    report.summary.status = report.summary.horizontalOverflow.length || report.summary.overflowFindings ? 'fail' : 'pass';

    fs.writeFileSync(path.join(outDir, 'multidevice-qa-report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report.summary, null, 2));
    if (report.summary.status === 'fail') {
      throw new Error(`Multi-device audit found ${report.summary.horizontalOverflow.length} viewport overflow(s) and ${report.summary.overflowFindings} text overflow finding(s).`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(`Web PPT multi-device audit failed: ${error.message}`);
  process.exit(1);
});
