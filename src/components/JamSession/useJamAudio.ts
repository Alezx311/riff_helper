import { useRef, useState, useCallback } from 'react';
import { NOTE_NAMES } from '../../constants/music';
import { isInScale } from '../../utils/midi';

export interface JamNote {
  note: string;
  midi: number;
  noteClass: number;
  start: number;
  duration: number;
  inKey: boolean;
}

export interface AudioParams {
  fftSize: 1024 | 2048 | 4096 | 8192;
  smoothing: number;        // 0.0–0.99
  rmsThreshold: number;     // silence gate
  corrThreshold: number;    // min autocorrelation peak
  minFreq: number;          // Hz
  maxFreq: number;          // Hz
  stabilityFrames: number;  // frames before accepting note
  minNoteDuration: number;  // seconds, min to record in history
}

export interface DebugInfo {
  rms: number;
  rawFreq: number | null;
  corrStrength: number;
  stabilityCount: number;
}

export const DEFAULT_AUDIO_PARAMS: AudioParams = {
  fftSize: 4096,
  smoothing: 0.5,
  rmsThreshold: 0.01,
  corrThreshold: 0.005,
  minFreq: 60,
  maxFreq: 1200,
  stabilityFrames: 2,
  minNoteDuration: 0.12,
};

function detectPitch(
  buffer: Float32Array,
  sampleRate: number,
  params: AudioParams,
): { freq: number | null; rms: number; corrStrength: number } {
  const SIZE = buffer.length;
  const HALF = Math.floor(SIZE / 2);

  let sumSq = 0;
  for (let i = 0; i < SIZE; i++) sumSq += buffer[i] * buffer[i];
  const rms = Math.sqrt(sumSq / SIZE);

  if (rms < params.rmsThreshold) return { freq: null, rms, corrStrength: 0 };

  const minLag = Math.floor(sampleRate / params.maxFreq);
  const maxLag = Math.min(HALF - 1, Math.floor(sampleRate / params.minFreq));
  const count = maxLag - minLag + 1;

  if (count <= 0) return { freq: null, rms, corrStrength: 0 };

  const corrs = new Float32Array(count);
  for (let k = 0; k < count; k++) {
    const lag = minLag + k;
    let c = 0;
    for (let i = 0; i < HALF; i++) c += buffer[i] * buffer[i + lag];
    corrs[k] = c;
  }

  let maxVal = -Infinity, maxIdx = 0;
  for (let i = 0; i < count; i++) {
    if (corrs[i] > maxVal) { maxVal = corrs[i]; maxIdx = i; }
  }

  if (maxVal < params.corrThreshold) return { freq: null, rms, corrStrength: maxVal };

  // Parabolic interpolation for sub-sample accuracy
  let refinedLag = minLag + maxIdx;
  if (maxIdx > 0 && maxIdx < count - 1) {
    const y1 = corrs[maxIdx - 1], y2 = corrs[maxIdx], y3 = corrs[maxIdx + 1];
    const a = (y1 + y3 - 2 * y2) / 2;
    const b = (y3 - y1) / 2;
    if (a < 0) refinedLag = (minLag + maxIdx) - b / (2 * a);
  }

  return { freq: sampleRate / refinedLag, rms, corrStrength: maxVal };
}

function freqToMidi(freq: number): number {
  return Math.round(12 * Math.log2(freq / 440) + 69);
}

