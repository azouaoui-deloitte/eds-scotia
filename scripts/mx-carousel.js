/**
 * Scotiabank México slider: same geometry and behaviour as the prod owl carousels, so slides
 * land on the same pixels. Item width = (outer - 2 * stagePadding + margin) / items - margin;
 * loop clones the slides on both sides; one dot per page of `items`; pointer drag / swipe;
 * 250ms ease transitions; settings picked by window width like owl's `responsive`.
 * @param {Element} root element receiving the `mx-carousel` class and the dots
 * @param {Element} list the slides container (its children are the slides)
 * @param {(width: number) => object} settingsFor items, margin, stagePadding, loop, center, dots,
 *   padEnd (stage padding on the trailing side only: first item flush with the container)
 */
export default function mxCarousel(root, list, settingsFor) {
  const slides = [...list.children];
  if (slides.length < 2) return null;
  root.classList.add('mx-carousel');
  const outer = document.createElement('div');
  outer.className = 'mx-carousel-outer';
  list.before(outer);
  outer.append(list);
  list.classList.add('mx-carousel-stage');
  const dots = document.createElement('div');
  dots.className = 'mx-carousel-dots';
  outer.after(dots);

  let s = {};
  let pos = 0; // index of the first visible real slide
  let clones = 0;
  let pitch = 0;

  const all = () => [...list.children];
  const setTransform = (index, animate) => {
    const centre = s.center ? (outer.clientWidth - 2 * s.stagePadding - pitch + s.margin) / 2 : 0;
    const offset = (clones + index) * pitch - centre;
    list.style.transition = animate ? 'transform 0.25s ease' : 'none';
    list.style.transform = `translate3d(${-Math.round(offset * 1000) / 1000}px, 0, 0)`;
  };
  const maxPos = () => (s.loop ? slides.length - 1 : Math.max(0, slides.length - s.items));
  const pages = () => (s.loop ? slides.length : Math.ceil(slides.length / s.items));
  const pageOf = (p) => (s.loop ? p : Math.min(pages() - 1, Math.ceil(p / s.items)));
  const renderDots = () => {
    const n = s.dots ? pages() : 0;
    if (dots.children.length !== n) {
      dots.replaceChildren(...Array.from({ length: n }, (_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'mx-carousel-dot';
        b.setAttribute('aria-label', `${i + 1} / ${n}`);
        b.append(document.createElement('span'));
        b.addEventListener('click', () => {
          // eslint-disable-next-line no-use-before-define
          go(s.loop ? i : Math.min(i * s.items, maxPos()), true);
        });
        return b;
      }));
    }
    dots.hidden = !n;
    [...dots.children].forEach((b, i) => b.classList.toggle('active', i === pageOf(pos)));
  };
  const markActive = () => {
    all().forEach((el) => el.classList.remove('active'));
    for (let i = 0; i < s.items; i += 1) all()[clones + pos + i]?.classList.add('active');
    slides.forEach((el) => el.setAttribute('aria-hidden', String(!el.classList.contains('active'))));
  };

  const layout = () => {
    s = {
      items: 1,
      margin: 0,
      stagePadding: 0,
      loop: false,
      center: false,
      dots: true,
      ...settingsFor(window.innerWidth),
    };
    // clones (loop)
    list.querySelectorAll(':scope > .mx-clone').forEach((c) => c.remove());
    clones = 0;
    if (s.loop) {
      const n = Math.min(slides.length, s.items + 1);
      const mk = (el) => {
        const c = el.cloneNode(true);
        c.classList.add('mx-clone');
        c.setAttribute('aria-hidden', 'true');
        c.inert = true;
        const strip = (e) => [...e.attributes].filter((a) => /^data-(aue|richtext)-/.test(a.name))
          .forEach((a) => e.removeAttribute(a.name));
        c.querySelectorAll('[data-aue-resource],[data-aue-prop],[data-richtext-prop]').forEach(strip);
        strip(c);
        return c;
      };
      slides.slice(-n).forEach((el) => list.insertBefore(mk(el), slides[0]));
      slides.slice(0, n).forEach((el) => list.append(mk(el)));
      clones = n;
    }
    const w = (outer.clientWidth - 2 * s.stagePadding + s.margin) / s.items - s.margin;
    pitch = w + s.margin;
    if (!s.stagePadding) list.style.paddingInline = '';
    else list.style.paddingInline = s.padEnd ? `0 ${s.stagePadding}px` : `${s.stagePadding}px`;
    all().forEach((el) => {
      el.style.width = `${w}px`;
      el.style.marginRight = `${s.margin}px`;
    });
    pos = Math.min(pos, maxPos());
    setTransform(pos, false);
    renderDots();
    markActive();
  };

  function go(target, animate = true) {
    let t = target;
    if (!s.loop) t = Math.max(0, Math.min(maxPos(), t));
    pos = t;
    setTransform(t, animate);
    if (s.loop && (t < 0 || t >= slides.length)) {
      pos = (t + slides.length) % slides.length;
      const settle = () => { setTransform(pos, false); markActive(); };
      if (animate) list.addEventListener('transitionend', settle, { once: true });
      else settle();
    }
    renderDots();
    markActive();
  }

  // pointer drag / swipe (owl: follows the pointer, settles on the nearest item)
  let drag = null;
  list.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    drag = {
      x: e.clientX, y: e.clientY, start: pos, moved: false,
    };
  });
  window.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) < 3) return;
    if (!drag.moved && Math.abs(e.clientY - drag.y) > Math.abs(dx)) { drag = null; return; }
    drag.moved = true;
    const base = (clones + drag.start) * pitch;
    list.style.transition = 'none';
    list.style.transform = `translate3d(${-(base - dx)}px, 0, 0)`;
    drag.dx = dx;
  });
  window.addEventListener('pointerup', () => {
    if (!drag) return;
    const { moved, dx = 0, start } = drag;
    drag = null;
    if (!moved) return;
    const steps = Math.abs(dx) > pitch / 5 ? Math.max(1, Math.round(Math.abs(dx) / pitch)) : 0;
    go(start + (dx < 0 ? steps : -steps), true);
    // swallow the click that ends a drag
    list.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); }, { capture: true, once: true });
  });
  list.addEventListener('dragstart', (e) => e.preventDefault());

  let lastW = 0;
  const onResize = () => {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    layout();
  };
  window.addEventListener('resize', onResize);
  onResize();
  const api = {
    go: (i, instant) => go(i, !instant),
    stop: () => {},
    layout,
    get position() { return pos; },
  };
  root.mxCarousel = api;
  return api;
}
