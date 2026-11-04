import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  // MX document card + video: the video column's YouTube link becomes the embedded player
  if (block.classList.contains('mx-brand')) {
    block.querySelectorAll('a[href*="youtube.com/embed/"], a[href*="youtu.be/"]').forEach((a) => {
      const iframe = document.createElement('iframe');
      iframe.src = a.href;
      iframe.title = 'YouTube video';
      iframe.loading = 'lazy';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      const box = document.createElement('div');
      box.className = 'mx-video';
      box.append(iframe);
      const holder = a.closest('p') || a;
      moveInstrumentation(holder, box);
      holder.replaceWith(box);
    });
  }

  // scroll (L1 link lists): swipe carousel with a pager below 1200px
  if (block.classList.contains('scroll')) {
    import('../../scripts/l1-carousel.js').then((m) => m.default(block, block.firstElementChild));
  }
}
