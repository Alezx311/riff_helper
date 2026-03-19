import { useState, useMemo } from 'react';
import { useAppState } from '../../state/AppContext';
import { detectKeyScale } from '../../utils/keyDetect';
import { Beat } from '../../types';

function collectMidi(beats: Beat[]): number[] {
  return beats.flatMap(b => b.notes.map(n => n.midi));
}

export function KeyScaleDetector() {
  const { state, dispatch } = useAppState();
  const [open, setOpen] = useState(false);

  const allMidi = useMemo(
    () => [...collectMidi(state.guitar.beats), ...collectMidi(state.bass.beats)],
    [state.guitar.beats, state.bass.beats],
  );

  const matches = useMemo(() => (open ? detectKeyScale(allMidi) : []), [open, allMidi]);

  if (allMidi.length === 0) return null;

  function apply(key: number, scale: string) {
    dispatch({ type: 'SET_KEY', payload: key });
    dispatch({ type: 'SET_SCALE', payload: scale });
    setOpen(false);
  }

  return (
    <div className="ksd-wrap">
      <button
        className={`btn-sm ksd-btn${open ? ' ksd-btn-active' : ''}`}
        onClick={() => setOpen(v => !v)}
        title="Find key and scale that contain all input notes"
      >
        ♦ Detect Key/Scale
      </button>

      {open && (
        <div className="ksd-panel">
          <div className="ksd-panel-header">
            Matching keys &amp; scales
            <span className="ksd-hint"> (+N = extra scale notes not in input)</span>
          </div>

          {matches.length === 0 ? (
            <div className="ksd-empty">No match found for these notes</div>
          ) : (
            <div className="ksd-list">
              {matches.slice(0, 20).map((m, i) => (
                <div key={i} className="ksd-row">
                  <span className="ksd-name">{m.keyName} {m.scaleName}</span>
                  <span className="ksd-extra" title="Scale notes not in your input">+{m.extraNotes}</span>
                  <button className="ksd-apply" onClick={() => apply(m.key, m.scale)}>Apply</button>
                </div>
              ))}
            </div>
          )}

          <button className="ksd-close" onClick={() => setOpen(false)}>✕ Close</button>
        </div>
      )}
    </div>
  );
}
