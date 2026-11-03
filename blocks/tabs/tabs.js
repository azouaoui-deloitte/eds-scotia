import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Accessible tabs. Each row is a tab: [label] [rich content].
 * Each tab is paired, by order, with a sibling `cards.featured` / `cards.product` block in the
 * same section
 * (tab 0 -> 1st cards block, tab 1 -> 2nd, ...). Selecting a tab shows its panel text and its
 * matching card grid, hiding the others. Backend-driven tab content on scotiabank.com cannot
 * be fetched cross-origin from Edge Delivery, so each tab carries its own authored cards.
 * Options (block classes): `pills` (filter pills), `panels` (show the active panel's copy).
 */
export default function decorate(block) {
  const section = block.closest('.section');
  // sibling card grids, in document (tab) order
  const cardBlocks = section ? [...section.querySelectorAll('.cards.featured, .cards.product')] : [];
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

  // Default (personal "Featured"): prod renders the tab bar ABOVE the section's heading +
  // subtitle, so the whole block (tab bar + hidden, UE-editable panels) moves to the top of the
  // section and the cards grid follows the heading directly.
  // Options keep the block where it is authored: `pills` (category filter pills under the
  // heading, panels hidden) and `panels` (the active tab's panel copy shows under the bar).
  const inPlace = block.classList.contains('pills') || block.classList.contains('panels');
  if (section && !inPlace) section.prepend(block);

  // pills: when the pills wrap, show only the first row with a "Show more +" / "Show less -"
  // toggle (prod tablist toggle)
  if (block.classList.contains('pills')) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'tabs-pills-toggle';
    toggle.setAttribute('aria-controls', tablist.id = `tabs-list-${Math.random().toString(36).slice(2, 8)}`);
    let open = false;
    const render = () => {
      const tabs = [...tablist.children];
      const wraps = tabs.length > 1 && tabs[tabs.length - 1].offsetTop > tabs[0].offsetTop;
      const collapsed = wraps && !open;
      tablist.classList.toggle('collapsed', collapsed);
      toggle.hidden = !wraps && !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.innerHTML = open ? 'Show less <span aria-hidden="true">-</span>' : 'Show more <span aria-hidden="true">+</span>';
    };
    toggle.addEventListener('click', () => { open = !open; tablist.classList.remove('collapsed'); render(); });
    tablist.after(toggle);
    window.addEventListener('resize', () => { tablist.classList.remove('collapsed'); render(); });
    window.requestAnimationFrame(render);
  }
}
