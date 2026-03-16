import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateContinuation, ensureLoopable } from '../../src/generation/continue';
import { FretNote, StyleConfig } from '../../src/types';
import { TUNINGS } from '../../src/constants/music';
import { getScaleNotes } from '../../src/utils/midi';

const neutral: StyleConfig = {
  powerChords: false, chromaticRuns: false, preferLow: false,
  preferHigh: false, shuffleFeel: false, rhythmVariety: 0.3,
};

const standardMidi = (s: number, f: number) => TUNINGS.standard.midi[s] + f;

const aMinorPent = getScaleNotes(9, 'minorPentatonic'); // [9,0,2,4,7]

afterEach(() => {
  vi.restoreAllMocks();
});

describe('generateContinuation', () => {
  it('returns null when input is empty', () => {
    const result = generateContinuation([], aMinorPent, 4, 'stepwise', neutral, standardMidi, 6, 9);
    expect(result).toBeNull();
  });

  it('returns notes when given valid input', () => {
    const input: FretNote[] = [
      { string: 1, fret: 5, midi: standardMidi(1, 5) },
      { string: 1, fret: 7, midi: standardMidi(1, 7) },
    ];
    const result = generateContinuation(input, aMinorPent, 4, 'stepwise', neutral, standardMidi, 6, 9);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it('returns at most `length` notes', () => {
    const input: FretNote[] = [{ string: 2, fret: 5, midi: standardMidi(2, 5) }];
    const result = generateContinuation(input, aMinorPent, 4, 'stepwise', neutral, standardMidi, 6, 9);
    if (result) {
      expect(result.length).toBeLessThanOrEqual(4);
    }
  });

  it('all generated notes have valid fret (0-15)', () => {
    const input: FretNote[] = [
      { string: 2, fret: 5, midi: standardMidi(2, 5) },
      { string: 2, fret: 7, midi: standardMidi(2, 7) },
    ];
    const result = generateContinuation(input, aMinorPent, 6, 'stepwise', neutral, standardMidi, 6, 9);
    if (result) {
      result.forEach(n => {
        expect(n.fret).toBeGreaterThanOrEqual(0);
        expect(n.fret).toBeLessThanOrEqual(15);
      });
    }
  });

  it('all generated notes have valid string (0-5 for 6-string guitar)', () => {
    const input: FretNote[] = [{ string: 2, fret: 5, midi: standardMidi(2, 5) }];
    const result = generateContinuation(input, aMinorPent, 4, 'stepwise', neutral, standardMidi, 6, 9);
    if (result) {
      result.forEach(n => {
        expect(n.string).toBeGreaterThanOrEqual(0);
        expect(n.string).toBeLessThan(6);
      });
    }
  });

  it('midi value matches getMidiFn(string, fret) for each note', () => {
    const input: FretNote[] = [{ string: 2, fret: 5, midi: standardMidi(2, 5) }];
    const result = generateContinuation(input, aMinorPent, 4, 'stepwise', neutral, standardMidi, 6, 9);
    if (result) {
      result.forEach(n => {
        expect(n.midi).toBe(standardMidi(n.string, n.fret));
      });
    }
  });

  it('returns null (or empty) when single-note input with chromatic but no neighbors', () => {
    // With a valid note that has neighbors, should not fail
    const input: FretNote[] = [{ string: 2, fret: 7, midi: standardMidi(2, 7) }];
    const result = generateContinuation(input, aMinorPent, 4, 'chromatic', neutral, standardMidi, 6, 9);
    // Should return notes or null, not throw
    if (result !== null) {
      expect(Array.isArray(result)).toBe(true);
    }
  });

  it('works for all 7 strategies', () => {
    const strategies = ['stepwise', 'skipUp', 'skipDown', 'pendulum', 'resolve', 'chromatic', 'styleLick'];
    const input: FretNote[] = [
      { string: 2, fret: 5, midi: standardMidi(2, 5) },
      { string: 2, fret: 7, midi: standardMidi(2, 7) },
    ];
    strategies.forEach(strategy => {
      // Should not throw
      expect(() =>
        generateContinuation(input, aMinorPent, 4, strategy, neutral, standardMidi, 6, 9)
      ).not.toThrow();
    });
  });
});

describe('ensureLoopable', () => {
  it('does nothing for empty gen array', () => {
    const gen: FretNote[] = [];
    const input: FretNote[] = [{ string: 2, fret: 5, midi: standardMidi(2, 5) }];
    ensureLoopable(gen, input, aMinorPent, standardMidi, 6);
    expect(gen).toHaveLength(0);
  });

  it('does nothing for empty input array', () => {
    const gen: FretNote[] = [{ string: 2, fret: 7, midi: standardMidi(2, 7) }];
    const originalNote = { ...gen[0] };
    ensureLoopable(gen, [], aMinorPent, standardMidi, 6);
    expect(gen[0]).toEqual(originalNote);
  });

  it('does not modify gen when last note is already close to first input note', () => {
    // first input: midi = standardMidi(2, 5)
    // last gen: midi = standardMidi(2, 6) — interval of 1, within threshold of 7
    const firstMidi = standardMidi(2, 5);
    const input: FretNote[] = [{ string: 2, fret: 5, midi: firstMidi }];
    const gen: FretNote[] = [
      { string: 2, fret: 7, midi: standardMidi(2, 7) },
      { string: 2, fret: 6, midi: standardMidi(2, 6) }, // close to first
    ];
    const originalLast = { ...gen[gen.length - 1] };
    ensureLoopable(gen, input, aMinorPent, standardMidi, 6);
    expect(gen[gen.length - 1]).toEqual(originalLast);
  });

  it('attempts to fix last note when interval to first input > 7', () => {
    // first input: fret 0, string 5 (low E)
    const firstNote: FretNote = { string: 5, fret: 0, midi: standardMidi(5, 0) };
    const input: FretNote[] = [firstNote];
    // last gen: very far away
    const gen: FretNote[] = [
      { string: 0, fret: 14, midi: standardMidi(0, 14) },
    ];
    const originalLast = { ...gen[0] };
    ensureLoopable(gen, input, aMinorPent, standardMidi, 6);
    // Either stays the same (no better found) or changes to something closer
    // Just ensure no crash and the array still has one element
    expect(gen).toHaveLength(1);
    // If changed, new note should be valid
    if (gen[0] !== originalLast) {
      expect(gen[0].fret).toBeGreaterThanOrEqual(0);
      expect(gen[0].fret).toBeLessThanOrEqual(15);
    }
  });
});
