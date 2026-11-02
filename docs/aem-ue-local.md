# AEM + Universal Editor (xwalk) locally — Scotiabank on port 4802

The Scotiabank page is authored in the local **AEM SDK author on http://localhost:4802**
(admin/admin) and edited with the **Universal Editor**. This is independent of the TD/latamib
setup on 4602 (which must not be touched).

## Services

| Service | URL | Notes |
|---|---|---|
| Universal Editor Service | `https://localhost:8000` | shared `~/ue-service/universal-editor-service.cjs` |
| HTTPS proxy → AEM 4802 | `https://localhost:8444` | `~/ue-service/aem-https-proxy.cjs` (strips `X-Frame-Options`, `SameSite=None`, auto-auth admin) |
| AEM SDK author | `http://localhost:4802` | `/content/scotia/ca/en/personal` |

Start / stop / status (separate from the 4602 stack):

```bash
~/ue-service/start-ue-scotia.sh start     # or restart / stop / status
```

## OSGi settings applied on 4802 (by `import-work/tools/ue-setup-aem.sh`)

| PID | Value | Effect |
|---|---|---|
| `…franklin.internal.UniversalEditorSettings` | `endpoint=https://localhost:8000` | `<meta name="urn:adobe:aue:config:service">` |
| `com.day.cq.commons.impl.ExternalizerImpl` | `author https://localhost:8444` | `<meta name="urn:adobe:aue:system:aemconnection" content="xwalk:https://localhost:8444">` |
| `…UniversalEditorURLServiceImpl` | `/content/scotia:${author}${path}.html` | "Edit" in Sites opens the UE |
| `…hlx.HelixAdminClientImpl` | `adminApiBaseUri=https://localhost:1/…` | preview/publish to admin.hlx.page **disabled** for this SDK |

## Open the Universal Editor

1. Open `https://localhost:8000/ping` and accept the self-signed certificate (`{"ping":"pong"}`).
2. Open `https://localhost:8444/content/scotia/ca/en/personal.html` and accept the certificate.
3. Open the canvas and sign in with an Adobe IMS account that has UE access; allow
   **Local Network Access** for experience.adobe.com when Chrome prompts.

| Page | Universal Editor URL |
|---|---|
| Personal Banking | `https://experience.adobe.com/#/aem/editor/canvas/localhost:8444/content/scotia/ca/en/personal.html` |
| Navigation (header) | `https://experience.adobe.com/#/aem/editor/canvas/localhost:8444/content/scotia/ca/en/nav.html` |
| Footer | `https://experience.adobe.com/#/aem/editor/canvas/localhost:8444/content/scotia/ca/en/footer.html` |

## Code sync (required for the UE to render) — user action

The AEM author loads the EDS code (`head.html`, `/scripts`, `/blocks`, `component-*.json`) from
the Edge Delivery **code bus** `https://main--eds-scotia--azouaoui-deloitte.aem.page`. The
**AEM Code Sync** GitHub App is installed on the `azouaoui-deloitte` account (from the TD repo),
so the code bus works once the repo lives there. The repo was created under `azizzouaouiaem` and
a transfer to `azouaoui-deloitte` was requested but is **pending manual acceptance**.

Until then the author shows *"Component Models could not be loaded: HTTP 404"*. To finish:

1. Accept the repo transfer to **azouaoui-deloitte** (GitHub email / the org's repo-transfer
   prompt), **or** install the *AEM Code Sync* GitHub App on `azizzouaouiaem` and set
   `EDS_OWNER=azizzouaouiaem` when rebuilding the package.
2. Trigger a code sync if needed:
   `curl -X POST "https://admin.hlx.page/code/azouaoui-deloitte/eds-scotia/main/*"`
3. Verify: `https://admin.hlx.page/status/azouaoui-deloitte/eds-scotia/main/` and
   `https://main--eds-scotia--azouaoui-deloitte.aem.page/scripts/scripts.js` return 200.
4. Reload the UE canvas — the page renders with `data-aue-*` instrumentation and is editable.

If `EDS_OWNER` changes, rebuild + reinstall: `import-work/tools/ue-setup-aem.sh`.

## Page templates (Templates console)

Same layout as the Adobe `aem-boilerplate-xwalk` site template (release 0.2.0): `/conf/scotia/settings/wcm`
holds `templates`, `policies` and `template-types` (`cq:Page`), which is what makes the **Scotia** folder
appear in *Tools › General › Templates* (`/libs/wcm/core/content/sites/templates.html/conf`).

| Path | Content |
|---|---|
| `/conf/scotia/settings/wcm/templates/page-template` | **Scotia EDS Page**, `status=enabled`, `allowedPaths=^/content/scotia(/.*)?`; `initial` = `core/franklin/components/page/v1/page` + `root` + one `section` (same as `/libs/core/franklin/templates/page`) |
| `/conf/scotia/settings/wcm/template-types/eds-page` | template type used by *Create* in the Templates console |
| `/content/scotia/jcr:content` `cq:allowedTemplates` | `/libs/core/franklin/templates/.*` + `/conf/scotia/settings/wcm/templates/.*` |

`personal`, `nav` and `footer` use `cq:template=/conf/scotia/settings/wcm/templates/page-template`; the
rendered HTML and `data-aue-*` instrumentation are identical to the `/libs/core/franklin/templates/page` version.

Source: `tools/aem/scotia-wcm-templates/` (package `scotia:scotia-wcm-templates`, filter
`/conf/scotia/settings/wcm` only, so it never touches `/content/scotia`). Reinstall it alone with
`tools/aem/scotia-wcm-templates/build.sh --install`. The full content package also bundles it.

## Edit round-trip & restore

Edit a text or a card/tab item in the UE and see it render. To restore the original content,
reinstall the package (mode *replace*): `import-work/tools/ue-setup-aem.sh --skip-build`.
