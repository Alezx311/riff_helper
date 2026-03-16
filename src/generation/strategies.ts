import { FretNote, StyleConfig } from '../types';
import { TOTAL_FRETS } from '../constants/music';
import { isInScale } from '../utils/midi';

export function getNextNote(
  current: FretNote,
  scaleNotes: number[],
  strategy: string,
  step: number,
  inputDir: number,
  allPrev: FretNote[],
  styleConfig: StyleConfig,
  getMidiFn: (s: number, f: number) => number,
  stringCount: number,
  key: number,
): FretNote | null {
  const candidates: Array<FretNote & { dist: number; inScale: boolean; score: number }> = [];
  const maxFR = strategy === 'chromatic' ? 3 : 5;

  for (let s = Math.max(0, current.string - 2); s < Math.min(stringCount, current.string + 3); s++) {
    for (let f = Math.max(0, current.fret - maxFR); f <= Math.min(TOTAL_FRETS, current.fret + maxFR); f++) {
      const midi = getMidiFn(s, f);
      if (s === current.string && f === current.fret) continue;
      const inS = isInScale(midi, scaleNotes);
      if (!inS && strategy !== 'chromatic') continue;
      candidates.push({
        string: s, fret: f, midi,
        dist: Math.abs(f - current.fret) + Math.abs(s - current.string) * 2,
        inScale: inS,
        score: 0,
      });
    }
  }
  if (!candidates.length) return null;

  const root = key % 12;
  candidates.forEach(c => {
    c.score = 10 - c.dist;
    const iv = c.midi - current.midi;
    if (!c.inScale) c.score -= 3;

    switch (strategy) {
      case 'stepwise':
        if (Math.abs(iv) <= 3) c.score += 5;
        if (inputDir > 0 && iv > 0) c.score += 3;
        if (inputDir < 0 && iv < 0) c.score += 3;
        break;
      case 'skipUp':
        if (step === 0 && iv >= 3 && iv <= 7) c.score += 8;
        else if (iv > 0 && iv <= 3) c.score += 4;
        break;
      case 'skipDown':
        if (step === 0 && iv <= -3 && iv >= -7) c.score += 8;
        else if (iv < 0 && Math.abs(iv) <= 3) c.score += 4;
        break;
      case 'pendulum': {
        const u = step % 2 === 0;
        if (u && iv > 0) c.score += 5;
        if (!u && iv < 0) c.score += 5;
        if (Math.abs(iv) >= 2 && Math.abs(iv) <= 5) c.score += 3;
        break;
      }
      case 'resolve': {
        const cd = Math.abs((current.midi % 12) - root);
        const ca = Math.abs((c.midi % 12) - root);
        if (ca < cd) c.score += 5;
        if (ca === 0) c.score += 3;
        break;
      }
      case 'chromatic':
        if (Math.abs(iv) === 1) c.score += 6;
        else if (Math.abs(iv) === 2) c.score += 3;
        break;
      case 'styleLick':
        if (styleConfig.preferLow && c.string >= stringCount - 2) c.score += 3;
        if (styleConfig.preferHigh && c.string <= 1) c.score += 3;
        if (styleConfig.powerChords && Math.abs(iv) === 7) c.score += 5;
        if (styleConfig.chromaticRuns && Math.abs(iv) === 1) c.score += 4;
        if (Math.abs(iv) <= 4) c.score += 3;
        break;
    }
    if (styleConfig.preferLow && c.string >= stringCount - 1) c.score += 1;
    if (styleConfig.preferHigh && c.string <= 0) c.score += 1;
    const recent = allPrev.slice(-2);
    if (recent.some(n => n.midi === c.midi)) c.score -= 3;
  });

  candidates.sort((a, b) => b.score - a.score);
  const topN = candidates.slice(0, Math.min(6, candidates.length));
  const ts = topN.reduce((s, c) => s + Math.max(c.score, 1), 0);
  let r = Math.random() * ts;
  for (const c of topN) {
    r -= Math.max(c.score, 1);
    if (r <= 0) return { string: c.string, fret: c.fret, midi: c.midi };
  }
  return { string: topN[0].string, fret: topN[0].fret, midi: topN[0].midi };
}
