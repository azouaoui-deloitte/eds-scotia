import { getMetadata, loadCSS } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import initFooter from './footer-behavior.js';
import initMxFooter from './footer-mx-behavior.js';
import { compassFooterHtml, parseCompassFooter } from '../header/compass.js';

const el = (tag, cls, ...children) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  e.append(...children);
  return e;
};

/**
 * Contact cards: each card is one authored text component (icon, bold title, text, link).
 * In plain rendering the paragraphs of all cards are flattened, so a card starts at every
 * paragraph holding an icon.
 */
function buildCards(section) {
  const wrapper = section.querySelector('.default-content-wrapper') || section;
  const cards = [];
  [...wrapper.children].forEach((child) => {
    const isGroup = child.tagName === 'DIV';
    const nodes = isGroup ? [...child.children] : [child];
    nodes.forEach((p) => {
      if (isGroup && p === nodes[0]) cards.push({ host: child, items: [] });
      else if (!isGroup && p.querySelector(':scope > .icon')) cards.push({ host: null, items: [] });
      cards[cards.length - 1]?.items.push(p);
    });
  });
  return cards.map(({ host, items }) => {
    const card = host || el('div');
    card.className = 'footer-card';
    const body = el('div', 'footer-card-body');
    items.forEach((p) => {
      const iconEl = p.querySelector(':scope > .icon');
      if (iconEl && !p.textContent.trim()) {
        iconEl.classList.add('footer-card-icon');
        body.append(iconEl);
        p.remove();
        return;
      }
      if (p.querySelector(':scope > strong') && p.textContent.trim() === p.querySelector('strong').textContent.trim()) {
        p.className = 'footer-card-title';
        p.setAttribute('role', 'heading');
        p.setAttribute('aria-level', '2');
        p.textContent = p.textContent.trim();
      } else if (p.querySelector('a')) {
        p.className = 'footer-card-link';
      } else {
        p.className = 'footer-card-text';
      }
      body.append(p);
    });
    card.append(body);
    return card;
  });
}

/**
 * Fallback footer built from the EDS footer fragment (page). The fragment has three sections:
 *   0 contact cards (question / support / advice)   1 social links   2 legal links + copyright
 */
async function buildFooter(footerPath) {
  const fragment = await loadFragment(footerPath);
  if (!fragment) return null;
  // compass footer document (first section style "compass-footer"): new scotiabank.com design
  if (fragment.querySelector(':scope > .section.compass-footer')) {
    const box = el('div');
    box.innerHTML = compassFooterHtml(parseCompassFooter(fragment));
    return box.firstElementChild;
  }
  const [contact, social, bottom] = [...fragment.children];
  const cardsRow = el('div', 'footer-container');
  if (contact) cardsRow.append(...buildCards(contact));
  const socialList = social?.querySelector('ul');
  if (socialList) {
    socialList.className = 'footer-social-list';
    socialList.querySelectorAll('a').forEach((a) => {
      a.target = '_blank';
      a.rel = 'noreferrer noopener';
      if (a.title) a.setAttribute('aria-label', a.title);
      // keep the glyph's own aspect ratio (decorateIcons sets a square 16x16 size)
      a.querySelectorAll('.icon img').forEach((img) => {
        img.removeAttribute('width');
        img.removeAttribute('height');
        img.loading = 'eager';
      });
    });
    cardsRow.append(el('div', 'footer-card footer-social', el('div', 'footer-card-body', socialList)));
  }

  const links = bottom?.querySelector('ul');
  if (links) {
    links.className = 'footer-links-list';
    // "Cookie Settings" opens the OneTrust preference centre, as on prod
    links.querySelectorAll('a[href$="#cookie-settings"]').forEach((a) => {
      const button = el('button', 'footer-cookie-settings', a.textContent.trim());
      button.type = 'button';
      a.replaceWith(button);
    });
  }
  const copyright = [...(bottom?.querySelectorAll('p') || [])].pop();

  return el(
    'div',
    'footer-inner',
    el('div', 'footer-contact', cardsRow),
    el('div', 'footer-links', el('div', 'footer-container', ...[links].filter(Boolean))),
    el('div', 'footer-copyright', el('div', 'footer-container', ...[copyright].filter(Boolean))),
  );
}

/**
 * Server-rendered footer of an AEM Experience Fragment (scotia/components/footer): the
 * `.footer-inner` (classic), `.cmp-footer` (compass) or `.mx-footer` (Scotiabank Mexico) of the
 * XF variation content.
 */
async function loadExperienceFragment(path) {
  try {
    const resp = await fetch(`${path.replace(/\.html$/, '')}.content.html?wcmmode=disabled`);
    if (!resp.ok) return null;
    const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
    const inner = doc.querySelector('.footer-inner, .cmp-footer, .mx-footer');
    return inner ? document.adoptNode(inner) : null;
  } catch {
    return null;
  }
}

/**
 * Scotiabank footer: the footer Experience Fragment (AEM footer component) set in the `footer`
 * metadata; falls back to an EDS footer fragment page. Markup already server-rendered in the
 * block (template structure) is only bound.
 */
export default async function decorate(block) {
  let inner = block.querySelector('.footer-inner, .cmp-footer, .mx-footer');
  if (!inner) {
    const footerMeta = getMetadata('footer');
    // Default to a footer fragment in the current content directory so the site works both
    // root-served on Edge (/ca/en/footer) and subtree-served on AEM (/content/scotia/ca/en/footer).
    const footerPath = footerMeta
      ? new URL(footerMeta, window.location).pathname
      : `${window.location.pathname.replace(/\/[^/]*$/, '')}/footer`;
    inner = (footerPath.includes('/experience-fragments/') && await loadExperienceFragment(footerPath))
      || await buildFooter(footerPath);
    block.textContent = '';
    if (!inner) return;
    block.append(inner);
  }
  if (inner.matches('.mx-footer')) {
    await loadCSS(`${window.hlx.codeBasePath}/blocks/footer/footer-mx.css`);
    initMxFooter(inner);
    return;
  }
  if (inner.matches('.cmp-footer')) await loadCSS(`${window.hlx.codeBasePath}/blocks/footer/footer-compass.css`);
  initFooter(inner);
}
