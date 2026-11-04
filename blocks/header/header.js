import { getMetadata, loadCSS } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import initNav from './nav-behavior.js';
import initCompass from './compass-behavior.js';
import initMxHeader from './mx-behavior.js';
import { compassHeaderHtml, parseCompassNav } from './compass.js';

const icon = (name) => `${window.hlx.codeBasePath}/icons/${name}.svg`;
const el = (tag, attrs = {}, ...children) => {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  e.append(...children);
  return e;
};
const isExternal = (a) => {
  try {
    const { hostname } = new URL(a.href);
    return hostname !== window.location.hostname && hostname !== 'www.scotiabank.com';
  } catch { return false; }
};
const EXTERNAL_SVG = '<svg width="14" height="14" viewBox="0 0 14 14" class="nav-external" aria-hidden="true"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(1 1)" stroke="#333" stroke-width="1.5"><path d="M10 6.667v4C10 11.403 9.403 12 8.667 12H1.333C.597 12 0 11.403 0 10.667V3.333C0 2.597.597 2 1.333 2h4"/><polyline points="8 0 12 0 12 4"/><path d="M4.667 7.333L12 0"/></g></g></svg>';
const CHEVRON_SVG = '<svg class="nav-lang-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" d="M21.333 7.33L12 16.664 2.666 7.33"/></svg>';

/** clone without UE instrumentation (the drawer duplicates authored links) */
const cleanClone = (node) => {
  const c = node.cloneNode(true);
  [c, ...c.querySelectorAll('*')].forEach((n) => [...n.attributes].forEach((a) => {
    if (a.name.startsWith('data-aue-') || a.name.startsWith('data-richtext-')) n.removeAttribute(a.name);
  }));
  return c;
};

function buildTopbar(segmentsSection, languageSection) {
  const container = el('div', { class: 'nav-container' });
  const segments = segmentsSection?.querySelector('ul');
  if (segments) {
    segments.classList.add('nav-segments');
    container.append(segments);
  }
  const right = el('div', { class: 'nav-topbar-right' });
  const more = segmentsSection?.querySelector('p a');
  if (more) {
    more.classList.add('nav-more');
    right.append(more.closest('p') || more);
  }
  const langList = languageSection?.querySelector('ul');
  if (langList) {
    const items = [...langList.querySelectorAll('a')];
    const currentLang = items[0];
    const lang = el('div', { class: 'nav-lang' });
    const toggle = el('button', {
      type: 'button', class: 'nav-lang-toggle', 'aria-haspopup': 'true', 'aria-expanded': 'false',
    });
    toggle.innerHTML = `<span class="nav-sr-only">Select language: </span>${currentLang?.textContent.trim() || ''}${CHEVRON_SVG}`;
    langList.classList.add('nav-lang-menu');
    langList.setAttribute('role', 'menu');
    langList.querySelectorAll('li').forEach((li) => li.setAttribute('role', 'none'));
    items.forEach((a, i) => {
      a.setAttribute('role', 'menuitem');
      a.innerHTML = `<span>${a.textContent.trim()}</span>`;
      if (i === 0) {
        a.classList.add('selected');
        a.setAttribute('aria-current', 'true');
        a.insertAdjacentHTML('beforeend', `<span class="nav-sr-only">selected</span><img class="nav-lang-check" src="${icon('check')}" alt="" width="13" height="13">`);
      }
    });
    lang.append(toggle, langList);
    right.append(lang);
  }
  container.append(right);
  return el('div', { class: 'nav-topbar' }, container);
}

function buildSearch(trendingSection) {
  const box = el('div', { class: 'nav-search-box' });
  const form = el('form', { class: 'nav-search', role: 'search', autocomplete: 'off' });
  form.innerHTML = '<label for="nav-search-input" class="nav-sr-only">Begin Your Search</label>'
    + '<input type="search" id="nav-search-input" name="q" placeholder="Begin Your Search" aria-controls="nav-trending">'
    + `<button type="submit" class="nav-search-submit"><img src="${icon('search')}" alt="Search" width="20" height="20"></button>`;
  box.append(form);
  if (trendingSection) {
    const panel = el('div', { class: 'nav-trending', id: 'nav-trending' });
    const title = trendingSection.querySelector('p');
    title?.classList.add('nav-trending-title');
    const list = trendingSection.querySelector('ul');
    list?.querySelectorAll('a').forEach((a) => { a.innerHTML = `<span>${a.textContent.trim()}</span>`; });
    panel.append(...[title, list].filter(Boolean));
    box.append(panel);
  }
  return box;
}

