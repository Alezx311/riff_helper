import { FretNote, Beat, StyleConfig } from '../types';

export function assignRhythm(notes: FretNote[], styleConfig: StyleConfig, defaultDuration: number): Beat[] {
  if (!notes.length) return [];
  const beats: Beat[] = [];
  const baseDur = defaultDuration;
  const variety = styleConfig.rhythmVariety || 0;

  const durPool = [baseDur];
  if (variety > 0.2) durPool.push(baseDur * 2, baseDur * 0.5);
  if (variety > 0.5) durPool.push(baseDur * 1.5, baseDur * 0.5);

  notes.forEach((note, i) => {
    let dur = baseDur;
    if (styleConfig.shuffleFeel) {
      dur = i % 2 === 0 ? baseDur * 1.33 : baseDur * 0.67;
    } else if (variety > 0 && Math.random() < variety) {
      dur = durPool[Math.floor(Math.random() * durPool.length)];
    }
    beats.push({ notes: [note], duration: Math.round(dur * 10000) / 10000 });
  });
  return beats;
}
