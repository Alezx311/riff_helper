import { DrumPattern, MixerTrack } from '../types';
import { DRUM_STEPS } from '../constants/music';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

let drumGain: GainNode | null = null;

function getDrumGain(): GainNode {
  const ctx = getCtx();
  if (!drumGain) {
    drumGain = ctx.createGain();
    drumGain.connect(ctx.destination);
  }
  return drumGain;
}

export function setDrumVolume(vol: number) {
  getDrumGain().gain.value = vol;
}

export function setDrumMuted(muted: boolean) {
  getDrumGain().gain.value = muted ? 0 : 1;
}

export function applyDrumMixer(track: MixerTrack, anySolo: boolean) {
  const effectiveMute = track.muted || (anySolo && !track.solo);
  const gain = getDrumGain();
  gain.gain.value = effectiveMute ? 0 : track.volume;
}

function playDrumHit(drumIdx: number, time: number) {
  const ctx = getCtx();
  const dest = getDrumGain();

  if (drumIdx === 0) { // Kick
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);
    g.gain.setValueAtTime(0.8, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    osc.connect(g);
    g.connect(dest);
    osc.start(time);
    osc.stop(time + 0.15);
  } else if (drumIdx === 1) { // Snare
    const bufSize = ctx.sampleRate * 0.1;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / bufSize * 5);
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    src.buffer = buf;
    g.gain.setValueAtTime(0.4, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    src.connect(g);
    g.connect(dest);
    src.start(time);
  } else if (drumIdx === 2 || drumIdx === 3) { // HiHat / Crash
    const dur = drumIdx === 2 ? 0.05 : 0.2;
    const decay = drumIdx === 2 ? 10 : 3;
    const freq = drumIdx === 2 ? 7000 : 3000;
    const vol = drumIdx === 2 ? 0.2 : 0.3;
    const bufSize = ctx.sampleRate * dur;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / bufSize * decay);
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    const flt = ctx.createBiquadFilter();
    src.buffer = buf;
    flt.type = 'highpass';
    flt.frequency.value = freq;
    g.gain.setValueAtTime(vol, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    src.connect(flt);
    flt.connect(g);
    g.connect(dest);
    src.start(time);
  } else { // Toms
    const freq = drumIdx === 4 ? 200 : 150;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, time + 0.15);
    g.gain.setValueAtTime(0.5, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    osc.connect(g);
    g.connect(dest);
    osc.start(time);
    osc.stop(time + 0.15);
  }
}

export function scheduleDrums(pattern: DrumPattern, startTime: number, tempo: number): number {
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();
  const stepDur = (60 / tempo) / 4;
  for (let r = 0; r < pattern.length; r++) {
    for (let s = 0; s < DRUM_STEPS; s++) {
      if (pattern[r][s]) playDrumHit(r, startTime + s * stepDur);
    }
  }
  return DRUM_STEPS * stepDur;
}

export function getAudioContext(): AudioContext {
  return getCtx();
}

export function resumeDrumContext() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();
}
