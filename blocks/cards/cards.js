import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Cards block. Variants:
 *   cards.interest  - product tiles with an image, a title and an "Explore" link (overlay style)
 *   cards.featured  - offer tiles with an image, optional badge, heading, body and a link
 * Default: image + body.
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    // first bold paragraph in a featured card is a badge
    if (block.classList.contains('featured')) {
      const body = li.querySelector('.cards-card-body');
      const badge = body?.querySelector('p > strong');
      if (badge && body.firstElementChild.contains(badge)) {
        body.firstElementChild.classList.add('cards-card-badge');
      }
    }
    // personal tab grids: an item with no image whose paragraphs are only links is the row of
    // "View all ..." buttons under the grid (prod bns_button rectangle buttons)
    const tabGrid = (block.classList.contains('featured') && !block.classList.contains('article'))
      || (block.classList.contains('product') && !block.classList.contains('compare'));
    const paras = [...li.querySelectorAll('.cards-card-body > *')].filter((e) => e.textContent.trim());
    if (tabGrid && !li.querySelector('picture') && paras.length
      && paras.every((p) => p.tagName === 'P' && p.querySelector('a') && p.textContent.trim() === p.querySelector('a').textContent.trim())) {
      li.classList.add('cards-ctas');
      li.querySelectorAll('.cards-card-body:not(:has(*))').forEach((d) => d.remove());
      li.querySelectorAll('a').forEach((a) => a.classList.add('cards-cta-button'));
      ul.append(li);
      return;
    }
    // make the whole tile clickable via its last link
    const link = li.querySelector('.cards-card-body a[href]');
    if (link) {
      link.classList.add('cards-card-link');
      li.dataset.href = link.href;
    }
    // interest: prod's tile IS the link (one focusable anchor around art, title and CTA text)
    if (link && block.classList.contains('interest')) {
      const tile = document.createElement('a');
      tile.className = 'cards-card-tile';
      tile.href = link.href;
      const cta = document.createElement('span');
      cta.className = link.className;
      cta.append(...link.childNodes);
      link.replaceWith(cta);
      tile.append(...li.childNodes);
      li.append(tile);
    }
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.replaceChildren(ul);
  // L1 pages: swipe carousel with pager below 1200px
  if (block.classList.contains('scroll')) import('../../scripts/l1-carousel.js').then((m) => m.default(block, ul));
  // optional "Show more" (cards.product: after 3 cards, cards.icons: after 5)
  if (block.classList.contains('more')) {
    import('./cards-product.js').then((m) => m.default(block, ul, block.classList.contains('icons') ? 5 : 3));
  }
  // L1 Advice+ quiz: option rows + feedback row
  if (block.classList.contains('quiz')) import('./cards-quiz.js').then((m) => m.default(block, ul));
}
