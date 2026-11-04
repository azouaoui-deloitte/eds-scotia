import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Scotiabank México tabs ("Administra tu patrimonio"): one tab per row (label), each paired by
 * order with the following sections styled "mx-tab", so a panel can hold any blocks and stays a
 * regular, editable section. The tab bar scrolls horizontally on small screens like prod.
 * @param {Element} block the tabs block
 */
export default function decorate(block) {
  const section = block.closest('.section');
  const panels = [];
  for (let s = section?.nextElementSibling; s?.classList.contains('mx-tab'); s = s.nextElementSibling) panels.push(s);

  const scroller = document.createElement('div');
  scroller.className = 'mx-tabs-scroll';
  const list = document.createElement('ul');
  list.className = 'mx-tabs-list';
  list.setAttribute('role', 'tablist');
  scroller.append(list);

  const uid = Math.random().toString(36).slice(2, 7);
  const tabs = [...block.children].map((row, i) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'presentation');
    moveInstrumentation(row, li);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mx-tab';
    button.id = `mx-tab-${uid}-${i}`;
    button.setAttribute('role', 'tab');
    const label = document.createElement('span');
    label.textContent = (row.firstElementChild?.textContent || `Tab ${i + 1}`).trim();
    moveInstrumentation(row.firstElementChild?.querySelector('[data-aue-prop]') || row.firstElementChild || row, label);
    button.append(label);
    const panel = panels[i];
    if (panel) {
      panel.id = panel.id || `mx-panel-${uid}-${i}`;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', button.id);
      button.setAttribute('aria-controls', panel.id);
    }
    li.append(button);
    list.append(li);
    return button;
  });

  const select = (idx, focus = false) => {
    tabs.forEach((b, i) => {
      const on = i === idx;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
      b.parentElement.classList.toggle('active', on);
      if (panels[i]) panels[i].hidden = !on;
    });
    if (focus) tabs[idx].focus();
  };
  tabs.forEach((b, i) => b.addEventListener('click', () => select(i)));
  list.addEventListener('keydown', (e) => {
    const cur = tabs.indexOf(document.activeElement);
    if (cur < 0 || !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const n = tabs.length;
    const next = {
      ArrowRight: (cur + 1) % n, ArrowLeft: (cur - 1 + n) % n, Home: 0, End: n - 1,
    }[e.key];
    select(next, true);
  });
  // Universal Editor: selecting something inside a hidden panel shows that panel
  document.addEventListener('aue:ui-select', (e) => {
    const target = e.target instanceof Element ? e.target : null;
    const idx = panels.findIndex((p) => p.contains(target) || p === target);
    if (idx >= 0) select(idx);
  });

  block.replaceChildren(scroller);
  select(0);
}
