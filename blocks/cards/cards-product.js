/**
 * cards.product + "more": only the first 3 cards are shown, a "Show more" / "Show less" toggle
 * reveals the rest (credit-cards page tab grids).
 * @param {Element} block the cards block
 * @param {Element} ul the card list
 * @param {number} [limit=3] cards shown before "Show more" (Advice+ trending topics: 5)
 */
export default function decorateMore(block, ul, limit = 3) {
  const LIMIT = limit;
  const items = [...ul.children];
  if (items.length <= LIMIT) return;
  let expanded = false;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'cards-product-more';
  const apply = () => {
    items.forEach((li, i) => { li.hidden = !expanded && i >= LIMIT; });
    button.textContent = expanded ? 'Show less' : 'Show more';
    button.setAttribute('aria-expanded', String(expanded));
  };
  button.addEventListener('click', () => { expanded = !expanded; apply(); });
  block.append(button);
  apply();
}
