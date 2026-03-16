import {
  InstrumentType, TrackState, DrumTrackState, GenerationResult,
  MixerState, GenerateFor, SampleSet, FretNote,
} from '../types';

export interface AppState {
  activeInst: InstrumentType;
  guitar: TrackState;
  bass: TrackState;
  drums: DrumTrackState;
  key: number;
  scale: string;
  tuning: string;
  style: string;
  genLength: number;
  genMode: 'continue' | 'remix';
  tempo: number;
  defaultDuration: number;
  results: GenerationResult[];
  playingIdx: number;
  mixer: MixerState;
  generateFor: GenerateFor;
}

export type AppAction =
  | { type: 'SET_ACTIVE_INST'; payload: InstrumentType }
  | { type: 'SET_KEY'; payload: number }
  | { type: 'SET_SCALE'; payload: string }
  | { type: 'SET_TUNING'; payload: string }
  | { type: 'SET_STYLE'; payload: string }
  | { type: 'SET_TEMPO'; payload: number }
  | { type: 'SET_GEN_LENGTH'; payload: number }
  | { type: 'SET_GEN_MODE'; payload: 'continue' | 'remix' }
  | { type: 'SET_DEFAULT_DURATION'; payload: number }
  | { type: 'ADD_NOTE_TO_BEAT'; payload: { note: FretNote; inst: InstrumentType } }
  | { type: 'ADVANCE_BEAT'; payload: InstrumentType }
  | { type: 'REMOVE_NOTE'; payload: { string: number; fret: number; inst: InstrumentType } }
  | { type: 'REMOVE_BEAT'; payload: { beatIdx: number; inst: InstrumentType } }
  | { type: 'SET_BEAT_DURATION'; payload: { beatIdx: number; duration: number; inst: InstrumentType } }
  | { type: 'SELECT_BEAT'; payload: { beatIdx: number; inst: InstrumentType } }
  | { type: 'TOGGLE_DRUM_CELL'; payload: { row: number; step: number } }
  | { type: 'CLEAR_TRACK'; payload: InstrumentType }
  | { type: 'SET_RESULTS'; payload: GenerationResult[] }
  | { type: 'SET_PLAYING'; payload: number }
  | { type: 'STOP_PLAYING' }
  | { type: 'USE_RESULT'; payload: GenerationResult }
  | { type: 'SET_VOLUME'; payload: { inst: InstrumentType; volume: number } }
  | { type: 'TOGGLE_MUTE'; payload: InstrumentType }
  | { type: 'TOGGLE_SOLO'; payload: InstrumentType }
  | { type: 'SET_SAMPLE_SET'; payload: { inst: InstrumentType; sampleSet: SampleSet } }
  | { type: 'TOGGLE_GENERATE_FOR'; payload: InstrumentType }
  | { type: 'UPDATE_TUNING_MIDI'; payload: string };
