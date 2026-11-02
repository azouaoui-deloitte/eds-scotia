import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// prod (bootstrap) breakpoints: < 768 mobile, 768-991 tablet, >= 992 desktop (>= 1200 wide)
const isDesktop = window.matchMedia('(min-width: 992px)');
const isMobile = window.matchMedia('(max-width: 767px)');

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

const lastSegment = (href) => {
  try { return new URL(href, window.location).pathname.replace(/\/$/, '').split('/').pop().replace(/\.html$/, ''); } catch { return ''; }
};

function buildTopbar(segmentsSection, languageSection) {
  const container = el('div', { class: 'nav-container' });
  const segments = segmentsSection?.querySelector('ul');
  const current = lastSegment(window.location.pathname);
  if (segments) {
    segments.classList.add('nav-segments');
    segments.querySelectorAll('a').forEach((a) => {
      if (lastSegment(a.href) === current) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    });
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
      if (i === 0) {
        a.classList.add('selected');
        a.setAttribute('aria-current', 'true');
      }
    });
    const setOpen = (open) => {
      lang.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    toggle.addEventListener('click', () => setOpen(!lang.classList.contains('open')));
    lang.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lang.classList.contains('open')) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener('click', (e) => { if (!lang.contains(e.target)) setOpen(false); });
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
  const submit = (q) => {
    window.location.href = `https://www.scotiabank.com/ca/en/search-results.html${q ? `?q=${encodeURIComponent(q)}` : ''}`;
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submit(form.querySelector('input').value.trim());
  });
  box.append(form);
  if (trendingSection) {
    const panel = el('div', { class: 'nav-trending', id: 'nav-trending' });
    const title = trendingSection.querySelector('p');
    title?.classList.add('nav-trending-title');
    const list = trendingSection.querySelector('ul');
    panel.append(...[title, list].filter(Boolean));
    box.append(panel);
    const input = form.querySelector('input');
    const setOpen = (open) => box.classList.toggle('open', open);
    input.addEventListener('focus', () => setOpen(true));
    box.addEventListener('focusout', (e) => { if (!box.contains(e.relatedTarget)) setOpen(false); });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { setOpen(false); input.blur(); }
    });
    document.addEventListener('mousedown', (e) => { if (!box.contains(e.target)) setOpen(false); });
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

  const close = (cat) => {
    cat.li.classList.remove('open');
    cat.link.setAttribute('aria-expanded', 'false');
  };
  const open = (cat) => {
    categories.filter((c) => c !== cat).forEach(close);
    cat.li.classList.add('open');
    cat.link.setAttribute('aria-expanded', 'true');
  };
  categories.forEach((cat) => {
    cat.li.addEventListener('mouseenter', () => { if (isDesktop.matches) open(cat); });
    cat.li.addEventListener('mouseleave', () => { if (isDesktop.matches) close(cat); });
    // keyboard: Enter follows the link (as prod), Space / ArrowDown opens the panel, Escape closes
    cat.link.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        open(cat);
        cat.li.querySelector('.nav-dropdown a')?.focus();
      }
    });
    cat.li.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && cat.li.classList.contains('open')) {
        close(cat);
        cat.link.focus();
      }
    });
    cat.li.addEventListener('focusout', (e) => { if (!cat.li.contains(e.relatedTarget)) close(cat); });
  });
  return categories;
}

