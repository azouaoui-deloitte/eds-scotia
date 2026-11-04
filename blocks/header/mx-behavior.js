/**
 * Scotiabank Mexico header interactions (scotiabank.com.mx behaviour), bound on the server-rendered
 * markup of the AEM header component ("mx" design) - shared with the AEM clientlib (js/mx-header.js
 * via tools/sync-from-eds.mjs), so it must stay self-contained (no imports).
 *   - INGRESA: click toggles the sign-in dropdown (#newSignIn.newSignIn--open), Escape closes
 *   - desktop mega-menu: opens on hover (CSS); keyboard: Space / Enter on the expanded state,
 *     Escape closes, panel links are only tabbable while the panel is open (as prod)
 *   - mobile drawer: hamburger toggles #siteHeader.open; the chevron of an entry opens its level
 *     (li.open), "Regresa" goes back; segment select navigates
 *   - search: button / Enter go to the search page with ?q=
 */
export default function initMxHeader(root) {
  if (!root || root.dataset.mxBound) return;
  root.dataset.mxBound = 'true';
  const $ = (s, r = root) => r.querySelector(s);
  const $$ = (s, r = root) => [...r.querySelectorAll(s)];
  const header = $('#siteHeader');
  const menu = $('#mainMenu');
  const burger = $('#showMegaMenu');
  const signin = $('#newSignIn');
  const signinButton = $('.newSignIn-link');
  // prod WindowSize.IsDesktopSize: body at least 800px wide; stylesheets switch at 600px
  const isDesktop = () => document.body.clientWidth >= 800;
  const width = () => document.documentElement.clientWidth;

  // sign-in dropdown
  const dropDesktop = $('#divDropDownDesktop');
  const dropMobile = $('#divDropDownMobile');
  const syncDropdowns = () => {
    const wide = width() > 600;
    if (dropDesktop) dropDesktop.style.display = wide ? '' : 'none';
    if (dropMobile) dropMobile.style.display = wide ? 'none' : '';
    signinButton?.setAttribute('aria-controls', wide ? 'divDropDownDesktop' : 'divDropDownMobile');
  };
  const setSignin = (open) => {
    signin?.classList.toggle('newSignIn--open', open);
    signinButton?.setAttribute('aria-expanded', String(open));
  };
  signinButton?.addEventListener('click', () => setSignin(!signin.classList.contains('newSignIn--open')));

  // mega-menu levels (mobile drawer): prod f()
  const toggleLevel = (li) => {
    if (li.classList.contains('open')) {
      li.classList.remove('open');
      $$('.open', li).forEach((e) => e.classList.remove('open'));
      li.parentElement?.closest('.megaMenu, .megaMenuWrapper')?.classList.remove('active');
    } else {
      li.classList.add('open');
      li.closest('.megaMenu')?.classList.add('active');
      li.parentElement?.closest('.megaMenuWrapper')?.classList.add('active');
    }
    const top = li.querySelector(':scope > a, :scope > .open_menu_item');
    top?.setAttribute('aria-expanded', String(li.classList.contains('open')));
  };
  const setDrawer = (open) => {
    if (!header) return;
    if (!open) {
      header.classList.remove('open');
      $$('.active:not(.siteTabs li)', header).forEach((e) => e.classList.remove('active'));
      menu?.classList.remove('open');
      $$('.open', menu || root).forEach((e) => e.classList.remove('open'));
    } else {
      header.classList.add('open');
      burger?.classList.add('active');
      menu?.classList.add('open');
    }
    burger?.setAttribute('aria-expanded', String(open));
  };
  burger?.addEventListener('click', (e) => {
    e.preventDefault();
    setDrawer(!header.classList.contains('open'));
  });
  $$('.megaMenu li.parent > span').forEach((span) => {
    span.addEventListener('click', (e) => {
      if (isDesktop()) return;
      e.preventDefault();
      toggleLevel(span.closest('li'));
    });
    span.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        span.click();
      }
    });
  });
  $$('#mainMenu .back').forEach((back) => back.addEventListener('click', (e) => {
    e.preventDefault();
    toggleLevel(back.closest('li'));
  }));

  // desktop mega-menu keyboard / aria state (prod: .hover + Tabbable)
  const tops = $$('#mainMenu > li');
  const focusables = (li) => $$('section a, section [tabindex], section button, section input', li);
  const setPanel = (li, open) => {
    li.classList.toggle('hover', open);
    li.querySelector(':scope > a')?.setAttribute('aria-expanded', String(open));
    if (isDesktop()) focusables(li).forEach((f) => f.setAttribute('tabindex', open ? '0' : '-1'));
  };
  const syncTabbables = () => tops.forEach((li) => {
    const open = li.classList.contains('hover');
    focusables(li).forEach((f) => {
      if (isDesktop()) f.setAttribute('tabindex', open ? '0' : '-1');
      else if (f.matches('a')) f.removeAttribute('tabindex');
      else f.setAttribute('tabindex', '0');
    });
  });
  tops.forEach((li) => {
    const link = li.querySelector(':scope > a');
    li.addEventListener('mouseenter', () => { if (isDesktop()) link?.setAttribute('aria-expanded', 'true'); });
    li.addEventListener('mouseleave', () => { if (isDesktop() && !li.classList.contains('hover')) link?.setAttribute('aria-expanded', 'false'); });
    li.addEventListener('keydown', (e) => {
      if (!isDesktop()) return;
      if (e.key === ' ' || e.key === 'Spacebar') {
        if (e.target !== link) return;
        e.preventDefault();
        setPanel(li, !li.classList.contains('hover'));
        if (li.classList.contains('hover')) focusables(li)[0]?.focus();
      } else if (e.key === 'Escape' && li.classList.contains('hover')) {
        setPanel(li, false);
        link?.focus();
      } else if (e.key === 'ArrowDown' && e.target === link) {
        e.preventDefault();
        setPanel(li, true);
        focusables(li)[0]?.focus();
      }
    });
    li.addEventListener('focusout', () => {
      setTimeout(() => {
        if (!li.contains(document.activeElement)) setPanel(li, false);
      }, 0);
    });
  });

  // search
  $$('.searchForm').forEach((form) => {
    const input = $('.txtSearchQuery', form);
    const go = (q) => {
      const url = form.dataset.searchUrl;
      if (url && q) window.location.href = `${url}?q=${encodeURIComponent(q)}`;
    };
    $('.imgSearchSubmit', form)?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      go(input?.value);
    });
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        go(input.value.toLowerCase());
      }
    });
  });

  // mobile segment select
  $('#siteTabsSelect')?.addEventListener('change', (e) => {
    const opt = e.target.selectedOptions[0];
    if (opt?.dataset.href) window.open(opt.dataset.href, opt.dataset.target || '_self');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (signin?.classList.contains('newSignIn--open')) {
      setSignin(false);
      signinButton?.focus();
    } else if (header?.classList.contains('open')) {
      setDrawer(false);
      burger?.focus();
    }
  });

  let wasDesktop = isDesktop();
  syncDropdowns();
  syncTabbables();
  window.addEventListener('resize', () => {
    syncDropdowns();
    if (isDesktop() !== wasDesktop) {
      wasDesktop = isDesktop();
      syncTabbables();
    }
  });
}
