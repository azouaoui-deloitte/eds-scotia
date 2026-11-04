# Scotiabank México homepage — section → block map

Source: `https://www.scotiabank.com.mx/` (es-MX). Target (xwalk / Universal Editor, AEM 4802):
`/content/scotia/mx/es/index`, DAM `/content/dam/scotia/mx`, template `Scotia EDS Page`, header /
footer Experience Fragments `/content/experience-fragments/scotia/mx/es/site/{header,footer}/master`
(mapped by the `/content/scotia/mx/**` row of `/content/scotia/metadata`).

MX pages are enabled by the section style **`mx`** on the first section: `scripts.js` then loads
`styles/mx.css` (MX fonts, typography, section bands, pill buttons) and sets `lang="es-MX"`. Every MX
rule is scoped to `body.mx` or to `mx-*` block variants / section styles, so CA pages are unaffected.

## Blocks (reused vs new)

| Prod section | Block / variant | Status |
|---|---|---|
| Hero rotator (3 slides, autoplay, loop, dots; desktop / mobile backgrounds, side art) | `cards` + **`mx-hero`** (new variant), items **MX Card** | reused block, new variant + new item model `card-mx` |
| "Beneficios todos los días" promo + card slider (2 per view, dots; peek scroll on mobile) | section styles `mx-promo` + `mx-split`, default content, `cards` + `mx-tiles mx-slider` | reused (default content), new variants |
| "Administra tu patrimonio" 7 tabs | `tabs` + **`mx`** option: the tab panels are the following `mx-tab` sections (any blocks inside) | reused block, new option |
| Tab Destacado: 5 image tiles with white overlay | `cards` + `mx-tiles mx-mosaic` | new variants |
| Tab panels: wide photo card + overlay (list, button) | `cards` + `mx-tiles mx-wide` | new variant |
| Tab panels: icon key points (centred; 2-col with divider) | `cards` + `mx-keys` (+ `mx-keys-text`) | new variant |
| Tab panels / "Más que un Banco": colour boxes (charcoal, sky, stone, grey, oxblood) with lists / pill buttons; "Aviso Importante" | `cards` + `mx-boxes` (tone per item), `mx-notice` | new variants |
| Tab Singular: media cards (photo + coloured title), ScotiaRewards feature card | `cards` + `mx-media`, `mx-feature` | new variants |
| Tab Tienes más: document card + YouTube video | `columns` + `mx-brand` | reused block, new variant |
| QR banner "Abre tu Cuenta Scotia desde tu celular" | `columns` + `mx-qr` | reused block, new variant |
| "Soluciones financieras" dark band + icon card slider | section `mx-credito mx-split`, `cards` + `mx-icons mx-slider` | new variants |
| Header (site tabs, logo, search, 4 icon CTAs, INGRESA dropdown, mega-menu, mobile drawer) | AEM component `scotia/components/header`, design **`mx`** (`header/mx.html`) in XF | reused component, new design |
| Footer (tagline logo, 5 icon columns, legal links, ©, back-to-top, accessibility widget) | AEM component `scotia/components/footer`, design **`mx`** (`footer/mx.html`) in XF | reused component, new design |

## Authoring conventions

- Headings with a serif second line: the serif part is *italic* in the RTE (`<em>`), rendered upright
  in Scotia Serif (prod `headline-medium-serif`).
- Buttons (RTE): **bold** link = primary, *italic* link = secondary (outline); inside dark boxes the
  primary is the white pill. Plain links inside lists stay text links.
- MX Card fields: Image (+ Alt), Mobile image (art direction ≤768px), Art (side / logo image),
  Text (RTE), Style (tone / layout: `charcoal`, `sky`, `stone`, `grey`, `oxblood`, `ocean`, `right`,
  `light`, `wide`, `logo-lg`).
