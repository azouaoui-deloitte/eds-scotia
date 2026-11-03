// eslint-disable-next-line import/no-cycle
// eslint-disable-next-line import/no-cycle
import { loadFragment } from '../blocks/fragment/fragment.js';

/**
 * Fragment-based modal + toggletip for L1 pages. Authors link to a fragment page:
 *   .../modals/<id>   -> opens a modal dialog with the fragment (its first h2 is the title)
 *   .../tooltips/<id> -> renders as an info button; opens a small toggletip under the link
 * Links are handled by delegation, so content decorated later (tabs, show more) works too.
 */
const kindOf = (a) => {
  try {
    const url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin) return null;
    if (/\/modals\/[^/]+$/.test(url.pathname.replace(/\.html$/, ''))) return 'modal';
    if (/\/tooltips\/[^/]+$/.test(url.pathname.replace(/\.html$/, ''))) return 'tooltip';
  } catch { /* not a URL */ }
  return null;
};

async function fragmentContent(href) {
  const path = new URL(href, window.location.href).pathname;
  const fragment = await loadFragment(path);
  const box = document.createElement('div');
  if (fragment) [...fragment.querySelectorAll(':scope > .section')].forEach((s) => box.append(...s.children));
  return box;
}

let openTip = null;
function closeTip() {
  if (!openTip) return;
  openTip.tip.remove();
  openTip.link.setAttribute('aria-expanded', 'false');
  openTip.link.focus();
  openTip = null;
}

async function openModal(link) {
  const dialog = document.createElement('dialog');
  dialog.className = 'l1-modal';
  dialog.innerHTML = '<div class="l1-modal-header"><button type="button" class="l1-modal-close" aria-label="Close"></button></div><div class="l1-modal-body"></div>';
  const body = dialog.querySelector('.l1-modal-body');
  body.append(await fragmentContent(link.href));
  const title = body.querySelector('h2');
  if (title) {
    title.id = `l1-modal-title-${Date.now()}`;
    title.classList.add('l1-modal-title');
    dialog.querySelector('.l1-modal-header').prepend(title);
    dialog.setAttribute('aria-labelledby', title.id);
  }
  const close = () => { dialog.close(); };
  dialog.querySelector('.l1-modal-close').addEventListener('click', close);
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
  dialog.addEventListener('close', () => { dialog.remove(); document.body.classList.remove('l1-modal-open'); link.focus(); });
  document.body.append(dialog);
  document.body.classList.add('l1-modal-open');
  dialog.showModal();
}

async function toggleTip(link) {
  if (openTip?.link === link) { closeTip(); return; }
  closeTip();
  const tip = document.createElement('div');
  tip.className = 'l1-tooltip';
  tip.setAttribute('role', 'dialog');
  tip.innerHTML = '<button type="button" class="l1-tooltip-close" aria-label="Close"></button>';
  tip.append(await fragmentContent(link.href));
  tip.querySelector('.l1-tooltip-close').addEventListener('click', closeTip);
  document.body.append(tip);
  const r = link.getBoundingClientRect();
  const width = Math.min(320, document.documentElement.clientWidth - 32);
  tip.style.width = `${width}px`;
  tip.style.top = `${r.bottom + window.scrollY + 10}px`;
  tip.style.left = `${Math.max(16, Math.min(r.left + window.scrollX - 24, document.documentElement.clientWidth - width - 16))}px`;
  tip.style.setProperty('--l1-tip-x', `${r.left + window.scrollX + r.width / 2 - parseFloat(tip.style.left)}px`);
  link.setAttribute('aria-expanded', 'true');
  openTip = { link, tip };
  tip.querySelector('.l1-tooltip-close').focus();
}

export default function init(main) {
  main.querySelectorAll('a[href]').forEach((a) => {
    if (kindOf(a) === 'tooltip') {
      a.classList.add('l1-tooltip-link');
      a.setAttribute('role', 'button');
      a.setAttribute('aria-expanded', 'false');
      a.setAttribute('aria-label', a.textContent.trim());
    }
  });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    const kind = a && kindOf(a);
    if (kind) {
      e.preventDefault();
      if (kind === 'modal') openModal(a);
      else toggleTip(a);
      return;
    }
    if (openTip && !e.target.closest('.l1-tooltip')) closeTip();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeTip(); });
}
