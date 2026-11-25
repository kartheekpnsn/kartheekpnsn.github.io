import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { generatePhotos } from '../scripts/photos.mjs';

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'portfolio-photos-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = path.join(root, 'source'), output = path.join(root, 'output');
  await mkdir(source);
  const metadataPath = path.join(root, 'metadata.json');
  const make = async (name) => sharp({ create: { width: 40, height: 25, channels: 3, background: '#78e3d2' } })
    .withExif({ IFD0: { Artist: 'Private fixture metadata' } }).jpeg().toFile(path.join(source, name));
  return { root, source, output, metadataPath, make };
}

test('discovers uppercase/space filenames, excludes thumbnail folders, and removes metadata from derivatives', async (t) => {
  const f = await fixture(t);
  await f.make('A photo #1.JPG');
  await mkdir(path.join(f.source, 'Thumbnails'));
  await writeFile(path.join(f.source, 'Thumbnails/ignored.jpg'), 'not an image');
  await writeFile(f.metadataPath, JSON.stringify({ 'A photo #1.JPG': { title: 'An observation', alt: 'A cyan test card', category: 'Test' } }));
  const photos = await generatePhotos(f);
  assert.equal(photos.length, 1);
  assert.equal(photos[0].title, 'An observation');
  assert.match(photos[0].thumb.url, /^images\/[a-f0-9]{16}-thumb.webp$/);
  const result = await sharp(path.join(f.output, photos[0].large.url)).metadata();
  assert.equal(result.exif, undefined);
  assert.equal(result.icc, undefined);
  assert.equal(result.width, 40);
});

test('manifest tracks additions/removals without a filename list and preserves surviving IDs', async (t) => {
  const f = await fixture(t);
  await f.make('b.jpg');
  const first = await generatePhotos(f);
  await f.make('a.jpg');
  const added = await generatePhotos(f);
  assert.equal(added.length, 2);
  assert.ok(added.some((p) => p.id === first[0].id));
  await rm(path.join(f.source, 'a.jpg'));
  const removed = await generatePhotos(f);
  assert.equal(removed.length, 1);
  assert.equal(removed[0].id, first[0].id);
  assert.deepEqual(JSON.parse(await readFile(path.join(f.output, 'manifest.json'), 'utf8')).photos, removed);
  await rm(path.join(f.source, 'b.jpg'));
  assert.deepEqual(await generatePhotos(f), []);
});

test('malformed metadata and corrupt images reject rather than publishing a partial manifest', async (t) => {
  const f = await fixture(t);
  await writeFile(f.metadataPath, '[]');
  await assert.rejects(generatePhotos(f), /metadata must be an object/);
  await writeFile(f.metadataPath, JSON.stringify({ 'a.jpg': { order: 'first' } }));
  await assert.rejects(generatePhotos(f), /Invalid photo metadata field/);
  await writeFile(f.metadataPath, '{}');
  await writeFile(path.join(f.source, 'broken.JPG'), 'corrupt image');
  await assert.rejects(generatePhotos(f), /unsupported image format/i);
});
