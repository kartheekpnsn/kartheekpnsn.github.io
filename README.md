# Kartheek Palepu / The Thinking Machine

A static, midnight-lab portfolio with a Three.js workbench, a genuine browser-side k-means experiment, and an automatically generated photography journal. No backend, visitor-time GitHub API calls, analytics, external fonts, or paid inference services.

## Local development

Use Node.js 22 or later:

```sh
npm ci
npm test
npm run build
npm run check
npm run preview
```

Open <http://127.0.0.1:4173>. `npm run preview` automatically builds first, including the photo manifest and optimized images. The preview server serves **only `dist/`**, not reference documents or other repository sources. Rebuild and reload after editing. Set `PORT` to choose another preview port.

### Photography opens a directory listing

Some editor previews list directories instead of opening their index page. Navigation now explicitly targets `photography/index.html` (and `index.html` for return links), avoiding this dependency on server behavior.

The gallery still requires generated assets: previewing the repository's source homepage directly does not build its manifest, images, or Three.js bundle. Run `npm run preview` and use the URL above. If using an editor preview extension instead, build first and open [dist/index.html](dist/index.html), not the source homepage.

- [index.html](index.html): public profile and project copy.
- [stylesheets/site.css](stylesheets/site.css): shared responsive design.
- [assets/main.js](assets/main.js): accessible experiment and pipeline controls.
- [assets/kmeans.js](assets/kmeans.js): deterministic clustering implementation.
- [assets/workbench.js](assets/workbench.js): optional 3D illustration.
- [photography/index.html](photography/index.html) and [assets/gallery.js](assets/gallery.js): manifest-driven gallery and native-dialog lightbox.

Three.js is pinned and bundled locally with esbuild during the small Node.js build step. There is no application framework. Reduced-motion visitors receive a static illustration and single-step experiment controls; WebGL failures leave the profile usable and are explicitly reported.

The retained [legacy Lightbox snapshot](photography/lightbox2-master/) is not used by the current gallery or deployment build. Its obsolete Grunt dependencies and build/lint configuration have been removed; source, prebuilt static assets, and licensing are unchanged. No separate installation or Grunt command is needed there.

## Add or remove photos

1. Add `.jpg`, `.jpeg`, `.png`, or `.webp` originals directly to [photography/mySnaps/](photography/mySnaps/). Uppercase extensions are supported. Subdirectories, including legacy thumbnails, are ignored.
2. Optionally add editorial metadata keyed by the exact filename to [photography/metadata.json](photography/metadata.json):

```json
{
  "new-photo.JPG": {
    "title": "An evening observation",
    "alt": "A descriptive account of what is visible in the photograph",
    "caption": "Optional camera settings or a short note",
    "category": "Light",
    "order": 10
  }
}
```

All fields are optional. `order` is a finite number; other values must be strings. Without metadata, a photo receives a neutral numbered label, not a guessed subject. Categories appear only when supplied. Existing camera captions have been retained where useful.

3. Run `npm run build` and preview. The build scans all supported originals, creates 720px thumbnails and 1920px viewing images (without upscaling), and writes a deterministic manifest. EXIF/GPS metadata is stripped from deployed derivatives. Filenames with spaces or URL-special characters receive safe, stable hashed URLs.
4. Publish using the workflow below. No HTML or filename list edits are needed. Removing an original removes it from the next clean build. The homepage automatically previews the first three ordered photos.

The legacy `Photography/` directory has been normalized to lowercase `photography/` in Git. Preserve this spelling: GitHub's Linux runners and published URLs are case-sensitive even when a local macOS filesystem is not.

Corrupt images or invalid metadata fail the build rather than silently dropping photos. Originals are never modified. The originals remain in the repository: do not commit sensitive photographs or assume metadata stripping makes committed originals private.

## Validation

```sh
npm test              # Clustering and photo-generation edge cases
npm run build
npm run check         # Local links/anchors/assets, EXIF exclusion, deployment privacy, JS budget
npm run check:links   # Also check external destinations over the network
```

