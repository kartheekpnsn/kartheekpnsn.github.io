import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
import sharp from 'sharp';

const root = path.resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const origin = 'https://kartheekpnsn.github.io';
const external = new Set();
async function localLink(raw, from, navigation = false) {
  const value = raw.replaceAll('&amp;', '&');
  if (/^(mailto:|tel:|data:)/.test(value)) return;
  const base = new URL(from, `${origin}/`);
  const url = new URL(value, base);
  if (url.origin !== origin) {
    if (url.protocol === 'https:') external.add(url.href);
    else throw new Error(`Insecure or unsupported URL: ${value}`);
    return;
  }
  let target = path.join(root, decodeURIComponent(url.pathname));
  const info = await stat(target).catch((error) => { throw new Error(`Broken local link in ${from}: ${value}`, { cause: error }); });
  if (info.isDirectory()) {
    assert.ok(!navigation, `Navigation must target an HTML file, not a directory listing: ${value} in ${from}`);
    target = path.join(target, 'index.html');
  }
  if (url.hash) {
    const text = await readFile(target, 'utf8');
    assert.ok(text.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `Missing anchor: ${value} in ${from}`);
  }
}
for (const page of ['index.html', 'photography/index.html']) {
  const html = await readFile(path.join(root, page), 'utf8');
  assert.ok(!html.includes('{{'), `Unresolved template in ${page}`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, `Duplicate IDs in ${page}`);
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) await localLink(match[1], page);
  for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) await localLink(match[1], page, true);
}
const { photos } = JSON.parse(await readFile(path.join(root, 'photography/manifest.json'), 'utf8'));
for (const photo of photos) {
  for (const size of [photo.thumb, photo.large]) {
    await localLink(size.url, 'photography/index.html');
    const metadata = await sharp(path.join(root, 'photography', size.url)).metadata();
    assert.equal(metadata.exif, undefined, `EXIF must not be published: ${size.url}`);
    assert.equal(metadata.width, size.width); assert.equal(metadata.height, size.height);
  }
}
async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}
const files = await walk(root);
assert.ok(!files.some((file) => /\.(pdf|tex)$/i.test(file) || /\/(references|node_modules)\//.test(file) || /\/PLAN\.md$/.test(file)), 'Private/development sources must not be deployed');
let jsBytes = 0;
for (const name of ['main.js', 'kmeans.js', 'workbench.js']) {
  const source = await readFile(path.join(root, 'assets', name));
  jsBytes += gzipSync(source).length;
  if (name !== 'workbench.js') for (const match of source.toString().matchAll(/(?:from\s*|import\s*\()['"](\.[^'"]+)['"]/g)) await localLink(match[1], `assets/${name}`);
}
assert.ok(jsBytes <= 250 * 1024, `Homepage JS exceeds 250 KB gzipped: ${jsBytes}`);
console.log(`Local links, fragments, module imports, ${photos.length} photographs, privacy exclusions: OK.`);
console.log(`Homepage JavaScript including Three.js: ${(jsBytes / 1024).toFixed(1)} KB gzipped (budget: 250 KB).`);
if (process.argv.includes('--external')) {
  let broken = 0;
  const urls = [...external];
  for (let offset = 0; offset < urls.length; offset += 4) {
    await Promise.all(urls.slice(offset, offset + 4).map(async (url) => {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'Portfolio-Link-Check/1.0' } });
        await response.body?.cancel();
        if ([404, 410].includes(response.status)) { console.error(`BROKEN ${response.status}: ${url}`); broken++; }
        else if (!response.ok) console.warn(`UNVERIFIED HTTP ${response.status}: ${url}`);
        else console.log(`OK ${response.status}: ${url}`);
      } catch (error) {
        console.warn(`UNVERIFIED ${error.message}: ${url}`);
      }
    }));
  }
  assert.equal(broken, 0, 'Confirmed broken external links remain');
}