export function useJamAudio(scaleNotes: number[]) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number>(0);
  const timeDomainBuf = useRef<Float32Array<ArrayBuffer> | null>(null);
  const freqBuf = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const [currentMidi, setCurrentMidi] = useState<number | null>(null);
  const [currentFreq, setCurrentFreq] = useState<number | null>(null);
  const [inKey, setInKey] = useState(false);
  const [energy, setEnergy] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [notesHistory, setNotesHistory] = useState<JamNote[]>([]);
  const [params, setParams] = useState<AudioParams>(DEFAULT_AUDIO_PARAMS);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({ rms: 0, rawFreq: null, corrStrength: 0, stabilityCount: 0 });

  // Ref mirror — always up-to-date inside the RAF loop without recreating the loop
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const noteTrackRef = useRef<{ note: string; midi: number; noteClass: number; start: number; inKey: boolean } | null>(null);
  const notesAccumRef = useRef<JamNote[]>([]);
  const startTimeRef = useRef(0);
  const frameCountRef = useRef(0);
  const prevDetectedRef = useRef<string | null>(null);
  const stableCountRef = useRef(0);

  const loop = useCallback(() => {
    const analyser = analyserRef.current;
    const ctx = audioCtxRef.current;
    if (!analyser || !ctx) return;
    animRef.current = requestAnimationFrame(loop);

    const p = paramsRef.current;
    analyser.smoothingTimeConstant = p.smoothing;

    analyser.getFloatTimeDomainData(timeDomainBuf.current!);
    analyser.getByteFrequencyData(freqBuf.current!);

    const now = ctx.currentTime;
    frameCountRef.current++;

    const { freq, rms, corrStrength } = detectPitch(timeDomainBuf.current!, ctx.sampleRate, p);

    let detectedNote: string | null = null;
    let detectedMidi: number | null = null;
    let detectedFreq: number | null = null;
    let keyStatus = false;

    if (freq !== null) {
      const midi = freqToMidi(freq);
      if (midi >= 28 && midi <= 96) {
        detectedMidi = midi;
        detectedFreq = freq;
        detectedNote = NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
        keyStatus = isInScale(midi, scaleNotes);
      }
    }

    // Stability filter — require N consistent frames before accepting
    if (detectedNote === prevDetectedRef.current) {
      stableCountRef.current++;
    } else {
      stableCountRef.current = 0;
      prevDetectedRef.current = detectedNote;
    }

    const stableNote = stableCountRef.current >= p.stabilityFrames ? detectedNote : noteTrackRef.current?.note ?? null;
    const stableMidi = stableNote === detectedNote ? detectedMidi : noteTrackRef.current?.midi ?? null;

    // Record note transitions
    const prevTrack = noteTrackRef.current;
    if (stableNote !== (prevTrack?.note ?? null)) {
      if (prevTrack && now - prevTrack.start > p.minNoteDuration) {
        const entry: JamNote = { ...prevTrack, duration: now - prevTrack.start };
        notesAccumRef.current = [...notesAccumRef.current, entry];
        setNotesHistory([...notesAccumRef.current]);
      }
      noteTrackRef.current = stableNote
        ? { note: stableNote, midi: stableMidi!, noteClass: stableMidi! % 12, start: now, inKey: keyStatus }
        : null;
    }

    // Energy from frequency data
    let sum = 0;
    const fd = freqBuf.current!;
    for (let i = 0; i < fd.length; i++) sum += fd[i];
    const eng = sum / fd.length / 128;

    // Throttled React state updates ~15fps
    if (frameCountRef.current % 4 === 0) {
      setCurrentNote(stableNote);
      setCurrentMidi(stableMidi);
      setCurrentFreq(stableNote ? detectedFreq : null);
      setInKey(stableNote ? keyStatus : false);
      setEnergy(eng);
      setElapsed(now - startTimeRef.current);
      setDebugInfo({ rms, rawFreq: detectedFreq, corrStrength, stabilityCount: stableCountRef.current });
    }
  }, [scaleNotes]);

  const start = useCallback(async () => {
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = paramsRef.current.fftSize;
      analyser.smoothingTimeConstant = paramsRef.current.smoothing;
      source.connect(analyser);
      analyserRef.current = analyser;

      timeDomainBuf.current = new Float32Array(analyser.fftSize) as Float32Array<ArrayBuffer>;
      freqBuf.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;

      notesAccumRef.current = [];
      noteTrackRef.current = null;
      prevDetectedRef.current = null;
      stableCountRef.current = 0;
      frameCountRef.current = 0;
      startTimeRef.current = ctx.currentTime;

      setIsRecording(true);
      setNotesHistory([]);
      setCurrentNote(null);
      setCurrentMidi(null);
      setCurrentFreq(null);
      setEnergy(0);
      setElapsed(0);
      setDebugInfo({ rms: 0, rawFreq: null, corrStrength: 0, stabilityCount: 0 });

      animRef.current = requestAnimationFrame(loop);
    } catch {
      alert('Не вдалося отримати доступ до мікрофону. Перевірте дозволи браузера.');
    }
  }, [loop]);

  const stop = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    setIsRecording(false);
    setCurrentNote(null);
    setCurrentMidi(null);
    setCurrentFreq(null);
    setEnergy(0);
  }, []);

  const updateParam = useCallback(<K extends keyof AudioParams>(key: K, value: AudioParams[K]) => {
    setParams(p => ({ ...p, [key]: value }));
  }, []);

  const saveSession = useCallback((elapsedSec: number) => {
    const data = {
      timestamp: new Date().toISOString(),
      duration: elapsedSec.toFixed(1) + 's',
      noteCount: notesAccumRef.current.length,
      notes: notesAccumRef.current,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jam_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return {
    isRecording,
    currentNote,
    currentMidi,
    currentFreq,
    inKey,
    energy,
    elapsed,
    notesHistory,
    params,
    debugInfo,
    analyserRef,
    freqBuf,
    updateParam,
    start,
    stop,
    saveSession,
    getNotesAccum: () => notesAccumRef.current,
  };
}
