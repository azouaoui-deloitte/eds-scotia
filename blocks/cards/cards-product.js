/**
 * cards.product + "more": only the first 3 cards are shown, a "Show more" / "Show less" toggle
 * reveals the rest (credit-cards page tab grids).
 * @param {Element} block the cards block
 * @param {Element} ul the card list
 */
export default function decorateMore(block, ul) {
  const LIMIT = 3;
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
