import { FretNote } from '../types';
import { BASS_TUNING } from '../constants/music';

function getBassMidi(s: number, f: number): number {
  return BASS_TUNING.midi[s] + f;
}

export function generateBassFromGuitar(guitarNotes: FretNote[]): FretNote[] {
  const bassNotes: FretNote[] = [];
  const step = Math.max(1, Math.floor(guitarNotes.length / 4));

  for (let i = 0; i < guitarNotes.length; i += step) {
    const gNote = guitarNotes[i];
    const targetPitch = gNote.midi % 12;

    for (let s = 0; s < 4; s++) {
      let found = false;
      for (let f = 0; f <= 12; f++) {
        if (getBassMidi(s, f) % 12 === targetPitch) {
          bassNotes.push({ string: s, fret: f, midi: getBassMidi(s, f) });
          found = true;
          break;
        }
      }
      if (found) break;
    }
  }
  return bassNotes;
}
