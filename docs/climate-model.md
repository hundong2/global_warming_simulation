# Climate model and interpretation

**English** | [한국어](ko/climate-model.md) · [Documentation](../README.md#documentation)

This application explores reference values and simple authored relationships. It does not run an Earth system model, hydrodynamic flood model, weather forecast, or epidemiological transmission model. Sources and omissions are listed in [sources](sources.md).

## Inputs and baselines

`Y`: year, 2020–2100. `G`: target warming, 1.5–4.4°C relative to 1850–1900. Presets map SSP1-2.6 to 1.8°C, SSP2-4.5 to 2.7°C, and SSP5-8.5 to 4.4°C (IPCC AR6 WGI Table SPM.1 best estimates for 2081–2100). We use these period averages as an educational 2100 endpoint; these are not precise temperatures of the calendar year 2100 or current policy forecasts. SSP means Shared Socioeconomic Pathway.

The starting point, 2020 at +1.2°C, is an authored common scenario anchor, not a live observation. Define `p = (Y − 2020) / 80`. The displayed warming is `T = 1.2 + (G − 1.2)p`. Natural variability, annual weather, emissions-to-temperature physics and feedback loops are omitted. ENSO does not change this long-term trajectory.

## Sea level

The 2100 likely ranges from IPCC AR6 WGI B.5.3, relative to 1995–2014, are:

| Reference scenario                     | Warming anchor                                                   | Sea-level range |
| -------------------------------------- | ---------------------------------------------------------------- | --------------- |
| SSP1-1.9 (custom interpolation anchor) | 1.5°C (rounded educational anchor; not its Table SPM.1 estimate) | 0.28–0.55 m     |
| SSP1-2.6                               | 1.8°C                                                            | 0.32–0.62 m     |
| SSP2-4.5                               | 2.7°C                                                            | 0.44–0.76 m     |
| SSP5-8.5                               | 4.4°C                                                            | 0.63–1.01 m     |

For custom `G`, linearly interpolate each range bound across these anchors. The 1.5°C association is authored: a warming level alone does not determine a unique sea-level outcome. For each endpoint bound `S2100`, calculate `S(Y) = 0.08 + (S2100 − 0.08)p^1.25`. The 0.08 m starting value and exponent are educational assumptions. Intermediate ranges are not assessed confidence intervals. Preset 2100 ranges retain the source's likely-range interpretation; a custom interval is an interpolation, not an IPCC scenario.

The values already include multiple contributors such as thermal expansion and land-ice changes; we do not add the glacier percentage to sea level. Regional ocean dynamics, vertical land motion, tides, surge, terrain and coastal defenses are absent. Bright coastlines and the fictional coastal section are exaggerated illustrations, not flood footprints or a physically scaled rising sphere. The section keeps the datum fixed and shades the selected lower-to-upper range; its wave line is the arithmetic midpoint, not an assessed median.

## Glacier mass

Rounce et al. (2023) report global glacier mass loss excluding the Greenland and Antarctic ice sheets: **26 ± 6% at 1.5°C** and **41 ± 11% at 4°C**, by 2100 relative to 2015. The paper identifies these as ensemble medians with **95% confidence intervals**. They are not one standard deviation and not the fraction of glacier count disappearing.

We linearly interpolate the endpoint loss `L` and interval half-width over 1.5–4°C, clamping above 4°C. Time interpolation is `loss(Y) = L × (Y − 2015) / 85`; it is authored and is not the paper's annual output. This means even the model's 2020 loss depends on the selected future scenario; do not interpret it as an observed historical reconstruction. Symbols at eight representative mountain/glacier regions all use the same global remaining fraction. Linear symbol scale is `(1 − loss/100)^(1/3)`. Local glacier area, glacier counts, meltwater, calving and individual disappearance dates are not calculated. Greenland and Antarctica do not vanish in the globe display.

## Ocean and ENSO

ENSO means El Niño–Southern Oscillation, a natural ocean–atmosphere pattern. Let `e = 0, +1, −1` for neutral, El Niño and La Niña. With latitude `φ` in degrees and longitude offset `d` wrapped into [−180, 180] around 140°W:

```text
A = e × 1.8 × exp(−(φ/12)^2 − (d/48)^2)
SST = 28 − 31 × sin(|φ|π/180)^3 + 0.65 × (T − 1.2) + A
```

Every numeric coefficient in this ocean field is authored for visual teaching. It is not an observed SST product, ENSO index, event classification, ocean circulation or seasonal forecast. ENSO's eastern/central Pacific warm/cool sign is the source-backed concept. Seasonal evolution, thermocline and coupled winds are omitted. We do not project ENSO frequency from warming or apply Atlantic-specific cyclone effects to the western Pacific.

## Tropical cyclone environment

The virtual experiment uses 140°E and user-selected latitude, 0–30°N. `SST` is from the synthetic ocean above; `V` is vertical wind shear (0–30 m/s), `H` relative humidity (20–100%). `clip(x)` bounds x to 0–1:

```text
C = 0 if SST < 26.5°C or |latitude| < 5°
C = 100 × clip((SST−26)/4) × clip(1−V/30) × clip((H−30)/50) otherwise
```

The 26.5°C warm-water condition is informed by NOAA, which also describes a warm layer of depth about 50 m. We do not model that depth. The 5° cutoff and all score coefficients are simplified assumptions, not operational thresholds or a calibrated genesis index. Initial disturbances, upper-air stability, moisture profiles, ocean heat content and observed steering winds are absent. The separate [weather experiment](weather-model.md) creates authored candidates and tracks when the environment gate permits, using a deterministic steering field, lifecycle and coarse land mask. Cloud size, spin and development indices are illustrative, not wind-speed or track forecasts. Global cyclone frequency does not necessarily rise with warming even as intensity and rainfall can increase.

## Extreme precipitation and flood exposure

IPCC AR6 WGI Figure SPM.6 gives global land frequency ratios for a preindustrial once-in-10-year heavy precipitation event: warming 0, 1, 1.5, 2, 4°C → **1, 1.3, 1.5, 1.7, 2.7**. We linearly interpolate and clamp at the endpoints; 4.4°C shows the 4°C reference, explicitly labeled. We do not display unimplemented confidence ranges or convert the ratio into an exact local annual flood probability.

For adaptation `D` in 0–100, the illustrative flood exposure score is:

```text
F = min(100, max(0, 25 × rainRatio + 40 × seaUpper)) × (1 − 0.006D)
```

These coefficients are authored, uncalibrated, and unit-balancing visual choices. A global sea-level upper bound plus global precipitation does not predict a real site's flood risk. Adaptation changes exposure scores, not physical warming, sea level, ice or rain.

## Vector suitability, not infectious disease incidence

Four fictional climate zones start at 19, 24, 29, 32°C. Their temperature is `t = baseline + T − 1.2`. The authored thermal suitability is `100 × exp(−((t−28)/8)^2)`, multiplied by `(1−0.005D)` for fictional exposure reduction. The 28°C optimum, 8°C width, zone temperatures and adaptation factor are not fitted to any pathogen or mosquito species. This intentionally shows a bounded, non-monotonic response; excessive heat may lower the score.

No cases, deaths, incidence percentages or actual risk maps are estimated. Humidity and shear controls belong only to the cyclone experiment. Vector abundance, rainfall, standing water, sanitation, vector species, host immunity, mobility, surveillance and healthcare are missing. WHO supports the general climate–health relationship, not our coefficients. Waterborne disease is discussed as a climate-health relationship, not quantitatively modeled.

## Validation scope

Independent tests lock the research endpoints, ordered sea bounds, bounded ice and scores, ENSO sign and longitude wrapping, cyclone gating, non-monotonic suitability and adaptation independence. Passing tests verifies the implemented contracts, not predictive skill. Building a predictive tool would require licensed/traceable regional datasets, fitted models, uncertainty analysis, independent hindcasts and domain review.
