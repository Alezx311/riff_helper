import { describe, it, expect } from 'vitest';
import { beatsToTab, drumPatternToText } from '../../src/utils/tab';
import { Beat, DrumPattern } from '../../src/types';

const guitarLabels = ['e', 'B', 'G', 'D', 'A', 'E'];
const bassLabels = ['G', 'D', 'A', 'E'];

describe('beatsToTab', () => {
  it('returns empty string for empty beats array', () => {
    expect(beatsToTab([], guitarLabels)).toBe('');
  });

  it('generates correct number of lines (one per string)', () => {
    const beats: Beat[] = [{ notes: [{ string: 0, fret: 5, midi: 69 }], duration: 0.25 }];
    const tab = beatsToTab(beats, guitarLabels);
    const lines = tab.split('\n');
    expect(lines).toHaveLength(6);
  });

  it('shows fret number on the correct string', () => {
    const beats: Beat[] = [{ notes: [{ string: 2, fret: 7, midi: 62 }], duration: 0.25 }];
    const tab = beatsToTab(beats, guitarLabels);
    const lines = tab.split('\n');
    expect(lines[2]).toContain('7');
  });

  it('shows dashes for strings with no note', () => {
    const beats: Beat[] = [{ notes: [{ string: 0, fret: 3, midi: 67 }], duration: 0.25 }];
    const tab = beatsToTab(beats, guitarLabels);
    const lines = tab.split('\n');
    // strings 1-5 have no note, should show dashes
    for (let i = 1; i < 6; i++) {
      expect(lines[i]).toContain('---');
    }
  });

  it('handles multiple beats', () => {
    const beats: Beat[] = [
      { notes: [{ string: 0, fret: 5, midi: 69 }], duration: 0.25 },
      { notes: [{ string: 0, fret: 7, midi: 71 }], duration: 0.25 },
    ];
    const tab = beatsToTab(beats, guitarLabels);
    const lines = tab.split('\n');
    expect(lines[0]).toContain('5');
    expect(lines[0]).toContain('7');
  });

  it('handles chord (multiple notes in one beat)', () => {
    const beats: Beat[] = [{
      notes: [
        { string: 0, fret: 0, midi: 64 },
        { string: 1, fret: 0, midi: 59 },
        { string: 2, fret: 1, midi: 56 },
      ],
      duration: 0.5,
    }];
    const tab = beatsToTab(beats, guitarLabels);
    const lines = tab.split('\n');
    expect(lines[0]).toContain('0');
    expect(lines[1]).toContain('0');
    expect(lines[2]).toContain('1');
  });

  it('wraps tab with pipe characters', () => {
    const beats: Beat[] = [{ notes: [{ string: 0, fret: 5, midi: 69 }], duration: 0.25 }];
    const tab = beatsToTab(beats, guitarLabels);
    const lines = tab.split('\n');
    lines.forEach(line => {
      expect(line).toMatch(/\|.*\|/);
    });
  });

  it('works with bass labels (4 strings)', () => {
    const beats: Beat[] = [{ notes: [{ string: 0, fret: 3, midi: 46 }], duration: 0.25 }];
    const tab = beatsToTab(beats, bassLabels);
    const lines = tab.split('\n');
    expect(lines).toHaveLength(4);
  });
});

describe('drumPatternToText', () => {
  it('returns empty string for empty pattern', () => {
    const empty: DrumPattern = Array.from({ length: 6 }, () => new Array(16).fill(false));
    expect(drumPatternToText(empty)).toBe('');
  });

  it('returns non-empty string when pattern has active steps', () => {
    const pattern: DrumPattern = Array.from({ length: 6 }, () => new Array(16).fill(false));
    pattern[0][0] = true; // kick on step 1
    expect(drumPatternToText(pattern)).not.toBe('');
  });

  it('only includes rows with at least one active step', () => {
    const pattern: DrumPattern = Array.from({ length: 6 }, () => new Array(16).fill(false));
    pattern[0][0] = true; // only kick
    const text = drumPatternToText(pattern);
    const lines = text.split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('Ki');
  });

  it('shows x for active steps and . for inactive', () => {
    const pattern: DrumPattern = Array.from({ length: 6 }, () => new Array(16).fill(false));
    pattern[0][0] = true;
    pattern[0][4] = true;
    const text = drumPatternToText(pattern);
    expect(text).toContain('x');
    expect(text).toContain('.');
  });

  it('includes all active drum rows', () => {
    const pattern: DrumPattern = Array.from({ length: 6 }, () => new Array(16).fill(false));
    pattern[0][0] = true; // Kick
    pattern[1][4] = true; // Snare
    pattern[2][0] = true; // HiHat
    const text = drumPatternToText(pattern);
    const lines = text.split('\n');
    expect(lines).toHaveLength(3);
  });

  it('wraps each line with pipe characters', () => {
    const pattern: DrumPattern = Array.from({ length: 6 }, () => new Array(16).fill(false));
    pattern[0][0] = true;
    const text = drumPatternToText(pattern);
    expect(text).toMatch(/\|.*\|/);
  });
});
