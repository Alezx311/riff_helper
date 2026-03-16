import { SampleSet } from '../types';

export const SAMPLE_SETS: { value: SampleSet; label: string }[] = [
  { value: 'guitar-electric', label: 'Electric Guitar' },
  { value: 'guitar-acoustic', label: 'Acoustic Guitar' },
  { value: 'guitar-nylon', label: 'Nylon Guitar' },
  { value: 'bass-electric', label: 'Electric Bass' },
  { value: 'piano', label: 'Piano' },
  { value: 'violin', label: 'Violin' },
  { value: 'cello', label: 'Cello' },
  { value: 'organ', label: 'Organ' },
  { value: 'saxophone', label: 'Saxophone' },
  { value: 'bassoon', label: 'Bassoon' },
  { value: 'contrabass', label: 'Contrabass' },
];

// Map for default sample sets per instrument
export const DEFAULT_SAMPLES: Record<string, SampleSet> = {
  guitar: 'guitar-electric',
  bass: 'bass-electric',
  drums: 'guitar-electric', // drums use synth, this is unused
};
