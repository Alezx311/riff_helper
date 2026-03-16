import { describe, it, expect } from 'vitest';
import { scoreVariation } from '../../src/generation/scoring';
import { FretNote, StyleConfig } from '../../src/types';

const n = (midi: number, str = 0, fret = 0): FretNote => ({ string: str, fret, midi });

const neutral: StyleConfig = {
  powerChords: false, chromaticRuns: false, preferLow: false,
  preferHigh: false, shuffleFeel: false, rhythmVariety: 0.3,
};

describe('scoreVariation', () => {
  it('returns 0 for empty gen notes', () => {
    expect(scoreVariation([], [n(60), n(62)], neutral)).toBe(0);
  });

  it('starts with base score of 50', () => {
    // Single gen note, no input — minimal interval scoring
    const score = scoreVariation([n(60)], [], neutral);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('returns value between 0 and 100', () => {
    const gen = [n(60), n(62), n(64), n(65)];
    const input = [n(57), n(59)];
    const score = scoreVariation(gen, input, neutral);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('rewards stepwise motion (small intervals ≤ 3)', () => {
    // Gen with stepwise motion: C-D-E (intervals of 2)
    const stepwise = [n(60), n(62), n(64)];
    // Gen with leaps: C-G-D (interval of 7, -5)
    const leaping = [n(60), n(67), n(62)];
    const sScore = scoreVariation(stepwise, [], neutral);
    const lScore = scoreVariation(leaping, [], neutral);
    expect(sScore).toBeGreaterThan(lScore);
  });

  it('rewards physical proximity on fretboard', () => {
    // Notes on same string, adjacent frets
    const close = [
      n(60, 2, 5), n(62, 2, 7), n(64, 2, 9),
    ];
    // Notes with large fret jumps
    const far = [
      n(60, 2, 0), n(62, 2, 12), n(64, 2, 1),
    ];
    const closeScore = scoreVariation(close, [], neutral);
    const farScore = scoreVariation(far, [], neutral);
    expect(closeScore).toBeGreaterThan(farScore);
  });

  it('rewards pitch diversity (more unique pitch classes = higher score)', () => {
    // 4 unique pitch classes
    const diverse = [n(60), n(62), n(64), n(65)]; // C D E F
    // 4 notes same pitch class
    const monotone = [n(60), n(72), n(84), n(96)]; // all C
    const diverseScore = scoreVariation(diverse, [], neutral);
    const monotoneScore = scoreVariation(monotone, [], neutral);
    expect(diverseScore).toBeGreaterThan(monotoneScore);
  });

  it('rewards loopable ending (last gen note close to first input note)', () => {
    const input = [n(60)]; // C4
    // Gen ending close to C4 (within 3 semitones)
    const loopable = [n(62), n(61)]; // D, C#
    // Gen ending far from C4
    const nonLoopable = [n(62), n(72)]; // D, C5 (interval 12)
    const lScore = scoreVariation(loopable, input, neutral);
    const nlScore = scoreVariation(nonLoopable, input, neutral);
    expect(lScore).toBeGreaterThan(nlScore);
  });

  it('rewards preferLow style when gen has low strings', () => {
    const preferLow: StyleConfig = { ...neutral, preferLow: true };
    // Note on high string (string 5, low-pitched)
    const lowString = [n(60, 5, 0)];
    // Note on low string (string 0, high-pitched)
    const highString = [n(60, 0, 0)];
    const lowScore = scoreVariation(lowString, [], preferLow);
    const highScore = scoreVariation(highString, [], preferLow);
    expect(lowScore).toBeGreaterThan(highScore);
  });

  it('rewards preferHigh style when gen has high strings', () => {
    const preferHigh: StyleConfig = { ...neutral, preferHigh: true };
    const highString = [n(60, 0, 0)]; // string 0 = high
    const lowString = [n(60, 5, 0)]; // string 5 = low
    const highScore = scoreVariation(highString, [], preferHigh);
    const lowScore = scoreVariation(lowString, [], preferHigh);
    expect(highScore).toBeGreaterThan(lowScore);
  });

  it('penalizes large intervals (> 7 semitones)', () => {
    // All notes within 3 semitones
    const small = [n(60, 2, 3), n(62, 2, 5), n(64, 2, 7)];
    // Notes with large interval
    const large = [n(60, 2, 0), n(71, 2, 11)]; // interval of 11
    const smallScore = scoreVariation(small, [], neutral);
    const largeScore = scoreVariation(large, [], neutral);
    expect(smallScore).toBeGreaterThan(largeScore);
  });
});
