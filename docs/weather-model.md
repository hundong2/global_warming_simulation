# Weather experiment and visual scales

**English** | [한국어](ko/weather-model.md) · [Climate model](climate-model.md)

## Interpretation

This is a deterministic, authored 30-day tropical-cyclone animation experiment. NOAA supports the qualitative eye/eyewall/rainband structure, environmental constraints, steering and recurvature concepts; it does **not** validate the following coefficients. See [sources](sources.md). Candidates are fictional disturbances, not observed storms, annual frequency, forecast probabilities or simultaneous real-world counts. Warming does not necessarily increase global cyclone frequency. Warmer oceans can support stronger storms and heavier rainfall; this experiment does not quantify either in physical units.

The default **stress** mode deliberately increases candidate count and track variability with the selected year's warming to explore a crowded, unusual scenario. **Reference** mode fixes four candidates and removes temperature from the steering field. Neither mode is a climate projection. Varying steering can create bends, stalls and loops; warming causing more loops is an experimental assumption, not a research finding. Storm interactions, including the Fujiwhara effect, are absent.

## Pure, reproducible state

`src/simulation/weather.ts` receives validated climate settings and a pure land query. It returns tracks at 0.25-day intervals, then linearly samples them at `weatherDay` (0–30). The renderer consumes those samples; mesh positions never feed the model. Default weather day is 9, mode is `stress`, and `trackVariability` is 65/100. The hash and JSON preserve all three. The weather clock is independent of the selected climate year; playback runs at approximately one simulated day per real second, stopping at day 30.

Let `T` be the selected year's warming, `V` shear, `H` humidity, `φ` latitude, `λ` longitude (degrees), and `a` storm age in days. `clip` bounds to 0–1. Define `S(b,c,x) = t²(3−2t)`, with `t=clip((x−b)/(c−b))`. The deterministic seed is `u(i,n)=fract(sin(i×127.1+n×311.7)×43758.5453)`; `fract` subtracts the floor.

```text
Nreference = 4
Nstress = min(12, 4 + floor(max(0,T−1.2)×2.5))
i = 0 ... N−1
birth = (i×3.7) mod 14
φ0 = clamp(latitudeSetting−6 + 12u(i+1,1), 5, 28)
λ0 = 136 + (i×19.3 mod 50) + 8(u(i+1,2)−0.5)
```

If the climate environment score is zero, no tracks are generated. A land start shifts east by 2° up to 18 times; remaining land or SST below 26.5°C rejects that candidate. The displayed candidate count includes rejected and not-yet-active candidates. Active count requires age between 0 and 16 days and development index at least 0.018. Thus a warmer stress scenario need not have more active storms at every instant. Local Natural Earth polygons and holes determine land, with wrapped longitude. Small islands and coastline detail are missing.

## Development and motion

For each 0.25-day step, the local SST comes from the [synthetic ocean](climate-model.md). The development index `I` starts at zero. It is not wind speed, pressure, a storm category or occurrence probability.

```text
potential = clip((0.42 + 0.15(SST−26.5)) × (1−V/35) × H/85)
surface = 0 when SST < 26.5; otherwise 0.12 on land and 1 over water
equilibrium = S(0,3.5,a) × (1−S(9,16,a)) × potential × surface
Inew = clip(I + (equilibrium−I) × response)
response = 0.35 on land or cold water, otherwise 0.18
B = trackVariability/100 × (stress ? 1+0.22(T−1.2) : 1)
phase = 2πu(i+1,3)
turn = S(19+4u(i+1,4), 32, φ)
envelope = exp(−((a−7)/4)²)
east = −2.1 + 6turn + 3.6B sin(0.95a+phase) × envelope
north = 0.95 + 0.5u(i+1,5) + 2.5B cos(0.95a+phase) × envelope
λnew = λ + east×0.25/max(0.6,cos(φπ/180))
φnew = clamp(φ + north×0.25, 3, 55)
```

East/north are schematic degrees/day, not resolved atmospheric velocities. Track samples cover ages 0–16. The initially westward field turns eastward at higher latitude; its oscillating perturbation demonstrates irregular steering. Stage labels are illustrative: forming below age 2, developing below 5, mature thereafter, decaying on land or after age 10. They are not official intensity classifications. Cold-water decay is gradual; no extratropical transition, ocean cooling feedback, atmospheric dynamics, terrain-specific drag or seasonal cycle is solved.

## Display magnification

- Clouds are generated locally from deterministic noise, an eye, eyewall, diffuse shield and spiral bands. The eye becomes visible above index 0.42 and age 3. Diameter is `0.15+0.22I` display units; shear compresses one axis by `1−V/110`; opacity is capped at `0.23+1.3I`; spin is `1.15a+2.4i` radians. These sizes and rates are enlarged illustrations on a radius-one globe. Gold lines show only the sampled past path; no forecast cone is drawn. Earth depth hides far-side clouds.
- Glacier symbols retain a fixed amber 2015 footprint, scale current ice by the cube root of remaining mass, and shift it uphill by `0.065×(1−scale)` display units. The paired fictional valley places its front at `432−3.1×loss` SVG units. These exaggerated distances are not local area or length projections. Polar ice sheets remain fixed.
- The coast highlight uses a raster land union and distance to its boundary, avoiding bright internal country borders. Its display band is `1.3+5×seaUpper` pixels on a 1024×512 map. The fictional section uses `178−98×seaLevel` SVG units vertically, a fixed datum, lower/upper band, and midpoint wave line. It uses no elevation model and estimates no inundation area.

## Verification boundary

Tests cover reproducibility, bounded finite state, water genesis, conditional land weakening, formation gates, time interpolation, lifecycle completion, fixed versus stress counts, steering independence in reference mode, and land holes/reference locations. Browser checks verify visible movement, pause/end, shared reconstruction, enlarged comparisons and responsive layouts. These checks establish implementation behavior, not predictive skill.
