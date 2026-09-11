# Verification and development workflow

**English** | [한국어](ko/harness-engineering.md) · [Documentation](../README.md#documentation)

## Repeatable development

1. Read repository instructions, architecture and model contracts.
2. Write a bounded plan and success criteria in both development logs.
3. Keep numerical state outside the renderer; preserve the source and baseline for each result.
4. Run `npm run format`, then `npm run check`.
5. For browser changes, run `npm run test:e2e` and inspect the actual screenshots.
6. Record actual outcomes, failed checks, corrective work and remaining limitations in both languages.

## Commands

Use Node.js 22.12 or later and the committed lockfile.

```sh
npm ci
npm run dev
npm run format
npm run check
npx playwright install chromium
npm run test:e2e
npm run preview
```

`check` verifies formatting, TypeScript, unit tests, a production build, relative asset paths, geography SHA-256, bilingual document counterparts, reciprocal links and matching source URLs. The link checker verifies local file targets; fragment text, translation meaning and external availability require human review. The checked-in source data is reproducible without a network download.

`test:e2e` builds and serves `dist/` at `http://127.0.0.1:4193/global_warming_simulation/` to test the real Pages subpath. It does not reuse an unrelated server. Stop a known previous preview on this port before testing. CI installs Chromium and system dependencies with `npx playwright install --with-deps chromium`.

## Model checks

- Independent IPCC temperature/sea-level endpoints and heavy-rain reference ratios.
- Published glacier mass endpoints and 95% interval half-widths.
- Bounded, ordered, finite values and monotonic sea/ice progression.
- Opposite ENSO signs, continuous date-line wrapping, and independent long-term climate.
- Cyclone failures for cold water, equatorial location, dry air and strong shear.
- Adaptation changes fictional exposure, not physical temperature, rain or sea level.
- Suitability falls away from an assumed optimum instead of increasing indefinitely.
- Shared-state validation, round trips, unknown fields and invalid numbers.

Do not change reference fixtures simply to make a model change pass. Test success does not establish predictive validity.

## Browser checks

Desktop 1440×1000 and mobile 390×844 run the same user scenarios in Chromium. Software WebGL uses SwiftShader for reproducibility. Checks cover rendered frame counts, zero remote runtime requests, errors, overflow, settings, all layers, ENSO colors, camera, playback, pause/end, dialogs, health/adaptation, comparisons, checklist persistence, URL sharing, JSON export, idle rendering, missing geography, retry and WebGL context recovery.

Screenshots in `test-results/` include the laboratory, ENSO, ice, cyclone, impacts and actions. Open them directly; DOM assertions do not prove visual quality. Evidence uses real rasterized output, not placeholders. Test artifacts are ignored by Git and retained by CI on failure. Native mobile GPU behavior, Firefox and Safari are not covered by these Chromium runs.

## Extending the science

Before adding actual flood or disease incidence, define the population/geography, time horizon, endpoint, dataset license, fitting/calibration procedure, uncertainty and validation. A percent sign must not turn an arbitrary score into a probability. New physical simulations need domain review and independent references.
