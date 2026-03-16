import { describe, it, expect } from 'vitest';
import {
  midiToNote,
  midiToNoteOctave,
  midiToFreq,
  getScaleNotes,
  isInScale,
  durationLabel,
  midiToToneNote,
} from '../../src/utils/midi';

describe('midiToNote', () => {
  it('returns correct note name for C (midi 60)', () => {
    expect(midiToNote(60)).toBe('C');
  });

  it('returns correct note name for A (midi 69)', () => {
    expect(midiToNote(69)).toBe('A');
  });

  it('wraps around octaves correctly', () => {
    expect(midiToNote(72)).toBe('C'); // C5
    expect(midiToNote(48)).toBe('C'); // C3
  });

  it('handles sharps', () => {
    expect(midiToNote(61)).toBe('C#');
    expect(midiToNote(66)).toBe('F#');
  });
});

describe('midiToNoteOctave', () => {
  it('returns C4 for midi 60', () => {
    expect(midiToNoteOctave(60)).toBe('C4');
  });

  it('returns A4 for midi 69', () => {
    expect(midiToNoteOctave(69)).toBe('A4');
  });

  it('returns C5 for midi 72', () => {
    expect(midiToNoteOctave(72)).toBe('C5');
  });

  it('handles low octaves', () => {
    expect(midiToNoteOctave(24)).toBe('C1');
  });
});

describe('midiToFreq', () => {
  it('returns 440 for A4 (midi 69)', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 2);
  });

  it('returns 880 for A5 (midi 81)', () => {
    expect(midiToFreq(81)).toBeCloseTo(880, 2);
  });

  it('returns 220 for A3 (midi 57)', () => {
    expect(midiToFreq(57)).toBeCloseTo(220, 2);
  });

  it('returns positive frequency for any valid midi', () => {
    expect(midiToFreq(0)).toBeGreaterThan(0);
    expect(midiToFreq(127)).toBeGreaterThan(0);
  });
});

describe('getScaleNotes', () => {
  it('returns correct minor pentatonic for A (root=9)', () => {
    const notes = getScaleNotes(9, 'minorPentatonic');
    expect(notes).toEqual([9, 0, 2, 4, 7]);
  });

  it('returns correct major scale for C (root=0)', () => {
    const notes = getScaleNotes(0, 'major');
    expect(notes).toEqual([0, 2, 4, 5, 7, 9, 11]);
  });

  it('returns 5 notes for pentatonic scales', () => {
    expect(getScaleNotes(0, 'minorPentatonic')).toHaveLength(5);
    expect(getScaleNotes(0, 'majorPentatonic')).toHaveLength(5);
  });

  it('returns 7 notes for diatonic scales', () => {
    expect(getScaleNotes(0, 'major')).toHaveLength(7);
    expect(getScaleNotes(0, 'minor')).toHaveLength(7);
    expect(getScaleNotes(0, 'dorian')).toHaveLength(7);
  });

  it('all notes are in range 0-11', () => {
    const notes = getScaleNotes(7, 'blues');
    notes.forEach(n => {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(11);
    });
  });

  it('falls back to minorPentatonic for unknown scale', () => {
    const fallback = getScaleNotes(0, 'unknown');
    const minPent = getScaleNotes(0, 'minorPentatonic');
    expect(fallback).toEqual(minPent);
  });

  it('wraps around correctly for root near 12', () => {
    const notes = getScaleNotes(11, 'major'); // B major
    notes.forEach(n => {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(11);
    });
  });
});

describe('isInScale', () => {
  it('returns true when note is in scale', () => {
    const scale = [0, 2, 4, 5, 7, 9, 11];
    expect(isInScale(60, scale)).toBe(true); // C (60 % 12 = 0)
    expect(isInScale(62, scale)).toBe(true); // D (62 % 12 = 2)
  });

  it('returns false when note is not in scale', () => {
    const scale = [0, 2, 4, 5, 7, 9, 11];
    expect(isInScale(61, scale)).toBe(false); // C# (61 % 12 = 1)
    expect(isInScale(63, scale)).toBe(false); // D# (63 % 12 = 3)
  });

  it('uses modulo 12 for octave-independent check', () => {
    const scale = [0];
    expect(isInScale(0, scale)).toBe(true);
    expect(isInScale(12, scale)).toBe(true);
    expect(isInScale(24, scale)).toBe(true);
    expect(isInScale(60, scale)).toBe(true);
  });
});

describe('durationLabel', () => {
  it('returns "1" for duration 1', () => {
    expect(durationLabel(1)).toBe('1');
  });

  it('returns "1/2" for duration 0.5', () => {
    expect(durationLabel(0.5)).toBe('1/2');
  });

  it('returns "1/4" for duration 0.25', () => {
    expect(durationLabel(0.25)).toBe('1/4');
  });

  it('returns "1/8" for duration 0.125', () => {
    expect(durationLabel(0.125)).toBe('1/8');
  });

  it('returns "1/16" for duration 0.0625', () => {
    expect(durationLabel(0.0625)).toBe('1/16');
  });

  it('returns "3/8" for duration 0.375', () => {
    expect(durationLabel(0.375)).toBe('3/8');
  });

  it('returns formatted decimal for unknown durations', () => {
    expect(durationLabel(0.333)).toBe('0.333');
  });
});

describe('midiToToneNote', () => {
  it('converts midi 60 to C4', () => {
    expect(midiToToneNote(60)).toBe('C4');
  });

  it('converts midi 69 to A4', () => {
    expect(midiToToneNote(69)).toBe('A4');
  });

  it('matches midiToNoteOctave', () => {
    for (let m = 36; m <= 84; m++) {
      expect(midiToToneNote(m)).toBe(midiToNoteOctave(m));
    }
  });
});
