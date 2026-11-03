/**
 * Swipe carousel with a "‹ 1 of N ›" pager for a block's <ul> of cards (L1 pages: product cards,
 * cards.scroll). The list scrolls horizontally with scroll-snap; the pager is hidden by CSS on
 * desktop where the list becomes a grid. Pages = ceil(visible items / items per view).
 * @param {Element} block the block element (the pager is prepended to it)
 * @param {Element} ul the scrolling list
 */
export default function buildPager(block, ul) {
  const pager = document.createElement('div');
  pager.className = 'l1-pager';
  pager.innerHTML = '<button type="button" class="l1-pager-prev" aria-label="Previous"></button><span class="l1-pager-count" aria-live="polite"></span><button type="button" class="l1-pager-next" aria-label="Next"></button>';
  const [prev, count, next] = pager.children;
  const visible = () => [...ul.children].filter((li) => !li.hidden);
  const pitch = () => {
    const [a, b] = visible();
    if (!a) return 1;
    return b ? b.offsetLeft - a.offsetLeft : a.offsetWidth;
  };
  const perView = () => Math.max(1, Math.floor((ul.clientWidth + 8) / pitch()));
  const pages = () => Math.max(1, Math.ceil(visible().length / perView()));
  const current = () => Math.min(pages() - 1, Math.round(ul.scrollLeft / (pitch() * perView())));
  const update = () => {
    const n = pages();
    const c = current();
    count.innerHTML = `<b>${c + 1}</b> of ${n}`;
    prev.disabled = c === 0;
    next.disabled = c >= n - 1;
  };
  const go = (d) => ul.scrollTo({ left: (current() + d) * pitch() * perView(), behavior: 'smooth' });
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  ul.addEventListener('scroll', () => window.requestAnimationFrame(update), { passive: true });
  window.addEventListener('resize', update);
  block.prepend(pager);
  window.requestAnimationFrame(update);
  return update;
}
