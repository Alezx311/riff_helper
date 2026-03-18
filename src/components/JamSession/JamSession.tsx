import { useRef, useEffect, useMemo, useCallback } from 'react';
import { useAppState } from '../../state/AppContext';
import { getScaleNotes } from '../../utils/midi';
import { NOTE_NAMES, SCALE_NAMES, TUNING_NAMES, TUNINGS } from '../../constants/music';
import { Beat, FretNote } from '../../types';
import { useJamAudio, JamNote } from './useJamAudio';
import { JamFretboard } from './JamFretboard';
import { AudioDebugPanel } from './AudioDebugPanel';
import './JamSession.css';

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

/** Find lowest-fret position for a MIDI note on guitar given tuning.
 *  If the note is out of range, transpose down by octaves until it fits. */
function midiToBestFret(midi: number, tuningMidi: number[]): FretNote | null {
  const lowestOpen = Math.min(...tuningMidi);
  let m = midi;
  // Transpose down until at least one string can play it within 15 frets
  while (m > lowestOpen + 15) m -= 12;
  // Also ensure we're not below the lowest open string
  while (m < lowestOpen) m += 12;

  let best: FretNote | null = null;
  let bestFret = Infinity;
  for (let s = 0; s < tuningMidi.length; s++) {
    const fret = m - tuningMidi[s];
    if (fret >= 0 && fret <= 15 && fret < bestFret) {
      bestFret = fret;
      best = { string: s, fret, midi: m };
    }
  }
  return best;
}

/** Convert note duration in seconds to nearest Beat duration (in quarter notes) */
function secondsToBeatDuration(durationSec: number, bpm: number): number {
  const inBeats = durationSec * bpm / 60;
  const options = [1, 0.5, 0.375, 0.25, 0.125, 0.0625];
  return options.reduce((best, opt) =>
    Math.abs(opt - inBeats) < Math.abs(best - inBeats) ? opt : best
  );
}

/** Convert recorded JamNote[] to guitar Beat[] using current tuning and tempo */
function jamNotesToBeats(notes: JamNote[], tuningMidi: number[], bpm: number): Beat[] {
  return notes
    .map(n => {
      const pos = midiToBestFret(n.midi, tuningMidi);
      if (!pos) return null;
      return { notes: [pos], duration: secondsToBeatDuration(n.duration, bpm) };
    })
    .filter((b): b is Beat => b !== null);
}

interface Props {
  onSwitchToMain: () => void;
}

