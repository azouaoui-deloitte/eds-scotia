import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Accessible tabs. Each row is a tab: [label] [rich content].
 * Each tab is paired, by order, with a sibling `cards.featured` block in the same section
 * (tab 0 -> 1st cards block, tab 1 -> 2nd, ...). Selecting a tab shows its panel text and its
 * matching card grid, hiding the others. Backend-driven tab content on scotiabank.com cannot
 * be fetched cross-origin from Edge Delivery, so each tab carries its own authored cards.
 */
export default function decorate(block) {
  const section = block.closest('.section');
  // sibling card grids, in document (tab) order
  const cardBlocks = section ? [...section.querySelectorAll('.cards.featured')] : [];
  const showCards = (idx) => cardBlocks.forEach((cb, j) => { cb.style.display = j === idx ? '' : 'none'; });

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
      showCards(i);
    });
  });

  // show the first tab's cards by default
  showCards(0);

  // prod renders the tab bar ABOVE the section's "Featured" heading + subtitle, then the
  // card grid directly (no per-tab text line). Move the tablist to the top of the section
  // and hide the (UE-editable) panels so only the cards switch.
  if (section) section.prepend(tablist);

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
