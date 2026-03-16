import { FretNote, StyleConfig } from '../types';

export function scoreVariation(gen: FretNote[], inputFlat: FretNote[], styleConfig: StyleConfig): number {
  if (!gen.length) return 0;
  let score = 50;

  const all = [...inputFlat, ...gen];
  for (let i = 1; i < all.length; i++) {
    const iv = Math.abs(all[i].midi - all[i - 1].midi);
    if (iv <= 3) score += 5;
    else if (iv <= 5) score += 3;
    else if (iv <= 7) score += 1;
    else score -= 3;
  }

  for (let i = 1; i < gen.length; i++) {
    const fd = Math.abs(gen[i].fret - gen[i - 1].fret);
    const sd = Math.abs(gen[i].string - gen[i - 1].string);
    if (fd <= 3 && sd <= 1) score += 4;
    else if (fd > 5 || sd > 2) score -= 5;
  }

  score += [...new Set(gen.map(n => n.midi % 12))].length * 3;

  if (inputFlat.length > 0 && gen.length > 0) {
    const li = Math.abs(gen[gen.length - 1].midi - inputFlat[0].midi);
    if (li <= 3) score += 6;
    else if (li <= 5) score += 3;
    else if (li > 8) score -= 5;
  }

  if (styleConfig.preferLow && gen.some(n => n.string >= 4)) score += 3;
  if (styleConfig.preferHigh && gen.some(n => n.string <= 1)) score += 3;

  return Math.max(0, Math.min(100, score));
}