/** prod-like mobile/tablet drawer ("mav"): root list > category panel > section panel */
function buildDrawer(categories, {
  segments, more, langLinks, tools,
}) {
  const drawer = el('div', {
    class: 'nav-drawer', id: 'nav-drawer', role: 'dialog', 'aria-label': 'Menu', 'aria-hidden': 'true',
  });
  const search = el('form', { class: 'nav-drawer-search', role: 'search' });
  search.innerHTML = '<label for="nav-drawer-search-input" class="nav-sr-only">Search</label>'
    + '<input type="text" id="nav-drawer-search-input" name="q" placeholder="Begin Your Search">'
    + `<button type="submit"><img src="${icon('search')}" alt="Search"></button>`;
  search.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = search.querySelector('input').value.trim();
    window.location.href = `https://www.scotiabank.com/ca/en/search-results.html${q ? `?q=${encodeURIComponent(q)}` : ''}`;
  });
  const wrapper = el('div', { class: 'nav-drawer-wrapper' });
  const panels = [];
  const show = (panel) => {
    panels.forEach((p) => p.classList.toggle('active', p === panel));
    wrapper.scrollTop = 0;
    panel.querySelector('a, button, select')?.focus({ preventScroll: true });
  };
  const button = (label, cls, onClick) => {
    const b = el('button', { type: 'button', class: cls }, label);
    b.addEventListener('click', onClick);
    return b;
  };
  const li = (...c) => el('li', {}, ...c);

  const root = el('div', { class: 'nav-drawer-panel active' });
  const rootList = el('ul');
  root.append(rootList);
  panels.push(root);
  categories.forEach((cat) => {
    const catPanel = el('div', { class: 'nav-drawer-panel' });
    const catList = el('ul');
    catPanel.append(catList);
    panels.push(catPanel);
    catList.append(li(button('Back to main menu', 'nav-drawer-back', () => show(root))));
    if (cat.viewall) {
      const va = el('a', { href: cat.viewall.href }, 'View all');
      catList.append(li(va));
    }
    cat.sections.forEach((sec) => {
      const secPanel = el('div', { class: 'nav-drawer-panel' });
      const secList = el('ul');
      secPanel.append(secList);
      panels.push(secPanel);
      secList.append(li(button('Back', 'nav-drawer-back', () => show(catPanel))));
      sec.links.forEach((a) => {
        const c = cleanClone(a);
        c.querySelector('.nav-external')?.remove();
        c.textContent = c.textContent.trim();
        secList.append(li(c));
      });
      catList.append(li(button(sec.title, 'nav-drawer-toggle', () => show(secPanel))));
    });
    rootList.append(li(button(cat.label, 'nav-drawer-toggle', () => show(catPanel))));
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
    sel.addEventListener('change', () => { window.location.href = sel.value; });
    box.append(lab, el('div', {}, sel));
    return box;
  };
  const option = (a, selected) => [a.textContent.trim(), a.href, selected];
  if (langLinks.length) {
    root.append(select('nav-drawer-lang', 'Language', langLinks.map((a, i) => option(a, i === 0))));
  }
  if (segments.length) {
    const sites = segments.map((a) => option(a, a.classList.contains('active')));
    root.append(select('nav-drawer-sites', 'Scotiabank Sites', sites));
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
  drawer.append(search, wrapper, quick);
  drawer.resetPanels = () => show(root);
  return drawer;
}

/**
 * Scotiabank header. The nav fragment has seven sections, in order:
 *   0 brand (desktop + mobile logo)   1 segment links + More Sites   2 language links
 *   3 tools (Location / Contact / Offers)   4 sign in   5 main menu (mega-menu)
 *   6 trending searches
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
  const nav = el('nav', { id: 'nav', 'aria-label': 'Main' });
  const [
    brand, segmentsSection, languageSection, toolsSection,
    signinSection, menuSection, trendingSection,
  ] = [...fragment.children];

  // logo
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
  });
  const overlay = el('div', { class: 'nav-overlay' });

  const toggleButton = hamburger.querySelector('button');
  const setDrawer = (open) => {
    nav.classList.toggle('drawer-open', open);
    toggleButton.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggleButton.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('nav-drawer-open', open);
    if (open) drawer.resetPanels();
    else toggleButton.focus({ preventScroll: true });
  };
  toggleButton.addEventListener('click', () => setDrawer(!nav.classList.contains('drawer-open')));
  overlay.addEventListener('click', () => setDrawer(false));
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('drawer-open')) setDrawer(false);
  });
  isDesktop.addEventListener('change', () => { if (isDesktop.matches) setDrawer(false); });
  isMobile.addEventListener('change', () => drawer.resetPanels());

  nav.append(topbar, mainbar, menubar, overlay, drawer);
  const navWrapper = el('div', { class: 'nav-wrapper' }, nav);
  block.append(navWrapper);
}