function decorateTools(toolsSection) {
  const list = toolsSection?.querySelector('ul');
  if (!list) return null;
  list.classList.add('nav-cta');
  list.querySelectorAll('a').forEach((a) => {
    const label = el('span', { class: 'nav-cta-label' });
    [...a.childNodes].filter((n) => !(n.nodeType === 1 && n.classList.contains('icon'))).forEach((n) => label.append(n));
    label.textContent = label.textContent.trim();
    a.append(label);
    a.setAttribute('aria-label', label.textContent);
    const iconSpan = a.querySelector('.icon');
    const name = [...(iconSpan?.classList || [])].find((c) => c.startsWith('icon-'))?.substring(5);
    if (name) iconSpan.style.setProperty('--nav-icon', `url("${icon(name)}")`);
  });
  return list;
}

function decorateSignin(signinSection) {
  if (!signinSection) return null;
  signinSection.className = 'nav-signin';
  const a = signinSection.querySelector('a');
  if (a) {
    a.classList.add('signin-button');
    a.classList.remove('button');
    a.closest('.button-container')?.classList.remove('button-container');
    a.prepend(
      el('img', {
        class: 'lock-white', src: icon('lock-white'), alt: '', width: 21, height: 21,
      }),
      el('img', {
        class: 'lock-red', src: icon('lock-red'), alt: '', width: 21, height: 21,
      }),
    );
  }
  const msg = [...signinSection.querySelectorAll('p')].find((p) => !p.contains(a));
  msg?.classList.add('nav-signin-msg');
  return signinSection;
}

/** mega-menu: category > section title > links; the last child without a list is "View All" */
function decorateMenu(menuSection) {
  const ul = menuSection?.querySelector('ul');
  if (!ul) return [];
  menuSection.className = 'nav-menu';
  menuSection.replaceChildren(ul);
  const categories = [];
  [...ul.children].forEach((li, i) => {
    const link = li.querySelector(':scope > a');
    const sections = li.querySelector(':scope > ul');
    if (!link || !sections) return;
    const id = `nav-dd-${i + 1}`;
    const dropdown = el('div', { class: 'nav-dropdown', id });
    sections.classList.add('nav-dd-sections');
    const cat = {
      li, link, label: link.textContent.trim(), href: link.href, sections: [], viewall: null,
    };
    [...sections.children].forEach((sec) => {
      const links = sec.querySelector(':scope > ul');
      if (!links) {
        const va = sec.querySelector('a');
        if (va) {
          va.classList.add('nav-dd-viewall');
          cat.viewall = va;
        }
        sec.remove();
        return;
      }
      const title = el('p', { class: 'nav-dd-title' });
      [...sec.childNodes].filter((n) => n !== links).forEach((n) => title.append(n));
      title.textContent = title.textContent.trim();
      links.classList.add('nav-dd-links');
      links.querySelectorAll('a').forEach((a) => {
        a.innerHTML = `<span>${a.innerHTML.trim()}</span>`;
        if (isExternal(a)) {
          a.target = '_blank';
          a.rel = 'noopener';
          a.insertAdjacentHTML('beforeend', EXTERNAL_SVG);
        }
      });
      sec.prepend(title);
      cat.sections.push({ title: title.textContent, links: [...links.querySelectorAll('a')] });
    });
    dropdown.append(sections);
    if (cat.viewall) dropdown.append(cat.viewall);
    li.append(dropdown);
    li.classList.add('has-dropdown');
    link.setAttribute('aria-haspopup', 'true');
    link.setAttribute('aria-expanded', 'false');
    link.setAttribute('aria-controls', id);
    categories.push(cat);
  });

  return categories;
}

/** prod-like mobile/tablet drawer ("mav"): root list > category panel > section panel */
const DISMISS_SVG = '<svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 5.5l5 5m0-5l-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

