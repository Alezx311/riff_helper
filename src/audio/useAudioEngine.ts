import { useCallback, useRef, useEffect } from 'react';
import type { Beat, DrumPattern, InstrumentType, MixerState } from '../types';
import { sampleEngine, midiToToneNote } from './SampleEngine';
import { scheduleDrums, getAudioContext, applyDrumMixer, resumeDrumContext } from './DrumEngine';
import { DRUM_STEPS } from '../constants/music';

// Lazy Tone reference — start loading immediately for iOS gesture timing
let ToneModule: typeof import('tone') | null = null;
import('tone').then(t => { ToneModule = t; });
async function getTone() {
  if (!ToneModule) ToneModule = await import('tone');
  return ToneModule;
}

export function useAudioEngine(mixer: MixerState, tempo: number) {
  const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playingRef = useRef(false);
  const initedRef = useRef(false);

  // iOS unlock: resume both audio contexts on first touch/click within a user gesture
  useEffect(() => {
    let unlocked = false;
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      ToneModule?.start();
      resumeDrumContext();
      document.removeEventListener('touchstart', unlock, true);
      document.removeEventListener('click', unlock, true);
    };
    document.addEventListener('touchstart', unlock, true);
    document.addEventListener('click', unlock, true);
    return () => {
      document.removeEventListener('touchstart', unlock, true);
      document.removeEventListener('click', unlock, true);
    };
  }, []);

  // Apply mixer settings only after audio has been initialized
  useEffect(() => {
    if (!initedRef.current) return;
    sampleEngine.applyMixer(mixer);
    const anySolo = Object.values(mixer).some(t => t.solo);
    applyDrumMixer(mixer.drums, anySolo);
  }, [mixer]);

  // Initialize audio on first user gesture
  const ensureInit = useCallback(async () => {
    const T = await getTone();
    if (!initedRef.current) {
      await T.start();
      initedRef.current = true;
    }
    await sampleEngine.ensureStarted();
    await sampleEngine.getOrCreateSampler('guitar', mixer.guitar.sampleSet);
    await sampleEngine.getOrCreateSampler('bass', mixer.bass.sampleSet);
    await sampleEngine.applyMixer(mixer);
    const anySolo = Object.values(mixer).some(t => t.solo);
    applyDrumMixer(mixer.drums, anySolo);
  }, [mixer]);

  const scheduleBeats = useCallback(async (
    beats: Beat[], startTime: number, inst: InstrumentType
  ): Promise<number> => {
    const entry = await sampleEngine.getOrCreateSampler(inst, mixer[inst].sampleSet);
    const beatUnit = 60 / tempo;
    let time = startTime;

    beats.forEach(beat => {
      const dur = beat.duration * 4 * beatUnit;
      beat.notes.forEach(note => {
        if (entry.ready) {
          const noteName = midiToToneNote(note.midi);
          try {
            entry.sampler.triggerAttackRelease(noteName, dur * 0.9, time);
          } catch {
            // Note out of range
          }
        }
      });
      time += dur;
    });
    return time - startTime;
  }, [mixer, tempo]);

  const playAllOnce = useCallback(async (
    guitarBeats: Beat[], bassBeats: Beat[], drumPattern: DrumPattern,
    soloInst?: InstrumentType
  ) => {
    await ensureInit();
    const T = await getTone();
    const now = T.now();
    const isSolo = soloInst !== undefined;

    if (guitarBeats.length && (!isSolo || soloInst === 'guitar')) {
      await scheduleBeats(guitarBeats, now, 'guitar');
    }
    if (bassBeats.length && (!isSolo || soloInst === 'bass')) {
      await scheduleBeats(bassBeats, now, 'bass');
    }
    if (drumPattern?.some(r => r.some(v => v)) && (!isSolo || soloInst === 'drums')) {
      scheduleDrums(drumPattern, getAudioContext().currentTime, tempo);
    }
  }, [ensureInit, scheduleBeats, tempo]);

  const playLoop = useCallback(async (
    guitarBeats: Beat[], bassBeats: Beat[], drumPattern: DrumPattern,
    onLoopStart?: () => void,
  ) => {
    stopPlayback();
    await ensureInit();
    const T = await getTone();
    playingRef.current = true;

    const beatUnit = 60 / tempo;
    const gDur = guitarBeats.reduce((s, b) => s + b.duration * 4 * beatUnit, 0);
    const bDur = bassBeats.reduce((s, b) => s + b.duration * 4 * beatUnit, 0);
    const hasDrums = drumPattern?.some(r => r.some(v => v));
    const dDur = hasDrums ? (DRUM_STEPS * (60 / tempo) / 4) : 0;
    const loopDur = Math.max(gDur, bDur, dDur, 0.5);

    let nextStart = T.now();
    async function scheduleNext() {
      if (!playingRef.current) return;
      onLoopStart?.();

      if (guitarBeats.length) {
        const entry = sampleEngine.getCachedSampler('guitar', mixer.guitar.sampleSet);
        if (entry?.ready) {
          let t = nextStart;
          guitarBeats.forEach(beat => {
            const dur = beat.duration * 4 * beatUnit;
            beat.notes.forEach(note => {
              try { entry.sampler.triggerAttackRelease(midiToToneNote(note.midi), dur * 0.9, t); } catch {}
            });
            t += dur;
          });
        }
      }
      if (bassBeats.length) {
        const entry = sampleEngine.getCachedSampler('bass', mixer.bass.sampleSet);
        if (entry?.ready) {
          let t = nextStart;
          bassBeats.forEach(beat => {
            const dur = beat.duration * 4 * beatUnit;
            beat.notes.forEach(note => {
              try { entry.sampler.triggerAttackRelease(midiToToneNote(note.midi), dur * 0.9, t); } catch {}
            });
            t += dur;
          });
        }
      }
      if (hasDrums) {
        const Tnow = await getTone();
        scheduleDrums(drumPattern, getAudioContext().currentTime + (nextStart - Tnow.now()), tempo);
      }
      nextStart += loopDur;
      loopTimerRef.current = setTimeout(scheduleNext, Math.max((loopDur - 0.1) * 1000, 50));
    }
    scheduleNext();
  }, [ensureInit, mixer, tempo]);

  const stopPlayback = useCallback(() => {
    playingRef.current = false;
    if (loopTimerRef.current) {
      clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
  }, []);

  const playPreview = useCallback(async (midi: number, inst: InstrumentType) => {
    await ensureInit();
    const entry = await sampleEngine.getOrCreateSampler(inst, mixer[inst].sampleSet);
    if (entry.ready) {
      try {
        entry.sampler.triggerAttackRelease(midiToToneNote(midi), 0.3);
      } catch {}
    }
  }, [ensureInit, mixer]);

  return { playAllOnce, playLoop, stopPlayback, playPreview };
}
