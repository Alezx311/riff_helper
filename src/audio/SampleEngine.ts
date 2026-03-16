import type { InstrumentType, MixerState, SampleSet } from '../types';
import { NOTE_NAMES } from '../constants/music';

// Actual sample files per instrument folder (generated from filesystem)
// Tone.Sampler interpolates missing notes by pitch-shifting nearest available
const SAMPLE_NOTES: Record<SampleSet, string[]> = {
  'guitar-electric': ['A2','A3','A4','A5','C3','C4','C5','C6','Cs2','Ds3','Ds4','Ds5','E2','Fs2','Fs3','Fs4','Fs5'],
  'guitar-acoustic': [
    'A1','A2','A3','As1','As2','As3','B1','B2','B3',
    'C2','C3','C4','Cs2','Cs3','Cs4','D1','D2','D3','D4',
    'Ds1','Ds2','Ds3','E1','E2','E3','F1','F2','F3',
    'Fs1','Fs2','Fs3','G1','G2','G3','Gs1','Gs2','Gs3',
  ],
  'guitar-nylon': [
    'A2','A3','A4','A5','As5','B1','B2','B3','B4',
    'Cs3','Cs4','Cs5','D2','D3','D5','Ds4',
    'E2','E3','E4','E5','Fs2','Fs3','Fs4','Fs5',
    'G3','G5','Gs2','Gs4','Gs5',
  ],
  'bass-electric': ['As2','As3','As4','As5','Cs2','Cs3','Cs4','Cs5','Cs6','E2','E3','E4','E5','G2','G3','G4','G5'],
  'piano': [
    'A0','A1','A2','A3','A4','A5','A6','As0','As1','As2','As3','As4','As5','As6',
    'B0','B1','B2','B3','B4','B5','B6',
    'C0','C1','C2','C3','C4','C5','C6','C7','Cs0','Cs1','Cs2','Cs3','Cs4','Cs5','Cs6',
    'D0','D1','D2','D3','D4','D5','D6','Ds0','Ds1','Ds2','Ds3','Ds4','Ds5','Ds6',
    'E0','E1','E2','E3','E4','E5','E6','F0','F1','F2','F3','F4','F5','F6',
    'Fs0','Fs1','Fs2','Fs3','Fs4','Fs5','Fs6',
    'G0','G1','G2','G3','G4','G5','G6','Gs0','Gs1','Gs2','Gs3','Gs4','Gs5','Gs6',
  ],
  'violin': ['A3','A4','A5','A6','C4','C5','C6','C7','E4','E5','E6','G3','G4','G5','G6'],
  'cello': [
    'A2','A3','A4','As2','As3','As4','B2','B3','B4',
    'C2','C3','C4','C5','Cs3','Cs4','D2','D3','D4',
    'Ds2','Ds3','Ds4','E2','E3','E4','F2','F3','F4',
    'Fs3','Fs4','G2','G3','G4','Gs2','Gs3','Gs4',
  ],
  'organ': [
    'A1','A2','A3','A4','A5','C1','C2','C3','C4','C5','C6',
    'Ds1','Ds2','Ds3','Ds4','Ds5','Fs1','Fs2','Fs3','Fs4','Fs5',
  ],
  'saxophone': [
    'A3','A4','As2','As3','B2','B3','C3','C4','Cs2','Cs3','Cs4',
    'D2','D3','D4','Ds2','Ds3','Ds4','E2','E3','E4',
    'F2','F3','F4','Fs2','Fs3','Fs4','G2','G3','G4','Gs2','Gs3','Gs4',
  ],
  'bassoon': ['A1','A2','A3','C2','C3','C4','E3','G1','G2','G3'],
  'contrabass': ['A1','As0','B2','C1','Cs2','D1','E1','E2','Fs0','Fs1','G0','Gs1','Gs2'],
};

function sampleNameToNote(name: string): string {
  return name.replace(/s(\d)/, '#$1');
}

function buildSampleUrls(sampleFolder: SampleSet): Record<string, string> {
  const urls: Record<string, string> = {};
  const notes = SAMPLE_NOTES[sampleFolder] || [];
  for (const name of notes) {
    const toneNote = sampleNameToNote(name);
    urls[toneNote] = `${name}.mp3`;
  }
  return urls;
}

export function midiToToneNote(midi: number): string {
  return NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
}

// Lazy-loaded Tone.js module reference
let Tone: typeof import('tone') | null = null;

async function getTone() {
  if (!Tone) {
    Tone = await import('tone');
  }
  return Tone;
}

interface SamplerEntry {
  sampler: any;  // Tone.Sampler
  volume: any;   // Tone.Volume
  ready: boolean;
}

class SampleEngine {
  private samplers: Map<string, SamplerEntry> = new Map();
  private started = false;

  async ensureStarted() {
    if (!this.started) {
      const T = await getTone();
      await T.start();
      this.started = true;
    }
  }

  get isStarted() { return this.started; }

  async getOrCreateSampler(inst: InstrumentType, sampleSet: SampleSet): Promise<SamplerEntry> {
    const T = await getTone();

    const key = `${inst}:${sampleSet}`;
    if (this.samplers.has(key)) return this.samplers.get(key)!;

    const vol = new T.Volume(0).toDestination();
    const urls = buildSampleUrls(sampleSet);
    const baseUrl = `/samples/${sampleSet}/`;

    const entry: SamplerEntry = {
      sampler: new T.Sampler({
        urls,
        baseUrl,
        onload: () => { entry.ready = true; console.log(`Samples loaded: ${sampleSet}`); },
        onerror: (err: any) => { console.warn(`Sample load error for ${sampleSet}:`, err); },
      }).connect(vol),
      volume: vol,
      ready: false,
    };

    this.samplers.set(key, entry);
    return entry;
  }

  // Sync getter - returns cached entry or null
  getCachedSampler(inst: InstrumentType, sampleSet: SampleSet): SamplerEntry | null {
    return this.samplers.get(`${inst}:${sampleSet}`) || null;
  }

  async applyMixer(mixer: MixerState) {
    if (!this.started) return;
    const T = await getTone();
    const anySolo = Object.values(mixer).some(t => t.solo);

    for (const inst of ['guitar', 'bass'] as InstrumentType[]) {
      const track = mixer[inst];
      const entry = this.samplers.get(`${inst}:${track.sampleSet}`);
      if (!entry) continue;

      const effectiveMute = track.muted || (anySolo && !track.solo);
      entry.volume.mute = effectiveMute;
      if (!effectiveMute) {
        entry.volume.volume.value = track.volume <= 0 ? -Infinity : T.gainToDb(track.volume);
      }
    }
  }

  disposeAll() {
    this.samplers.forEach(entry => {
      entry.sampler.dispose();
      entry.volume.dispose();
    });
    this.samplers.clear();
  }
}

export const sampleEngine = new SampleEngine();
