import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Scotiabank hero: left-hand content (brand lockup, heading, body, two CTAs) over a
 * right-hand image. Rows: [image] [richtext]. The last two links in the richtext become
 * the primary (dark) and secondary (outline) call to action buttons.
 */
export default function decorate(block) {
  const rows = [...block.children];
  const imageRow = rows[0];
  const contentRow = rows[1];

  if (imageRow) {
    imageRow.classList.add('hero-image');
    const img = imageRow.querySelector('picture > img');
    if (img) {
      // Art-directed hero matching prod breakpoints: a dedicated crop per viewport.
      const base = (img.getAttribute('src') || '').replace(/[^/]+$/, '');
      const picture = document.createElement('picture');
      const addSource = (file, media) => {
        const s = document.createElement('source');
        s.setAttribute('srcset', `${base}${file}`);
        if (media) s.setAttribute('media', media);
        picture.append(s);
      };
      // Art direction matching prod renditions: mobile band, tablet band, desktop master
      // (the desktop 3000x900 has a dark band on the left that the light text panel covers,
      // exactly like prod's full-bleed hero).
      addSource('hero-mobile.jpg', '(max-width: 767px)');
      addSource('hero-tablet.jpg', '(max-width: 991px)');
      const out = document.createElement('img');
      out.setAttribute('src', `${base}hero-desktop.jpg`);
      out.setAttribute('alt', img.getAttribute('alt') || '');
      out.setAttribute('loading', 'eager');
      moveInstrumentation(img, out);
      picture.append(out);
      img.closest('picture').replaceWith(picture);
    }
  }

  if (contentRow) {
    contentRow.classList.add('hero-content');
    const inner = contentRow.firstElementChild || contentRow;
    inner.classList.add('hero-content-inner');
    // brand lockup image (first picture) stays on top
    const brand = inner.querySelector('picture');
    if (brand) brand.closest('p')?.classList.add('hero-brands');
    // style the two CTA links (split variant: only links standing alone in their paragraph)
    const split = block.classList.contains('split');
    const links = [...inner.querySelectorAll('a')]
      .filter((a) => !split || a.closest('p')?.textContent.trim() === a.textContent.trim());
    if (split) {
      const first = inner.firstElementChild;
      if (first?.tagName === 'P' && first.nextElementSibling?.matches('h1, h2')) first.classList.add('hero-eyebrow');
      inner.querySelector('h1 + p, h2 + p')?.classList.add('hero-lead');
    }
    links.forEach((a, i) => {
      a.classList.add('button');
      a.classList.add(i === 0 ? 'primary' : 'secondary');
      const p = a.closest('p');
      if (p) p.classList.add('hero-cta');
    });
  }
}
