import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import buildPager from '../../scripts/l1-carousel.js';

/**
 * Product comparison cards (bank accounts, investment products, credit cards).
 * Each row is a card: [image (optional card art)] [rich text] [tags (optional, comma separated)].
 * The rich text is grouped by role: head (eyebrow, title, price), offer (badge image + text),
 * features (paragraphs starting with a bold line), disclaimer (italic only), actions (buttons and
 * the trailing text link). Below 992px the cards become a swipeable carousel with a pager.
 * Variant `filter`: category pills built from the card tags ("All" first) + "Show more".
 */
const isOnly = (el, sel) => el.children.length === 1 && el.firstElementChild.matches(sel)
  && el.textContent.trim() === el.firstElementChild.textContent.trim();

function group(body) {
  const kids = [...body.children];
  const titleIdx = kids.findIndex((el) => /^H[2-4]$/.test(el.tagName));
  const groups = {
    head: [], offer: [], features: [], notes: [], actions: [],
  };
  kids.forEach((el, i) => {
    if (i <= titleIdx) { groups.head.push(el); return; }
    if (el.classList.contains('button-wrapper') || (el.tagName === 'P' && isOnly(el, 'a'))) { groups.actions.push(el); return; }
    if (groups.actions.length) { groups.actions.push(el); return; }
    if (i === titleIdx + 1 && el.tagName === 'P' && el.querySelector('strong, b') && !groups.offer.length) {
      el.classList.add('product-cards-price');
      groups.head.push(el);
      return;
    }
    if (el.tagName === 'P' && el.querySelector('picture, img') && !el.textContent.trim()) {
      el.classList.add('product-cards-badge');
      groups.offer.push(el);
      return;
    }
    if (el.tagName === 'P' && isOnly(el, 'em, i')) { el.classList.add('product-cards-disclaimer'); groups.notes.push(el); return; }
    const lead = el.firstElementChild;
    if (el.tagName === 'P' && lead && lead.matches('strong, b') && el.firstChild === lead && el.querySelector('br')) {
      groups.features.push(el);
      return;
    }
    if (groups.features.length || (groups.offer.length > 1)) groups.features.push(el);
    else groups.offer.push(el);
  });
  if (titleIdx > 0) kids.slice(0, titleIdx).forEach((el) => el.classList.add('product-cards-eyebrow'));
  const frag = document.createDocumentFragment();
  Object.entries(groups).forEach(([name, els]) => {
    if (!els.length) return;
    const div = document.createElement('div');
    div.className = `product-cards-${name}`;
    div.append(...els);
    frag.append(div);
  });
  body.replaceChildren(frag);
}

function buildFilter(block, ul) {
  const items = [...ul.children];
  const labels = [];
  items.forEach((li) => (li.dataset.tags || '').split(',').map((t) => t.trim()).filter(Boolean)
    .forEach((t) => { if (!labels.includes(t)) labels.push(t); }));
  if (!labels.length) return;
  const LIMIT = 3;
  let active = '';
  let expanded = false;
  const bar = document.createElement('div');
  bar.className = 'product-cards-filters';
  bar.setAttribute('role', 'group');
  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'product-cards-more';
  const tagsOf = (li) => (li.dataset.tags || '').split(',').map((t) => t.trim());
  const apply = () => {
    const matching = items.filter((li) => !active || tagsOf(li).includes(active));
    items.forEach((li) => {
      li.hidden = !matching.includes(li) || (!expanded && matching.indexOf(li) >= LIMIT);
    });
    more.hidden = matching.length <= LIMIT;
    more.textContent = expanded ? 'Show less' : 'Show more';
    bar.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tag === active)));
    block.productCardsUpdate?.();
  };
  ['', ...labels].forEach((tag) => {
    const n = tag ? items.filter((li) => tagsOf(li).includes(tag)).length : items.length;
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.tag = tag;
    b.textContent = `${tag || 'All'} (${n})`;
    b.addEventListener('click', () => { active = tag; expanded = false; apply(); });
    bar.append(b);
  });
  more.addEventListener('click', () => { expanded = !expanded; apply(); });
  block.prepend(bar);
  block.append(more);
  apply();
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    const cells = [...row.children];
    cells.forEach((cell) => {
      if (cell.querySelector('picture') && !cell.textContent.trim()) {
        cell.className = 'product-cards-image';
        li.append(cell);
      } else if (cell.querySelector('h2, h3, h4, p > a, p') && cell.children.length > 1) {
        cell.className = 'product-cards-body';
        group(cell);
        li.append(cell);
      } else if (cell.textContent.trim()) {
        li.dataset.tags = cell.textContent.trim();
        cell.className = 'product-cards-tags';
        cell.hidden = true;
        li.append(cell);
      }
    });
    ul.append(li);
  });
  ul.querySelectorAll('.product-cards-image picture > img').forEach((img) => {
    const pic = createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]);
    moveInstrumentation(img, pic.querySelector('img'));
    img.closest('picture').replaceWith(pic);
  });
  block.replaceChildren(ul);
  // grid: a plain grid at every width (no swipe carousel / pager)
  if (!block.classList.contains('grid')) block.productCardsUpdate = buildPager(block, ul);
  if (block.classList.contains('filter')) buildFilter(block, ul);
}
