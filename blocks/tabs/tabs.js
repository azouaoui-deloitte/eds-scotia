import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Accessible tabs. Each row is a tab: [label] [rich content].
 * The first tab is selected by default. When a non-"Featured" tab is active, a sibling
 * `cards.featured` block (if present in the same section) is hidden so only the active
 * tab's content shows. Backend-driven tab content on scotiabank.com cannot be fetched
 * cross-origin from Edge Delivery, so each tab here carries its own authored content.
 */
export default function decorate(block) {
  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');

  const panels = [];
  [...block.children].forEach((row, i) => {
    const [labelCell, contentCell] = row.children;
    const id = `tab-${i}`;
    const label = (labelCell?.textContent || `Tab ${i + 1}`).trim();

    const button = document.createElement('button');
    button.className = 'tabs-tab';
    button.type = 'button';
    button.setAttribute('role', 'tab');
    button.id = `${id}-btn`;
    button.setAttribute('aria-controls', id);
    button.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    button.tabIndex = i === 0 ? 0 : -1;
    button.textContent = label;
    tablist.append(button);

    const panel = document.createElement('div');
    panel.className = 'tabs-panel';
    moveInstrumentation(row, panel);
    panel.id = id;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `${id}-btn`);
    panel.hidden = i !== 0;
    panel.dataset.label = label;
    if (contentCell) while (contentCell.firstChild) panel.append(contentCell.firstChild);
    panels.push(panel);

    button.addEventListener('click', () => {
      tablist.querySelectorAll('.tabs-tab').forEach((b) => {
        b.setAttribute('aria-selected', 'false');
        b.tabIndex = -1;
      });
      button.setAttribute('aria-selected', 'true');
      button.tabIndex = 0;
      panels.forEach((p) => { p.hidden = p !== panel; });
      // The per-tab card data on scotiabank.com is backend-driven and cannot be fetched
      // cross-origin from Edge Delivery. Keep the authored featured card grid visible for
      // every tab so a tab is never empty (graceful degradation); the panel text above it
      // provides the tab-specific context.
      const cards = block.closest('.section')?.querySelector('.cards.featured');
      if (cards) cards.style.display = '';
    });
  });

  tablist.addEventListener('keydown', (e) => {
    const tabs = [...tablist.querySelectorAll('.tabs-tab')];
    const current = tabs.indexOf(document.activeElement);
    if (current < 0) return;
    let next = current;
    if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    else return;
    e.preventDefault();
    tabs[next].focus();
    tabs[next].click();
  });

  block.replaceChildren(tablist, ...panels);
}