function buildDrawer(categories, {
  segments, more, langLinks, tools, trending,
}) {
  const drawer = el('div', {
    class: 'nav-drawer', id: 'nav-drawer', role: 'dialog', 'aria-label': 'Menu', 'aria-hidden': 'true',
  });
  const search = el('form', { class: 'nav-drawer-search', role: 'search' });
  search.innerHTML = '<label for="nav-drawer-search-input" class="nav-sr-only">Search</label>'
    + '<input type="text" id="nav-drawer-search-input" name="q" placeholder="Begin Your Search">'
    + `<button type="submit"><img src="${icon('search')}" alt="Search"></button>`;
  // mobile search focus: prod shows the trending searches sheet over the drawer
  const sheet = el('div', { class: 'nav-drawer-trending' });
  if (trending) {
    const panel = el('div', { class: 'nav-drawer-trending-panel' });
    const head = el('div', { class: 'nav-drawer-trending-head' });
    const title = trending.querySelector('.nav-trending-title');
    head.append(el('span', { class: 'nav-drawer-trending-title' }, title?.textContent.trim() || ''));
    const dismiss = el('button', { type: 'button', class: 'nav-drawer-dismiss' });
    dismiss.innerHTML = `<span>Dismiss</span>${DISMISS_SVG}`;
    head.append(dismiss);
    panel.append(head);
    const list = trending.querySelector('ul');
    if (list) panel.append(cleanClone(list));
    sheet.append(panel);
  }
  const wrapper = el('div', { class: 'nav-drawer-wrapper' });
  const panels = [];
  // panel buttons point to their target panel (aria-controls), bound by initNav
  const button = (label, cls, target) => el('button', { type: 'button', class: cls, 'aria-controls': target }, label);
  const li = (...c) => el('li', {}, ...c);

  const root = el('div', { class: 'nav-drawer-panel active', id: 'nav-drawer-root' });
  const rootList = el('ul');
  root.append(rootList);
  panels.push(root);
  categories.forEach((cat, i) => {
    const catId = `nav-drawer-${i + 1}`;
    const catPanel = el('div', { class: 'nav-drawer-panel', id: catId });
    const catList = el('ul');
    catPanel.append(catList);
    panels.push(catPanel);
    catList.append(li(button('Back to main menu', 'nav-drawer-back', root.id)));
    if (cat.viewall) {
      const va = el('a', { href: cat.viewall.href }, 'View all');
      catList.append(li(va));
    }
    cat.sections.forEach((sec, j) => {
      const secPanel = el('div', { class: 'nav-drawer-panel', id: `${catId}-${j + 1}` });
      const secList = el('ul');
      secPanel.append(secList);
      panels.push(secPanel);
      secList.append(li(button('Back', 'nav-drawer-back', catId)));
      sec.links.forEach((a) => {
        const c = cleanClone(a);
        c.querySelector('.nav-external')?.remove();
        c.textContent = c.textContent.trim();
        secList.append(li(c));
      });
      catList.append(li(button(sec.title, 'nav-drawer-toggle', secPanel.id)));
    });
    rootList.append(li(button(cat.label, 'nav-drawer-toggle', catId)));
  });

  const select = (id, label, options) => {
    const box = el('div', { class: 'nav-drawer-extra' });
    const lab = el('label', { for: id }, label);
    const sel = el('select', { id });
    options.forEach(([text, href, selected]) => {
      const o = el('option', { value: href }, text);
      if (selected) o.selected = true;
      sel.append(o);
    });
    box.append(lab, el('div', {}, sel));
    return box;
  };
  const option = (a, selected) => [a.textContent.trim(), a.href, selected];
  if (langLinks.length) {
    root.append(select('nav-drawer-lang', 'Language', langLinks.map((a, i) => option(a, i === 0))));
  }
  if (segments.length) {
    root.append(select('nav-drawer-sites', 'Scotiabank Sites', segments.map((a) => option(a, false))));
  }
  if (more) {
    const box = el('div', { class: 'nav-drawer-extra' });
    box.append(el('div', {}, el('a', { href: more.href }, more.textContent.trim())));
    root.append(box);
  }
  const content = el('div', { class: 'nav-drawer-content' }, ...panels);
  wrapper.append(content);

  const quick = el('ul', { class: 'nav-drawer-quick' });
  // prod drawer quick links: Contact Us + Offers (the tools list without Location)
  tools.slice(1).forEach((a) => {
    const c = cleanClone(a);
    quick.append(li(c));
  });
  drawer.append(search, sheet, wrapper, quick);
  return drawer;
}

/**
 * Fallback nav built from the EDS nav fragment (page). The fragment has seven sections, in order:
 *   0 brand (desktop + mobile logo)   1 segment links + More Sites   2 language links
 *   3 tools (Location / Contact / Offers)   4 sign in   5 main menu (mega-menu)
 *   6 trending searches
 */
