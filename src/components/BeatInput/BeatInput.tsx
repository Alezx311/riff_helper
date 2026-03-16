import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppState } from '../../state/AppContext';
import { midiToNoteOctave, durationLabel } from '../../utils/midi';
import { InstrumentType } from '../../types';

const DURATIONS = [
  { value: 1, label: '1' },
  { value: 0.5, label: '1/2' },
  { value: 0.25, label: '1/4' },
  { value: 0.125, label: '1/8' },
  { value: 0.0625, label: '1/16' },
  { value: 0.375, label: '3/8' },
];

export function BeatInput() {
  const { state, dispatch } = useAppState();
  const inst = state.activeInst;
  const isDrum = inst === 'drums';
  const [pickerBeat, setPickerBeat] = useState<number | null>(null);
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });
  const pickerRef = useRef<HTMLDivElement>(null);

  const track = isDrum ? null : state[inst as 'guitar' | 'bass'];

  const showPicker = useCallback((e: React.MouseEvent, beatIdx: number) => {
    e.stopPropagation();
    setPickerBeat(beatIdx);
    setPickerPos({ x: e.clientX, y: e.clientY - 40 });
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerBeat(null);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const instLabel = inst.charAt(0).toUpperCase() + inst.slice(1);

  if (isDrum) {
    const hasHits = state.drums.pattern.some(r => r.some(v => v));
    return (
      <div className="input-section">
        <div className="input-label">{instLabel} Pattern:</div>
        <div className="beats-container">
          {hasHits
            ? <div className="empty-input" style={{ color: '#03a9f4' }}>Drum pattern set (see grid above)</div>
            : <div className="empty-input">Click cells in the grid above...</div>
          }
        </div>
      </div>
    );
  }

  if (!track) return null;

  return (
    <div className="input-section">
      <div className="input-label">{instLabel} Beats:</div>
      <div className="beats-container">
        {track.beats.length === 0 ? (
          <div className="empty-input">Click notes on the fretboard...</div>
        ) : (
          track.beats.map((beat, bi) => (
            <span key={bi} style={{ display: 'contents' }}>
              {bi > 0 && <span className="beat-arrow">{'\u2192'}</span>}
              <div
                className={`beat-chip ${bi === track.currentBeatIdx ? 'current-beat' : ''}`}
                onClick={() => dispatch({ type: 'SELECT_BEAT', payload: { beatIdx: bi, inst: inst as InstrumentType } })}
              >
                <div className="beat-notes">
                  {beat.notes.map((n, ni) => (
                    <span key={ni} className="beat-note">{midiToNoteOctave(n.midi)}</span>
                  ))}
                </div>
                <span
                  className="beat-duration"
                  onClick={(e) => showPicker(e, bi)}
                >
                  {durationLabel(beat.duration)}
                </span>
                <button
                  className="beat-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'REMOVE_BEAT', payload: { beatIdx: bi, inst: inst as InstrumentType } });
                  }}
                >
                  {'\u00d7'}
                </button>
              </div>
            </span>
          ))
        )}
      </div>

      {pickerBeat !== null && (
        <div
          ref={pickerRef}
          className="duration-picker visible"
          style={{ left: pickerPos.x, top: pickerPos.y }}
        >
          {DURATIONS.map(d => (
            <button
              key={d.value}
              className={track.beats[pickerBeat]?.duration === d.value ? 'active' : ''}
              onClick={() => {
                dispatch({
                  type: 'SET_BEAT_DURATION',
                  payload: { beatIdx: pickerBeat, duration: d.value, inst: inst as InstrumentType },
                });
                setPickerBeat(null);
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
