# Development log

**English** | [한국어](ko/development-log.md)

## 2026-09-11 · Initial implementation plan

- Inspected the target repository: initial README and Apache-2.0 license only.
- Work takes place in `D:/workspace/global_warming_simulation`, branch `codex/climate-lab`.
- Follow the six-step execution plan in the README before implementation.
- Product: a Korean climate laboratory, with English-default documentation and equivalent Korean pages.
- Model contract: research reference ranges are labeled; schematic maps, hazard scores, and vector suitability are not forecasts or real incidence rates.
- Delivery: source, locked dependencies, tests, bilingual documentation, and a Pages workflow. Remote publication status must be stated accurately.
- Validation: pending implementation.

## 2026-09-12 · Climate Lab implemented and verified locally

### Delivered

- Static Korean application with a 3D globe, three reference emission pathways, custom temperature, 2020–2100 playback, four layers, ENSO anomaly view, and a cyclone environment experiment.
- Climate impacts view with heavy-rain relative frequency, fictional flood exposure, vector thermal suitability, adaptation control, and three-pathway comparison.
- Six action cards with a persistent local checklist; shareable settings, JSON export, source dialog, keyboard controls, responsive layout and WebGL recovery.
- 16 English/Korean documentation files, reciprocal links, a shared real application screenshot, fixed local geography, CI and a GitHub Pages workflow. The original Apache-2.0 license is unchanged.

### Actual validation

Environment: Windows, Node.js 22.18.0, npm 11.19.1, Playwright 1.63.0 Chromium with SwiftShader.

| Check                | Result                                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`      | Passed: formatting, strict types, 23 unit tests, production build, relative assets, geography checksum and 16 bilingual documents.                                                                            |
| `npm run test:e2e`   | Passed: 24 scenarios, 12 each at desktop 1440×1000 and mobile 390×844, final run approximately 1.5 minutes.                                                                                                   |
| Visual inspection    | Directly opened generated laboratory, ENSO, glacier, cyclone, impacts and action screenshots across desktop/mobile. No horizontal page overflow; the comparison table scrolls within its container on mobile. |
| Runtime network      | Initial-load browser checks observed zero requests to external origins. Geography and assets load from the repository subpath.                                                                                |
| Recovery             | Geography loading failure/retry and actual WebGL context loss/restoration passed on both viewport projects.                                                                                                   |
| Package installation | `npm install` reported zero known vulnerabilities for the resolved dependency tree.                                                                                                                           |
| Remote status        | Read-only repository check: `main` is the default branch and Pages is not enabled. No push or publication performed during local implementation.                                                              |

### Corrections during verification

- Initial first-frame tests timed out. Drawing thousands of individual decorative dots inside the complex country clipping path stalled canvas materialization. Replaced them with one tiled pattern fill; the globe then rendered and idle rendering stopped correctly.
- A subsequent run had 20 passes and four failures (two behaviors on two viewports). The authored SST latitude falloff was too steep for the default tropical cyclone exercise; changed its exponent to 3 and added a warm-default invariant. A same-page shared-hash navigation retained an open modal; shared-state navigation now closes dialogs and returns to the laboratory.
- Source review corrected the glacier uncertainty description to the paper's **95% confidence interval**, not one standard deviation.
- The bilingual source checker initially included adjacent backticks/punctuation in inline URLs. Corrected URL tokenization; all 16 documents pass. Reviewed the meanings, equations and baseline descriptions in both languages as well.
- Strengthened the El Niño/La Niña view with an explicit divergence-color anomaly scale and verified the changed pixels and legend. Improved Korean heading wrapping on narrow screens.

### Remaining limits

- This is a source-backed educational reference explorer with documented toy components. No calibrated flood/disease incidence, live observations, cyclone counts/tracks, regional glacier predictions, terrain inundation or real-time collaboration.
- Browser evidence covers Chromium desktop/mobile emulation, not native mobile GPUs, Safari or Firefox. There is no claim of universal device performance.
- Vite reports a non-blocking large-chunk warning: approximately 583.22 kB JavaScript, 152.39 kB gzip, largely including Three.js. The local geography is 248,548 bytes. No external runtime service is needed.
- Publication requires the user's authorization, enabling Pages with GitHub Actions, and a successful remote deployment run. Workflow execution in GitHub has not been claimed based on local checks.
