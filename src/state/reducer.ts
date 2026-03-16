import { AppState, AppAction } from './types';
import { DRUM_STEPS, TUNINGS } from '../constants/music';

function getGuitarMidi(tuning: string, s: number, f: number): number {
  return TUNINGS[tuning].midi[s] + f;
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ACTIVE_INST':
      return { ...state, activeInst: action.payload };

    case 'SET_KEY':
      return { ...state, key: action.payload };

    case 'SET_SCALE':
      return { ...state, scale: action.payload };

    case 'SET_TUNING':
      return { ...state, tuning: action.payload };

    case 'UPDATE_TUNING_MIDI': {
      const tuning = action.payload;
      const newBeats = state.guitar.beats.map(b => ({
        ...b,
        notes: b.notes.map(n => ({ ...n, midi: getGuitarMidi(tuning, n.string, n.fret) })),
      }));
      return { ...state, tuning, guitar: { ...state.guitar, beats: newBeats } };
    }

    case 'SET_STYLE':
      return { ...state, style: action.payload };

    case 'SET_TEMPO':
      return { ...state, tempo: Math.max(40, Math.min(300, action.payload || 120)) };

    case 'SET_GEN_LENGTH':
      return { ...state, genLength: action.payload };

    case 'SET_GEN_MODE':
      return { ...state, genMode: action.payload };

    case 'SET_DEFAULT_DURATION':
      return { ...state, defaultDuration: action.payload };

    case 'ADD_NOTE_TO_BEAT': {
      const { note, inst } = action.payload;
      if (inst === 'drums') return state;
      const track = { ...state[inst] };
      const beats = [...track.beats.map(b => ({ ...b, notes: [...b.notes] }))];

      if (track.currentBeatIdx >= 0 && track.currentBeatIdx < beats.length) {
        const beat = beats[track.currentBeatIdx];
        const ni = beat.notes.findIndex(n => n.string === note.string && n.fret === note.fret);
        if (ni >= 0) {
          beat.notes.splice(ni, 1);
          if (beat.notes.length === 0) {
            beats.splice(track.currentBeatIdx, 1);
            track.currentBeatIdx = track.currentBeatIdx >= beats.length ? -1 : track.currentBeatIdx;
          }
        } else {
          beat.notes.push(note);
        }
      } else {
        beats.push({ notes: [note], duration: state.defaultDuration });
        track.currentBeatIdx = beats.length - 1;
      }

      track.beats = beats;
      return { ...state, [inst]: track };
    }

    case 'ADVANCE_BEAT': {
      const inst = action.payload;
      if (inst === 'drums') return state;
      return { ...state, [inst]: { ...state[inst], currentBeatIdx: -1 } };
    }

    case 'REMOVE_NOTE': {
      const { string, fret, inst } = action.payload;
      if (inst === 'drums') return state;
      const track = { ...state[inst] };
      const beats = [...track.beats.map(b => ({ ...b, notes: [...b.notes] }))];
      for (let bi = 0; bi < beats.length; bi++) {
        const ni = beats[bi].notes.findIndex(n => n.string === string && n.fret === fret);
        if (ni >= 0) {
          beats[bi].notes.splice(ni, 1);
          if (beats[bi].notes.length === 0) {
            beats.splice(bi, 1);
            if (track.currentBeatIdx >= beats.length) track.currentBeatIdx = beats.length - 1;
          }
          break;
        }
      }
      track.beats = beats;
      return { ...state, [inst]: track };
    }

    case 'REMOVE_BEAT': {
      const { beatIdx, inst } = action.payload;
      if (inst === 'drums') return state;
      const track = { ...state[inst] };
      const beats = [...track.beats];
      beats.splice(beatIdx, 1);
      track.beats = beats;
      if (track.currentBeatIdx >= beats.length) track.currentBeatIdx = -1;
      return { ...state, [inst]: track };
    }

    case 'SET_BEAT_DURATION': {
      const { beatIdx, duration, inst } = action.payload;
      if (inst === 'drums') return state;
      const track = { ...state[inst] };
      const beats = [...track.beats.map(b => ({ ...b }))];
      if (beats[beatIdx]) beats[beatIdx].duration = duration;
      track.beats = beats;
      return { ...state, [inst]: track };
    }

    case 'SELECT_BEAT': {
      const { beatIdx, inst } = action.payload;
      if (inst === 'drums') return state;
      return { ...state, [inst]: { ...state[inst], currentBeatIdx: beatIdx } };
    }

    case 'TOGGLE_DRUM_CELL': {
      const { row, step } = action.payload;
      const pattern = state.drums.pattern.map(r => [...r]);
      pattern[row][step] = !pattern[row][step];
      return { ...state, drums: { pattern } };
    }

    case 'CLEAR_TRACK': {
      const inst = action.payload;
      if (inst === 'drums') {
        return { ...state, drums: { pattern: Array.from({ length: 6 }, () => new Array(DRUM_STEPS).fill(false)) } };
      }
      return { ...state, [inst]: { beats: [], currentBeatIdx: -1 } };
    }

    case 'SET_RESULTS':
      return { ...state, results: action.payload };

    case 'SET_PLAYING':
      return { ...state, playingIdx: action.payload };

    case 'STOP_PLAYING':
      return { ...state, playingIdx: -1 };

    case 'USE_RESULT': {
      const r = action.payload;
      return {
        ...state,
        guitar: {
          beats: r.guitarBeats.map(b => ({ notes: b.notes.map(n => ({ ...n })), duration: b.duration })),
          currentBeatIdx: -1,
        },
        bass: {
          beats: r.bassBeats.map(b => ({ notes: b.notes.map(n => ({ ...n })), duration: b.duration })),
          currentBeatIdx: -1,
        },
        results: [],
        playingIdx: -1,
      };
    }

    case 'SET_VOLUME':
      return {
        ...state,
        mixer: {
          ...state.mixer,
          [action.payload.inst]: { ...state.mixer[action.payload.inst], volume: action.payload.volume },
        },
      };

    case 'TOGGLE_MUTE':
      return {
        ...state,
        mixer: {
          ...state.mixer,
          [action.payload]: { ...state.mixer[action.payload], muted: !state.mixer[action.payload].muted },
        },
      };

    case 'TOGGLE_SOLO': {
      const inst = action.payload;
      return {
        ...state,
        mixer: {
          ...state.mixer,
          [inst]: { ...state.mixer[inst], solo: !state.mixer[inst].solo },
        },
      };
    }

    case 'SET_SAMPLE_SET':
      return {
        ...state,
        mixer: {
          ...state.mixer,
          [action.payload.inst]: { ...state.mixer[action.payload.inst], sampleSet: action.payload.sampleSet },
        },
      };

    case 'TOGGLE_GENERATE_FOR':
      return {
        ...state,
        generateFor: {
          ...state.generateFor,
          [action.payload]: !state.generateFor[action.payload],
        },
      };

    default:
      return state;
  }
}
