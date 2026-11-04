/*
 * Compass (new scotiabank.com design, used on the credit cards pages): canonical markup of the
 * header and footer, same classes / ids as prod (Core Components markup) so that the generated
 * header-compass.css / footer-compass.css apply. The AEM header / footer components (variant
 * "compass") render the same markup server-side; this builder is used when the nav / footer is an
 * EDS document (DA). Interactions: compass-behavior.js.
 */

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');
const icon = (name) => `${window.hlx.codeBasePath}/icons/${name}.svg`;

/**
 * @param {object} d header data: extras, sites, languages, home, signin, search, categories
 * @returns {string} compass header markup (root div.compass)
 */
export function compassHeaderHtml(d) {
  const current = d.languages.find((l) => l.current) || d.languages[0] || { label: '' };
  const signin = `<div class="cmp-button--primary">
<a id="sign-in" class="cmp-button" href="${esc(d.signin.href)}">
<span class="cmp-button__text">${esc(d.signin.label)}</span>
</a>
</div>`;
  const trending = (cls) => d.search.trending.map((t) => `<a class="${cls}" tabindex="0">${esc(t)}</a>`).join('\n');
  const link = (l, cls = 'cmp-navigation__item-link') => `<a class="${cls}" href="${esc(l.href)}">${esc(l.label)}</a>`;
  const category = (c) => `<li class="cmp-navigation__item cmp-navigation__item--level-0">
<button class="cmp-navigation__item-button toggle-submenu" aria-expanded="false">
${esc(c.label)}
</button>
<div class="submenu-wrapper">
<ul class="cmp-navigation__group submenu ">
<li class="cmp-navigation__item cmp-navigation__item--current">
${link({ label: c.label, href: c.href })}
</li>
${c.sections.map((s) => `<li class="cmp-navigation__item cmp-navigation__item--level-1">
<button class="cmp-navigation__item-button toggle-submenu" aria-expanded="false">
${esc(s.title)}
</button>
<p class="cmp-navigation__item-submenu-heading">
${esc(s.title)}
</p>
<div class="submenu-wrapper">
<ul class="cmp-navigation__group submenu level-two">
<li class="cmp-navigation__item cmp-navigation__item--current">
${link({ label: s.title, href: s.href })}
</li>
${s.links.map((l) => `<li class="cmp-navigation__item cmp-navigation__item--level-2">
${link(l)}
</li>`).join('\n')}
</ul>
</div>
</li>`).join('\n')}
</ul>
</div>
</li>`;
  return `<div class="compass">
<div class="compass-header">
<div class="mobile-header">
<div class="mobile-header-content">
<div class="toggle-logo-group">
<button id="toggleMobileNav" aria-expanded="false" aria-controls="bottomNavContent">
<span></span>
<span></span>
<span></span>
<span></span>
<span class="sr-only">Navigation menu</span>
</button>
<a class="mobile-logo" href="${esc(d.home)}">
<img src="${icon('compass-logo-mobile')}" alt="Scotiabank Home Page">
</a>
</div>
<div class="mobile-util-buttons">
<button id="mobileSearchTrigger" class="cmp-button ico-mobile-search-trigger">
<span class="cmp-button__text sr-only">Search</span>
</button>
${signin}
</div>
</div>
</div>
<div id="compassHeaderContent" class="compass-header-content">
<div class="foreground foreground-hide">
</div>
<div class="top-nav">
<div class="top-nav-content">
<div class="extra">
${d.extras.map((l) => `<div class="-">
<a class="cmp-button" href="${esc(l.href)}">
<span class="cmp-button__text">${esc(l.label)}</span>
</a>
</div>`).join('\n')}
</div>
<div class="site-nav">
<button class="cmp-navigation__item-button toggle-submenu" aria-expanded="false">${esc(d.sites[d.sites.length - 1]?.label)}</button>
<nav id="site-navigation" class="cmp-navigation" role="navigation">
<ul class="cmp-navigation__group  ">
${d.sites.map((l) => `<li class="cmp-navigation__item cmp-navigation__item--level-0">
${link(l)}
</li>`).join('\n')}
</ul>
</nav>
</div>
<div class="lang-nav">
<nav id="language-selector" class="cmp-languagenavigation">
<button class="cmp-languagenavigation-button toggle-submenu" id="language-toggle" aria-haspopup="true" aria-expanded="false" aria-controls="language-menu" aria-label="Select language">${esc(current.label)}</button>
<ul class="cmp-languagenavigation__group" id="language-menu">
${d.languages.map((l) => `<li class="cmp-languagenavigation__item cmp-languagenavigation__item--langcode-${esc(l.lang)} cmp-languagenavigation__item--level-0${l === current ? ' cmp-languagenavigation__item--active' : ''}">
<a${l === current ? ' aria-current="page"' : ''} class="cmp-languagenavigation__item-link" href="${esc(l.href)}" hreflang="${esc(l.lang)}" lang="${esc(l.lang)}" rel="alternate">${esc(l.label)}</a>
</li>`).join('\n')}
</ul>
</nav>
</div>
</div>
</div>
<div class="mid-nav">
<div class="mid-nav-content">
<div class="logo">
<div id="Scotiabank-Logo" class="cmp-image">
<a class="cmp-image__link" href="${esc(d.home)}">
<picture>
<img src="${icon('compass-logo-desktop')}" loading="lazy" class="cmp-image__image" alt="" title="Scotiabank">
</picture>
</a>
</div>
</div>
<div class="util">
<div id="search" class="search search-hide">
<div class="search-content">
<div id="search-container" class="search-container">
<form id="search" class="cmp-bns-search__form" autocomplete="off">
<div class="cmp-bns-search__inner-container">
<div class="cmp-bns-search__icon-container" data-submit="">
<img class="search-icon-img" src="${icon('compass-magnifying-glass')}" alt="" aria-label="${esc(d.search.placeholder)}">
</div>
<input type="search" class="cmp-bns-search__input" placeholder="${esc(d.search.placeholder)}" id="searchInput" aria-labelledby="trendingSearchAriaAnnoucement">
<div class="cmp-bns-search__input-controls">
<div class="divider">
</div>
<button id="searchClose" class="custom-close-button" aria-label="Clear search input" type="button" style="display: none;">
<img class="close-icon-img" src="${icon('compass-img-close')}" alt="">
</button>
</div>
</div>
</form>
<div class="trending-search-container trending-hide">
<div class="trending-search-headline">
<p id="trendingSearchAriaAnnoucement" class="trending-search-announcement">trending search results below</p>
<b>${esc(d.search.trendingTitle)}</b>
</div>
${trending('list-item')}
</div>
<div id="searchModal" class="cmp-modal mobile-search-hide" tabindex="-1">
<dialog class="cmp-modal-dialog" aria-modal="true" aria-hidden="true">
<div class="cmp-modal-mobile-search">
<div class="cmp-modal-mobile-search-close">
<button id="searchModalClose" class="cmp-modal-mobile-search-close-button" aria-label="Clear search input" type="button">
<img class="close-icon-img" src="${icon('compass-img-close')}" alt="">
</button>
</div>
<form id="mobileSearch" class="cmp-modal-mobile-search-input-parent-container" autocomplete="off">
<div class="cmp-modal-mobile-search-input-container">
<div class="cmp-modal-mobile-search-icon">
<img class="search-icon-img" src="${icon('compass-magnifying-glass')}" alt="" aria-label="${esc(d.search.placeholder)}">
</div>
<input type="search" class="cmp-modal-mobile-search-input" placeholder="${esc(d.search.placeholder)}" id="header__search_mobile" aria-labelledby="trendingSearchAriaAnnoucement">
</div>
</form>
</div>
<div class="cmp-modal-mobile-search-trending">
<div class="cmp-modal-mobile-search-trending-headline">
<p class="trending-search-announcement">trending search results below</p>${esc(d.search.trendingTitle)}</div>
${trending('cmp-modal-mobile-search-trending-list-item')}
</div>
</dialog>
</div>
</div>
</div>
</div>
<div class="util-buttons">
${signin}
</div>
</div>
</div>
</div>
<div class="bottom-nav">
<div id="bottomNavContent" class="bottom-nav-content">
<nav id="mega-menu" class="cmp-navigation" role="navigation">
<ul class="cmp-navigation__group  ">
${d.categories.map(category).join('\n')}
</ul>
</nav>
</div>
</div>
</div>
</div>
</div>`;
}