export function JamSession({ onSwitchToMain }: Props) {
  const { state, dispatch } = useAppState();
  const scaleNotes = useMemo(() => getScaleNotes(state.key, state.scale), [state.key, state.scale]);

  const {
    isRecording, currentNote, currentMidi, currentFreq,
    inKey, energy, elapsed, notesHistory,
    params, debugInfo,
    analyserRef, freqBuf,
    updateParam, start, stop, saveSession, getNotesAccum,
  } = useJamAudio(scaleNotes);

  // Canvas refs for animation without React re-render
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const energyRef = useRef(0);
  const inKeyRef = useRef(false);
  const rafRef = useRef(0);

  energyRef.current = energy;
  inKeyRef.current = inKey;

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    function draw() {
      rafRef.current = requestAnimationFrame(draw);
      if (!canvas) return;
      const W = canvas.width, H = canvas.height;

      ctx.fillStyle = 'rgba(8, 8, 25, 0.2)';
      ctx.fillRect(0, 0, W, H);

      const analyser = analyserRef.current;
      const fd = freqBuf.current;

      if (!analyser || !fd) {
        const t = Date.now() / 1000;
        const r = Math.min(W, H) * 0.15 + Math.sin(t * 0.7) * 8;
        const g = ctx.createRadialGradient(W / 2, H / 2, 4, W / 2, H / 2, r);
        g.addColorStop(0, 'rgba(83,52,131,0.25)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        return;
      }

      analyser.getByteFrequencyData(fd);

      const bins = fd.length;
      const barW = W / bins;
      for (let i = 0; i < bins; i++) {
        const v = fd[i] / 255;
        const barH = v * H * 0.65;
        const hue = 200 + (i / bins) * 150;
        ctx.fillStyle = `hsla(${hue}, 85%, 55%, ${v * 0.75})`;
        ctx.fillRect(i * barW, H - barH, barW - 0.5, barH);
      }

      const eng = energyRef.current;
      const cx = W / 2, cy = H * 0.42;
      const baseR = Math.min(W, H) * 0.1;
      const r = baseR + eng * baseR * 2.5;
      const hue = inKeyRef.current ? 140 : 0;

      const grad = ctx.createRadialGradient(cx, cy, baseR * 0.2, cx, cy, r);
      grad.addColorStop(0, `hsla(${hue}, 100%, 68%, 0.85)`);
      grad.addColorStop(0.45, `hsla(${hue}, 80%, 45%, 0.35)`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, baseR + eng * 20, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${0.3 + eng * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    resize();
    window.addEventListener('resize', resize);
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Send recorded notes to main tab as guitar input beats */
  const handleUseForGeneration = useCallback(() => {
    const notes = getNotesAccum();
    if (notes.length === 0) return;
    const tuningMidi = TUNINGS[state.tuning].midi;
    const beats = jamNotesToBeats(notes, tuningMidi, state.tempo);
    if (beats.length === 0) return;
    dispatch({ type: 'LOAD_BEATS', payload: { inst: 'guitar', beats } });
    dispatch({ type: 'SET_ACTIVE_INST', payload: 'guitar' });
    dispatch({ type: 'SET_RESULTS', payload: [] });
    onSwitchToMain();
  }, [getNotesAccum, state.tuning, state.tempo, dispatch, onSwitchToMain]);

  const canUseForGen = notesHistory.length > 0 && !isRecording;

  return (
    <div className="jam-session">
      {/* Top controls */}
      <div className="jam-controls">
        <div className="jam-selectors">
          <div className="control-group">
            <label>Тональність</label>
            <select value={state.key} onChange={e => dispatch({ type: 'SET_KEY', payload: +e.target.value })}>
              {NOTE_NAMES.map((n, i) => <option key={i} value={i}>{n}</option>)}
            </select>
          </div>
          <div className="control-group">
            <label>Гама</label>
            <select value={state.scale} onChange={e => dispatch({ type: 'SET_SCALE', payload: e.target.value })}>
              {Object.entries(SCALE_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="control-group">
            <label>Строй</label>
            <select value={state.tuning} onChange={e => dispatch({ type: 'UPDATE_TUNING_MIDI', payload: e.target.value })}>
              {Object.entries(TUNING_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>

        <div className="jam-timer-block">
          {isRecording && <span className="jam-rec-dot" />}
          <span className="jam-timer">{formatTime(elapsed)}</span>
        </div>

        <div className="jam-btn-row">
          {!isRecording ? (
            <button className="btn-primary jam-btn-rec" onClick={start}>● REC</button>
          ) : (
            <button className="btn-stop jam-btn-rec" onClick={stop}>■ STOP</button>
          )}
          {canUseForGen && (
            <button className="btn-primary jam-btn-use" onClick={handleUseForGeneration} title="Конвертувати ноти в гітарний ввід і переключитися на головну вкладку">
              → Генерувати варіанти
            </button>
          )}
          {canUseForGen && (
            <button className="btn-outline" onClick={() => saveSession(elapsed)}>↓ Зберегти</button>
          )}
        </div>
      </div>

      {/* Audio analysis debug panel */}
      <AudioDebugPanel
        params={params}
        debugInfo={debugInfo}
        isRecording={isRecording}
        onUpdate={updateParam}
      />

      {/* Visualizer */}
      <canvas ref={canvasRef} className="jam-canvas" />

      {/* Current note display */}
      <div className="jam-note-panel">
        <div className={`jam-big-note ${isRecording && currentNote ? (inKey ? 'note-in-key' : 'note-out-key') : ''}`}>
          {currentNote ?? '—'}
        </div>
        <div className="jam-note-meta">
          {currentFreq != null && (
            <span className="jam-freq">{currentFreq.toFixed(1)} Hz</span>
          )}
          {isRecording && currentNote && (
            <span className={`jam-key-badge ${inKey ? 'badge-in' : 'badge-out'}`}>
              {inKey ? '✓ В тональності' : '✗ Поза тональністю'}
            </span>
          )}
          {!isRecording && !currentNote && (
            <span className="jam-hint">Натисніть REC і почніть грати</span>
          )}
        </div>
      </div>

      {/* Fretboard – read-only, shows detected note + scale notes */}
      <JamFretboard activeMidi={currentMidi} scaleNotes={scaleNotes} />

      {/* Note history */}
      {notesHistory.length > 0 && (
        <div className="jam-history">
          <div className="jam-history-header">
            <span className="jam-history-title">Послідовність нот</span>
            <span className="jam-history-count">{notesHistory.length} нот</span>
            {canUseForGen && (
              <button className="jam-use-inline" onClick={handleUseForGeneration}>
                → Використати для генерації
              </button>
            )}
          </div>
          <div className="jam-history-scroll">
            {notesHistory.slice(-40).reverse().map((n, i) => (
              <span
                key={i}
                className={`jam-hist-note ${n.inKey ? 'hist-in' : 'hist-out'}`}
                title={`${n.note} — ${n.duration.toFixed(2)}s`}
              >
                {n.note}
                <span className="jam-hist-dur">{n.duration.toFixed(1)}s</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
