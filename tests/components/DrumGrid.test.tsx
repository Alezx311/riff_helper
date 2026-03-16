import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DrumGrid } from '../../src/components/DrumGrid/DrumGrid';
import * as AppContextModule from '../../src/state/AppContext';
import { AppState } from '../../src/state/types';
import { DRUM_STEPS, DRUM_NAMES } from '../../src/constants/music';

const emptyPattern = Array.from({ length: 6 }, () => new Array(DRUM_STEPS).fill(false));

const mockState: AppState = {
  activeInst: 'guitar',
  guitar: { beats: [], currentBeatIdx: -1 },
  bass: { beats: [], currentBeatIdx: -1 },
  drums: { pattern: emptyPattern },
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

function renderDrumGrid(state = mockState, dispatch = vi.fn()) {
  vi.spyOn(AppContextModule, 'useAppState').mockReturnValue({ state, dispatch });
  return { dispatch, ...render(<DrumGrid />) };
}

describe('DrumGrid component', () => {
  it('renders all drum row labels', () => {
    renderDrumGrid();
    DRUM_NAMES.forEach(name => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  it('renders step numbers 1-16', () => {
    renderDrumGrid();
    for (let i = 1; i <= DRUM_STEPS; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument();
    }
  });

  it('renders 6 × 16 = 96 drum cells', () => {
    renderDrumGrid();
    // Cells that are inactive show empty text, active show 'x'
    // Total cells = 6 rows * 16 steps
    const cells = document.querySelectorAll('.drum-cell');
    expect(cells).toHaveLength(96);
  });

  it('inactive cells have no active class', () => {
    renderDrumGrid();
    const cells = document.querySelectorAll('.drum-cell');
    cells.forEach(cell => {
      expect(cell).not.toHaveClass('active');
    });
  });

  it('active cell has active class', () => {
    const activePattern = emptyPattern.map((r, ri) =>
      r.map((v, si) => ri === 0 && si === 0 ? true : v)
    );
    renderDrumGrid({ ...mockState, drums: { pattern: activePattern } });
    const activeCells = document.querySelectorAll('.drum-cell.active');
    expect(activeCells).toHaveLength(1);
  });

  it('active cell shows "x"', () => {
    const activePattern = emptyPattern.map((r, ri) =>
      r.map((v, si) => ri === 0 && si === 0 ? true : v)
    );
    renderDrumGrid({ ...mockState, drums: { pattern: activePattern } });
    const activeCells = document.querySelectorAll('.drum-cell.active');
    expect(activeCells[0]).toHaveTextContent('x');
  });

  it('clicking an inactive cell dispatches TOGGLE_DRUM_CELL with correct row and step', () => {
    const { dispatch } = renderDrumGrid();
    const cells = document.querySelectorAll('.drum-cell');
    fireEvent.click(cells[0]); // row=0, step=0
    expect(dispatch).toHaveBeenCalledWith({
      type: 'TOGGLE_DRUM_CELL',
      payload: { row: 0, step: 0 },
    });
  });

  it('clicking the 17th cell dispatches TOGGLE_DRUM_CELL for row=1, step=0', () => {
    const { dispatch } = renderDrumGrid();
    const cells = document.querySelectorAll('.drum-cell');
    fireEvent.click(cells[16]); // second row, first step
    expect(dispatch).toHaveBeenCalledWith({
      type: 'TOGGLE_DRUM_CELL',
      payload: { row: 1, step: 0 },
    });
  });

  it('clicking an active cell dispatches TOGGLE_DRUM_CELL (to deactivate)', () => {
    const activePattern = emptyPattern.map((r, ri) =>
      r.map((v, si) => ri === 2 && si === 4 ? true : v)
    );
    const { dispatch } = renderDrumGrid({ ...mockState, drums: { pattern: activePattern } });
    const activeCells = document.querySelectorAll('.drum-cell.active');
    fireEvent.click(activeCells[0]);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'TOGGLE_DRUM_CELL',
      payload: { row: 2, step: 4 },
    });
  });

  it('renders correctly with all cells active', () => {
    const allActive = Array.from({ length: 6 }, () => new Array(DRUM_STEPS).fill(true));
    renderDrumGrid({ ...mockState, drums: { pattern: allActive } });
    const activeCells = document.querySelectorAll('.drum-cell.active');
    expect(activeCells).toHaveLength(96);
  });
});
