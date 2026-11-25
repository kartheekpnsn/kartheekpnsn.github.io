const grid = document.querySelector('#photo-grid');
const status = document.querySelector('#gallery-status');
const filters = document.querySelector('#photo-filters');
const counter = document.querySelector('#photo-count');
const dialog = document.querySelector('#lightbox');
const image = document.querySelector('#lightbox-image');
const imageError = document.querySelector('#lightbox-error');
let visible = [], selected = 0, opener = null;

function showPhoto(index) {
  selected = (index + visible.length) % visible.length;
  const photo = visible[selected];
  imageError.hidden = true;
  image.hidden = false;
  image.alt = photo.alt;
  image.src = photo.large.url;
  document.querySelector('#lightbox-title').textContent = photo.title;
  document.querySelector('#lightbox-caption').textContent = photo.caption;
  document.querySelector('#lightbox-position').textContent = `${String(selected + 1).padStart(2, '0')} / ${String(visible.length).padStart(2, '0')}`;
}
image.addEventListener('error', () => {
  if (!dialog.open) return;
  image.hidden = true;
  imageError.textContent = 'This photograph could not be loaded. Try the next image or close the viewer.';
  imageError.hidden = false;
  console.error('Photograph failed to load:', image.src);
});
document.querySelector('#lightbox-close').addEventListener('click', () => dialog.close());
document.querySelector('#lightbox-prev').addEventListener('click', () => showPhoto(selected - 1));
document.querySelector('#lightbox-next').addEventListener('click', () => showPhoto(selected + 1));
dialog.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault(); dialog.close(); return;
  }
  if (event.key === 'Tab') {
    const buttons = [...dialog.querySelectorAll('button:not(:disabled)')];
    const first = buttons[0], last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault(); showPhoto(selected + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
dialog.addEventListener('click', (event) => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
});
dialog.addEventListener('close', () => { image.removeAttribute('src'); if (opener?.isConnected) opener.focus(); });

function render(photos, category = '') {
  visible = category ? photos.filter((photo) => photo.category === category) : photos;
  grid.replaceChildren();
  counter.textContent = `${String(visible.length).padStart(2, '0')} PHOTOGRAPHS / ${category || 'THE COLLECTION'}`;
  visible.forEach((photo, index) => {
    const figure = document.createElement('figure');
    figure.className = 'gallery-photo';
    const button = document.createElement('button');
    button.type = 'button'; button.setAttribute('aria-label', `Open ${photo.title}`);
    const thumbnail = document.createElement('img');
    thumbnail.src = photo.thumb.url; thumbnail.alt = photo.alt;
    thumbnail.width = photo.thumb.width; thumbnail.height = photo.thumb.height;
    thumbnail.loading = index < 2 ? 'eager' : 'lazy'; thumbnail.decoding = 'async';
    thumbnail.addEventListener('error', () => {
      thumbnail.alt = `${photo.title} — image unavailable`;
      console.error('Thumbnail failed to load:', photo.thumb.url);
      status.textContent = 'Some photographs could not be loaded. Please reload the page to try again.';
    });
    button.append(thumbnail);
    button.addEventListener('click', () => { opener = button; showPhoto(index); dialog.showModal(); });
    const caption = document.createElement('figcaption');
    const title = document.createElement('span'); title.textContent = photo.title;
    const number = document.createElement('span'); number.textContent = String(index + 1).padStart(2, '0');
    caption.append(title, number); figure.append(button, caption); grid.append(figure);
  });
}
function validManifest(data) {
  const variant = (item) => item && /^images\/[a-f0-9]{16}-(thumb|large)\.webp$/.test(item.url) &&
    Number.isInteger(item.width) && item.width > 0 && Number.isInteger(item.height) && item.height > 0;
  return data?.version === 1 && Array.isArray(data.photos) && data.photos.every((photo) =>
    photo && ['id', 'title', 'alt', 'caption', 'category'].every((key) => typeof photo[key] === 'string') &&
    variant(photo.thumb) && variant(photo.large));
}
try {
  const response = await fetch('manifest.json');
  if (!response.ok) throw new Error(`Gallery manifest returned HTTP ${response.status}`);
  const data = await response.json();
  if (!validManifest(data)) throw new Error('Gallery manifest has an invalid format.');
  if (!data.photos.length) status.textContent = 'The collection is empty for now. Check back for new photographs.';
  else status.textContent = '';
  render(data.photos);
  const categories = [...new Set(data.photos.map((photo) => photo.category).filter(Boolean))].sort();
  if (categories.length) {
    for (const category of ['', ...categories]) {
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = category || 'All photographs';
      button.setAttribute('aria-pressed', String(!category));
      button.addEventListener('click', () => {
        filters.querySelectorAll('button').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
        render(data.photos, category);
        status.textContent = `Showing ${visible.length} ${category || 'total'} photographs.`;
      });
      filters.append(button);
    }
    filters.hidden = false;
  }
} catch (error) {
  console.error('Gallery loading failed:', error);
  status.textContent = 'The photo collection could not be loaded. Please reload to try again, or return to the portfolio.';
}
