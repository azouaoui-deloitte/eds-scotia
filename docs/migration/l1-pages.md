# Scotiabank L1 product pages — migration status (AEM xwalk + DA)

Block decisions: see `l1-pages-block-map.md`. Same documents for both targets, generated from one
source per page (`import-work/l1/src/<slug>.html`, git-ignored) by `import-work/tools/l1-gen.mjs`.

| Page | AEM (UE) | DA live |
|---|---|---|
| bank-accounts | `/content/scotia/ca/en/personal/bank-accounts` | `/ca/en/personal/bank-accounts` |
| credit-cards | `/content/scotia/ca/en/personal/credit-cards` | `/ca/en/personal/credit-cards` |
| investing | `/content/scotia/ca/en/personal/investing` | `/ca/en/personal/investing` |
| loans-lines | `/content/scotia/ca/en/personal/loans-lines` | `/ca/en/personal/loans-lines` |
| mortgages | `/content/scotia/ca/en/personal/mortgages` | `/ca/en/personal/mortgages` |
| creditor-insurance | `/content/scotia/ca/en/personal/creditor-insurance/creditor-insurance` | `/ca/en/personal/creditor-insurance/creditor-insurance` |
| advice-plus | `/content/scotia/ca/en/personal/advice-plus` | `/ca/en/personal/advice-plus` |

Assets: prod originals in `~/Desktop/scotia-assets/<slug>/` (+ `manifest.json`, `_capture/`), DAM
`/content/dam/scotia/<slug>/`, DA `media/scotia/<slug>/`. Heroes use the prod art-directed renditions
(`hero-desktop` = 3000x900 master, `hero-tablet` = 2048x1200 medium, `hero-mobile` = 767x600 small).

## Pipeline (replayable)

```bash
# capture prod (real Chrome, DPR2, 1440/1024/768/375) + originals
node ~/Desktop/scotia-assets/_tools/l1/capture.mjs <slug> <prodPath>
node ~/Desktop/scotia-assets/_tools/l1/download.mjs <slug>
node import-work/tools/l1-dam.mjs <slug> --hero=<file> [files...]   # DAM folder
import-work/tools/l1-aem.sh <slug>          # generate docs, build scoped package, install on 4802
import-work/tools/l1-port-da.sh             # port shared L1 block code to eds-scotia-da
../eds-scotia-da/import-work/tools/da-l1.sh <slug>   # upload media + doc, preview + publish
node ~/Desktop/scotia-assets/_tools/l1/measure.mjs <slug> <url> <width>   # section-relative ±3px
node ~/Desktop/scotia-assets/_tools/l1/personal-guard.mjs <personal url>  # personal page unchanged
```

Package `scotia:scotia-l1-pages` (built by `ue-build-l1.mjs`) only has filter roots
`/content/scotia/ca/en/personal/<page>` and `/content/dam/scotia/<slug>`.

## Functional gaps

- Header/footer: the XF header/footer (classic Scotiabank) is used on every page; prod credit-cards
  uses the newer global header/footer.
- Modals / tooltips: one generic mechanism (`scripts/l1-modal.js`) — any link to a fragment page
  `…/modals/<id>` opens a modal dialog, `…/tooltips/<id>` renders an info button + toggletip. Authored
  fragments: credit-cards "About the offer" (30, from prod) and rate-row toggletips (11, the ones prod
  renders), investing TFSA / RRSP / GIC triage modals (product-cards inside the modal). Other prod
  modals (Book an appointment, advisor) still link to their target; video cards link to YouTube.
- Tabs options (UE `tabs` model): default = personal Featured (tab bar moved above the heading,
  panels hidden); `pills` = credit-cards filter pills in place, "Show more +" when they wrap;
  `panels` = Advice+ (active panel copy under the bar).
- Card grids that prod renders in a `tab-pane` are swipe carousels below 1200px (`cards … scroll`,
  `product-cards`), pager "n of m" stepping one card like prod; credit-cards Special offers is an
  arrow-only carousel below 768px.
- Advice+: RRSP quiz (`cards quiz`), Trending topics "Show more" (`cards icons more`), tabs `panels` render a
  dropdown below 992px like prod; hero heights `h400` / `h500` for the Money Style / "Not sure" bands.
- Creditor insurance: the Protection Planner gear icon is not migrated.
- Personalised / backend content (Adobe Target, search) is a static snapshot.