External 404/410 responses fail the link audit. Bot blocking, authentication requirements, timeouts, and other inconclusive responses are reported as unverified, not silently treated as success or automatically removed.

Browser checks should cover both routes at desktop/mobile sizes, point addition, Run/Pause/Step/Reset, convergence, all pipeline stages, photo filters, image navigation, Escape, modal focus restoration, reduced motion, unavailable WebGL, and a failed manifest request. The plot is pointer-interactive, with an equivalent **+ Point** button for keyboard users. Lightbox controls support Tab, Escape, and left/right arrows.

Homepage budgets: at most 250 KB gzipped JavaScript including Three.js and 1 MB measured initial transfer. Gallery images are lazy-loaded; the hero does not depend on image textures or external assets.

## Deployment

[The Pages workflow](.github/workflows/pages.yml) tests/builds pull requests and builds/deploys pushes to `master` or manual runs. Only the explicit `dist/` artifact is uploaded; raw photos, reference PDFs/TeX, development scripts, and the plan are excluded. Existing independent [location pages](locations/) remain in the artifact at their existing paths.

The homepage links to the [Unfold topic library](unfold/topics/index.html) as **Technical learnings**, with a **Learnings** navigation shortcut. The library and the finished [UltraBERT](unfold/topics/UltraBERT/index.html), [ModernBERT](unfold/topics/ModernBERT/index.html), and [Azure voice agents](unfold/topics/Cascade-Vs-Speech-To-Speech-In-Azure-Voice-Agents/index.html) lessons are explicitly included in the deployment. Local `_unfold/` research, build notes, and QA artifacts are not published.

**One-time repository setup is required:** at implementation time GitHub reported `has_pages: false`, and the Pages endpoint returned 404. An authorized owner must enable **Settings → Pages → Build and deployment → Source: GitHub Actions**. The workflow does not enable Pages or change repository settings itself. Review the `github-pages` environment protection rules before publishing.

No commit, push, settings change, or production deployment is performed by local build commands. Once approved changes are pushed and Pages is configured, check the workflow and both published URLs before considering production verified:

- <https://kartheekpnsn.github.io/>
- <https://kartheekpnsn.github.io/photography/>

Do not deploy the repository root using a legacy branch-based configuration: it lacks generated gallery assets and bypasses the deployment allowlist.

## Content and privacy

The supplied LinkedIn PDF is authoritative for the current role/timeline; the CV supplies supporting background. The public site omits phone numbers, employer project names, exact business-impact figures, and internal award documents. The local `references/` folder is ignored and excluded from deployment. Do not commit the supplied documents. Personal project visuals are original illustrations, not screenshots of private conversations.

Private chat reports and their assets under `chat_explore/` are excluded from published history and ignored to prevent accidental recommits. The public Chat Explore project card links only to its source repository, not to personal reports. History rewriting cannot remove downloaded copies or guarantee removal of GitHub caches; cached views may require a GitHub Support purge.

Environment files, common private-key formats, and credential files are ignored as a safeguard, not a substitute for credential scanning. Keep locations and original photographs public only when their contents and metadata are approved. If a real secret is ever committed, revoke/rotate it first: deleting a file or rewriting history cannot invalidate a credential or erase copies already downloaded.

## Attribution

The new interface and workbench illustration replace the old Tactile/Dopetrope page templates. Three.js is MIT-licensed; its notice is included in the deployed `assets/vendor/THREE-LICENSE.txt`. Untouched legacy assets retain their existing license notices. Photographs belong to Kartheek Palepu. Chat Explore is a collaborative project; its card credits contributors.

The retained legacy Tactile theme assets are by Jason Long and licensed under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/). The retained legacy Dopetrope assets are by AJ at [HTML5 UP](https://html5up.net/) and retain their [original attribution license](photography/LICENSE.txt). Neither legacy theme powers the new pages.
