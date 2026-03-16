import React, { useCallback, useMemo } from 'react';
import { useAppState } from '../../state/AppContext';
import { TUNINGS, BASS_TUNING, TOTAL_FRETS } from '../../constants/music';
import { midiToNote, getScaleNotes, isInScale } from '../../utils/midi';

interface Props {
  onNotePreview: (midi: number) => void;
}

export function Fretboard({ onNotePreview }: Props) {
  const { state, dispatch } = useAppState();
  const inst = state.activeInst as 'guitar' | 'bass';
  const isBass = inst === 'bass';

  const strings = isBass ? 4 : 6;
  const labels = isBass ? BASS_TUNING.labels : TUNINGS[state.tuning].labels;
  const getMidi = useCallback((s: number, f: number) =>
    isBass ? BASS_TUNING.midi[s] + f : TUNINGS[state.tuning].midi[s] + f,
    [isBass, state.tuning]
  );

  const scaleNotes = useMemo(() => getScaleNotes(state.key, state.scale), [state.key, state.scale]);
  const track = state[inst];

  const allSel = useMemo(() => {
    const m = new Map<string, number>();
    track.beats.forEach((b, bi) => b.notes.forEach(n => m.set(`${n.string},${n.fret}`, bi)));
    return m;
  }, [track.beats]);

  const handleClick = useCallback((s: number, f: number) => {
    const midi = getMidi(s, f);
    dispatch({ type: 'ADD_NOTE_TO_BEAT', payload: { note: { string: s, fret: f, midi }, inst } });
    onNotePreview(midi);
  }, [dispatch, getMidi, inst, onNotePreview]);

  const handleRightClick = useCallback((e: React.MouseEvent, s: number, f: number) => {
    e.preventDefault();
    dispatch({ type: 'REMOVE_NOTE', payload: { string: s, fret: f, inst } });
  }, [dispatch, inst]);

  const dotFrets = [3, 5, 7, 9, 12, 15];

  return (
    <div className="fretboard-container">
      <div
        className="fretboard"
        style={{ gridTemplateColumns: `40px repeat(${TOTAL_FRETS + 1}, 1fr)` }}
      >
        {/* Fret numbers */}
        <div className="fret-number" />
        {Array.from({ length: TOTAL_FRETS + 1 }, (_, f) => (
          <div key={f} className="fret-number">{f}</div>
        ))}

        {/* Strings */}
        {Array.from({ length: strings }, (_, s) => (
          <React.Fragment key={s}>
            <div className="string-label">{labels[s]}</div>
            {Array.from({ length: TOTAL_FRETS + 1 }, (_, f) => {
              const midi = getMidi(s, f);
              const noteName = midiToNote(midi);
              const inScale = isInScale(midi, scaleNotes);
              const selKey = `${s},${f}`;
              const isSelected = allSel.has(selKey);
              const showMarker = isSelected || inScale;

              return (
                <div
                  key={f}
                  className={`fret-cell ${f === 0 ? 'nut' : ''}`}
                  onClick={() => handleClick(s, f)}
                  onContextMenu={(e) => handleRightClick(e, s, f)}
                >
                  {showMarker && (
                    <div
                      className={`note-marker ${isSelected ? 'selected' : 'scale-note'}`}
                      data-order={isSelected ? (allSel.get(selKey)! + 1).toString() : undefined}
                    >
                      {noteName}
                    </div>
                  )}
                  {!isBass && s === 2 && dotFrets.includes(f) && (
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
