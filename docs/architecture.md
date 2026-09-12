# Architecture

**English** | [한국어](ko/architecture.md) · [Documentation](../README.md#documentation)

## Product and boundaries

Climate Lab is a Korean-first educational globe with three views: **지구 실험실** (Earth laboratory), **기후와 우리** (Climate and people), and **함께하는 실천** (Shared action). A sources dialog explains what every result means. It is a static Vite + TypeScript + Three.js site with local Natural Earth geography.

```text
Input / URL hash → validated Settings → pure evaluate()
                                         ├─ numerical indicators / comparisons
                                         ├─ schematic ocean / cyclone / glacier graphics
                                         └─ exported experiment snapshot
Action checklist → optional localStorage (independent of climate)
```

- `src/simulation/climate.ts`: typed settings, normalization, reference tables, interpolation, scenario evaluation, and URL serialization. No rendering dependencies.
- `src/simulation/weather.ts`: deterministic candidate/lifecycle/steering tracks and clock sampling. `src/simulation/geography.ts`: pure polygon/holes land query.
- `src/render/weather-visual.ts`: locally generated cloud textures and past-track geometry. `src/render/surface-visual.ts`: glacier outlines and coast-distance raster.
- `src/ui/details.ts`: enlarged fictional glacier and sea-level comparisons.
- `src/render/globe.ts`: local geography loading, generated map texture, globe, grid, glaciers and weather display, camera, resize, context recovery, and disposal.
- `src/ui/content.ts`: Korean lessons, attribution links, action cards, and authored SVG icons.
- `src/main.ts`: owns the settings, coordinates views and dialogs, runs mutually exclusive climate-year and weather-day playback, caches model tracks independently of the render loop, updates DOM output, and exports settings plus weather snapshots.
- `src/style.css` and `src/ui/tokens.css`: responsive design, accessible focus, native controls, and reduced-motion behavior.
- `tests/unit/`: independent numerical endpoints and invariants. `tests/e2e/`: real browser interactions at repository subpaths.
- `scripts/`: static preview and documentation/build/provenance checks.

## Rendering and lifecycle

The globe radius is one display unit. A longitude/latitude maps to `(cos(lat) cos(lon), sin(lat), −cos(lat) sin(lon))`. Three.js texture UV coordinates follow the same convention. The camera initially faces Asia and the western Pacific. Pointer drag, zoom buttons, wheel/pinch and focused-canvas arrow keys control the camera. The model never reads back mesh positions.

The 1024×512 procedural ocean texture uses 4-pixel samples and locally rasterized country polygons. Colors are schematic SST, not satellite imagery. A latitude-based land palette adds legibility; it is not vegetation or elevation data. Glacier symbols use the cube root of the remaining mass fraction for linear scale, not predicted local areas. Polar ice sheets stay fixed. Fixed amber glacier footprints expose the shrinking ice, with a larger paired valley below the globe. The sea layer removes the old wireframe sphere and uses distance to the raster land boundary to emphasize coasts without highlighting internal borders. Its large section displays a fixed datum, range and midpoint. These visual scales exaggerate change without calculating inundation; see [weather and visual scales](weather-model.md).

With El Niño or La Niña selected in the ocean layer, the globe switches to a clearly labeled −2 to +2°C anomaly scale: cool blue, neutral dark water, warm orange. The neutral phase restores the absolute synthetic SST scale. The cyclone layer continues to display absolute synthetic SST.

Pixel ratio is capped at 1.5. The scene draws on demand when idle. Explicit globe rotation schedules animation frames; the climate experiment advances in one-year increments every 800/400/160 ms. Weather playback samples a separate 30-day experiment about every 65 ms, at one day per second with an elapsed-step cap of 0.15 day, and stops at day 30. Weather-only ticks do not repaint the map texture or rebuild trajectories. Selecting the cyclone layer starts motion unless reduced motion is preferred; direct play remains available. Playback stops at 2100. Hidden views and dialogs suspend rendering; hidden browser tabs stop time. A recovered frame starts with zero elapsed time, preventing jumps.

ResizeObserver updates camera aspect and drawing size. WebGL context loss presents a recovery message while the model and lessons remain usable. Missing geography provides a retry. Scene geometry, materials, texture, listeners, observer, and renderer are disposed before recreation. No WebGL fallback image is fabricated.

## State and sharing

All shared values are allowlisted and normalized. The hash carries the scenario, target, year, ENSO phase, layer, shear, humidity, latitude, adaptation, weather day, storm mode, and steering variability. Localhost links work only where that local server is reachable; the dialog explains this. JSON export includes a schema version, settings, evaluated values, assumptions, and source links. No personal information is collected.

The six action checks use `climate-lab-actions-v1` in localStorage, with memory-only behavior when storage is unavailable. Action checks do not change the global temperature or pretend to quantify carbon savings. Links reproduce an experiment, not a real-time multiuser session.

## Delivery

`base: './'` makes assets portable to repository subpaths. Geography loads with `import.meta.env.BASE_URL`. There is no router or backend. Deploy all of `dist/`. English documentation lives at the default paths; equivalent Korean pages have reciprocal language navigation. See [deployment](deployment.md).
