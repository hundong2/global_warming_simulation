# Repository instructions

**English** | [한국어](AGENTS.ko.md)

## Read first

Read [README](README.md) → [architecture](docs/architecture.md) → [verification](docs/harness-engineering.md) → [climate model](docs/climate-model.md) and relevant sources. Record an execution plan in [the development log](docs/development-log.md) before implementation.

## Contracts

- English is the default documentation language. Maintain `README.ko.md`, this file's Korean counterpart, and equivalent `docs/ko/` pages with reciprocal links. Keep formulas, commands, sources, and validation results aligned.
- The product interface defaults to Korean. Explain technical abbreviations in Korean.
- This is a static GitHub Pages application. No backend, API keys, CDN scripts, external fonts, or remote runtime data requests.
- `src/simulation/` contains pure TypeScript; no DOM or Three.js. Model state is the source of truth; mesh positions are presentation only.
- Use °C anomalies relative to 1850–1900, sea level in m relative to 1995–2014, glacier mass loss in % relative to 2015, coordinates in degrees, and calendar years. Preserve each quantity's baseline.
- Separate research reference values, interpolation, and authored schematic models. Never label hazard scores or vector suitability as disease incidence, flood probability, or cyclone counts.
- Do not claim that warmer climate always increases cyclone frequency or that infectious disease is determined only by temperature.
- Keep ice sheets separate from glaciers; glacier mass loss is not the percentage of glaciers that disappear. Sea-level rise includes multiple contributions; do not add the glacier indicator to an already aggregated sea-level projection.
- List sources, licenses, data transformations, reference dates, and omissions in [sources](docs/sources.md).
- Preserve user changes and the existing Apache-2.0 license. Do not push or publish without user authorization.

## Completion

Run `npm run check`. Interaction/rendering changes require `npm run test:e2e` and direct inspection of desktop/mobile screenshots. Model changes require independent reference tests or scientific invariants. Verify both documentation languages and internal links. Record actual results and limitations in both development logs.
