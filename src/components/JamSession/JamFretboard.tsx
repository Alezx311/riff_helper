import React from 'react';
import { useAppState } from '../../state/AppContext';
import { TUNINGS, TOTAL_FRETS } from '../../constants/music';
import { midiToNote, isInScale } from '../../utils/midi';

interface Props {
  activeMidi: number | null;
  scaleNotes: number[];
}

const DOT_FRETS = new Set([3, 5, 7, 9, 12, 15]);

export function JamFretboard({ activeMidi, scaleNotes }: Props) {
  const { state } = useAppState();
  const tuning = TUNINGS[state.tuning];
  const activeClass = activeMidi !== null ? activeMidi % 12 : -1;

  return (
    <div className="fretboard-container">
      <div
        className="fretboard"
        style={{ gridTemplateColumns: `40px repeat(${TOTAL_FRETS + 1}, 1fr)` }}
      >
        <div className="fret-number" />
        {Array.from({ length: TOTAL_FRETS + 1 }, (_, f) => (
          <div key={f} className="fret-number">{f}</div>
        ))}

        {Array.from({ length: 6 }, (_, s) => (
          <React.Fragment key={s}>
            <div className="string-label">{tuning.labels[s]}</div>
            {Array.from({ length: TOTAL_FRETS + 1 }, (_, f) => {
              const midi = tuning.midi[s] + f;
              const noteClass = midi % 12;
              const isActive = noteClass === activeClass;
              const inScale = isInScale(midi, scaleNotes);

              return (
                <div key={f} className={`fret-cell ${f === 0 ? 'nut' : ''}`}>
                  {(isActive || inScale) && (
                    <div className={`note-marker ${isActive ? 'jam-active' : 'scale-note'}`}>
                      {midiToNote(midi)}
                    </div>
                  )}
                  {s === 2 && DOT_FRETS.has(f) && (
                    <div className="dot-marker" style={{ display: 'block' }} />
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