/**
 * @param {object} d footer data: home, logoAlt, socialTitle, social, links, copyright
 * @returns {string} compass footer markup (root div.cmp-footer)
 */
export function compassFooterHtml(d) {
  return `<div class="cmp-footer">
<div class="cmp-footer__bottom">
<div class="cmp-footer__bottom-container">
<div class="cmp-footer__bottom-primary-logo">
<a class="cmp-image__link" href="${esc(d.home)}">
<img src="${icon('compass-footer-logo')}" alt="${esc(d.logoAlt)}">
</a>
</div>
<div class="cmp-footer__bottom-social">
<div class="cmp-footer__bottom-social-title">
<h3>${esc(d.socialTitle)}</h3>
</div>
<div class="cmp-footer__bottom-social-icons-container">
${d.social.map((s) => `<div class="cmp-footer__social-icon">
<a href="${esc(s.href)}" target="_blank" rel="noopener noreferrer">
<img src="${icon(`compass-social-${s.icon}`)}" alt="${esc(s.alt)}">
<span class="cmp-link__screen-reader-only">opens in a new tab</span>
</a>
</div>`).join('\n')}
</div>
</div>
</div>
<div class="cmp-footer__bottom-list">
<nav id="footer-links" class="cmp-navigation" role="navigation">
<ul class="cmp-navigation__group  ">
${d.links.map((l) => (l.cookieSettings ? `<li class="cmp-navigation__item">
<button class="cmp-navigation__item-link link-button">${esc(l.label)}</button>
</li>` : `<li class="cmp-navigation__item cmp-navigation__item--level-0">
<a class="cmp-navigation__item-link" href="${esc(l.href)}">${esc(l.label)}</a>
</li>`)).join('\n')}
</ul>
</nav>
</div>
</div>
<div class="cmp-footer__copyright">
<div class="cmp-footer__copyright-container">${esc(d.copyright)}</div>
</div>
</div>`;
}

