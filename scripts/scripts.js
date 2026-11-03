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

let experienceFragmentBlocks = [];

/**
 * Header / footer Experience Fragment components (the locked XFs of the template structure)
 * include the header / footer server-rendered by the AEM components: load their block (CSS +
 * interactions) in place.
 * @param {Element} main The main element
 * @returns {Element[]} the header / footer blocks to load
 */
function decorateExperienceFragments(main) {
  return [...main.querySelectorAll('.cmp-experiencefragment')].map((xf) => {
    const block = xf.querySelector(':scope .header.block, :scope .footer.block');
    if (!block) return null;
    block.removeAttribute('data-block-status');
    document.documentElement.dataset.experienceFragments = 'true';
    return block;
  }).filter(Boolean);
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
 * Turns a link into a button when the author formatted its whole label in the rich text
 * editor: Bold = primary, Italic = secondary, Bold + Italic = accent. Formatting is the only
 * link marker the AEM renderer and the Markdown pipeline keep (classes, target and spans are
 * stripped). The marks may wrap the link (<strong><a>) or sit inside it (<a><strong>).
 * @param {HTMLAnchorElement} a The link
 * @returns {string|null} The button style applied, or null when the link has no style marks
 */
export function decorateButton(a) {
  const label = a.textContent.trim();
  const isMark = (el) => el?.matches('strong, em') && el.textContent.trim() === label;
  const outer = [];
  for (let el = a.parentElement; isMark(el); el = el.parentElement) outer.push(el);
  const inner = [];
  for (let el = a.firstElementChild; isMark(el); el = el.firstElementChild) inner.push(el);
  const tags = [...outer, ...inner].map((el) => el.tagName);
  const strong = tags.includes('STRONG');
  const em = tags.includes('EM');
  if (!strong && !em) return null;

  const style = (strong && em && 'accent') || (strong && 'primary') || 'secondary';
  inner.forEach((el) => el.replaceWith(...el.childNodes));
  outer.at(-1)?.replaceWith(a);
  a.classList.add('button', style);
  return style;
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
    if (decorateButton(a)) p.className = 'button-wrapper';
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
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main && !doc.documentElement.dataset.experienceFragments) {
    experienceFragmentBlocks = decorateExperienceFragments(main);
    if (experienceFragmentBlocks.length) {
      doc.querySelectorAll('body > header, body > footer').forEach((el) => { el.style.display = 'none'; });
    }
  }
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    const firstSection = main.querySelector('.section');
    if (firstSection) await loadSection(firstSection, waitForFirstImage);
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
  const inlineFragments = doc.documentElement.dataset.experienceFragments === 'true';
  if (!inlineFragments) loadHeader(doc.querySelector('header'));
  experienceFragmentBlocks.forEach((block) => {
    decorateBlock(block);
    loadBlock(block);
  });

  const main = doc.querySelector('main');
  await loadSections(main);
  // L1 pages: fragment-based modals (.../modals/<id>) and toggletips (.../tooltips/<id>)
  // eslint-disable-next-line import/no-cycle
  // eslint-disable-next-line import/no-cycle
  if (main.querySelector('a[href*="/modals/"], a[href*="/tooltips/"]')) import('./l1-modal.js').then((m) => m.default(main));
  if (main.querySelector('.section.subnav-select')) import('./l1-subnav.js').then((m) => m.default(main));
  decorateBackToTop();

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  if (!inlineFragments) loadFooter(doc.querySelector('footer'));

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
