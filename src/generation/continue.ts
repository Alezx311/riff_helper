import { FretNote, StyleConfig } from '../types';
import { TOTAL_FRETS } from '../constants/music';
import { isInScale } from '../utils/midi';
import { getNextNote } from './strategies';

export function generateContinuation(
  inputFlat: FretNote[],
  scaleNotes: number[],
  length: number,
  strategy: string,
  styleConfig: StyleConfig,
  getMidiFn: (s: number, f: number) => number,
  stringCount: number,
  key: number,
): FretNote[] | null {
  const notes: FretNote[] = [];
  const last = inputFlat[inputFlat.length - 1];
  if (!last) return null;

  let current = { ...last };
  let dir = 0;
  if (inputFlat.length >= 2) {
    dir = inputFlat[inputFlat.length - 1].midi - inputFlat[inputFlat.length - 2].midi;
  }

  for (let i = 0; i < length; i++) {
    const next = getNextNote(current, scaleNotes, strategy, i, dir, [...inputFlat, ...notes], styleConfig, getMidiFn, stringCount, key);
    if (!next) break;
    notes.push(next);
    current = next;
  }
  return notes.length > 0 ? notes : null;
}

export function ensureLoopable(
  gen: FretNote[],
  inputFlat: FretNote[],
  scaleNotes: number[],
  getMidiFn: (s: number, f: number) => number,
  stringCount: number,
): void {
  if (!gen.length || !inputFlat.length) return;
  const first = inputFlat[0];
  const last = gen[gen.length - 1];
  if (Math.abs(last.midi - first.midi) > 7) {
    let best: FretNote | null = null;
    let bd = Infinity;
    for (let s = Math.max(0, last.string - 2); s < Math.min(stringCount, last.string + 3); s++) {
      for (let f = Math.max(0, last.fret - 4); f <= Math.min(TOTAL_FRETS, last.fret + 4); f++) {
        const m = getMidiFn(s, f);
        if (!isInScale(m, scaleNotes)) continue;
        const d = Math.abs(m - first.midi);
        if (d < bd && d <= 5) {
          bd = d;
          best = { string: s, fret: f, midi: m };
        }
      }
    }
    if (best) gen[gen.length - 1] = best;
  }
}
