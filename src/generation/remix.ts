import { FretNote, StyleConfig } from '../types';
import { TOTAL_FRETS } from '../constants/music';
import { getNextNote } from './strategies';

export function generateRemix(
  inputFlat: FretNote[],
  scaleNotes: number[],
  length: number,
  strategy: string,
  styleConfig: StyleConfig,
  getMidiFn: (s: number, f: number) => number,
  stringCount: number,
  key: number,
): FretNote[] {
  const inputPitchClasses = [...new Set(inputFlat.map(n => n.midi % 12))];
  const remixScale = inputPitchClasses.filter(pc => scaleNotes.includes(pc));
  const useScale = remixScale.length >= 3 ? remixScale : scaleNotes;

  const notes: FretNote[] = [];
  const startPitch = inputPitchClasses[Math.floor(Math.random() * inputPitchClasses.length)];
  let current: FretNote | null = null;

  for (let s = 0; s < stringCount && !current; s++) {
    for (let f = 0; f <= TOTAL_FRETS && !current; f++) {
      if (getMidiFn(s, f) % 12 === startPitch) {
        current = { string: s, fret: f, midi: getMidiFn(s, f) };
      }
    }
  }
  if (!current) return [];

  notes.push(current);
  for (let i = 1; i < length; i++) {
    const next = getNextNote(current, useScale, strategy, i, 0, notes, styleConfig, getMidiFn, stringCount, key);
    if (!next) break;
    notes.push(next);
    current = next;
  }
  return notes;
}
