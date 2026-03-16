# GuitarRiff Helper

## Project Overview
Multi-instrument riff generator. Users input notes on virtual fretboard (guitar/bass) or drum grid,
and the app generates musically relevant continuations or entirely new remixes.

## Tech Stack (MVP - single HTML file prototype)
- Vanilla HTML/CSS/JS (no frameworks)
- Web Audio API for sound (triangle=guitar, sawtooth=bass, noise+sine=drums)
- All logic client-side

## Key Architecture

### Data Model
- **Beat**: { notes: [{string, fret, midi}], duration: number }
- **State tracks**: guitar.beats[], bass.beats[], drums.pattern[6][16]
- **GenerationResult**: { guitarBeats, bassBeats, drumPattern, score }

### Instruments
| Instrument | Strings | Tuning | Wave | Tab color |
|------------|---------|--------|------|-----------|
| Guitar | 6 | configurable (7 tunings) | triangle | green |
| Bass | 4 | GDAE (fixed) | sawtooth | orange |
| Drums | 6 voices | Kick/Snare/HiHat/Crash/Tom1/Tom2 | synth | blue |

### Generation Modes
- **Continue**: extend input sequence, loop-aware
- **Remix**: new riff using only pitch classes from input

### Rhythm Generation
- Each style has `rhythmVariety` (0-1) controlling duration variation
- Duration pool: baseDur, baseDur*2, baseDur*0.5, baseDur*1.5
- Blues/Funk: shuffle feel (1.33/0.67 alternation)
- Per-beat custom duration via UI picker

### Multi-instrument Generation
- Guitar: 7 strategies (stepwise, skipUp, skipDown, pendulum, resolve, chromatic, styleLick)
- Bass: follows guitar (auto-generates root notes) or independent if bass input exists
- Drums: passed through as-is (16-step grid, user-defined)
- All instruments play simultaneously with correct timing

### Current Features
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
- Responsive design

## File Structure
- `index.html` - single-file prototype with all HTML/CSS/JS
- `GuitarRiffHelper_PRD.md` - full product requirements
- `CLAUDE.md` - this file
