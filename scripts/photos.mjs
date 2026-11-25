import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const fields = new Set(['title', 'alt', 'category', 'caption', 'order']);

export async function generatePhotos({ source, output, metadataPath }) {
  let metadata = {};
  if (metadataPath) {
    try {
      metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  if (!metadata || Array.isArray(metadata) || typeof metadata !== 'object') {
    throw new Error('Photo metadata must be an object keyed by filename.');
  }
  for (const [file, entry] of Object.entries(metadata)) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error(`Invalid metadata: ${file}`);
    for (const [key, value] of Object.entries(entry)) {
      if (!fields.has(key) || (key === 'order' ? !Number.isFinite(value) : typeof value !== 'string')) {
        throw new Error(`Invalid photo metadata field: ${file}.${key}`);
      }
    }
  }
  const files = (await readdir(source, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && /\.(jpe?g|png|webp)$/i.test(entry.name))
    .map((entry) => entry.name).sort();
  await mkdir(path.join(output, 'images'), { recursive: true });
  const photos = [];
  for (const [index, file] of files.entries()) {
    const id = createHash('sha256').update(file).digest('hex').slice(0, 16);
    const editorial = metadata[file] ?? {};
    const input = path.join(source, file);
    const sizes = {};
    // Re-encoding deliberately strips EXIF (including GPS) from public copies.
    for (const [kind, width] of [['thumb', 720], ['large', 1920]]) {
      const { width: w, height: h } = await sharp(input).autoOrient()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: kind === 'thumb' ? 77 : 85 })
        .toFile(path.join(output, 'images', `${id}-${kind}.webp`));
      sizes[kind] = { url: `images/${id}-${kind}.webp`, width: w, height: h };
    }
    photos.push({
      id, title: editorial.title || `Study ${String(index + 1).padStart(2, '0')}`,
      alt: editorial.alt || `Untitled photograph ${index + 1} from Kartheek Palepu's collection`,
      caption: editorial.caption || '', category: editorial.category || '',
      order: editorial.order ?? 1000 + index, ...sizes,
    });
  }
  photos.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  await writeFile(path.join(output, 'manifest.json'), `${JSON.stringify({ version: 1, photos }, null, 2)}\n`);
  return photos;
}
