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
    // make the whole tile clickable via its last link
    const link = li.querySelector('.cards-card-body a[href]');
    if (link) {
      link.classList.add('cards-card-link');
      li.dataset.href = link.href;
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
  // cards.product: optional "Show more" after 3 cards
  if (block.classList.contains('product') && block.classList.contains('more')) import('./cards-product.js').then((m) => m.default(block, ul));
}
