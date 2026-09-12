# Climate Lab

**English** | [한국어](README.ko.md)

**Website:** [hundong2.github.io/global_warming_simulation](https://hundong2.github.io/global_warming_simulation/)

An interactive, Korean-first climate learning website for GitHub Pages. Explore a globe, warming scenarios, sea level, glacier loss, ENSO, tropical cyclone formation, climate hazards, and everyday climate action.

![Climate Lab desktop laboratory](docs/images/climate-lab.png)

## Execution plan

1. Establish matching English and Korean architecture, model, sources, verification, deployment, and contributor documentation.
2. Build a static Vite + TypeScript + Three.js application with local geography and no runtime services.
3. Keep source-backed climate reference values separate from illustrative ocean, cyclone, flood, and disease-suitability models.
4. Add accessible controls, scenario comparison, timeline playback, shareable settings, and a local action checklist.
5. Verify numerical invariants, desktop/mobile interactions, screenshots, local assets, and documentation parity.
6. Prepare GitHub Actions verification and Pages deployment; record actual results in the development log.

All six implementation steps are complete locally. Initial verification passed 23 unit tests and 24 desktop/mobile browser scenarios. The development log records the visual revision and its latest validation. Actual results and publication limits are recorded in [the development log](docs/development-log.md). The existing Apache-2.0 license is preserved.

## Features

- **Interactive 3D globe:** drag, zoom, keyboard rotation, Asia/Pacific/Arctic camera positions, and explicit automatic rotation.
- **Scenario laboratory:** three IPCC reference pathways, custom 1.5–4.4°C target, a 2020–2100 timeline, playback/pause, speeds and reset.
- **Four visual layers:** synthetic ocean temperature, symbolic sea-level/coastal change, glacier reference outlines with a large retreat comparison, and procedural cyclone clouds with a separate 30-day motion experiment.
- **Weather experiment:** eye, eyewall, spiral clouds, past tracks, land/cool-water weakening, and deterministic replay. Choose fixed candidates or a labeled stress mode that adds candidates and steering variability under warming; this is not a cyclone-frequency projection.
- **El Niño / La Niña:** change the sign of the equatorial Pacific temperature anomaly independently of long-term warming.
- **Climate and people:** source-backed heavy-precipitation frequency ratios, an illustrative flood-exposure score, a non-monotonic vector-suitability graphic, adaptation controls and scenario comparison.
- **Shared action:** six Korean everyday-action cards and a local checklist. Checks do not pretend to offset emissions or directly change the planet's temperature.
- **Share and export:** links reproduce all experiment settings; JSON includes values, assumptions and sources. No backend or real-time multiuser service.
- **Responsive and resilient:** desktop/mobile layout, keyboard focus, native dialogs, reduced-motion support, WebGL recovery and continued use without 3D.

## Run locally

Node.js 22.12 or later is required.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite, normally `http://127.0.0.1:5173`. No API key, backend, map account or external font is needed. All application assets are local. Use a web server, not `file://`.

```sh
npm run format
npm run check
npx playwright install chromium
npm run test:e2e
npm run preview
```

Browser verification serves the production build at `/global_warming_simulation/` on port 4193. See [verification](docs/harness-engineering.md) for details and [the development log](docs/development-log.md) for actual results.

## First experiments

1. Change the year to 2100 and compare **강한 감축** (Strong mitigation) with **매우 높은 배출** (Very high emissions). Compare sea-level bounds and remaining glacier mass.
2. Select **태평양** (Pacific), then alternate **엘니뇨** and **라니냐**. The warm/cool patch changes independently of the long-term trajectory.
3. Select **태풍** (Cyclone). Use the separate 30-day weather slider to watch birth, movement and decay. Compare fixed-candidate and stress modes, then increase shear or set latitude to zero to test formation conditions.
4. Open **기후와 우리** (Climate and people) and raise adaptation. Exposure scores fall while physical climate values stay unchanged.
5. Visit **함께하는 실천** (Shared action), choose an achievable action, and share the experiment from the published site.

Initial loading and shared links start paused. Selecting the cyclone layer starts weather playback unless reduced motion is preferred; its own play button allows explicit playback. Climate-year playback and weather playback pause one another. At 2100, playing again restarts from 2020. Changing a numeric slider pauses playback. Hiding the browser tab, opening a dialog or changing views stops playback. Shared links include settings, not personal checklist state or camera orientation.

## What the numbers mean

This is an educational reference explorer, not a predictive Earth-system model. Source-backed endpoints and authored interpolation are labeled. Sea level is relative to 1995–2014; warming to 1850–1900; glacier mass to 2015, excluding ice sheets. The selected period-average target is treated as a schematic 2100 endpoint.

The application does **not** estimate actual local flood occurrence or disease incidence percentages. Those need regional observations, exposed populations and calibrated models. Instead, it shows separately labeled relative heavy-rain frequency, fictional flood exposure and illustrative vector environmental suitability. Actual storm counts, individual glacier disappearance dates and real flood maps are not predicted. The weather experiment displays authored candidates and paths; see the [weather model](docs/weather-model.md). See [all equations and omissions](docs/climate-model.md).

## GitHub Pages

The included workflow verifies the application before deploying `dist/` from `main`. First select **GitHub Actions** in [repository Settings → Pages](https://github.com/hundong2/global_warming_simulation/settings/pages). Push/merge and publication require authorization; this implementation alone does not enable Pages.

Expected address after successful deployment: [Climate Lab](https://hundong2.github.io/global_warming_simulation/). This is an expected deployment URL, not a claim that the site is already live. Follow the [English deployment guide](docs/deployment.md) or [한국어 배포 안내](docs/ko/deployment.md).

## Documentation

English is the default. Every document has an equivalent Korean version with reciprocal language links; product labels remain Korean.

| Topic                     | English                                             | 한국어                                       |
| ------------------------- | --------------------------------------------------- | -------------------------------------------- |
| Project and usage         | [README](README.md)                                 | [소개와 사용법](README.ko.md)                |
| Contributor instructions  | [Instructions](AGENTS.md)                           | [작업 지침](AGENTS.ko.md)                    |
| Architecture              | [Architecture](docs/architecture.md)                | [아키텍처](docs/ko/architecture.md)          |
| Climate model and limits  | [Model guide](docs/climate-model.md)                | [기후 모델과 한계](docs/ko/climate-model.md) |
| Weather and visual scales | [Weather model](docs/weather-model.md)              | [날씨 모델](docs/ko/weather-model.md)        |
| Sources and licenses      | [Sources](docs/sources.md)                          | [출처와 라이선스](docs/ko/sources.md)        |
| Verification              | [Development workflow](docs/harness-engineering.md) | [검증 절차](docs/ko/harness-engineering.md)  |
| GitHub Pages              | [Deployment](docs/deployment.md)                    | [배포 안내](docs/ko/deployment.md)           |
| Plan and results          | [Development log](docs/development-log.md)          | [개발 기록](docs/ko/development-log.md)      |

## Project structure

```text
.github/workflows/      CI and verified GitHub Pages deployment
src/simulation/        Pure climate reference/interpolation models
src/render/            Globe, generated texture, camera and recovery
src/ui/                Korean explanations, icons and design tokens
src/main.ts            Application state and user interactions
public/data/           Local Natural Earth geography
tests/unit/            Research reference and invariant checks
tests/e2e/             Desktop/mobile browser scenarios
scripts/               Subpath server and build/document checks
docs/                  English documentation
docs/ko/               Equivalent Korean documentation
```

## License

The existing [Apache License 2.0](LICENSE) is preserved. Natural Earth is public domain; other dependencies and reference sources are documented in [sources](docs/sources.md).
