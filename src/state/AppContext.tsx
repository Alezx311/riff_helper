import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import { AppState, AppAction } from './types';
import { appReducer } from './reducer';
import { DRUM_STEPS } from '../constants/music';

const initialState: AppState = {
  activeInst: 'guitar',
  guitar: { beats: [], currentBeatIdx: -1 },
  bass: { beats: [], currentBeatIdx: -1 },
  drums: { pattern: Array.from({ length: 6 }, () => new Array(DRUM_STEPS).fill(false)) },
  key: 9,
  scale: 'minorPentatonic',
  tuning: 'standard',
  style: 'neutral',
  genLength: 4,
  genMode: 'continue',
  tempo: 120,
  defaultDuration: 0.25,
  results: [],
  playingIdx: -1,
  mixer: {
    guitar: { volume: 0.8, muted: false, solo: false, sampleSet: 'guitar-electric' },
    bass: { volume: 0.7, muted: false, solo: false, sampleSet: 'bass-electric' },
    drums: { volume: 0.7, muted: false, solo: false, sampleSet: 'guitar-electric' },
  },
  generateFor: { guitar: true, bass: true, drums: true },
};

const AppContext = createContext<{ state: AppState; dispatch: Dispatch<AppAction> }>({
  state: initialState,
  dispatch: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppState() {
  return useContext(AppContext);
}
