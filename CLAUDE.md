# GuitarRiff Helper

## Project Overview
Multi-instrument riff generator. Users input notes on virtual fretboard (guitar/bass) or drum grid,
and the app generates musically relevant continuations or entirely new remixes.

## Tech Stack
- **React 19 + TypeScript** (Vite 8 build)
- **Tone.js 14** for audio (real instrument samples via `Tone.Sampler`)
- **Web Audio API** for drums (synth: sine+noise) and Jam Session (pitch detection)
- All logic client-side, no backend
- Hosted on **GitHub Pages** (`base: '/riff_helper/'`)

## Key Architecture

### Data Model
- **Beat**: `{ notes: FretNote[], duration: number }`
- **FretNote**: `{ string, fret, midi }`
- **AppState**: managed via `useReducer` + React Context (`src/state/`)
- **GenerationResult**: `{ guitarBeats, bassBeats, drumPattern, score }`

### Instruments
| Instrument | Strings | Tuning      | Sound                    | Tab color |
|------------|---------|-------------|--------------------------|-----------|
| Guitar     | 6       | configurable (7 tunings) | Tone.Sampler (real samples) | green  |
| Bass       | 4       | BEADG (fixed) | Tone.Sampler (real samples) | orange  |
| Drums      | 6 voices | Kick/Snare/HiHat/Crash/Tom1/Tom2 | Web Audio synth | blue |

### Sample Sets (selectable per instrument)
`guitar-electric`, `guitar-acoustic`, `guitar-nylon`, `bass-electric`,
`piano`, `violin`, `cello`, `organ`, `saxophone`, `bassoon`, `contrabass`

Samples live in `public/samples/<set-name>/` as `.mp3` files (~297MB total).
`Tone.Sampler` pitch-shifts nearest sample for missing notes.

### Generation Modes
- **Continue**: extend input sequence, loop-aware
- **Remix**: new riff using only pitch classes from input

### Rhythm Generation
- Each style has `rhythmVariety` (0-1) controlling duration variation
- Duration pool: `baseDur`, `baseDur*2`, `baseDur*0.5`, `baseDur*1.5`
- Blues/Funk: shuffle feel (1.33/0.67 alternation)
- Per-beat custom duration via UI picker

### Multi-instrument Generation
- Guitar: 7 strategies (stepwise, skipUp, skipDown, pendulum, resolve, chromatic, styleLick)
- Bass: follows guitar (auto-generates root notes) or independent if bass input exists
- Drums: passed through as-is (16-step grid, user-defined)
- All instruments play simultaneously with correct timing

### Current Features
- 2 views: **Main** (riff editor) and **Jam Session** (real-time pitch detection)
- 3 instrument tabs: Guitar, Bass, Drums
- Green dot indicators on tabs with data
- Virtual fretboard (guitar 6-string, bass 4-string, 15 frets)
- 16-step drum grid (Kick, Snare, HiHat, Crash, Tom1, Tom2)
- Key + scale + tuning + style selection
- Continue + Remix generation modes
- Varied rhythm generation (style-dependent)
- Chord input, custom duration per beat
- Play Input (all instruments together)
- Looping playback with stop button
- Tempo slider (40-300 BPM)
- Tab display per instrument (guitar/bass/drums)
- **MixerPanel**: volume, mute, solo per instrument + sample set selector
- **JamSession**: real-time pitch detection via microphone + audio debug panel
- Responsive design

## File Structure
```
src/
  audio/
    DrumEngine.ts       - Web Audio API drum synth
    SampleEngine.ts     - Tone.Sampler wrapper (lazy-loaded, cached per inst+sampleSet)
    useAudioEngine.ts   - React hook: playAllOnce, playLoop, stopPlayback, playPreview
  components/
    BeatInput/          - Beat chips display + duration picker
    Controls/           - Key, scale, tuning, style, tempo, duration controls
    DrumGrid/           - 16-step drum sequencer
    Fretboard/          - Interactive fretboard (guitar/bass)
    GenerationControls/ - Generate, Play Input, Clear, Stop buttons
    Header/             - App header + view switcher (Main / Jam Session)
    InstrumentTabs/     - Guitar / Bass / Drums tab switcher
    JamSession/         - Real-time pitch detection view
    MixerPanel/         - Volume/mute/solo/sample-set per instrument
    Results/            - Generated variant cards with Play/Loop/Use
  constants/
    music.ts            - Scales, tunings, styles, note names
    samples.ts          - Sample set definitions + default sample sets
  generation/
    bass.ts             - Auto-bass generation from guitar roots
    continue.ts         - Continue mode logic
    generate.ts         - Entry point: dispatches to continue/remix
    remix.ts            - Remix mode logic
    rhythm.ts           - Duration assignment per style
    scoring.ts          - Score calculation (melodic flow, playability, loop smoothness)
    strategies.ts       - 7 melodic strategies
  state/
    AppContext.tsx       - React Context + useAppState hook
    reducer.ts          - All AppAction handlers
    types.ts            - AppState, AppAction types
  types/
    index.ts            - Shared domain types (Beat, FretNote, GenerationResult, etc.)
  utils/
    midi.ts             - MIDI ↔ note name conversion
    tab.ts              - Tab string rendering
public/
  samples/              - Real instrument samples (~297MB, committed to git)
.github/
  workflows/
    deploy.yml          - GitHub Actions: build → deploy to GitHub Pages
```
