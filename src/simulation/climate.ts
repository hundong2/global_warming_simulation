/** Educational reference explorer. No DOM, graphics, remote data, or random state. */
export type ScenarioId = 'low' | 'middle' | 'high' | 'custom';
export type Enso = 'neutral' | 'nino' | 'nina';
export type Layer = 'temperature' | 'sea' | 'ice' | 'cyclone';
export interface Settings {
  scenario: ScenarioId;
  target: number;
  year: number;
  enso: Enso;
  layer: Layer;
  shear: number;
  humidity: number;
  latitude: number;
  adaptation: number;
}
export const SCENARIOS = {
  low: { name: '강한 감축', ssp: 'SSP1-2.6', target: 1.8, sea: [0.32, 0.62] },
  middle: {
    name: '중간 배출',
    ssp: 'SSP2-4.5',
    target: 2.7,
    sea: [0.44, 0.76],
  },
  high: {
    name: '매우 높은 배출',
    ssp: 'SSP5-8.5',
    target: 4.4,
    sea: [0.63, 1.01],
  },
} as const;
export const DEFAULT: Settings = {
  scenario: 'middle',
  target: 2.7,
  year: 2050,
  enso: 'neutral',
  layer: 'temperature',
  shear: 8,
  humidity: 75,
  latitude: 18,
  adaptation: 25,
};
export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
export function interpolate(
  x: number,
  points: readonly (readonly [number, number])[],
): number {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [a, b] = [points[i - 1], points[i]];
    if (x <= b[0]) return a[1] + ((x - a[0]) / (b[0] - a[0])) * (b[1] - a[1]);
  }
  return points.at(-1)![1];
}
function finite(value: unknown, fallback: number, min: number, max: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? clamp(value, min, max)
    : fallback;
}
export function normalize(raw: Partial<Settings>): Settings {
  const scenario = ['low', 'middle', 'high', 'custom'].includes(
    raw.scenario ?? '',
  )
    ? raw.scenario!
    : DEFAULT.scenario;
  return {
    scenario,
    target:
      scenario === 'custom'
        ? finite(raw.target, 2.7, 1.5, 4.4)
        : SCENARIOS[scenario].target,
    year: Math.round(finite(raw.year, DEFAULT.year, 2020, 2100)),
    enso: ['neutral', 'nino', 'nina'].includes(raw.enso ?? '')
      ? raw.enso!
      : DEFAULT.enso,
    layer: ['temperature', 'sea', 'ice', 'cyclone'].includes(raw.layer ?? '')
      ? raw.layer!
      : DEFAULT.layer,
    shear: finite(raw.shear, DEFAULT.shear, 0, 30),
    humidity: finite(raw.humidity, DEFAULT.humidity, 20, 100),
    latitude: finite(raw.latitude, DEFAULT.latitude, 0, 30),
    adaptation: finite(raw.adaptation, DEFAULT.adaptation, 0, 100),
  };
}
export function seaRange(target: number): [number, number] {
  const knots = [
    [1.5, 0.28, 0.55],
    [1.8, 0.32, 0.62],
    [2.7, 0.44, 0.76],
    [4.4, 0.63, 1.01],
  ];
  return [0, 1].map((i) =>
    interpolate(
      target,
      knots.map((k) => [k[0], k[i + 1]]),
    ),
  ) as [number, number];
}
/** IPCC AR6 WGI SPM.6: frequency of a preindustrial once-in-10-year heavy precipitation event over land. */
export function precipitationRatio(warming: number) {
  return interpolate(warming, [
    [0, 1],
    [1, 1.3],
    [1.5, 1.5],
    [2, 1.7],
    [4, 2.7],
  ]);
}
/** Deliberately illustrative bell-shaped thermal suitability, not a disease-specific fit. */
export function vectorSuitability(celsius: number) {
  return Math.exp(-(((celsius - 28) / 8) ** 2)) * 100;
}
export function ensoAnomaly(lat: number, lon: number, enso: Enso) {
  const sign = enso === 'nino' ? 1 : enso === 'nina' ? -1 : 0;
  const delta = ((lon + 140 + 540) % 360) - 180;
  return sign * 1.8 * Math.exp(-((lat / 12) ** 2) - (delta / 48) ** 2);
}
export function oceanTemperature(
  lat: number,
  lon: number,
  warming: number,
  enso: Enso,
) {
  return (
    28 -
    31 * Math.sin((Math.abs(lat) * Math.PI) / 180) ** 3 +
    0.65 * (warming - 1.2) +
    ensoAnomaly(lat, lon, enso)
  );
}
export function cycloneSuitability(
  sst: number,
  shear: number,
  humidity: number,
  latitude: number,
) {
  if (sst < 26.5 || Math.abs(latitude) < 5) return 0;
  return (
    100 *
    clamp((sst - 26) / 4, 0, 1) *
    clamp(1 - shear / 30, 0, 1) *
    clamp((humidity - 30) / 50, 0, 1)
  );
}
export function evaluate(raw: Settings) {
  const s = normalize(raw);
  const progress = (s.year - 2020) / 80;
  const warming = 1.2 + (s.target - 1.2) * progress;
  const endpoint =
    s.scenario === 'custom'
      ? seaRange(s.target)
      : ([...SCENARIOS[s.scenario].sea] as [number, number]);
  // 0.08 m in 2020 is an authored educational anchor, relative to 1995–2014.
  const sea = endpoint.map((v) => 0.08 + (v - 0.08) * progress ** 1.25) as [
    number,
    number,
  ];
  const glacierTarget = interpolate(s.target, [
    [1.5, 26],
    [4, 41],
  ]);
  const glacierSpread = interpolate(s.target, [
    [1.5, 6],
    [4, 11],
  ]);
  const glacierLoss = (glacierTarget * (s.year - 2015)) / 85;
  const rain = precipitationRatio(warming);
  const sst = oceanTemperature(s.latitude, 140, warming, s.enso);
  const cyclone = cycloneSuitability(sst, s.shear, s.humidity, s.latitude);
  const flood =
    clamp(25 * rain + sea[1] * 40, 0, 100) * (1 - s.adaptation * 0.006);
  const vectorTemperatures = [19, 24, 29, 32].map((t) => t + (warming - 1.2));
  const vectors = vectorTemperatures.map(
    (t) => vectorSuitability(t) * (1 - s.adaptation * 0.005),
  );
  return {
    warming,
    sea,
    endpoint,
    glacierTarget,
    glacierSpread,
    glacierLoss,
    rain,
    sst,
    cyclone,
    flood,
    vectors,
    vectorTemperatures,
    progress,
  };
}
export function encodeSettings(s: Settings) {
  return new URLSearchParams(
    Object.entries(s).map(([k, v]) => [k, String(v)]),
  ).toString();
}
export function decodeSettings(query: string): Settings {
  const params = new URLSearchParams(query.replace(/^#/, ''));
  const raw: Record<string, unknown> = {};
  for (const key of Object.keys(DEFAULT)) {
    const v = params.get(key);
    if (v !== null && v.trim() !== '')
      raw[key] =
        typeof DEFAULT[key as keyof Settings] === 'number' ? Number(v) : v;
  }
  return normalize(raw);
}
