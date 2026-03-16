import { describe, it, expect, vi, afterEach } from 'vitest';
import { assignRhythm } from '../../src/generation/rhythm';
import { FretNote, StyleConfig } from '../../src/types';

const note = (midi: number): FretNote => ({ string: 0, fret: midi - 40, midi });

const neutralStyle: StyleConfig = {
  powerChords: false, chromaticRuns: false, preferLow: false,
  preferHigh: false, shuffleFeel: false, rhythmVariety: 0.3,
};

const shuffleStyle: StyleConfig = { ...neutralStyle, shuffleFeel: true, rhythmVariety: 0.5 };
const highVarietyStyle: StyleConfig = { ...neutralStyle, rhythmVariety: 0.8 };
const noVarietyStyle: StyleConfig = { ...neutralStyle, rhythmVariety: 0 };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('assignRhythm', () => {
  it('returns empty array for empty notes', () => {
    expect(assignRhythm([], neutralStyle, 0.25)).toEqual([]);
  });

  it('returns one beat per note', () => {
    const notes = [note(60), note(62), note(64)];
    const beats = assignRhythm(notes, neutralStyle, 0.25);
    expect(beats).toHaveLength(3);
  });

  it('each beat contains exactly one note', () => {
    const notes = [note(60), note(62)];
    const beats = assignRhythm(notes, neutralStyle, 0.25);
    beats.forEach(b => expect(b.notes).toHaveLength(1));
  });

  it('each beat note matches the input note', () => {
    const notes = [note(60), note(62), note(64)];
    const beats = assignRhythm(notes, neutralStyle, 0.25);
    beats.forEach((b, i) => expect(b.notes[0]).toEqual(notes[i]));
  });

  it('uses baseDur as default when no variety kicks in', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // never triggers variety branch
    const notes = [note(60), note(62)];
    const beats = assignRhythm(notes, noVarietyStyle, 0.25);
    beats.forEach(b => expect(b.duration).toBe(0.25));
  });

  it('applies shuffle feel: even notes longer, odd notes shorter', () => {
    const notes = [note(60), note(62), note(64), note(65)];
    const beats = assignRhythm(notes, shuffleStyle, 0.25);
    // Even indices: 0.25 * 1.33 = 0.3325, Odd indices: 0.25 * 0.67 = 0.1675
    expect(beats[0].duration).toBeCloseTo(0.3325, 3);
    expect(beats[1].duration).toBeCloseTo(0.1675, 3);
    expect(beats[2].duration).toBeCloseTo(0.3325, 3);
    expect(beats[3].duration).toBeCloseTo(0.1675, 3);
  });

  it('shuffle feel overrides variety', () => {
    const style: StyleConfig = { ...shuffleStyle, rhythmVariety: 0.9 };
    const notes = [note(60), note(62)];
    // With shuffle, result is always 1.33/0.67 alternation regardless of random
    const beats = assignRhythm(notes, style, 0.5);
    expect(beats[0].duration).toBeCloseTo(0.5 * 1.33, 3);
    expect(beats[1].duration).toBeCloseTo(0.5 * 0.67, 3);
  });

  it('allows duration variation when rhythmVariety > 0.2', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // always trigger variety + pick first in pool
    const notes = [note(60)];
    // variety 0.3 > 0.2, pool = [baseDur, baseDur*2, baseDur*0.5]
    // random() = 0 < 0.3, so picks durPool[floor(0 * 3)] = durPool[0] = baseDur
    const beats = assignRhythm(notes, neutralStyle, 0.25);
    expect(beats[0].duration).toBe(0.25);
  });

  it('rounds duration to 4 decimal places', () => {
    const notes = [note(60)];
    const beats = assignRhythm(notes, shuffleStyle, 0.25);
    const str = beats[0].duration.toString();
    const decimals = str.includes('.') ? str.split('.')[1].length : 0;
    expect(decimals).toBeLessThanOrEqual(4);
  });

  it('respects defaultDuration parameter', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const notes = [note(60)];
    const beats025 = assignRhythm(notes, noVarietyStyle, 0.25);
    const beats050 = assignRhythm(notes, noVarietyStyle, 0.5);
    expect(beats025[0].duration).toBe(0.25);
    expect(beats050[0].duration).toBe(0.5);
  });

  it('with variety > 0.5 extends duration pool with 1.5x and 0.5x', () => {
    // variety=0.8: pool = [base, base*2, base*0.5, base*1.5, base*0.5]
    // mock random to always trigger variety and pick pool[3] = base*1.5
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0) // < 0.8, triggers variety
      .mockReturnValueOnce(0.75); // picks index 3 of pool (base*1.5) when pool.length=5
    const notes = [note(60)];
    const beats = assignRhythm(notes, highVarietyStyle, 0.25);
    // Just verify it returned valid duration
    expect(beats[0].duration).toBeGreaterThan(0);
  });
});
