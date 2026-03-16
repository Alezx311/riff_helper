import { NOTE_NAMES, SCALES } from '../constants/music';

export function midiToNote(m: number): string {
  return NOTE_NAMES[m % 12];
}

export function midiToNoteOctave(m: number): string {
  return NOTE_NAMES[m % 12] + (Math.floor(m / 12) - 1);
}

export function midiToFreq(m: number): number {
  return 440 * Math.pow(2, (m - 69) / 12);
}

export function getScaleNotes(root: number, scale: string): number[] {
  return (SCALES[scale] || SCALES.minorPentatonic).map(i => (root % 12 + i) % 12);
}

export function isInScale(m: number, scaleNotes: number[]): boolean {
  return scaleNotes.includes(m % 12);
}

export function durationLabel(d: number): string {
  const map: Record<number, string> = {
    1: '1', 0.5: '1/2', 0.25: '1/4', 0.125: '1/8', 0.0625: '1/16', 0.375: '3/8',
  };
  return map[d] || d.toFixed(3);
}

// Convert MIDI to Tone.js note format: "C#4", "A3", etc.
export function midiToToneNote(m: number): string {
  return NOTE_NAMES[m % 12] + (Math.floor(m / 12) - 1);
}
