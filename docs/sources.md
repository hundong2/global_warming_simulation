# Sources, assumptions, and licenses

**English** | [한국어](ko/sources.md) · [Documentation](../README.md#documentation)

Reviewed 2026-09-11–12. All numerical mappings and omissions are in [the model guide](climate-model.md). This site ships selected reference numbers and authored graphics; it does not redistribute papers or claim to run the underlying research models. Sources are static references, not a live feed.

| Primary source                                                                                                                                                                                                                         | Application use and limits                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [IPCC AR6 WGI, Summary for Policymakers (2021)](https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/) · [official PDF](https://www.ipcc.ch/report/ar6/wg1/downloads/report/IPCC_AR6_WGI_SPM_final.pdf)                 | Table SPM.1 temperature best estimates; B.5.3 sea-level likely ranges. Baselines and time horizons are kept separate. Custom/annual interpolation is authored.                                                                             |
| [IPCC AR6 WGI Figure SPM.6](https://www.ipcc.ch/report/ar6/wg1/figures/summary-for-policymakers/figure-spm-6/)                                                                                                                         | Heavy-precipitation relative frequency over global land, for a preindustrial 10-year event. Not local flood incidence; interpolation/capping is ours.                                                                                      |
| [Rounce et al., Science 379, 78–83 (2023), DOI 10.1126/science.abo1324](https://doi.org/10.1126/science.abo1324) · [author institution PDF](https://climatechange.umaine.edu/wp-content/uploads/sites/439/2023/01/science.abo1324.pdf) | Global glacier mass loss in 2100 relative to 2015, ice sheets excluded, at 1.5°C and 4°C. The ± values are 95% confidence intervals around ensemble medians. Spatial icons, intermediate temperatures and years are authored.              |
| [NOAA PSL: ENSO](https://psl.noaa.gov/enso/) · [NOAA PMEL: La Niña](https://www.pmel.noaa.gov/elnino/what-is-la-nina)                                                                                                                  | Central/eastern equatorial Pacific warm/cool signs. Synthetic SST field and amplitudes are not observations or operational ENSO indices.                                                                                                   |
| [NOAA Ocean Service: hurricane formation](https://oceanservice.noaa.gov/facts/how-hurricanes-form.html) · [NOAA AOML: hurricane FAQ](https://www.aoml.noaa.gov/hrd-faq/)                                                               | Warm water and depth, wind shear, moisture, and Coriolis considerations. Eye, eyewall and spiral rainband structure inform the cloud illustration. Our scores, cutoffs, cloud shapes and scales are authored; warm-layer depth is omitted. |
| [NOAA GFDL: Global Warming and Hurricanes](https://www.gfdl.noaa.gov/global-warming-and-hurricanes/)                                                                                                                                   | Distinguishes frequency, intensity, precipitation and uncertainty. Actual storm counts, tracks and damage are not predicted. Stress-mode candidate counts and path perturbations are authored assumptions, not results from this source.   |
| [WHO: Climate change and health](https://www.who.int/news-room/fact-sheets/detail/climate-change-and-health) · [WHO: Vector-borne diseases](https://www.who.int/news-room/fact-sheets/detail/vector-borne-diseases)                    | Climate affects health through multiple pathways. Our thermal-suitability curve has no disease-specific calibration or epidemiological prediction.                                                                                         |
| [United Nations ActNow: Actions for a healthy planet](https://www.un.org/en/node/143154) · [home energy](https://www.un.org/en/actnow/home-energy)                                                                                     | Paraphrased everyday action ideas. Checklist counts are not carbon offsets or measured emissions reductions.                                                                                                                               |

Cyclone structure and steering were reviewed again on 2026-09-12: [NOAA AOML: storm anatomy](https://www.aoml.noaa.gov/general/graphics/lib/storm.html) and [NHC: marine safety and recurvature](https://www.nhc.noaa.gov/prepare/marine.php). These support qualitative explanations only. The authored coefficients, omitted interactions and magnified graphics are recorded in the [weather model](weather-model.md).

## Local geography

- File: `public/data/countries.geojson`, 248,548 bytes.
- Origin: [Natural Earth v5.1.2, 1:110m countries](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_110m_admin_0_countries.geojson).
- Distribution: [public domain](https://www.naturalearthdata.com/about/terms-of-use/).
- This copy was taken from the adjacent Orbital Lab's documented Natural Earth asset. Unused country attributes had been removed there; geographic coordinates and polygons are retained. The runtime renders locally and requests no map service.
- SHA-256: `e4578a878f5be98ca4b5796a750bb976e76d27ac8260058fa5cc44fe30143b27`. The verification script locks this artifact; a changed source must be reviewed and recorded.
- Boundaries follow the source and express no position on territorial disputes. Resolution cannot support parcel-level or coastline inundation analysis. Small islands may be omitted.

## Technical references

- [Three.js documentation](https://threejs.org/docs/) — scene, textures, camera, renderer.
- [Vite static deployment](https://vite.dev/guide/static-deploy.html#github-pages) — build and base paths.
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) — Pages artifact and deployment permissions.
- [Playwright documentation](https://playwright.dev/docs/intro) — desktop/mobile browser verification.

## Licenses and assets

The existing [Apache License 2.0](../LICENSE) is unchanged. Three.js is MIT-licensed; dependency notices remain in installed packages and generated distribution where applicable. Natural Earth is public domain. SVG icons, logo, map colors, glacier graphics, stars, procedural cyclone clouds, paths and coastal section are authored in code. No external photographs, font files or AI-generated images are required. Reference publications retain their original copyright; only selected values and paraphrased concepts are used.

## Interpretation boundary

The application does not provide real-time climate observations, calibrated forecasts, actual flood/disease occurrence rates, regional vulnerability maps, individual medical advice, or quantified personal carbon savings. Read the [model guide](climate-model.md) before extending it. Reference dates identify what was reviewed; they are not an assertion that older published projections are the latest available science.
