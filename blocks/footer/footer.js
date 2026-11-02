import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Scotiabank footer. The footer fragment has three sections, in order:
 *   0 contact columns (question / support / advice)   1 social links   2 bottom bar
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  // Default to a footer fragment in the current content directory so the site works both
  // root-served on Edge (/ca/en/footer) and subtree-served on AEM (/content/scotia/ca/en/footer).
  const footerPath = footerMeta
    ? new URL(footerMeta, window.location).pathname
    : `${window.location.pathname.replace(/\/[^/]*$/, '')}/footer`;
  const fragment = await loadFragment(footerPath);

  block.textContent = '';
  const footer = document.createElement('div');
  const sections = [...fragment.children];
  const names = ['contact', 'social', 'bottom'];
  sections.forEach((section, i) => {
    if (names[i]) section.classList.add(`footer-${names[i]}`);
    footer.append(section);
  });

  block.append(footer);
}
