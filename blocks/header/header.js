import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Scotiabank header. The nav fragment has six sections, in order:
 *   0 brand (desktop + mobile logo)   1 utility links   2 language links
 *   3 tools (Location / Contact / Offers)   4 sign in   5 main menu
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  // Default to a nav fragment in the current content directory so the site works both
  // root-served on Edge (/ca/en/nav) and subtree-served on AEM (/content/scotia/ca/en/nav).
  const navPath = navMeta
    ? new URL(navMeta, window.location).pathname
    : `${window.location.pathname.replace(/\/[^/]*$/, '')}/nav`;
  const fragment = await loadFragment(navPath);

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  const sections = [...fragment.children];
  const names = ['brand', 'utility', 'language', 'tools', 'signin', 'menu'];
  sections.forEach((section, i) => {
    if (names[i]) section.classList.add(`nav-${names[i]}`);
    nav.append(section);
  });

  const brand = nav.querySelector('.nav-brand');
  const utility = nav.querySelector('.nav-utility');
  const language = nav.querySelector('.nav-language');
  const tools = nav.querySelector('.nav-tools');
  const signin = nav.querySelector('.nav-signin');
  const menu = nav.querySelector('.nav-menu');

  // mark the primary sign-in link as a button
  signin?.querySelectorAll('a').forEach((a, i) => { if (i === 0) a.classList.add('signin-button'); });

  // assemble the three header rows
  const topbar = document.createElement('div');
  topbar.className = 'nav-topbar';
  [utility, language].forEach((s) => s && topbar.append(s));

  const mainbar = document.createElement('div');
  mainbar.className = 'nav-mainbar';

  // search box (static: the scotiabank search API is cross-origin and cannot be called from EDS)
  const search = document.createElement('form');
  search.className = 'nav-search';
  search.setAttribute('role', 'search');
  search.action = 'https://www.scotiabank.com/ca/en/personal.html';
  search.innerHTML = '<input type="search" aria-label="Search" placeholder="Begin Your Search">'
    + '<button type="submit" aria-label="Search"><span class="icon icon-search"></span></button>';

  [brand, search, tools, signin].forEach((s) => s && mainbar.append(s));

  const navbar = document.createElement('div');
  navbar.className = 'nav-navbar';
  if (menu) navbar.append(menu);

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = '<button type="button" aria-controls="nav" aria-label="Open navigation">'
    + '<span class="nav-hamburger-icon"></span></button>';
  const toggle = () => {
    const expanded = nav.getAttribute('aria-expanded') === 'true';
    nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
    hamburger.querySelector('button').setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  };
  hamburger.addEventListener('click', toggle);
  window.addEventListener('keydown', (e) => { if (e.code === 'Escape' && nav.getAttribute('aria-expanded') === 'true') toggle(); });
  nav.setAttribute('aria-expanded', 'false');

  nav.replaceChildren(topbar, hamburger, mainbar, navbar);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
