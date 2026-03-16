import { useAppState } from '../../state/AppContext';
import { SAMPLE_SETS } from '../../constants/samples';
import { InstrumentType, SampleSet } from '../../types';

const TRACKS: { inst: InstrumentType; label: string; color: string }[] = [
  { inst: 'guitar', label: 'Guitar', color: '#8bc34a' },
  { inst: 'bass', label: 'Bass', color: '#ff9800' },
  { inst: 'drums', label: 'Drums', color: '#03a9f4' },
];

export function MixerPanel() {
  const { state, dispatch } = useAppState();
  const mixer = state.mixer;

  return (
    <div className="mixer-panel">
      <div className="mixer-title">Mixer</div>
      {TRACKS.map(({ inst, label, color }) => {
        const track = mixer[inst];
        return (
          <div key={inst} className="mixer-track">
            <div className="mixer-track-label" style={{ color }}>{label}</div>

            <div className="mixer-controls">
              <input
                type="range" min={0} max={100} value={Math.round(track.volume * 100)}
                className="mixer-volume"
                onChange={e => dispatch({ type: 'SET_VOLUME', payload: { inst, volume: +e.target.value / 100 } })}
              />
              <span className="mixer-vol-val">{Math.round(track.volume * 100)}%</span>

              <button
                className={`mixer-btn ${track.muted ? 'active-mute' : ''}`}
                onClick={() => dispatch({ type: 'TOGGLE_MUTE', payload: inst })}
                title="Mute"
              >
                M
              </button>

              <button
                className={`mixer-btn ${track.solo ? 'active-solo' : ''}`}
                onClick={() => dispatch({ type: 'TOGGLE_SOLO', payload: inst })}
                title="Solo"
              >
                S
              </button>

              {inst !== 'drums' && (
                <select
                  className="mixer-sample-select"
                  value={track.sampleSet}
                  onChange={e => dispatch({
                    type: 'SET_SAMPLE_SET',
                    payload: { inst, sampleSet: e.target.value as SampleSet },
                  })}
                >
                  {SAMPLE_SETS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              )}

              {inst === 'drums' && (
                <span className="mixer-sample-label">Synth</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
