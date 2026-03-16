import React from 'react';
import { useAppState } from '../../state/AppContext';
import { DRUM_NAMES, DRUM_STEPS } from '../../constants/music';

export function DrumGrid() {
  const { state, dispatch } = useAppState();

  return (
    <div
      className="drum-grid"
      style={{ gridTemplateColumns: `60px repeat(${DRUM_STEPS}, 1fr)` }}
    >
      {/* Step numbers */}
      <div />
      {Array.from({ length: DRUM_STEPS }, (_, st) => (
        <div key={st} className="drum-step-num">{st + 1}</div>
      ))}

      {/* Rows */}
      {DRUM_NAMES.map((name, r) => (
        <React.Fragment key={r}>
          <div className="drum-row-label">{name}</div>
          {Array.from({ length: DRUM_STEPS }, (_, st) => (
            <div
              key={st}
              className={`drum-cell ${state.drums.pattern[r][st] ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'TOGGLE_DRUM_CELL', payload: { row: r, step: st } })}
            >
              {state.drums.pattern[r][st] ? 'x' : ''}
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}
