import { moveInstrumentation } from '../../scripts/scripts.js';

/* Scotiabank México cards (`mx-*` variants), one row per MX Card:
 *   [image (+alt)] [mobile image] [content: art picture + rich text] [style]
 * mx-hero: rotator slides; mx-tiles (+ mx-slider / mx-mosaic / mx-wide): photo tiles with a white
 * overlay; mx-keys (+ mx-keys-text): icon key points; mx-boxes / mx-notice: colour boxes;
 * mx-icons (+ mx-slider): white icon cards; mx-media: photo + coloured title; mx-feature: wide
 * photo + logo + copy card. The style cell holds tones / layout flags (charcoal, sky, stone, grey,
 * oxblood, ocean, light, right, wide, logo-lg). Styles: styles/mx.css (loaded on MX pages). */

const MOBILE = '(max-width: 768px)';

const SLIDERS = {
  'mx-hero': () => ({ items: 1, loop: true, dots: true }),
  'mx-tiles': (w) => (w < 576
    ? {
      items: 1, margin: 18, stagePadding: 40, center: true, loop: true,
    }
    : { items: 2, margin: 18 }),
  'mx-icons': (w) => (w < 600
    ? {
      items: 1, margin: 15, stagePadding: 20, padEnd: true,
    }
    : {
      items: 2, margin: 15, stagePadding: 40, padEnd: true,
    }),
};

const cellPicture = (cell) => cell?.querySelector('picture');

function artDirected(desktop, mobile) {
  const img = desktop.querySelector('img');
  const picture = document.createElement('picture');
  const mImg = mobile?.querySelector('img');
  if (mImg) {
    const source = document.createElement('source');
    source.media = MOBILE;
    source.srcset = mImg.getAttribute('src');
    picture.append(source);
  }
  const out = document.createElement('img');
  out.src = img.getAttribute('src');
  out.alt = img.getAttribute('alt') || '';
  out.loading = 'eager';
  moveInstrumentation(img, out);
  picture.append(out);
  return picture;
}

function decorateText(text, block) {
  const first = text.firstElementChild;
  // eyebrow / descriptor: a plain first paragraph followed by the heading
  if (first?.tagName === 'P' && !first.querySelector('a, picture') && first.nextElementSibling?.matches('h1, h2, h3, h4')) {
    first.classList.add('mx-eyebrow');
  }
  if (block.classList.contains('mx-hero')) text.querySelector('h1 + p, h2 + p')?.classList.add('mx-intro');
  // promo slider tiles: prod's caption is an inline span on the overlay's line box
  if (block.classList.contains('mx-slider') && block.classList.contains('mx-tiles')) {
    text.querySelectorAll(':scope > p:not(.button-wrapper, .mx-eyebrow)').forEach((p) => {
      if (p.querySelector('picture')) return;
      const span = document.createElement('span');
      span.className = 'mx-caption';
      span.append(...p.childNodes);
      p.append(span);
    });
  }
  // a link on its own paragraph without bold / italic stays a text link (arrow in mx-icons)
  text.querySelectorAll('p > a:only-child:not(.button)').forEach((a) => {
    if (a.parentElement.textContent.trim() === a.textContent.trim()) a.parentElement.classList.add('mx-link');
  });
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'mx-list';
  [...block.children].forEach((row, index) => {
    const li = document.createElement('li');
    // position class: slider clones must keep the per-slide spacing of their original
    li.className = `mx-card mx-n${index + 1}`;
    moveInstrumentation(row, li);
    const cells = [...row.children];
    const byProp = (prop) => cells.find((c) => c.querySelector(`[data-aue-prop="${prop}"], [data-richtext-prop="${prop}"]`));
    const imageCell = byProp('image') || cells[0];
    const mobileCell = byProp('imageMobile') || cells[1];
    const contentCell = byProp('content_text') || byProp('content_art') || cells[2];
    const styleCell = cells.find((c) => c.querySelector('[data-aue-prop="style"]') || c.dataset.aueProp === 'style') || cells[3];

    const flags = styleCell?.querySelector('li')
      ? [...styleCell.querySelectorAll('li')].map((x) => x.textContent)
      : (styleCell?.textContent || '').split(/[\s,]+/);
    flags.map((f) => f.trim().toLowerCase()).filter((f) => /^[a-z0-9-]+$/.test(f))
      .forEach((f) => li.classList.add(`mx-${f}`));
    const inner = document.createElement('div');
    inner.className = 'mx-card-inner';

    const desktop = cellPicture(imageCell);
    if (desktop) {
      const media = document.createElement('div');
      media.className = 'mx-card-media';
      media.append(artDirected(desktop, cellPicture(mobileCell)));
      // keep the authored mobile image (UE instrumentation) without rendering it twice
      const mob = cellPicture(mobileCell);
      if (mob) {
        mob.hidden = true;
        media.append(mob);
      }
      inner.append(media);
    }

    const body = document.createElement('div');
    body.className = 'mx-card-body';
    let text = document.createElement('div');
    if (contentCell) {
      const artP = [...contentCell.children].find((el) => el.matches('p') && el.querySelector('picture') && !el.textContent.trim());
      if (artP) {
        artP.className = 'mx-card-art';
        body.append(artP);
      }
      // the rich text arrives grouped in one instrumented div (editor-support-rte): keep it as is
      const only = contentCell.children.length === 1 ? contentCell.firstElementChild : null;
      if (only?.tagName === 'DIV') text = only;
      else while (contentCell.firstChild) text.append(contentCell.firstChild);
    }
    text.classList.add('mx-card-text');
    decorateText(text, block);
    body.prepend(text);
    // hero: the art is the right-hand column on desktop and sits above the heading on mobile
    if (block.classList.contains('mx-hero') && body.querySelector('.mx-card-art')) li.classList.add('mx-has-art');
    else {
      const art = body.querySelector('.mx-card-art');
      if (art) text.prepend(art);
    }
    inner.append(body);
    li.append(inner);
    ul.append(li);
  });
  block.replaceChildren(ul);

  const slider = Object.keys(SLIDERS).find((k) => block.classList.contains(k)
    && (k === 'mx-hero' || block.classList.contains('mx-slider')));
  if (slider) {
    import('../../scripts/mx-carousel.js').then((m) => m.default(block, ul, SLIDERS[slider]));
  }
}
