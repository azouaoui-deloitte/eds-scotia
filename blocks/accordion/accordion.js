import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Accordion: each row is an item [summary] [rich text body], rendered as native <details>.
 * Variant `footnotes`: the legal disclosure toggle ("Terms and conditions", "Legal footnotes").
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const [label, body] = row.children;
    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    if (label) {
      moveInstrumentation(label, summary);
      summary.append(...label.childNodes);
    }
    const details = document.createElement('details');
    moveInstrumentation(row, details);
    details.className = 'accordion-item';
    details.append(summary);
    if (body) {
      body.className = 'accordion-item-body';
      details.append(body);
    }
    row.replaceWith(details);
  });
}