const text = (n) => (n?.textContent || '').replace(/\s+/g, ' ').trim();
const links = (root) => [...(root?.querySelectorAll('a') || [])].map((a) => ({ label: text(a), href: a.getAttribute('href') }));

/**
 * EDS (DA) nav document of a compass header: sections, in order: extras, sites, languages,
 * home + sign in, search (placeholder, trending title, trending list), mega-menu
 * (category > section > links nested lists).
 * @param {Element} main the loaded fragment
 */
export function parseCompassNav(main) {
  const [extras, sites, languages, util, search, menu] = [...main.children];
  const [home, signin] = links(util);
  const [placeholder, title] = [...(search?.querySelectorAll('p') || [])].map(text);
  const item = (li) => {
    const a = li.querySelector(':scope > a, :scope > p > a');
    return { label: text(a || li.firstChild), href: a?.getAttribute('href') || '' };
  };
  return {
    extras: links(extras),
    sites: links(sites),
    languages: [...(languages?.querySelectorAll('a') || [])].map((a, i) => ({
      label: text(a), href: a.getAttribute('href'), lang: a.getAttribute('hreflang') || (i ? 'fr' : 'en'), current: i === 0,
    })),
    home: home?.href || '/',
    signin: signin || { label: 'Sign in', href: '#' },
    search: { placeholder, trendingTitle: title, trending: [...(search?.querySelectorAll('li') || [])].map(text) },
    categories: [...(menu?.querySelector('ul')?.children || [])].map((li) => ({
      ...item(li),
      sections: [...(li.querySelector(':scope > ul')?.children || [])].map((s) => {
        const sec = item(s);
        return { title: sec.label, href: sec.href, links: links(s.querySelector(':scope > ul')) };
      }),
    })),
  };
}

/**
 * EDS (DA) footer document of a compass footer: sections, in order: home link + "Follow us" +
 * social links (link text = network: youtube, facebook, instagram, x, linkedin), legal links
 * (href #cookie-settings = Cookie Settings), copyright.
 * @param {Element} main the loaded fragment
 */
export function parseCompassFooter(main) {
  const [brand, legal, copyright] = [...main.children];
  const [home, ...social] = [...(brand?.querySelectorAll('a') || [])];
  return {
    home: home?.getAttribute('href') || '/',
    logoAlt: text(home) || 'Scotia Logo',
    socialTitle: text([...(brand?.querySelectorAll('p') || [])].find((p) => !p.querySelector('a'))),
    social: social.map((a) => {
      const name = text(a).toLowerCase();
      return { icon: name, href: a.getAttribute('href'), alt: `${name === 'x' ? 'X' : name} icon` };
    }),
    links: [...(legal?.querySelectorAll('a') || [])].map((a) => ({
      label: text(a), href: a.getAttribute('href'), cookieSettings: /#cookie-settings$/.test(a.getAttribute('href') || ''),
    })),
    copyright: text(copyright),
  };
}
