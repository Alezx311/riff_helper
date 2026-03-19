import { useState, useMemo } from 'react';
import { useAppState } from '../../state/AppContext';
import { JamNote } from './useJamAudio';
import {
  detectKeyScale,
  getDiatonicChords,
  getProgressions,
  formatProgression,
  formatProgressionNumerals,
  KeyScaleMatch,
} from '../../utils/keyDetect';

interface Props {
  notes: JamNote[];
}

const QUALITY_LABEL: Record<string, string> = {
  major: 'maj',
  minor: 'min',
  diminished: 'dim',
  augmented: 'aug',
};

export function JamAnalysis({ notes }: Props) {
  const { dispatch } = useAppState();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const midiNotes = useMemo(() => notes.map(n => n.midi), [notes]);
  const matches = useMemo(() => detectKeyScale(midiNotes), [midiNotes]);

  if (notes.length === 0 || matches.length === 0) return null;

  const selected: KeyScaleMatch | null = selectedIdx !== null ? matches[selectedIdx] : null;
  const chords = selected ? getDiatonicChords(selected.key, selected.scale) : [];
  const progressions = selected ? getProgressions(selected.scale, chords.length) : [];

  function applyMatch(m: KeyScaleMatch) {
    dispatch({ type: 'SET_KEY', payload: m.key });
    dispatch({ type: 'SET_SCALE', payload: m.scale });
  }

  function toggleSelect(i: number) {
    setSelectedIdx(prev => (prev === i ? null : i));
  }

  return (
    <div className="jam-analysis">
      <div className="jam-analysis-header">
        <span className="jam-analysis-title">Аналіз тональності</span>
        <span className="jam-analysis-count">{matches.length} варіантів</span>
        <span className="jam-analysis-hint">(+N = зайвих нот у гамі)</span>
      </div>

      <div className="jam-analysis-matches">
        {matches.slice(0, 16).map((m, i) => (
          <div
            key={i}
            className={`jam-am-row${selectedIdx === i ? ' jam-am-selected' : ''}`}
            onClick={() => toggleSelect(i)}
          >
            <span className="jam-am-name">{m.keyName} {m.scaleName}</span>
            <span className="jam-am-extra">+{m.extraNotes}</span>
            <button
              className="jam-am-apply"
              onClick={e => { e.stopPropagation(); applyMatch(m); }}
            >
              Застосувати
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <div className="jam-analysis-detail">
          <div className="jam-detail-title">
            {selected.keyName} {selected.scaleName} — Акорди
          </div>

          <div className="jam-chords-row">
            {chords.map((c, i) => (
              <div key={i} className={`jam-chord jam-chord-${c.quality}`}>
                <span className="jam-chord-roman">{c.romanNumeral}</span>
                <span className="jam-chord-name">{c.name}</span>
                <span className="jam-chord-quality">{QUALITY_LABEL[c.quality]}</span>
              </div>
            ))}
          </div>

          {progressions.length > 0 && (
            <>
              <div className="jam-detail-title jam-detail-title-prog">Прогресії акордів</div>
              <div className="jam-progressions">
                {progressions.map((p, i) => (
                  <div key={i} className="jam-prog-row">
                    <span className="jam-prog-style">{p.style}</span>
                    <span className="jam-prog-chords">{formatProgression(p, chords)}</span>
                    <span className="jam-prog-numerals">{formatProgressionNumerals(p, chords)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
