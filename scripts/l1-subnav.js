/**
 * L1 sub navigation with the "subnav-select" style: on mobile prod swaps the bar for a native
 * dropdown listing the same pages (current page selected). The authored list stays in place.
 * @param {Element} main
 */
export default function decorateSubnavSelect(main) {
  main.querySelectorAll('.section.subnav-select ul').forEach((ul) => {
    if (ul.parentElement.querySelector(':scope > select.l1-subnav-select')) return;
    const select = document.createElement('select');
    select.className = 'l1-subnav-select';
    select.setAttribute('aria-label', 'Page navigation');
    ul.querySelectorAll(':scope > li').forEach((li) => {
      const a = li.querySelector('a[href]');
      if (!a) return;
      const option = document.createElement('option');
      option.value = a.href;
      option.textContent = a.textContent.trim();
      option.selected = !!li.querySelector('strong');
      select.append(option);
    });
    select.addEventListener('change', () => { window.location.href = select.value; });
    ul.after(select);
  });
}
