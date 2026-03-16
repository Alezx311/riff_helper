import { StyleConfig, TuningDef } from '../types';

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const SCALES: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  minorPentatonic: [0, 3, 5, 7, 10],
  majorPentatonic: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
};

export const TUNINGS: Record<string, TuningDef> = {
  standard: { midi: [64, 59, 55, 50, 45, 40], labels: ['e', 'B', 'G', 'D', 'A', 'E'] },
  dropD: { midi: [64, 59, 55, 50, 45, 38], labels: ['e', 'B', 'G', 'D', 'A', 'D'] },
  dadgad: { midi: [62, 57, 55, 50, 45, 38], labels: ['d', 'A', 'G', 'D', 'A', 'D'] },
  openG: { midi: [62, 59, 55, 50, 43, 38], labels: ['d', 'B', 'G', 'D', 'G', 'D'] },
  openD: { midi: [62, 57, 54, 50, 45, 38], labels: ['d', 'A', 'F#', 'D', 'A', 'D'] },
  halfDown: { midi: [63, 58, 54, 49, 44, 39], labels: ['eb', 'Bb', 'Gb', 'Db', 'Ab', 'Eb'] },
  dropC: { midi: [62, 57, 53, 48, 43, 36], labels: ['d', 'A', 'F', 'C', 'G', 'C'] },
};

export const BASS_TUNING: TuningDef = { midi: [43, 38, 33, 28], labels: ['G', 'D', 'A', 'E'] };

export const DRUM_NAMES = ['Kick', 'Snare', 'HiHat', 'Crash', 'Tom1', 'Tom2'];
export const DRUM_STEPS = 16;
export const TOTAL_FRETS = 15;

export const STYLES: Record<string, StyleConfig> = {
  neutral: { powerChords: false, chromaticRuns: false, preferLow: false, preferHigh: false, shuffleFeel: false, rhythmVariety: 0.3 },
  rock: { powerChords: true, chromaticRuns: false, preferLow: true, preferHigh: false, shuffleFeel: false, rhythmVariety: 0.2 },
  metal: { powerChords: true, chromaticRuns: true, preferLow: true, preferHigh: false, shuffleFeel: false, rhythmVariety: 0.4 },
  blues: { powerChords: false, chromaticRuns: false, preferLow: false, preferHigh: false, shuffleFeel: true, rhythmVariety: 0.5 },
  jazz: { powerChords: false, chromaticRuns: true, preferLow: false, preferHigh: true, shuffleFeel: false, rhythmVariety: 0.6 },
  funk: { powerChords: false, chromaticRuns: false, preferLow: false, preferHigh: false, shuffleFeel: true, rhythmVariety: 0.7 },
};

export const SCALE_NAMES: Record<string, string> = {
  major: 'Major',
  minor: 'Minor',
  minorPentatonic: 'Minor Pentatonic',
  majorPentatonic: 'Major Pentatonic',
  blues: 'Blues',
  dorian: 'Dorian',
  phrygian: 'Phrygian',
  harmonicMinor: 'Harmonic Minor',
};

export const TUNING_NAMES: Record<string, string> = {
  standard: 'Standard',
  dropD: 'Drop D',
  dadgad: 'DADGAD',
  openG: 'Open G',
  openD: 'Open D',
  halfDown: 'Half Down',
  dropC: 'Drop C',
};

export const STYLE_NAMES: Record<string, string> = {
  neutral: 'Neutral',
  rock: 'Rock',
  metal: 'Metal',
  blues: 'Blues',
  jazz: 'Jazz',
  funk: 'Funk',
};
