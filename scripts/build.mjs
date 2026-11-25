import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { build } from 'esbuild';
import { generatePhotos } from './photos.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'dist');
await rm(out, { recursive: true, force: true });
await mkdir(path.join(out, 'photography'), { recursive: true });
for (const item of ['index.html', 'photography/index.html', 'assets', 'stylesheets/site.css', 'locations', 'topics/index.html', 'topics/UltraBERT/index.html', 'favicon.ico', 'google288d4618e190d101.html']) {
  await cp(path.join(root, item), path.join(out, item), { recursive: true });
}
await mkdir(path.join(out, 'assets/vendor'), { recursive: true });
await cp(path.join(root, 'node_modules/three/LICENSE'), path.join(out, 'assets/vendor/THREE-LICENSE.txt'));
await build({
  entryPoints: [path.join(root, 'assets/workbench.js')], bundle: true, minify: true,
  format: 'esm', target: 'es2022', outfile: path.join(out, 'assets/workbench.js'),
});
const photos = await generatePhotos({
  source: path.join(root, 'photography/mySnaps'),
  output: path.join(out, 'photography'),
  metadataPath: path.join(root, 'photography/metadata.json'),
});
let home = await readFile(path.join(out, 'index.html'), 'utf8');
const escape = (text) => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const preview = photos.slice(0, 3).map((photo, i) =>
  `<a href="photography/index.html"${i === 0 ? ' class="photo-preview-main"' : ''}><img src="photography/${photo.thumb.url}" loading="lazy" width="${photo.thumb.width}" height="${photo.thumb.height}" alt="${escape(photo.alt)}"><span><span>${String(i + 1).padStart(2, '0')} / ${escape(photo.title.toUpperCase())}</span><span aria-hidden="true">↗</span></span></a>`).join('');
home = home.replace('{{photoPreview}}', preview || '<p>New photographic observations are on their way.</p>');
await writeFile(path.join(out, 'index.html'), home);
await sharp(path.join(root, 'assets/social.svg')).png().toFile(path.join(out, 'assets/social.png'));
await writeFile(path.join(out, '.nojekyll'), '');
console.log(`Built ${photos.length} photographs and the portfolio into dist/. Reference documents excluded.`);
