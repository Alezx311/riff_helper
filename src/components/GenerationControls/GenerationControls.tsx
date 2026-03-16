import { useAppState } from '../../state/AppContext';
import { InstrumentType } from '../../types';

interface Props {
  onGenerate: () => void;
  onPlayInput: () => void;
  onClear: () => void;
  onStop: () => void;
  isPlaying: boolean;
}

export function GenerationControls({ onGenerate, onPlayInput, onClear, onStop, isPlaying }: Props) {
  const { state, dispatch } = useAppState();

  const anyData =
    state.guitar.beats.length > 0 ||
    state.bass.beats.length > 0 ||
    state.drums.pattern.some(r => r.some(v => v));

  const checkboxes: { inst: InstrumentType; label: string }[] = [
    { inst: 'guitar', label: 'Guitar' },
    { inst: 'bass', label: 'Bass' },
    { inst: 'drums', label: 'Drums' },
  ];

  return (
    <div className="actions">
      <button className="btn-primary" disabled={!anyData} onClick={onGenerate}>
        Generate
      </button>

      <div className="gen-checkboxes">
        {checkboxes.map(({ inst, label }) => (
          <label key={inst} className="gen-checkbox">
            <input
              type="checkbox"
              checked={state.generateFor[inst]}
              onChange={() => dispatch({ type: 'TOGGLE_GENERATE_FOR', payload: inst })}
            />
            {label}
          </label>
        ))}
      </div>

      {anyData && (
        <button className="btn-sm" onClick={onPlayInput}>Play Input</button>
      )}

      <button className="btn-outline" onClick={onClear}>Clear</button>

      {isPlaying && (
        <button className="btn-stop visible" onClick={onStop}>Stop</button>
      )}
    </div>
  );
}
