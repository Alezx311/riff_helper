import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Fretboard } from '../../src/components/Fretboard/Fretboard';
import * as AppContextModule from '../../src/state/AppContext';
import { AppState } from '../../src/state/types';
import { DRUM_STEPS, TUNINGS, TOTAL_FRETS } from '../../src/constants/music';

const emptyDrums = { pattern: Array.from({ length: 6 }, () => new Array(DRUM_STEPS).fill(false)) };

const mockGuitarState: AppState = {
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

function renderFretboard(state = mockGuitarState, dispatch = vi.fn(), onNotePreview = vi.fn()) {
  vi.spyOn(AppContextModule, 'useAppState').mockReturnValue({ state, dispatch });
  return { dispatch, onNotePreview, ...render(<Fretboard onNotePreview={onNotePreview} />) };
}

describe('Fretboard component — guitar mode', () => {
  it('renders 6 string labels for guitar', () => {
    renderFretboard();
    const labels = TUNINGS.standard.labels;
    labels.forEach(label => {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    });
  });

  it('renders fret numbers 0 to 15', () => {
    renderFretboard();
    for (let f = 0; f <= TOTAL_FRETS; f++) {
      expect(screen.getAllByText(String(f)).length).toBeGreaterThan(0);
    }
  });

  it('renders 6 × 16 fret cells total', () => {
    renderFretboard();
    const cells = document.querySelectorAll('.fret-cell');
    expect(cells).toHaveLength(6 * (TOTAL_FRETS + 1));
  });

  it('clicking a fret cell dispatches ADD_NOTE_TO_BEAT', () => {
    const { dispatch } = renderFretboard();
    const cells = document.querySelectorAll('.fret-cell');
    fireEvent.click(cells[0]); // string=0, fret=0
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ADD_NOTE_TO_BEAT' })
    );
  });

  it('clicking a fret calls onNotePreview with correct midi', () => {
    const { onNotePreview } = renderFretboard();
    const cells = document.querySelectorAll('.fret-cell');
    fireEvent.click(cells[0]); // string=0, fret=0
    const expectedMidi = TUNINGS.standard.midi[0] + 0;
    expect(onNotePreview).toHaveBeenCalledWith(expectedMidi);
  });

  it('right-clicking a fret cell dispatches REMOVE_NOTE', () => {
    const { dispatch } = renderFretboard();
    const cells = document.querySelectorAll('.fret-cell');
    fireEvent.contextMenu(cells[0]);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'REMOVE_NOTE' })
    );
  });

  it('ADD_NOTE_TO_BEAT payload contains correct inst (guitar)', () => {
    const { dispatch } = renderFretboard();
    const cells = document.querySelectorAll('.fret-cell');
    fireEvent.click(cells[0]);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ADD_NOTE_TO_BEAT',
        payload: expect.objectContaining({ inst: 'guitar' }),
      })
    );
  });

  it('scale notes show note-marker with scale-note class', () => {
    renderFretboard();
    const scaleMarkers = document.querySelectorAll('.note-marker.scale-note');
    // A minor pentatonic has 5 notes, each appearing across 6 strings × 16 frets
    expect(scaleMarkers.length).toBeGreaterThan(0);
  });

  it('selected note shows note-marker with selected class', () => {
    const stateWithNote: AppState = {
      ...mockGuitarState,
      guitar: {
        beats: [{ notes: [{ string: 0, fret: 5, midi: TUNINGS.standard.midi[0] + 5 }], duration: 0.25 }],
        currentBeatIdx: 0,
      },
    };
    renderFretboard(stateWithNote);
    const selectedMarkers = document.querySelectorAll('.note-marker.selected');
    expect(selectedMarkers.length).toBeGreaterThan(0);
  });
});

describe('Fretboard component — bass mode', () => {
  const mockBassState: AppState = { ...mockGuitarState, activeInst: 'bass' };

  it('renders 4 string labels for bass', () => {
    renderFretboard(mockBassState);
    // Bass has 4 strings, check no 5th string label visible
    const cells = document.querySelectorAll('.fret-cell');
    expect(cells).toHaveLength(4 * (TOTAL_FRETS + 1));
  });

  it('ADD_NOTE_TO_BEAT payload contains inst: bass', () => {
    const { dispatch } = renderFretboard(mockBassState);
    const cells = document.querySelectorAll('.fret-cell');
    fireEvent.click(cells[0]);
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ADD_NOTE_TO_BEAT',
        payload: expect.objectContaining({ inst: 'bass' }),
      })
    );
  });
});

describe('Fretboard component — tuning changes', () => {
  it('renders Drop D tuning labels when tuning is dropD', () => {
    renderFretboard({ ...mockGuitarState, tuning: 'dropD' });
    // dropD low string label is 'D' (replacing 'E')
    const labels = document.querySelectorAll('.string-label');
    const lastLabel = labels[labels.length - 1];
    expect(lastLabel).toHaveTextContent('D');
  });
});
