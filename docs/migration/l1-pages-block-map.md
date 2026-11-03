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
| `tabs` | reused as is | advice-plus Featured / Getting started / Planning for life / Banking 101 |
| `columns` + `links` | reused (variant) | link-list columns: Discover our services, Get more investment solutions, Products/Resources/Forms, Need help?, Resources |
| `columns` + `banner` / `box` | reused (variant) | CTA strips: Ready to talk to an advisor, Take steps today, Choose a borrowing solution, Connect with a Home Financing Advisor, eHOME, business advice, Protection Planner |
| default content + section styles | reused | intros, CDIC (`legal`), centred dark band (`dark`), grey/beige bands, sub-navigation (`subnav`), sticky side CTA (`floating`), rate split (`split`) |
| **`accordion`** (+ `footnotes`) | **new** | FAQs (credit-cards, investing, loans-lines, mortgages ×2) and the "Terms and conditions / Legal footnotes" disclosure on every page |
| **`product-cards`** (+ `filter`) | **new** | comparison product cards with price/badge/features/CTA, carousel pager on mobile/tablet: Our most popular accounts, Popular accounts and products, Featured credit cards (filter pills + show more) |

## Section styles (UE section "Style", DA section-metadata)

`l1` (page), `grey`, `beige`, `dark`, `maroon`, `center`, `subnav`, `floating`, `split`, `divider`,
`wide`, `legal` (existing).

## Per page

See the tables per page in `docs/migration/l1-pages.md` (coverage, interaction states, gaps).
