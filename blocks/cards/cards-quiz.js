/**
 * cards.quiz: single-answer quiz (Advice+ RRSP quiz). Rows of the cards block:
 *   option rows  - one text cell each ("A. ..."); the correct option is authored in bold
 *   feedback row - rich text: h3 "correct" heading, h3 "wrong" heading, then the explanation + link
 * Renders radio option cards, an "Answer" button (enabled once an option is picked) and reveals
 * the matching feedback heading with the explanation.
 * @param {Element} block the cards block
 * @param {Element} ul the decorated card list
 */
export default function decorateQuiz(block, ul) {
  const items = [...ul.children];
  const feedbackLi = items.find((li) => li.querySelector('h3'));
  const options = items.filter((li) => li !== feedbackLi);
  const name = `l1-quiz-${Math.random().toString(36).slice(2, 8)}`;
  let correct = -1;
  options.forEach((li, i) => {
    const text = li.textContent.replace(/\s+/g, ' ').trim();
    if (li.querySelector('strong, b')) correct = i;
    const label = document.createElement('label');
    label.className = 'l1-quiz-option';
    label.innerHTML = `<input type="radio" name="${name}" value="${i}"><span class="l1-quiz-radio" aria-hidden="true"></span><span class="l1-quiz-label"></span>`;
    label.querySelector('.l1-quiz-label').textContent = text;
    const body = li.querySelector('.cards-card-body:has(*)') || li;
    body.replaceChildren(label);
  });
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'l1-quiz-answer';
  button.textContent = 'Answer';
  button.disabled = true;
  const result = document.createElement('div');
  result.className = 'l1-quiz-result';
  result.hidden = true;
  result.setAttribute('aria-live', 'polite');
  let headings = [];
  if (feedbackLi) {
    const body = feedbackLi.querySelector('.cards-card-body:has(*)') || feedbackLi;
    headings = [...body.querySelectorAll('h3')];
    result.append(...body.childNodes);
    feedbackLi.remove();
  }
  ul.addEventListener('change', () => { button.disabled = false; });
  button.addEventListener('click', () => {
    const picked = Number(ul.querySelector('input:checked')?.value);
    const ok = picked === correct;
    headings.forEach((h, i) => { h.hidden = i !== (ok ? 0 : 1); });
    result.hidden = false;
    result.classList.toggle('correct', ok);
    ul.querySelectorAll('input').forEach((input) => { input.disabled = true; });
    ul.querySelectorAll('.l1-quiz-option').forEach((l, i) => {
      l.classList.toggle('is-correct', i === correct);
      l.classList.toggle('is-wrong', i === picked && !ok);
    });
    button.hidden = true;
  });
  block.append(button, result);
}
