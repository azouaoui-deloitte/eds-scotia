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

  // Expandable search. The scotiabank search API is cross-origin and cannot be queried from
  // Edge Delivery, so submitting redirects to the scotiabank.com search results page.
  const search = document.createElement('form');
  search.className = 'nav-search';
  search.setAttribute('role', 'search');
  search.innerHTML = '<input type="search" name="q" aria-label="Search scotiabank.com" placeholder="Begin Your Search">'
    + '<button type="submit" class="nav-search-submit" aria-label="Search"><span class="icon icon-search"></span></button>'
    + '<button type="button" class="nav-search-close" aria-label="Close search">&times;</button>';
  search.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = encodeURIComponent(search.querySelector('input').value.trim());
    window.location.href = `https://www.scotiabank.com/ca/en/search-results.html${q ? `?q=${q}` : ''}`;
  });
  // toggle button shown when the search is collapsed (mobile / compact)
  const searchToggle = document.createElement('button');
  searchToggle.type = 'button';
  searchToggle.className = 'nav-search-toggle';
  searchToggle.setAttribute('aria-label', 'Open search');
  searchToggle.innerHTML = '<span class="icon icon-search"></span>';
  const setSearch = (openState) => {
    search.classList.toggle('open', openState);
    searchToggle.setAttribute('aria-expanded', openState ? 'true' : 'false');
    if (openState) search.querySelector('input').focus();
  };
  searchToggle.addEventListener('click', () => setSearch(!search.classList.contains('open')));
  search.querySelector('.nav-search-close').addEventListener('click', () => setSearch(false));

  [brand, searchToggle, search, tools, signin].forEach((s) => s && mainbar.append(s));

  const navbar = document.createElement('div');
  navbar.className = 'nav-navbar';
  if (menu) navbar.append(menu);

  // Mega-menu: each top-level category link that has a nested <ul> gets a dropdown panel,
  // opened on hover (desktop) and click/Enter (all viewports). Content stays UE-editable
  // because it is authored in the nav fragment.
  const topItems = menu ? [...menu.querySelectorAll('ul > li')].filter((li) => li.querySelector(':scope > ul')) : [];
  const closeAllMenus = () => topItems.forEach((li) => li.classList.remove('open'));
  topItems.forEach((li) => {
    li.classList.add('has-submenu');
    const link = li.querySelector(':scope > a');
    const submenu = li.querySelector(':scope > ul');
    submenu.classList.add('nav-submenu');
    link?.setAttribute('aria-haspopup', 'true');
    link?.setAttribute('aria-expanded', 'false');
    const open = (state) => {
      closeAllMenus();
      if (state) li.classList.add('open');
      link?.setAttribute('aria-expanded', state ? 'true' : 'false');
    };
    link?.addEventListener('click', (e) => {
      // On desktop let hover drive it but still allow click to pin; prevent navigation
      // only when opening the panel (first click), navigate on the category page via arrow.
      if (!li.classList.contains('open')) { e.preventDefault(); open(true); } else open(false);
    });
    li.addEventListener('mouseenter', () => { if (isDesktop.matches) open(true); });
    li.addEventListener('mouseleave', () => { if (isDesktop.matches) open(false); });
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.nav-navbar')) closeAllMenus(); });

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
