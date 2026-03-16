import { useAppState } from '../../state/AppContext';
import { NOTE_NAMES, SCALE_NAMES, TUNING_NAMES, STYLE_NAMES } from '../../constants/music';

export function Controls() {
  const { state, dispatch } = useAppState();

  return (
    <div className="controls">
      <div className="control-group">
        <label>Key</label>
        <select value={state.key} onChange={e => dispatch({ type: 'SET_KEY', payload: +e.target.value })}>
          {NOTE_NAMES.map((n, i) => <option key={i} value={i}>{n}</option>)}
        </select>
      </div>

      <div className="control-group">
        <label>Scale</label>
        <select value={state.scale} onChange={e => dispatch({ type: 'SET_SCALE', payload: e.target.value })}>
          {Object.entries(SCALE_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="control-group">
        <label>Tuning</label>
        <select value={state.tuning} onChange={e => dispatch({ type: 'UPDATE_TUNING_MIDI', payload: e.target.value })}>
          {Object.entries(TUNING_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="control-group">
        <label>Style</label>
        <select value={state.style} onChange={e => dispatch({ type: 'SET_STYLE', payload: e.target.value })}>
          {Object.entries(STYLE_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="control-group">
        <label>Generate</label>
        <select value={state.genLength} onChange={e => dispatch({ type: 'SET_GEN_LENGTH', payload: +e.target.value })}>
          {[3, 4, 6, 8, 12].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div className="control-group">
        <label>Mode</label>
        <select value={state.genMode} onChange={e => dispatch({ type: 'SET_GEN_MODE', payload: e.target.value as 'continue' | 'remix' })}>
          <option value="continue">Continue</option>
          <option value="remix">Remix</option>
        </select>
      </div>

      <div className="control-group">
        <label>Tempo: {state.tempo}</label>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <input
            type="range" min={40} max={300} value={state.tempo}
            style={{ width: 90, cursor: 'pointer' }}
            onChange={e => dispatch({ type: 'SET_TEMPO', payload: +e.target.value })}
          />
          <input
            type="number" min={40} max={300} value={state.tempo}
            style={{ width: 45 }}
            onChange={e => dispatch({ type: 'SET_TEMPO', payload: +e.target.value })}
          />
        </div>
      </div>

      <div className="control-group">
        <label>Duration</label>
        <select value={state.defaultDuration} onChange={e => dispatch({ type: 'SET_DEFAULT_DURATION', payload: +e.target.value })}>
          <option value={0.5}>1/2</option>
          <option value={0.25}>1/4</option>
          <option value={0.125}>1/8</option>
          <option value={0.0625}>1/16</option>
        </select>
      </div>
    </div>
  );
}
