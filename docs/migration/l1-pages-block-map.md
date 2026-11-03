# Scotiabank L1 product pages — section → block map

Pages: bank-accounts, credit-cards, investing, loans-lines, mortgages,
creditor-insurance/creditor-insurance, advice-plus (prod `https://www.scotiabank.com/ca/en/personal/<path>.html`).
Same content model in both repos (`eds-scotia` xwalk/UE and `eds-scotia-da` DA). Block decisions are
made once here and reused on every page.

L1 pages are enabled by the section style **`l1`** on the first section (page-level typography,
containers 1110/930/690/315, pill buttons, dotted text links). The personal page has no `l1` section
and is not affected.

## Blocks (reused vs new)

| Block / variant | Status | Used for |
|---|---|---|
| `hero` + `split` (`maroon`, `sky`, `gold`) | reused (variant) | category heroes (colour panel left, photo right; image on top on tablet, hidden on mobile) — bank-accounts, investing, loans-lines, mortgages, creditor-insurance, advice-plus, advice-plus "Not sure where to start?" |
| `hero` + `split` `aura` | reused (variant) | advice-plus "What's your Money Style?" (full-bleed gradient image) |
| `cards` + `info` | reused (variant) | white bordered cards (optional icon, title, text/list, chevron link at bottom): Learn about accounts, For every future, Ways to invest, calculators & tools, Lines of credit / Loans, Ways to apply, homebuyer, mortgage tools, Ready to apply, Ways to contact us |
| `cards` + `article` | reused (variant) | image-top article / product cards: Advice+ articles (bank-accounts, loans, mortgages), credit protection, product videos, monthly news |
| `cards` + `icons` | reused (variant) | centred icon + text, no border: Reasons to consider, Trending topics |
| `cards` + `plain` | reused (variant) | borderless icon cards with underlined link: Useful calculators |
| `cards` + `links` | reused (variant) | bordered link tiles with arrow: "Find what's right for you" |
| `cards` + `promo` | reused (variant) | coloured offer tiles: credit-cards "Special offers" |
| `cards` + `featured` | reused as is | advice-plus "Keeping you informed" tab grids |
| `cards` + **`product`** (+ `compare`, `more`) | reused block, new variant (`blocks/cards/cards-product.css/.js`, UE item model `card-product`: category, card art, rich text, link + link text + style) | credit card product tiles: personal page Credit cards tab (category pill, centred art, Special offer, annual fee / interest rows, View more card details); credit-cards page "Featured credit cards" (`compare`: offer box, rate rows with notes, Apply now / Compare / See if it's right for you; `more`: show 3 + Show more) |
| `tabs` | reused (pairs with `cards.featured` **and** `cards.product` grids) | advice-plus Featured / Getting started / Planning for life / Banking 101 |
| `tabs` + `pills` | reused (variant, `blocks/tabs/tabs-l1.css`) | credit-cards category filter (All, Travel and lifestyle, Cash back, Scene+, No annual fee, Low interest, Students), one `cards.product` grid per pill |
| `columns` + `links` | reused (variant) | link-list columns: Discover our services, Get more investment solutions, Products/Resources/Forms, Need help?, Resources |
| `columns` + `banner` / `box` | reused (variant) | CTA strips: Ready to talk to an advisor, Take steps today, Choose a borrowing solution, Connect with a Home Financing Advisor, eHOME, business advice, Protection Planner |
| default content + section styles | reused | intros, CDIC (`legal`), centred dark band (`dark`), grey/beige bands, sub-navigation (`subnav`), sticky side CTA (`floating`), rate split (`split`) |
| **`accordion`** (+ `footnotes`) | **new** | FAQs (credit-cards, investing, loans-lines, mortgages ×2) and the "Terms and conditions / Legal footnotes" disclosure on every page |
| **`product-cards`** (+ `filter`) | **new** | comparison product cards with price/badge/features/CTA, carousel pager on mobile/tablet: Our most popular accounts, Popular accounts and products, Featured credit cards (filter pills + show more) |

## Section styles (UE section "Style", DA section-metadata)

`l1` (page), `grey`, `beige`, `dark`, `center`, `intro`, `heading-link`, `subnav`, `floating`,
`split`, `divider`, `wide`, `legal` (existing); credit-cards page (`styles/l1-cc.css`): `cc-top`,
`sand`, `sand-light`, `faq-side`. Other pages add their own (see git log).

## Tooling (import-work/tools, git-ignored)

- `l1-gen.mjs <slug>`: one source (`import-work/l1/src/<slug>.html`) -> AEM `.plain.html` + DA document
  (links to migrated pages rewritten to `/content/scotia/ca/en/personal/...` resp. `/ca/en/personal/...`).
- `l1-aem.sh <slug>`: build + install the scoped package `scotia:scotia-l1-pages` (filters: the page path
  + `/content/dam/scotia/<slug>` only).
- `l1-port-da.sh`: copy the committed shared L1 block code to eds-scotia-da; `da-l1.sh <slug>` (DA repo):
  upload media + document, preview + publish.

## Per page

See the tables per page in `docs/migration/l1-pages.md` (coverage, interaction states, gaps).
