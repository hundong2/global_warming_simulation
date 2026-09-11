import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  DEFAULT,
  encodeSettings,
  decodeSettings,
  normalize,
  type Settings,
} from '../../src/simulation/climate';
import {
  createLandQuery,
  type Geography,
} from '../../src/simulation/geography';
import {
  buildStormSeason,
  candidateCount,
  sampleStormSeason,
} from '../../src/simulation/weather';

const hot: Settings = { ...DEFAULT, year: 2100, scenario: 'high' };
const cold: Settings = { ...DEFAULT, year: 2100, scenario: 'low' };
const geography = JSON.parse(
  readFileSync('public/data/countries.geojson', 'utf8'),
) as Geography;
const isLand = createLandQuery(geography);
describe('Deterministic, explicitly fictional weather experiment', () => {
  it('increases authored candidates in stress mode, while comparison mode fixes four', () => {
    expect(candidateCount(hot)).toBeGreaterThan(candidateCount(cold));
    expect(candidateCount(hot)).toBeLessThanOrEqual(12);
    expect(candidateCount({ ...hot, stormMode: 'reference' })).toBe(4);
    expect(candidateCount({ ...cold, stormMode: 'reference' })).toBe(4);
    expect(candidateCount({ ...hot, year: 2020 })).toBe(
      candidateCount({ ...cold, year: 2020 }),
    );
  });
  it('reproduces all trajectories and snapshots from shared settings', () => {
    const state = { ...hot, weatherDay: 11.35, trackVariability: 90 };
    const a = buildStormSeason(state, isLand),
      b = buildStormSeason(decodeSettings(encodeSettings(state)), isLand);
    expect(a).toEqual(b);
    expect(sampleStormSeason(a, state.weatherDay)).toEqual(
      sampleStormSeason(b, state.weatherDay),
    );
  });
  it('keeps all paths finite, bounded, and starts candidates at sea', () => {
    const season = buildStormSeason(hot, isLand);
    expect(season.tracks.length).toBeGreaterThan(0);
    for (const track of season.tracks) {
      expect(isLand(track.points[0].lat, track.points[0].lon)).toBe(false);
      expect(track.points[0].intensity).toBe(0);
      for (const p of track.points) {
        expect([p.lat, p.lon, p.intensity, p.age].every(Number.isFinite)).toBe(
          true,
        );
        expect(p.lat).toBeGreaterThanOrEqual(3);
        expect(p.lat).toBeLessThanOrEqual(55);
        expect(p.intensity).toBeGreaterThanOrEqual(0);
        expect(p.intensity).toBeLessThanOrEqual(1);
      }
    }
  });
  it.each([{ shear: 30 }, { latitude: 0 }, { humidity: 20 }])(
    'respects failed formation conditions: %o',
    (override) => {
      expect(
        buildStormSeason({ ...hot, ...override }, isLand).tracks,
      ).toHaveLength(0);
    },
  );
  it('weakens developed storms after reaching a synthetic land boundary', () => {
    const ocean = buildStormSeason(hot),
      coast = buildStormSeason(hot, (lat) => lat > 26);
    let comparisons = 0;
    for (const track of coast.tracks) {
      const reference = ocean.tracks.find((t) => t.id === track.id)!;
      track.points.forEach((p, index) => {
        if (p.land && p.age > 5 && reference.points[index].intensity > 0.15) {
          expect(p.intensity).toBeLessThan(reference.points[index].intensity);
          comparisons++;
        }
      });
    }
    expect(comparisons).toBeGreaterThan(0);
  });
  it('moves continuously on the weather clock and completes all lifecycles by day 30', () => {
    const season = buildStormSeason(hot, isLand);
    const a = sampleStormSeason(season, 8),
      b = sampleStormSeason(season, 8.01);
    const first = a.storms[0],
      next = b.storms.find((s) => s.id === first.id)!;
    expect(
      Math.hypot(first.lat - next.lat, first.lon - next.lon),
    ).toBeGreaterThan(0);
    expect(Math.hypot(first.lat - next.lat, first.lon - next.lon)).toBeLessThan(
      0.2,
    );
    expect(sampleStormSeason(season, 0).storms).toHaveLength(0);
    expect(sampleStormSeason(season, 30).storms).toHaveLength(0);
    expect(sampleStormSeason(season, Number.NaN).day).toBe(0);
  });
  it('separates authored path variability from the comparison-mode temperature', () => {
    const refCold = buildStormSeason({ ...cold, stormMode: 'reference' });
    const refHot = buildStormSeason({ ...hot, stormMode: 'reference' });
    const positions = (season: ReturnType<typeof buildStormSeason>) =>
      season.tracks[0].points.map(({ lat, lon }) => [lat, lon]);
    expect(positions(refCold)).toEqual(positions(refHot));
    expect(
      positions(buildStormSeason({ ...hot, trackVariability: 0 })),
    ).not.toEqual(
      positions(buildStormSeason({ ...hot, trackVariability: 100 })),
    );
  });
  it('validates legacy and malformed weather settings', () => {
    expect(decodeSettings('#year=2070').weatherDay).toBe(DEFAULT.weatherDay);
    const state = normalize({ weatherDay: Infinity, trackVariability: -100 });
    expect(state.weatherDay).toBe(DEFAULT.weatherDay);
    expect(state.trackVariability).toBe(0);
    expect(normalize({ weatherDay: 200 }).weatherDay).toBe(30);
  });
});
describe('Local land geometry', () => {
  it('recognizes independent land/ocean reference locations and wrapped longitude', () => {
    expect(isLand(36, 128)).toBe(true);
    expect(isLand(20, 150)).toBe(false);
    expect(isLand(36, 488)).toBe(true);
    expect(isLand(36, -592)).toBe(true);
  });
  it('respects polygon holes', () => {
    const query = createLandQuery({
      features: [
        {
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [10, 0],
                [10, 10],
                [0, 10],
                [0, 0],
              ],
              [
                [3, 3],
                [7, 3],
                [7, 7],
                [3, 7],
                [3, 3],
              ],
            ],
          },
        },
      ],
    });
    expect(query(1, 1)).toBe(true);
    expect(query(5, 5)).toBe(false);
    expect(query(12, 5)).toBe(false);
  });
});
