import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Controls } from '../../src/components/Controls/Controls';
import * as AppContextModule from '../../src/state/AppContext';
import { AppState } from '../../src/state/types';
import { DRUM_STEPS } from '../../src/constants/music';

const emptyDrums = { pattern: Array.from({ length: 6 }, () => new Array(DRUM_STEPS).fill(false)) };

const mockState: AppState = {
  activeInst: 'guitar',
  guitar: { beats: [], currentBeatIdx: -1 },
  bass: { beats: [], currentBeatIdx: -1 },
  drums: emptyDrums,
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

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderControls(state = mockState, dispatch = vi.fn()) {
  vi.spyOn(AppContextModule, 'useAppState').mockReturnValue({ state, dispatch });
  // Selects order: Key[0], Scale[1], Tuning[2], Style[3], GenLength[4], Mode[5], Duration[6]
  const result = render(<Controls />);
  const selects = result.container.querySelectorAll('select');
  return { dispatch, selects, ...result };
}

describe('Controls component — rendering', () => {
  it('renders Key label', () => {
    renderControls();
    expect(screen.getByText('Key')).toBeInTheDocument();
  });

  it('renders Scale label', () => {
    renderControls();
    expect(screen.getByText('Scale')).toBeInTheDocument();
  });

  it('renders Tuning label', () => {
    renderControls();
    expect(screen.getByText('Tuning')).toBeInTheDocument();
  });

  it('renders Style label', () => {
    renderControls();
    expect(screen.getByText('Style')).toBeInTheDocument();
  });

  it('renders Tempo label with current value', () => {
    renderControls();
    expect(screen.getByText(/Tempo.*120/)).toBeInTheDocument();
  });

  it('renders Duration label', () => {
    renderControls();
    expect(screen.getByText('Duration')).toBeInTheDocument();
  });

  it('renders 7 select elements', () => {
    const { selects } = renderControls();
    expect(selects).toHaveLength(7);
  });

  it('key select has 12 options (chromatic scale)', () => {
    const { selects } = renderControls();
    expect(selects[0].querySelectorAll('option')).toHaveLength(12);
  });

  it('key select shows current key value', () => {
    const { selects } = renderControls();
    expect((selects[0] as HTMLSelectElement).value).toBe('9');
  });

  it('scale select shows current scale value', () => {
    const { selects } = renderControls();
    expect((selects[1] as HTMLSelectElement).value).toBe('minorPentatonic');
  });

  it('tuning select shows current tuning value', () => {
    const { selects } = renderControls();
    expect((selects[2] as HTMLSelectElement).value).toBe('standard');
  });

  it('mode select shows current genMode value', () => {
    const { selects } = renderControls();
    expect((selects[5] as HTMLSelectElement).value).toBe('continue');
  });
});

describe('Controls component — dispatching actions', () => {
  it('dispatches SET_KEY when key select changes', () => {
    const { dispatch, selects } = renderControls();
    fireEvent.change(selects[0], { target: { value: '0' } });
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_KEY', payload: 0 });
  });

  it('dispatches SET_SCALE when scale select changes', () => {
    const { dispatch, selects } = renderControls();
    fireEvent.change(selects[1], { target: { value: 'major' } });
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_SCALE', payload: 'major' });
  });

  it('dispatches UPDATE_TUNING_MIDI when tuning select changes', () => {
    const { dispatch, selects } = renderControls();
    fireEvent.change(selects[2], { target: { value: 'dropD' } });
    expect(dispatch).toHaveBeenCalledWith({ type: 'UPDATE_TUNING_MIDI', payload: 'dropD' });
  });

  it('dispatches SET_STYLE when style select changes', () => {
    const { dispatch, selects } = renderControls();
    fireEvent.change(selects[3], { target: { value: 'rock' } });
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_STYLE', payload: 'rock' });
  });

  it('dispatches SET_GEN_LENGTH when genLength select changes', () => {
    const { dispatch, selects } = renderControls();
    fireEvent.change(selects[4], { target: { value: '8' } });
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_GEN_LENGTH', payload: 8 });
  });

  it('dispatches SET_GEN_MODE when mode select changes', () => {
    const { dispatch, selects } = renderControls();
    fireEvent.change(selects[5], { target: { value: 'remix' } });
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_GEN_MODE', payload: 'remix' });
  });

  it('dispatches SET_DEFAULT_DURATION when duration select changes', () => {
    const { dispatch, selects } = renderControls();
    fireEvent.change(selects[6], { target: { value: '0.5' } });
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_DEFAULT_DURATION', payload: 0.5 });
  });

  it('dispatches SET_TEMPO when tempo range slider changes', () => {
    const dispatch = vi.fn();
    const { container } = renderControls(mockState, dispatch);
    const slider = container.querySelector('input[type="range"]')!;
    fireEvent.change(slider, { target: { value: '140' } });
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_TEMPO', payload: 140 });
  });

  it('dispatches SET_TEMPO when tempo number input changes', () => {
    const dispatch = vi.fn();
    const { container } = renderControls(mockState, dispatch);
    const numInput = container.querySelector('input[type="number"]')!;
    fireEvent.change(numInput, { target: { value: '160' } });
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_TEMPO', payload: 160 });
  });
});