async function buildNav(navPath) {
  const fragment = await loadFragment(navPath);
  if (!fragment) return null;
  // compass nav document (first section style "compass-header"): new scotiabank.com design
  if (fragment.querySelector(':scope > .section.compass-header')) {
    const box = el('div');
    box.innerHTML = compassHeaderHtml(parseCompassNav(fragment));
    return box.firstElementChild;
  }
  const nav = el('nav', { id: 'nav', 'aria-label': 'Main' });
  const [
    brand, segmentsSection, languageSection, toolsSection,
    signinSection, menuSection, trendingSection,
  ] = [...fragment.children];

  const ext = window.location.pathname.endsWith('.html') ? '.html' : '';
  const logo = el('a', {
    class: 'nav-logo', href: `${navPath.replace(/\/nav$/, '')}/personal${ext}`, 'aria-label': 'Scotiabank',
  });
  [...(brand?.querySelectorAll('picture') || [])].forEach((pic, i) => {
    pic.classList.add(i === 0 ? 'logo-desktop' : 'logo-mobile');
    logo.append(pic);
  });

  const topbar = buildTopbar(segmentsSection, languageSection);
  const searchBox = buildSearch(trendingSection);
  const tools = decorateTools(toolsSection);
  const signin = decorateSignin(signinSection);
  const categories = decorateMenu(menuSection);

  const hamburger = el('div', { class: 'nav-hamburger' });
  hamburger.innerHTML = '<button type="button" aria-controls="nav-drawer" aria-expanded="false" aria-label="Menu"><span></span></button>';

  const mainbarItems = [logo, searchBox, tools, signin, hamburger].filter(Boolean);
  const mainbar = el('div', { class: 'nav-mainbar' }, el('div', { class: 'nav-container' }, ...mainbarItems));
  const menubar = el('div', { class: 'nav-menubar' }, el('div', { class: 'nav-container' }, ...[menuSection].filter(Boolean)));

  const drawer = buildDrawer(categories, {
    segments: [...topbar.querySelectorAll('.nav-segments a')],
    more: topbar.querySelector('.nav-more'),
    langLinks: [...topbar.querySelectorAll('.nav-lang-menu a')],
    tools: [...(tools?.querySelectorAll('a') || [])],
    trending: searchBox.querySelector('.nav-trending'),
  });
  const overlay = el('div', { class: 'nav-overlay' });

  nav.append(topbar, mainbar, menubar, overlay, drawer);
  return el('div', { class: 'nav-wrapper' }, nav);
}

/**
 * Server-rendered header of an AEM Experience Fragment (scotia/components/header): the
 * `.nav-wrapper` (classic), `.compass` (compass variant) or `.mx-header` (Scotiabank Mexico) of
 * the XF variation content.
 */
async function loadExperienceFragment(path) {
  try {
    const resp = await fetch(`${path.replace(/\.html$/, '')}.content.html?wcmmode=disabled`);
    if (!resp.ok) return null;
    const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
    const wrapper = doc.querySelector('.nav-wrapper, .compass, .mx-header');
    return wrapper ? document.adoptNode(wrapper) : null;
  } catch {
    return null;
  }
}

/**
 * Scotiabank header: the header Experience Fragment (AEM header component) set in the `nav`
 * metadata; falls back to an EDS nav fragment page. Markup already server-rendered in the block
 * (template structure) is only bound.
 */
export default async function decorate(block) {
  let nav = block.querySelector('nav#nav, .compass, .mx-header');
  if (!nav) {
    const navMeta = getMetadata('nav');
    // Default to a nav fragment in the current content directory so the site works both
    // root-served on Edge (/ca/en/nav) and subtree-served on AEM (/content/scotia/ca/en/nav).
    const navPath = navMeta
      ? new URL(navMeta, window.location).pathname
      : `${window.location.pathname.replace(/\/[^/]*$/, '')}/nav`;
    const navWrapper = (navPath.includes('/experience-fragments/') && await loadExperienceFragment(navPath))
      || await buildNav(navPath);
    block.textContent = '';
    if (!navWrapper) return;
    block.append(navWrapper);
    nav = navWrapper.matches('.compass, .mx-header') ? navWrapper : navWrapper.querySelector('nav#nav');
  }
  if (nav.matches('.mx-header')) {
    await loadCSS(`${window.hlx.codeBasePath}/blocks/header/header-mx.css`);
    initMxHeader(nav);
  } else if (nav.matches('.compass')) {
    await loadCSS(`${window.hlx.codeBasePath}/blocks/header/header-compass.css`);
    initCompass(nav);
  } else {
    initNav(nav);
  }
}
