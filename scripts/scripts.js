import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  decorateBlock,
  loadBlock,
} from './aem.js';

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * Returns the site root to prefix content paths with: empty on aem.page / aem.live,
 * the AEM site path (e.g. `/content/latamib`) when rendered by AEM author (Universal Editor).
 * @returns {string}
 */
export function getContentRoot() {
  const match = window.location.pathname.match(/^\/content\/[^/.]+(?=[/.])/);
  return match ? match[0] : '';
}

/**
 * Header / footer Experience Fragment variation rendered on its own, e.g.
 * /content/experience-fragments/scotia/ca/en/site/header/master.html
 * @returns {string} 'header', 'footer' or '' (regular page)
 */
function getFragmentPreview() {
  const match = window.location.pathname.match(/^\/content\/experience-fragments\/.+\/(header|footer)\/[^/]+$/);
  return match ? match[1] : '';
}

let experienceFragmentBlocks = [];

/**
 * Header / footer Experience Fragment components (the locked XFs of the template structure)
 * inline the raw fragment sections: render them through the header / footer block instead.
 * @param {Element} main The main element
 * @returns {Element[]} the header / footer blocks to load
 */
function decorateExperienceFragments(main) {
  return [...main.querySelectorAll('.cmp-experiencefragment')].map((xf) => {
    const kind = ['header', 'footer'].find((k) => xf.classList.contains(`cmp-experiencefragment--${k}`));
    const root = xf.querySelector('[data-aue-resource$="/jcr:content/root"]');
    const path = (root?.dataset.aueResource || '').replace(/^urn:aemconnection:/, '').replace(/\/jcr:content\/root$/, '');
    if (!kind || !path) return null;
    const meta = document.createElement('meta');
    meta.name = kind === 'header' ? 'nav' : 'footer';
    meta.content = path;
    document.head.append(meta);
    const block = document.createElement('div');
    block.className = kind;
    const wrapper = document.createElement(kind);
    wrapper.append(block);
    xf.replaceChildren(wrapper);
    document.documentElement.dataset.experienceFragments = 'true';
    return block;
  }).filter(Boolean);
}

const UE_CANVAS = 'https://experience.adobe.com/#/@deloitte-digitalengage/aem/editor/canvas/';

/**
 * xwalk content has no classic authoring UI: when loaded in the classic page editor
 * (/editor.html/content/...), open the page in the Universal Editor instead.
 */
function redirectClassicEditor() {
  try {
    const top = window.top.location;
    if (window.top === window || !top.pathname.startsWith('/editor.html/content/')) return;
    const connection = document.querySelector('meta[name="urn:adobe:aue:system:aemconnection"]')?.content || '';
    const host = connection.replace(/^xwalk:https?:\/\//, '');
    if (host) top.href = `${UE_CANVAS}${host}${top.pathname.substring('/editor.html'.length)}`;
  } catch { /* cross-origin parent, e.g. the Universal Editor canvas */ }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
  try {
    // TODO: add auto block, if needed
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
export function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  redirectClassicEditor();
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  const preview = getFragmentPreview();
  if (preview && main) {
    // render the fragment through its own header / footer block (styled as on every page);
    // the instrumented sections stay in the DOM for the Universal Editor content tree
    const meta = doc.createElement('meta');
    meta.name = preview === 'header' ? 'nav' : 'footer';
    meta.content = window.location.pathname;
    doc.head.append(meta);
    doc.body.classList.add('fragment-preview');
    main.style.display = 'none';
    const unused = doc.querySelector(preview === 'header' ? 'footer' : 'header');
    if (unused) unused.style.display = 'none';
    ['patch', 'update', 'add', 'move', 'remove', 'copy'].forEach((type) => {
      doc.addEventListener(`aue:content-${type}`, () => window.location.reload(), { capture: true });
    });
  }
  if (main && !doc.documentElement.dataset.experienceFragments) {
    experienceFragmentBlocks = decorateExperienceFragments(main);
    if (experienceFragmentBlocks.length) {
      doc.querySelectorAll('body > header, body > footer').forEach((el) => { el.style.display = 'none'; });
    }
  }
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
/**
 * Adds the floating "back to top" button (purple circle, bottom-right), shown after the
 * user scrolls down, matching scotiabank.com. Page-level affordance (not header/footer).
 */
function decorateBackToTop() {
  if (document.querySelector('.back-to-top')) return;
  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '<span class="back-to-top-icon" aria-hidden="true"></span>';
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  const toggle = () => btn.classList.toggle('show', window.scrollY > 400);
  window.addEventListener('scroll', toggle, { passive: true });
  toggle();
  document.body.append(btn);
}

async function loadLazy(doc) {
  const preview = getFragmentPreview();
  const inlineFragments = doc.documentElement.dataset.experienceFragments === 'true';
  if (preview !== 'footer' && !inlineFragments) loadHeader(doc.querySelector('header'));
  experienceFragmentBlocks.forEach((block) => {
    decorateBlock(block);
    loadBlock(block);
  });

  const main = doc.querySelector('main');
  await loadSections(main);
  decorateBackToTop();

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  if (preview !== 'header' && !inlineFragments) loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
