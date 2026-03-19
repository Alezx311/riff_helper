import { NOTE_NAMES, SCALES, SCALE_NAMES } from '../constants/music';

export interface KeyScaleMatch {
  key: number;
  keyName: string;
  scale: string;
  scaleName: string;
  /** Scale notes not present in input — lower = tighter fit */
  extraNotes: number;
  scaleNotes: number[];
}

export interface DiatonicChord {
  degree: number;
  romanNumeral: string;
  root: number;
  rootName: string;
  quality: 'major' | 'minor' | 'diminished' | 'augmented';
  notes: number[];
  name: string;
}

export interface ChordProgression {
  name: string;
  degrees: number[];
  style: string;
}

/** Returns all key+scale combinations where every input MIDI note is in the scale.
 *  Sorted by extraNotes ascending (tightest fit first), then by key. */
export function detectKeyScale(midiNotes: number[]): KeyScaleMatch[] {
  if (midiNotes.length === 0) return [];
  const inputClasses = [...new Set(midiNotes.map(m => ((m % 12) + 12) % 12))];
  const results: KeyScaleMatch[] = [];

  for (let key = 0; key < 12; key++) {
    for (const [scaleName, intervals] of Object.entries(SCALES)) {
      const scaleNotes = intervals.map(i => (key + i) % 12);
      if (inputClasses.every(pc => scaleNotes.includes(pc))) {
        results.push({
          key,
          keyName: NOTE_NAMES[key],
          scale: scaleName,
          scaleName: SCALE_NAMES[scaleName] ?? scaleName,
          extraNotes: scaleNotes.length - inputClasses.length,
          scaleNotes,
        });
      }
    }
  }

  return results.sort((a, b) => a.extraNotes - b.extraNotes || a.key - b.key);
}

function getChordQuality(third: number, fifth: number): DiatonicChord['quality'] {
  if (third === 4 && fifth === 7) return 'major';
  if (third === 3 && fifth === 7) return 'minor';
  if (third === 3 && fifth === 6) return 'diminished';
  if (third === 4 && fifth === 8) return 'augmented';
  return 'major';
}

const ROMAN_UPPER = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const ROMAN_LOWER = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii'];

/** Build diatonic triads (root, 3rd, 5th) for each scale degree. */
export function getDiatonicChords(key: number, scaleName: string): DiatonicChord[] {
  const intervals = SCALES[scaleName];
  if (!intervals || intervals.length < 3) return [];
  const N = intervals.length;
  const absolute = intervals.map(i => (key + i) % 12);

  return absolute.map((root, d) => {
    const thirdPC = absolute[(d + 2) % N];
    const fifthPC = absolute[(d + 4) % N];
    const third = (thirdPC - root + 12) % 12;
    const fifth = (fifthPC - root + 12) % 12;
    const quality = getChordQuality(third, fifth);

    const isUpper = quality === 'major' || quality === 'augmented';
    const suffix = quality === 'augmented' ? '+' : quality === 'diminished' ? '°' : '';
    const roman = (isUpper ? ROMAN_UPPER : ROMAN_LOWER)[d] + suffix;

    const rootName = NOTE_NAMES[root];
    const name =
      rootName +
      (quality === 'minor' ? 'm' : '') +
      (quality === 'diminished' ? 'dim' : '') +
      (quality === 'augmented' ? 'aug' : '');

    return { degree: d, romanNumeral: roman, root, rootName, quality, notes: [root, thirdPC, fifthPC], name };
  });
}

// Progressions per scale — degrees are 0-based indices into the scale's chord array
const PROGRESSIONS_BY_SCALE: Record<string, ChordProgression[]> = {
  major: [
    { name: 'Pop',         degrees: [0, 4, 5, 3], style: 'Pop/Rock' },
    { name: 'Classic',     degrees: [0, 3, 4, 0], style: 'Classic/Folk' },
    { name: '50s',         degrees: [0, 5, 3, 4], style: '50s / Doo-wop' },
    { name: 'II–V–I',      degrees: [1, 4, 0],    style: 'Jazz' },
    { name: 'Blues',       degrees: [0, 3, 4],    style: 'Blues' },
  ],
  minor: [
    { name: 'Minor Pop',    degrees: [0, 6, 3, 5], style: 'Pop/Rock' },
    { name: 'Classic',      degrees: [0, 3, 4, 0], style: 'Classic' },
    { name: 'Andalusian',   degrees: [0, 6, 5, 4], style: 'Flamenco/Latin' },
    { name: 'II–V–i',       degrees: [1, 4, 0],    style: 'Jazz' },
  ],
  dorian: [
    { name: 'Dorian',      degrees: [0, 3, 1, 4], style: 'Modal/Funk' },
    { name: 'Dorian II–V', degrees: [1, 4, 0],    style: 'Jazz' },
  ],
  phrygian: [
    { name: 'Phrygian',    degrees: [0, 1, 6, 0], style: 'Flamenco/Metal' },
    { name: 'Phryg. Pop',  degrees: [0, 1, 3, 0], style: 'Metal/Dramatic' },
  ],
  harmonicMinor: [
    { name: 'HM Classic',  degrees: [0, 3, 4, 0], style: 'Classic/Metal' },
    { name: 'HM Jazz',     degrees: [1, 4, 0],    style: 'Jazz' },
  ],
};

/** Return progressions valid for the given scale (only degrees within range). */
export function getProgressions(scaleName: string, chordCount: number): ChordProgression[] {
  const list = PROGRESSIONS_BY_SCALE[scaleName] ?? [];
  return list.filter(p => p.degrees.every(d => d < chordCount));
}

/** Format progression degrees as actual chord names joined by ' - '. */
export function formatProgression(progression: ChordProgression, chords: DiatonicChord[]): string {
  return progression.degrees.map(d => chords[d]?.name ?? '?').join(' - ');
}

/** Format progression degrees as Roman numerals joined by ' - '. */
export function formatProgressionNumerals(progression: ChordProgression, chords: DiatonicChord[]): string {
  return progression.degrees.map(d => chords[d]?.romanNumeral ?? '?').join(' - ');
}
