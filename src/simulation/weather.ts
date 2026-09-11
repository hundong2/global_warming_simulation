import {
  clamp,
  evaluate,
  normalize,
  oceanTemperature,
  type Settings,
} from './climate';
import type { LandQuery } from './geography';

/** Authored weather experiment, not a calibrated frequency, wind or track forecast. */
export interface StormPoint {
  age: number;
  lat: number;
  lon: number;
  intensity: number;
  land: boolean;
}
export interface StormTrack {
  id: number;
  birth: number;
  points: StormPoint[];
}
export interface StormSeason {
  candidateCount: number;
  tracks: StormTrack[];
  mode: Settings['stormMode'];
}
export interface ActiveStorm extends StormPoint {
  id: number;
  birth: number;
  stage: '형성' | '발달' | '성숙' | '쇠퇴';
  history: StormPoint[];
}
export interface WeatherSnapshot {
  day: number;
  candidateCount: number;
  storms: ActiveStorm[];
  mode: Settings['stormMode'];
}
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const seed = (id: number, n: number) => {
  const x = Math.sin(id * 127.1 + n * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export function candidateCount(settings: Settings) {
  const s = normalize(settings),
    warming = evaluate(s).warming;
  return s.stormMode === 'reference'
    ? 4
    : Math.min(12, 4 + Math.floor(Math.max(0, warming - 1.2) * 2.5));
}
export function buildStormSeason(
  raw: Settings,
  isLand: LandQuery = () => false,
): StormSeason {
  const s = normalize(raw),
    climate = evaluate(s),
    count = candidateCount(s);
  const season: StormSeason = {
    candidateCount: count,
    tracks: [],
    mode: s.stormMode,
  };
  if (climate.cyclone <= 0) return season;
  for (let id = 0; id < count; id++) {
    const birth = (id * 3.7) % 14;
    let lat = clamp(s.latitude - 6 + seed(id + 1, 1) * 12, 5, 28);
    let lon = 136 + ((id * 19.3) % 50) + (seed(id + 1, 2) - 0.5) * 8;
    // Move genesis eastward until the coarse source geography indicates water.
    for (let tries = 0; isLand(lat, lon) && tries < 18; tries++) lon += 2;
    if (
      isLand(lat, lon) ||
      oceanTemperature(lat, lon, climate.warming, s.enso) < 26.5
    )
      continue;
    const points: StormPoint[] = [];
    let intensity = 0;
    const variability =
      (s.trackVariability / 100) *
      (s.stormMode === 'stress' ? 1 + 0.22 * (climate.warming - 1.2) : 1);
    const phase = seed(id + 1, 3) * Math.PI * 2;
    for (let step = 0; step <= 64; step++) {
      const age = step * 0.25,
        land = isLand(lat, lon);
      const sst = oceanTemperature(lat, lon, climate.warming, s.enso);
      const growth = smooth(0, 3.5, age),
        decay = 1 - smooth(9, 16, age);
      const potential = clamp(
        ((0.42 + 0.15 * (sst - 26.5)) * (1 - s.shear / 35) * s.humidity) / 85,
        0,
        1,
      );
      const equilibrium =
        growth * decay * potential * (sst < 26.5 ? 0 : land ? 0.12 : 1);
      intensity =
        step === 0
          ? 0
          : intensity +
            (equilibrium - intensity) * (land || sst < 26.5 ? 0.35 : 0.18);
      points.push({ age, lat, lon, intensity: clamp(intensity, 0, 1), land });
      // Degrees/day in a schematic steering field. No temperature-to-track forecast is implied.
      const turn = smooth(19 + seed(id + 1, 4) * 4, 32, lat);
      const vortex = Math.exp(-(((age - 7) / 4) ** 2));
      const east =
        -2.1 +
        6 * turn +
        variability * 3.6 * Math.sin(age * 0.95 + phase) * vortex;
      const north =
        0.95 +
        seed(id + 1, 5) * 0.5 +
        variability * 2.5 * Math.cos(age * 0.95 + phase) * vortex;
      lon += (east * 0.25) / Math.max(0.6, Math.cos((lat * Math.PI) / 180));
      lat = clamp(lat + north * 0.25, 3, 55);
    }
    season.tracks.push({ id, birth, points });
  }
  return season;
}
export function sampleStormSeason(
  season: StormSeason,
  day: number,
): WeatherSnapshot {
  const safeDay = Number.isFinite(day) ? clamp(day, 0, 30) : 0;
  const storms: ActiveStorm[] = [];
  for (const track of season.tracks) {
    const age = safeDay - track.birth;
    if (age <= 0 || age >= 16) continue;
    const index = Math.min(63, Math.floor(age / 0.25)),
      fraction = (age - index * 0.25) / 0.25;
    const a = track.points[index],
      b = track.points[index + 1];
    const blend = (key: 'lat' | 'lon' | 'intensity') =>
      a[key] + (b[key] - a[key]) * fraction;
    const point = {
      age,
      lat: blend('lat'),
      lon: blend('lon'),
      intensity: blend('intensity'),
      land: fraction < 0.5 ? a.land : b.land,
    };
    if (point.intensity < 0.018) continue;
    storms.push({
      ...point,
      id: track.id,
      birth: track.birth,
      stage:
        point.land || age > 10
          ? '쇠퇴'
          : age < 2
            ? '형성'
            : age < 5
              ? '발달'
              : '성숙',
      history: [...track.points.slice(0, index + 1), point],
    });
  }
  return {
    day: safeDay,
    candidateCount: season.candidateCount,
    storms,
    mode: season.mode,
  };
}
