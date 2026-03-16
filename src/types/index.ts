export interface FretNote {
  string: number;
  fret: number;
  midi: number;
}

export interface Beat {
  notes: FretNote[];
  duration: number;
}

export type DrumPattern = boolean[][];

export type InstrumentType = 'guitar' | 'bass' | 'drums';

export interface TrackState {
  beats: Beat[];
  currentBeatIdx: number;
}

export interface DrumTrackState {
  pattern: DrumPattern;
}

export interface GenerationResult {
  id: number;
  guitarBeats: Beat[];
  bassBeats: Beat[];
  drumPattern: DrumPattern;
  score: number;
}

export type SampleSet =
  | 'guitar-electric'
  | 'guitar-acoustic'
  | 'guitar-nylon'
  | 'bass-electric'
  | 'piano'
  | 'violin'
  | 'cello'
  | 'organ'
  | 'saxophone'
  | 'bassoon'
  | 'contrabass';

export interface MixerTrack {
  volume: number;
  muted: boolean;
  solo: boolean;
  sampleSet: SampleSet;
}

export interface MixerState {
  guitar: MixerTrack;
  bass: MixerTrack;
  drums: MixerTrack;
}

export interface GenerateFor {
  guitar: boolean;
  bass: boolean;
  drums: boolean;
}

export interface StyleConfig {
  powerChords: boolean;
  chromaticRuns: boolean;
  preferLow: boolean;
  preferHigh: boolean;
  shuffleFeel: boolean;
  rhythmVariety: number;
}

export interface TuningDef {
  midi: number[];
  labels: string[];
}

export type Strategy = 'stepwise' | 'skipUp' | 'skipDown' | 'pendulum' | 'resolve' | 'chromatic' | 'styleLick';
