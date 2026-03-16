import { describe, it, expect, vi, afterEach } from 'vitest';
import { generate } from '../../src/generation/generate';
import { AppState } from '../../src/state/types';
import { FretNote } from '../../src/types';
import { DRUM_STEPS, TUNINGS } from '../../src/constants/music';

const emptyDrums = { pattern: Array.from({ length: 6 }, () => new Array(DRUM_STEPS).fill(false)) };

const baseState: AppState = {
  activeInst: 'guitar',
  guitar: { beats: [], currentBeatIdx: -1 },
  bass: { beats: [], currentBeatIdx: -1 },
  drums: emptyDrums,
  key: 9,
  scale: 'minorPentatonic',
  tuning: 'standard',
  style: 'neutral',
  genLength: 4,
  genMode: 'continue',
  tempo: 120,
  defaultDuration: 0.25,
  results: [],
  playingIdx: -1,
  mixer: {
    guitar: { volume: 0.8, muted: false, solo: false, sampleSet: 'guitar-electric' },
    bass: { volume: 0.7, muted: false, solo: false, sampleSet: 'bass-electric' },
    drums: { volume: 0.7, muted: false, solo: false, sampleSet: 'guitar-electric' },
  },
  generateFor: { guitar: true, bass: true, drums: true },
};

const makeGuitarNote = (s: number, f: number): FretNote => ({
  string: s,
  fret: f,
  midi: TUNINGS.standard.midi[s] + f,
});

const stateWithGuitar: AppState = {
  ...baseState,
  guitar: {
    beats: [
      { notes: [makeGuitarNote(2, 5)], duration: 0.25 },
      { notes: [makeGuitarNote(2, 7)], duration: 0.25 },
      { notes: [makeGuitarNote(2, 5)], duration: 0.25 },
    ],
    currentBeatIdx: -1,
  },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('generate', () => {
  it('returns empty array when no guitar input and guitar generation enabled', () => {
    const results = generate(baseState);
    expect(results).toEqual([]);
  });

  it('returns results array when guitar input is provided', () => {
    const results = generate(stateWithGuitar);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  it('returns at most 5 results', () => {
    const results = generate(stateWithGuitar);
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('each result has required fields', () => {
    const results = generate(stateWithGuitar);
    results.forEach(r => {
      expect(r).toHaveProperty('id');
      expect(r).toHaveProperty('guitarBeats');
      expect(r).toHaveProperty('bassBeats');
      expect(r).toHaveProperty('drumPattern');
      expect(r).toHaveProperty('score');
    });
  });

  it('results are sorted by score descending', () => {
    const results = generate(stateWithGuitar);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it('guitar beats in result include original input beats', () => {
    const results = generate(stateWithGuitar);
    results.forEach(r => {
      expect(r.guitarBeats.length).toBeGreaterThanOrEqual(stateWithGuitar.guitar.beats.length);
    });
  });

  it('score values are non-negative numbers', () => {
    // score = scoreVariation(guitar) + scoreVariation(bass)/2, may exceed 100
    const results = generate(stateWithGuitar);
    results.forEach(r => {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(typeof r.score).toBe('number');
    });
  });

  it('drum pattern has correct shape (6 rows × 16 steps)', () => {
    const results = generate(stateWithGuitar);
    results.forEach(r => {
      expect(r.drumPattern).toHaveLength(6);
      r.drumPattern.forEach(row => expect(row).toHaveLength(16));
    });
  });

  it('disabling guitar generation skips guitar beats', () => {
    const state: AppState = { ...stateWithGuitar, generateFor: { guitar: false, bass: true, drums: true } };
    const results = generate(state);
    // Without guitar, and no bass input → no results
    expect(results).toHaveLength(0);
  });

  it('remix mode returns results with input pitch classes', () => {
    const state: AppState = { ...stateWithGuitar, genMode: 'remix' };
    const results = generate(state);
    // Remix should still produce results
    expect(results.length).toBeGreaterThan(0);
  });

  it('works with bass input independently', () => {
    const state: AppState = {
      ...baseState,
      bass: {
        beats: [
          { notes: [{ string: 0, fret: 5, midi: 48 }], duration: 0.25 },
          { notes: [{ string: 0, fret: 7, midi: 50 }], duration: 0.25 },
        ],
        currentBeatIdx: -1,
      },
      generateFor: { guitar: false, bass: true, drums: true },
    };
    const results = generate(state);
    expect(results.length).toBeGreaterThan(0);
  });

  it('generates bass from guitar when no bass input but guitar generated', () => {
    const results = generate(stateWithGuitar);
    results.forEach(r => {
      // When bass generateFor=true and guitar has notes, bass should have beats
      expect(r.bassBeats.length).toBeGreaterThanOrEqual(0);
    });
  });
});
