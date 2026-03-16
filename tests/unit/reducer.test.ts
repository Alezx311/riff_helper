import { describe, it, expect } from 'vitest';
import { appReducer } from '../../src/state/reducer';
import { AppState } from '../../src/state/types';
import { GenerationResult, FretNote } from '../../src/types';
import { DRUM_STEPS, TUNINGS } from '../../src/constants/music';

const emptyDrums = { pattern: Array.from({ length: 6 }, () => new Array(DRUM_STEPS).fill(false)) };

const initialState: AppState = {
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

const note: FretNote = { string: 1, fret: 5, midi: 64 };

describe('appReducer — SET_ACTIVE_INST', () => {
  it('changes activeInst to bass', () => {
    const s = appReducer(initialState, { type: 'SET_ACTIVE_INST', payload: 'bass' });
    expect(s.activeInst).toBe('bass');
  });

  it('does not mutate other state', () => {
    const s = appReducer(initialState, { type: 'SET_ACTIVE_INST', payload: 'drums' });
    expect(s.key).toBe(initialState.key);
    expect(s.guitar).toBe(initialState.guitar);
  });
});

describe('appReducer — SET_KEY', () => {
  it('updates key', () => {
    const s = appReducer(initialState, { type: 'SET_KEY', payload: 0 });
    expect(s.key).toBe(0);
  });
});

describe('appReducer — SET_SCALE', () => {
  it('updates scale', () => {
    const s = appReducer(initialState, { type: 'SET_SCALE', payload: 'major' });
    expect(s.scale).toBe('major');
  });
});

describe('appReducer — SET_TUNING', () => {
  it('updates tuning name only (not midi)', () => {
    const s = appReducer(initialState, { type: 'SET_TUNING', payload: 'dropD' });
    expect(s.tuning).toBe('dropD');
  });
});

describe('appReducer — UPDATE_TUNING_MIDI', () => {
  it('updates tuning and recalculates midi values for guitar beats', () => {
    const stateWithNote: AppState = {
      ...initialState,
      guitar: {
        beats: [{ notes: [{ string: 0, fret: 5, midi: TUNINGS.standard.midi[0] + 5 }], duration: 0.25 }],
        currentBeatIdx: 0,
      },
    };
    const s = appReducer(stateWithNote, { type: 'UPDATE_TUNING_MIDI', payload: 'dropD' });
    expect(s.tuning).toBe('dropD');
    const expectedMidi = TUNINGS.dropD.midi[0] + 5;
    expect(s.guitar.beats[0].notes[0].midi).toBe(expectedMidi);
  });
});

describe('appReducer — SET_STYLE', () => {
  it('updates style', () => {
    const s = appReducer(initialState, { type: 'SET_STYLE', payload: 'rock' });
    expect(s.style).toBe('rock');
  });
});

describe('appReducer — SET_TEMPO', () => {
  it('sets tempo within bounds', () => {
    const s = appReducer(initialState, { type: 'SET_TEMPO', payload: 160 });
    expect(s.tempo).toBe(160);
  });

  it('clamps to minimum 40', () => {
    const s = appReducer(initialState, { type: 'SET_TEMPO', payload: 10 });
    expect(s.tempo).toBe(40);
  });

  it('clamps to maximum 300', () => {
    const s = appReducer(initialState, { type: 'SET_TEMPO', payload: 999 });
    expect(s.tempo).toBe(300);
  });

  it('defaults to 120 when payload is falsy/undefined', () => {
    const s = appReducer(initialState, { type: 'SET_TEMPO', payload: 0 });
    expect(s.tempo).toBe(120);
  });
});

describe('appReducer — SET_GEN_LENGTH', () => {
  it('updates genLength', () => {
    const s = appReducer(initialState, { type: 'SET_GEN_LENGTH', payload: 8 });
    expect(s.genLength).toBe(8);
  });
});

describe('appReducer — SET_GEN_MODE', () => {
  it('switches to remix mode', () => {
    const s = appReducer(initialState, { type: 'SET_GEN_MODE', payload: 'remix' });
    expect(s.genMode).toBe('remix');
  });
});

describe('appReducer — SET_DEFAULT_DURATION', () => {
  it('updates defaultDuration', () => {
    const s = appReducer(initialState, { type: 'SET_DEFAULT_DURATION', payload: 0.5 });
    expect(s.defaultDuration).toBe(0.5);
  });
});

describe('appReducer — ADD_NOTE_TO_BEAT', () => {
  it('creates a new beat when no current beat selected', () => {
    const s = appReducer(initialState, { type: 'ADD_NOTE_TO_BEAT', payload: { note, inst: 'guitar' } });
    expect(s.guitar.beats).toHaveLength(1);
    expect(s.guitar.beats[0].notes[0]).toEqual(note);
    expect(s.guitar.currentBeatIdx).toBe(0);
  });

  it('adds note to current beat', () => {
    const withBeat: AppState = {
      ...initialState,
      guitar: {
        beats: [{ notes: [note], duration: 0.25 }],
        currentBeatIdx: 0,
      },
    };
    const newNote: FretNote = { string: 2, fret: 3, midi: 58 };
    const s = appReducer(withBeat, { type: 'ADD_NOTE_TO_BEAT', payload: { note: newNote, inst: 'guitar' } });
    expect(s.guitar.beats[0].notes).toHaveLength(2);
    expect(s.guitar.beats[0].notes[1]).toEqual(newNote);
  });

  it('toggles note off when same string+fret clicked again', () => {
    const withBeat: AppState = {
      ...initialState,
      guitar: {
        beats: [{ notes: [note, { string: 2, fret: 3, midi: 58 }], duration: 0.25 }],
        currentBeatIdx: 0,
      },
    };
    const s = appReducer(withBeat, { type: 'ADD_NOTE_TO_BEAT', payload: { note, inst: 'guitar' } });
    expect(s.guitar.beats[0].notes).toHaveLength(1);
    expect(s.guitar.beats[0].notes[0]).not.toEqual(note);
  });

  it('removes beat entirely when last note in beat is toggled off', () => {
    const withBeat: AppState = {
      ...initialState,
      guitar: {
        beats: [{ notes: [note], duration: 0.25 }],
        currentBeatIdx: 0,
      },
    };
    const s = appReducer(withBeat, { type: 'ADD_NOTE_TO_BEAT', payload: { note, inst: 'guitar' } });
    expect(s.guitar.beats).toHaveLength(0);
  });

  it('ignores drums instrument', () => {
    const s = appReducer(initialState, { type: 'ADD_NOTE_TO_BEAT', payload: { note, inst: 'drums' } });
    expect(s).toEqual(initialState);
  });

  it('sets duration to defaultDuration for new beat', () => {
    const s = appReducer(
      { ...initialState, defaultDuration: 0.5 },
      { type: 'ADD_NOTE_TO_BEAT', payload: { note, inst: 'guitar' } }
    );
    expect(s.guitar.beats[0].duration).toBe(0.5);
  });
});

describe('appReducer — ADVANCE_BEAT', () => {
  it('sets currentBeatIdx to -1', () => {
    const withBeat: AppState = {
      ...initialState,
      guitar: { beats: [{ notes: [note], duration: 0.25 }], currentBeatIdx: 0 },
    };
    const s = appReducer(withBeat, { type: 'ADVANCE_BEAT', payload: 'guitar' });
    expect(s.guitar.currentBeatIdx).toBe(-1);
  });

  it('ignores drums', () => {
    const s = appReducer(initialState, { type: 'ADVANCE_BEAT', payload: 'drums' });
    expect(s).toEqual(initialState);
  });
});

describe('appReducer — REMOVE_NOTE', () => {
  it('removes note by string and fret', () => {
    const withBeat: AppState = {
      ...initialState,
      guitar: {
        beats: [{ notes: [note, { string: 2, fret: 3, midi: 58 }], duration: 0.25 }],
        currentBeatIdx: 0,
      },
    };
    const s = appReducer(withBeat, { type: 'REMOVE_NOTE', payload: { string: note.string, fret: note.fret, inst: 'guitar' } });
    expect(s.guitar.beats[0].notes).toHaveLength(1);
    expect(s.guitar.beats[0].notes[0]).not.toEqual(note);
  });

  it('removes empty beat after last note removed', () => {
    const withBeat: AppState = {
      ...initialState,
      guitar: {
        beats: [{ notes: [note], duration: 0.25 }],
        currentBeatIdx: 0,
      },
    };
    const s = appReducer(withBeat, { type: 'REMOVE_NOTE', payload: { string: note.string, fret: note.fret, inst: 'guitar' } });
    expect(s.guitar.beats).toHaveLength(0);
  });

  it('does nothing for non-existent note', () => {
    const s = appReducer(initialState, { type: 'REMOVE_NOTE', payload: { string: 99, fret: 99, inst: 'guitar' } });
    expect(s.guitar.beats).toHaveLength(0);
  });

  it('ignores drums', () => {
    const s = appReducer(initialState, { type: 'REMOVE_NOTE', payload: { string: 0, fret: 0, inst: 'drums' } });
    expect(s).toEqual(initialState);
  });
});

describe('appReducer — REMOVE_BEAT', () => {
  it('removes beat at given index', () => {
    const with2Beats: AppState = {
      ...initialState,
      guitar: {
        beats: [
          { notes: [note], duration: 0.25 },
          { notes: [{ string: 2, fret: 3, midi: 58 }], duration: 0.25 },
        ],
        currentBeatIdx: 0,
      },
    };
    const s = appReducer(with2Beats, { type: 'REMOVE_BEAT', payload: { beatIdx: 0, inst: 'guitar' } });
    expect(s.guitar.beats).toHaveLength(1);
  });

  it('adjusts currentBeatIdx when it goes out of bounds', () => {
    const with1Beat: AppState = {
      ...initialState,
      guitar: { beats: [{ notes: [note], duration: 0.25 }], currentBeatIdx: 0 },
    };
    const s = appReducer(with1Beat, { type: 'REMOVE_BEAT', payload: { beatIdx: 0, inst: 'guitar' } });
    expect(s.guitar.currentBeatIdx).toBe(-1);
  });

  it('ignores drums', () => {
    const s = appReducer(initialState, { type: 'REMOVE_BEAT', payload: { beatIdx: 0, inst: 'drums' } });
    expect(s).toEqual(initialState);
  });
});

describe('appReducer — SET_BEAT_DURATION', () => {
  it('updates duration for specified beat', () => {
    const withBeat: AppState = {
      ...initialState,
      guitar: { beats: [{ notes: [note], duration: 0.25 }], currentBeatIdx: 0 },
    };
    const s = appReducer(withBeat, { type: 'SET_BEAT_DURATION', payload: { beatIdx: 0, duration: 0.5, inst: 'guitar' } });
    expect(s.guitar.beats[0].duration).toBe(0.5);
  });

  it('does nothing for out-of-range beatIdx', () => {
    const s = appReducer(initialState, { type: 'SET_BEAT_DURATION', payload: { beatIdx: 5, duration: 0.5, inst: 'guitar' } });
    expect(s.guitar.beats).toHaveLength(0);
  });

  it('ignores drums', () => {
    const s = appReducer(initialState, { type: 'SET_BEAT_DURATION', payload: { beatIdx: 0, duration: 0.5, inst: 'drums' } });
    expect(s).toEqual(initialState);
  });
});

describe('appReducer — SELECT_BEAT', () => {
  it('sets currentBeatIdx for instrument', () => {
    const with2Beats: AppState = {
      ...initialState,
      guitar: {
        beats: [
          { notes: [note], duration: 0.25 },
          { notes: [{ string: 2, fret: 3, midi: 58 }], duration: 0.25 },
        ],
        currentBeatIdx: 0,
      },
    };
    const s = appReducer(with2Beats, { type: 'SELECT_BEAT', payload: { beatIdx: 1, inst: 'guitar' } });
    expect(s.guitar.currentBeatIdx).toBe(1);
  });

  it('ignores drums', () => {
    const s = appReducer(initialState, { type: 'SELECT_BEAT', payload: { beatIdx: 0, inst: 'drums' } });
    expect(s).toEqual(initialState);
  });
});

describe('appReducer — TOGGLE_DRUM_CELL', () => {
  it('activates an inactive cell', () => {
    const s = appReducer(initialState, { type: 'TOGGLE_DRUM_CELL', payload: { row: 0, step: 0 } });
    expect(s.drums.pattern[0][0]).toBe(true);
  });

  it('deactivates an active cell', () => {
    const active: AppState = {
      ...initialState,
      drums: { pattern: initialState.drums.pattern.map((r, ri) => r.map((v, si) => ri === 0 && si === 0 ? true : v)) },
    };
    const s = appReducer(active, { type: 'TOGGLE_DRUM_CELL', payload: { row: 0, step: 0 } });
    expect(s.drums.pattern[0][0]).toBe(false);
  });

  it('does not affect other cells', () => {
    const s = appReducer(initialState, { type: 'TOGGLE_DRUM_CELL', payload: { row: 0, step: 0 } });
    expect(s.drums.pattern[0][1]).toBe(false);
    expect(s.drums.pattern[1][0]).toBe(false);
  });

  it('preserves immutability (original state unchanged)', () => {
    appReducer(initialState, { type: 'TOGGLE_DRUM_CELL', payload: { row: 0, step: 0 } });
    expect(initialState.drums.pattern[0][0]).toBe(false);
  });
});

describe('appReducer — CLEAR_TRACK', () => {
  it('clears guitar beats', () => {
    const withBeat: AppState = {
      ...initialState,
      guitar: { beats: [{ notes: [note], duration: 0.25 }], currentBeatIdx: 0 },
    };
    const s = appReducer(withBeat, { type: 'CLEAR_TRACK', payload: 'guitar' });
    expect(s.guitar.beats).toHaveLength(0);
    expect(s.guitar.currentBeatIdx).toBe(-1);
  });

  it('clears bass beats', () => {
    const withBeat: AppState = {
      ...initialState,
      bass: { beats: [{ notes: [note], duration: 0.25 }], currentBeatIdx: 0 },
    };
    const s = appReducer(withBeat, { type: 'CLEAR_TRACK', payload: 'bass' });
    expect(s.bass.beats).toHaveLength(0);
  });

  it('clears drum pattern', () => {
    const activePattern: AppState = {
      ...initialState,
      drums: { pattern: initialState.drums.pattern.map(r => r.map(() => true)) },
    };
    const s = appReducer(activePattern, { type: 'CLEAR_TRACK', payload: 'drums' });
    s.drums.pattern.forEach(row => row.forEach(cell => expect(cell).toBe(false)));
  });
});

describe('appReducer — SET_RESULTS', () => {
  it('stores generation results', () => {
    const result: GenerationResult = {
      id: 0, guitarBeats: [], bassBeats: [],
      drumPattern: emptyDrums.pattern, score: 75,
    };
    const s = appReducer(initialState, { type: 'SET_RESULTS', payload: [result] });
    expect(s.results).toHaveLength(1);
    expect(s.results[0].score).toBe(75);
  });
});

describe('appReducer — SET_PLAYING / STOP_PLAYING', () => {
  it('SET_PLAYING sets playingIdx', () => {
    const s = appReducer(initialState, { type: 'SET_PLAYING', payload: 2 });
    expect(s.playingIdx).toBe(2);
  });

  it('STOP_PLAYING resets playingIdx to -1', () => {
    const playing: AppState = { ...initialState, playingIdx: 2 };
    const s = appReducer(playing, { type: 'STOP_PLAYING' });
    expect(s.playingIdx).toBe(-1);
  });
});

describe('appReducer — USE_RESULT', () => {
  it('replaces guitar and bass beats from result', () => {
    const result: GenerationResult = {
      id: 0,
      guitarBeats: [{ notes: [note], duration: 0.5 }],
      bassBeats: [{ notes: [{ string: 0, fret: 3, midi: 46 }], duration: 0.5 }],
      drumPattern: emptyDrums.pattern,
      score: 80,
    };
    const s = appReducer(initialState, { type: 'USE_RESULT', payload: result });
    expect(s.guitar.beats).toHaveLength(1);
    expect(s.bass.beats).toHaveLength(1);
    expect(s.guitar.currentBeatIdx).toBe(-1);
    expect(s.results).toHaveLength(0);
    expect(s.playingIdx).toBe(-1);
  });

  it('deep-copies beats from result (no shared references)', () => {
    const result: GenerationResult = {
      id: 0,
      guitarBeats: [{ notes: [note], duration: 0.5 }],
      bassBeats: [],
      drumPattern: emptyDrums.pattern,
      score: 80,
    };
    const s = appReducer(initialState, { type: 'USE_RESULT', payload: result });
    // Mutating result should not affect state
    result.guitarBeats[0].duration = 99;
    expect(s.guitar.beats[0].duration).toBe(0.5);
  });
});

describe('appReducer — SET_VOLUME', () => {
  it('updates volume for guitar', () => {
    const s = appReducer(initialState, { type: 'SET_VOLUME', payload: { inst: 'guitar', volume: 0.5 } });
    expect(s.mixer.guitar.volume).toBe(0.5);
  });

  it('does not affect other mixer channels', () => {
    const s = appReducer(initialState, { type: 'SET_VOLUME', payload: { inst: 'guitar', volume: 0.5 } });
    expect(s.mixer.bass.volume).toBe(initialState.mixer.bass.volume);
  });
});

describe('appReducer — TOGGLE_MUTE', () => {
  it('mutes guitar when currently unmuted', () => {
    const s = appReducer(initialState, { type: 'TOGGLE_MUTE', payload: 'guitar' });
    expect(s.mixer.guitar.muted).toBe(true);
  });

  it('unmutes guitar when currently muted', () => {
    const muted: AppState = {
      ...initialState,
      mixer: { ...initialState.mixer, guitar: { ...initialState.mixer.guitar, muted: true } },
    };
    const s = appReducer(muted, { type: 'TOGGLE_MUTE', payload: 'guitar' });
    expect(s.mixer.guitar.muted).toBe(false);
  });
});

describe('appReducer — TOGGLE_SOLO', () => {
  it('solos bass when currently not soloed', () => {
    const s = appReducer(initialState, { type: 'TOGGLE_SOLO', payload: 'bass' });
    expect(s.mixer.bass.solo).toBe(true);
  });

  it('un-solos bass when currently soloed', () => {
    const soloed: AppState = {
      ...initialState,
      mixer: { ...initialState.mixer, bass: { ...initialState.mixer.bass, solo: true } },
    };
    const s = appReducer(soloed, { type: 'TOGGLE_SOLO', payload: 'bass' });
    expect(s.mixer.bass.solo).toBe(false);
  });
});

describe('appReducer — SET_SAMPLE_SET', () => {
  it('updates sampleSet for instrument', () => {
    const s = appReducer(initialState, { type: 'SET_SAMPLE_SET', payload: { inst: 'guitar', sampleSet: 'piano' } });
    expect(s.mixer.guitar.sampleSet).toBe('piano');
  });
});

describe('appReducer — TOGGLE_GENERATE_FOR', () => {
  it('disables guitar generation', () => {
    const s = appReducer(initialState, { type: 'TOGGLE_GENERATE_FOR', payload: 'guitar' });
    expect(s.generateFor.guitar).toBe(false);
  });

  it('enables guitar generation when disabled', () => {
    const disabled: AppState = {
      ...initialState,
      generateFor: { ...initialState.generateFor, guitar: false },
    };
    const s = appReducer(disabled, { type: 'TOGGLE_GENERATE_FOR', payload: 'guitar' });
    expect(s.generateFor.guitar).toBe(true);
  });

  it('does not affect other instruments', () => {
    const s = appReducer(initialState, { type: 'TOGGLE_GENERATE_FOR', payload: 'guitar' });
    expect(s.generateFor.bass).toBe(true);
    expect(s.generateFor.drums).toBe(true);
  });
});

describe('appReducer — unknown action', () => {
  it('returns state unchanged for unknown action type', () => {
    // @ts-expect-error testing unknown action
    const s = appReducer(initialState, { type: 'UNKNOWN_ACTION' });
    expect(s).toEqual(initialState);
  });
});
