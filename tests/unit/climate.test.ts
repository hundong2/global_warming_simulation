import { describe, expect, it } from 'vitest';
import {
  DEFAULT,
  cycloneSuitability,
  decodeSettings,
  encodeSettings,
  ensoAnomaly,
  evaluate,
  normalize,
  oceanTemperature,
  precipitationRatio,
  seaRange,
  vectorSuitability,
} from '../../src/simulation/climate';
describe('Independent research reference points', () => {
  it.each([
    ['low', 1.8, 0.32, 0.62],
    ['middle', 2.7, 0.44, 0.76],
    ['high', 4.4, 0.63, 1.01],
  ] as const)(
    'IPCC Table SPM.1 and B.5.3: %s',
    (scenario, temperature, low, high) => {
      const m = evaluate({ ...DEFAULT, scenario, year: 2100 });
      expect(m.warming).toBeCloseTo(temperature);
      expect(m.sea[0]).toBeCloseTo(low);
      expect(m.sea[1]).toBeCloseTo(high);
    },
  );
  it.each([
    [0, 1],
    [1, 1.3],
    [1.5, 1.5],
    [2, 1.7],
    [4, 2.7],
  ])('IPCC SPM.6 at %s°C = %s times', (temperature, frequency) =>
    expect(precipitationRatio(temperature)).toBe(frequency),
  );
  it.each([
    [1.5, 26, 6],
    [4, 41, 11],
  ])(
    'Rounce et al. 2100 glacier endpoint at %s°C',
    (target, loss, uncertainty) => {
      const m = evaluate({
        ...DEFAULT,
        scenario: 'custom',
        target,
        year: 2100,
      });
      expect(m.glacierLoss).toBe(loss);
      expect(m.glacierSpread).toBe(uncertainty);
    },
  );
  it('does not extrapolate precipitation or glacier references past 4°C', () => {
    expect(precipitationRatio(4.4)).toBe(2.7);
    expect(
      evaluate({ ...DEFAULT, scenario: 'high', year: 2100 }).glacierLoss,
    ).toBe(41);
  });
  it('custom sea reference reproduces 1.5°C anchor and interpolates between scenarios', () => {
    expect(seaRange(1.5)).toEqual([0.28, 0.55]);
    const mid = seaRange(2.25);
    expect(mid[0]).toBeCloseTo(0.38);
    expect(mid[1]).toBeCloseTo(0.69);
  });
});
describe('Physical direction and stated educational invariants', () => {
  it('the default western Pacific experiment has a warm tropical environment', () => {
    const m = evaluate(DEFAULT);
    expect(m.sst).toBeGreaterThan(26.5);
    expect(m.cyclone).toBeGreaterThan(0);
  });
  it('same authored starting temperature and sea level for every preset', () => {
    for (const scenario of ['low', 'middle', 'high'] as const) {
      const m = evaluate({ ...DEFAULT, scenario, year: 2020 });
      expect(m.warming).toBe(1.2);
      expect(m.sea).toEqual([0.08, 0.08]);
    }
  });
  it('time increases sea level and glacier loss with ordered finite bounds', () => {
    for (const scenario of ['low', 'middle', 'high'] as const) {
      let previous = evaluate({ ...DEFAULT, scenario, year: 2020 });
      for (let year = 2021; year <= 2100; year++) {
        const m = evaluate({ ...DEFAULT, scenario, year });
        expect(m.sea[0]).toBeGreaterThanOrEqual(previous.sea[0]);
        expect(m.sea[1]).toBeGreaterThanOrEqual(m.sea[0]);
        expect(m.glacierLoss).toBeGreaterThan(previous.glacierLoss);
        expect(m.glacierLoss).toBeLessThan(100);
        previous = m;
      }
    }
  });
  it('ENSO has opposite signs in eastern equatorial Pacific and no secular ice/sea effect', () => {
    expect(ensoAnomaly(0, -140, 'nino')).toBeCloseTo(1.8);
    expect(ensoAnomaly(0, -140, 'nina')).toBeCloseTo(-1.8);
    expect(ensoAnomaly(70, -140, 'nino')).toBeLessThan(0.001);
    const a = evaluate({ ...DEFAULT, enso: 'nino' }),
      b = evaluate({ ...DEFAULT, enso: 'nina' });
    expect(a.sea).toEqual(b.sea);
    expect(a.glacierLoss).toEqual(b.glacierLoss);
  });
  it('ocean field wraps around the dateline continuously', () =>
    expect(oceanTemperature(0, -180, 2, 'nino')).toBeCloseTo(
      oceanTemperature(0, 180, 2, 'nino'),
    ));
  it('cyclone conditions fail under cold water, equatorial latitude, dry air or strong shear', () => {
    expect(cycloneSuitability(25, 0, 100, 15)).toBe(0);
    expect(cycloneSuitability(30, 0, 100, 0)).toBe(0);
    expect(cycloneSuitability(30, 30, 100, 15)).toBe(0);
    expect(cycloneSuitability(30, 0, 20, 15)).toBe(0);
    expect(cycloneSuitability(30, 0, 100, 15)).toBe(100);
  });
  it('adaptation reduces illustrative exposure but cannot change physical climate', () => {
    const a = evaluate({ ...DEFAULT, adaptation: 0 }),
      b = evaluate({ ...DEFAULT, adaptation: 100 });
    expect(b.flood).toBeLessThan(a.flood);
    expect(b.vectors[0]).toBeLessThan(a.vectors[0]);
    expect(b.sea).toEqual(a.sea);
    expect(b.warming).toBe(a.warming);
    expect(b.rain).toBe(a.rain);
  });
  it('vector suitability is bounded and declines above its illustrative optimum', () => {
    expect(vectorSuitability(28)).toBe(100);
    expect(vectorSuitability(40)).toBeLessThan(vectorSuitability(32));
    expect(vectorSuitability(16)).toBeCloseTo(vectorSuitability(40));
  });
});
describe('Share input validation', () => {
  it('round trips every setting without changing values', () => {
    const s = {
      ...DEFAULT,
      scenario: 'custom' as const,
      target: 3.6,
      enso: 'nina' as const,
      year: 2082,
      humidity: 55,
      shear: 18,
      latitude: 12,
      adaptation: 60,
    };
    expect(decodeSettings(encodeSettings(s))).toEqual(s);
  });
  it('rejects nonfinite and unknown fields, clamps numbers and rounds years', () => {
    const s = decodeSettings(
      'year=Infinity&scenario=oops&target=NaN&enso=%3Cscript%3E&shear=999&latitude=-5',
    );
    expect(s.year).toBe(2050);
    expect(s.scenario).toBe('middle');
    expect(s.enso).toBe('neutral');
    expect(s.shear).toBe(30);
    expect(s.latitude).toBe(0);
    expect(normalize({ year: 2050.4 }).year).toBe(2050);
  });
  it('empty numeric values preserve defaults', () =>
    expect(decodeSettings('year=&target=')).toEqual(DEFAULT));
});
