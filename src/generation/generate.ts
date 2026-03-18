import { GenerationResult, StyleConfig } from '../types'
import { TUNINGS, BASS_TUNING, STYLES } from '../constants/music'
import { getScaleNotes } from '../utils/midi'
import { generateContinuation, ensureLoopable } from './continue'
import { generateRemix } from './remix'
import { generateBassFromGuitar } from './bass'
import { assignRhythm } from './rhythm'
import { scoreVariation } from './scoring'
import { AppState } from '../state/types'

function getGuitarMidi(tuning: string): (s: number, f: number) => number {
  return (s, f) => TUNINGS[tuning].midi[s] + f
}

function getBassMidi(s: number, f: number): number {
  return BASS_TUNING.midi[s] + f
}

export function generate(state: AppState): GenerationResult[] {
  const scaleNotes = getScaleNotes(state.key, state.scale)
  const genLen = state.genLength
  const styleConfig = STYLES[state.style] as StyleConfig
  const isRemix = state.genMode === 'remix'
  const results: GenerationResult[] = []
  const generateFor = state.generateFor

  const guitarInput = state.guitar.beats.flatMap(b => b.notes)
  const bassInput = state.bass.beats.flatMap(b => b.notes)
  const guitarMidiFn = getGuitarMidi(state.tuning)
  const strategies = ['stepwise', 'skipUp', 'skipDown', 'pendulum', 'resolve', 'chromatic', 'styleLick']

  for (let v = 0; v < 7; v++) {
    const strategy = strategies[v % strategies.length]
    let genGuitar: ReturnType<typeof generateContinuation> = []
    let genBass: ReturnType<typeof generateContinuation> = []

    // Guitar generation
    if (generateFor.guitar && guitarInput.length > 0) {
      if (isRemix) {
        genGuitar = generateRemix(guitarInput, scaleNotes, genLen, strategy, styleConfig, guitarMidiFn, 6, state.key)
      } else {
        genGuitar =
          generateContinuation(guitarInput, scaleNotes, genLen, strategy, styleConfig, guitarMidiFn, 6, state.key) || []
        if (genGuitar && genGuitar.length) ensureLoopable(genGuitar, guitarInput, scaleNotes, guitarMidiFn, 6)
      }
    }

    // Bass generation
    if (generateFor.bass && (bassInput.length > 0 || (guitarInput.length > 0 && genGuitar && genGuitar.length > 0))) {
      if (bassInput.length > 0) {
        if (isRemix) {
          genBass = generateRemix(
            bassInput,
            scaleNotes,
            Math.min(genLen, 6),
            strategy,
            styleConfig,
            getBassMidi,
            4,
            state.key,
          )
        } else {
          genBass =
            generateContinuation(
              bassInput,
              scaleNotes,
              Math.min(genLen, 6),
              strategy,
              styleConfig,
              getBassMidi,
              4,
              state.key,
            ) || []
          if (genBass && genBass.length) ensureLoopable(genBass, bassInput, scaleNotes, getBassMidi, 4)
        }
      } else if (genGuitar && genGuitar.length) {
        genBass = generateBassFromGuitar(genGuitar)
      }
    }

    const gNotes = genGuitar || []
    const bNotes = genBass || []
    if (gNotes.length === 0 && bNotes.length === 0) continue

    const gBeats = assignRhythm(gNotes, styleConfig, state.defaultDuration)
    const bBeats = assignRhythm(bNotes, { ...styleConfig, shuffleFeel: false }, state.defaultDuration)

    const fullGBeats = generateFor.guitar ? [...state.guitar.beats, ...gBeats] : [...state.guitar.beats]
    const fullBBeats = generateFor.bass ? [...state.bass.beats, ...bBeats] : [...state.bass.beats]

    results.push({
      id: v,
      guitarBeats: fullGBeats,
      bassBeats: fullBBeats,
      drumPattern: generateFor.drums ? state.drums.pattern.map(r => [...r]) : state.drums.pattern.map(r => [...r]),
      score: scoreVariation(gNotes, guitarInput, styleConfig) + scoreVariation(bNotes, bassInput, styleConfig) / 2,
    })
  }

  results.sort((a, b) => b.score - a.score)
  return results.slice(0, 5)
}
