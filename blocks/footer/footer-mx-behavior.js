/**
 * Scotiabank Mexico footer interactions (scotiabank.com.mx behaviour), bound on the server-rendered
 * markup of the AEM footer component ("mx" design) - shared with the AEM clientlib (js/mx-footer.js
 * via tools/sync-from-eds.mjs), so it must stay self-contained (no imports).
 *   - back to top: shown once scrolled past half the viewport, scrolls the page to the top
 *   - leaving-the-site confirmation: legal links flagged "interstitial" (CONDUSEF, IPAB) and the
 *     column links to *.gob.mx (Educa tu Cartera, with image) ask before opening in a new tab
 */
export default function initMxFooter(root) {
  if (!root || root.dataset.mxBound) return;
  root.dataset.mxBound = 'true';
  const top = root.querySelector('.backToTop');
  if (top) {
    const sync = () => top.classList.toggle('active', window.scrollY > window.innerHeight / 2);
    window.addEventListener('scroll', sync, { passive: true });
    sync();
    top.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const popups = {
    plain: root.querySelector('.popup-intersticial[data-popup="plain"]'),
    image: root.querySelector('.popup-intersticial[data-popup="image"]'),
  };
  let current = null;
  let opener = null;
  const close = () => {
    if (!current) return;
    current.popup.style.display = 'none';
    current = null;
    opener?.focus();
  };
  const open = (popup, url, link) => {
    if (!popup) return false;
    current = { popup, url };
    opener = link;
    popup.style.display = 'block';
    popup.querySelector('.salir')?.focus();
    return true;
  };
  const gob = (a) => {
    try { return /(^|\.)gob\.mx$/.test(new URL(a.href).hostname); } catch { return false; }
  };
  root.querySelectorAll('a.link-intersticial, .new-footer a').forEach((a) => {
    const kind = a.classList.contains('link-intersticial') ? 'plain' : (gob(a) && 'image');
    if (!kind) return;
    a.addEventListener('click', (e) => {
      if (open(popups[kind] || popups.plain, a.href, a)) e.preventDefault();
    });
  });
  Object.values(popups).filter(Boolean).forEach((popup) => {
    popup.querySelector('.salir')?.addEventListener('click', (e) => {
      e.preventDefault();
      const url = current?.url;
      close();
      if (url) window.open(url);
    });
    popup.querySelector('.cancelar')?.addEventListener('click', (e) => {
      e.preventDefault();
      close();
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}
