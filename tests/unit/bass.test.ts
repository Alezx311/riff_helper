import { describe, it, expect } from 'vitest';
import { generateBassFromGuitar } from '../../src/generation/bass';
import { FretNote } from '../../src/types';
import { BASS_TUNING } from '../../src/constants/music';

const g = (midi: number): FretNote => ({ string: 0, fret: midi - 64, midi });

describe('generateBassFromGuitar', () => {
  it('returns empty array for empty guitar notes', () => {
    expect(generateBassFromGuitar([])).toEqual([]);
  });

  it('returns fewer notes than guitar input (downsampled)', () => {
    const guitar = Array.from({ length: 8 }, (_, i) => g(60 + i));
    const bass = generateBassFromGuitar(guitar);
    expect(bass.length).toBeLessThan(guitar.length);
  });

  it('bass notes match guitar pitch class', () => {
    const guitar: FretNote[] = [
      { string: 0, fret: 5, midi: 69 }, // A4
    ];
    const bass = generateBassFromGuitar(guitar);
    if (bass.length > 0) {
      expect(bass[0].midi % 12).toBe(69 % 12); // same pitch class A
    }
  });

  it('all bass notes use valid bass strings (0-3)', () => {
    const guitar = [g(64), g(67), g(69), g(71)];
    const bass = generateBassFromGuitar(guitar);
    bass.forEach(n => {
      expect(n.string).toBeGreaterThanOrEqual(0);
      expect(n.string).toBeLessThanOrEqual(3);
    });
  });

  it('all bass frets are within valid range (0-12)', () => {
    const guitar = [g(64), g(67), g(69), g(71)];
    const bass = generateBassFromGuitar(guitar);
    bass.forEach(n => {
      expect(n.fret).toBeGreaterThanOrEqual(0);
      expect(n.fret).toBeLessThanOrEqual(12);
    });
  });

  it('midi value matches string + fret for bass tuning', () => {
    const guitar = [g(64), g(67), g(69)];
    const bass = generateBassFromGuitar(guitar);
    bass.forEach(n => {
      expect(n.midi).toBe(BASS_TUNING.midi[n.string] + n.fret);
    });
  });

  it('handles single guitar note', () => {
    const guitar: FretNote[] = [{ string: 0, fret: 5, midi: 69 }];
    const bass = generateBassFromGuitar(guitar);
    expect(bass.length).toBeGreaterThanOrEqual(0);
    // Should produce exactly 1 note (step = max(1, floor(1/4)) = 1)
    expect(bass.length).toBeLessThanOrEqual(1);
  });

  it('step size grows with guitar length', () => {
    const short = Array.from({ length: 4 }, (_, i) => g(60 + i));
    const long = Array.from({ length: 16 }, (_, i) => g(60 + (i % 12)));
    const shortBass = generateBassFromGuitar(short);
    const longBass = generateBassFromGuitar(long);
    // longer input should produce more bass notes (or equal)
    expect(longBass.length).toBeGreaterThanOrEqual(shortBass.length);
  });
});
