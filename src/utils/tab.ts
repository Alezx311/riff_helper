import { Beat, DrumPattern } from '../types';
import { DRUM_NAMES, DRUM_STEPS } from '../constants/music';

export function beatsToTab(beats: Beat[], labels: string[]): string {
  if (!beats.length) return '';
  const lines = labels.map(n => n.padStart(2) + '|');
  beats.forEach(beat => {
    const fbs: Record<number, number> = {};
    beat.notes.forEach(n => { fbs[n.string] = n.fret; });
    for (let s = 0; s < labels.length; s++) {
      if (s in fbs) {
        lines[s] += fbs[s].toString().padStart(2, '-') + '-';
      } else {
        lines[s] += '---';
      }
    }
  });
  lines.forEach((_, i) => { lines[i] += '|'; });
  return lines.join('\n');
}

export function drumPatternToText(pattern: DrumPattern): string {
  if (!pattern.some(r => r.some(v => v))) return '';
  const lines: string[] = [];
  for (let r = 0; r < DRUM_NAMES.length; r++) {
    if (!pattern[r].some(v => v)) continue;
    let line = DRUM_NAMES[r].substring(0, 2).padStart(2) + '|';
    for (let s = 0; s < DRUM_STEPS; s++) line += pattern[r][s] ? 'x ' : '. ';
    lines.push(line + '|');
  }
  return lines.join('\n');
}
