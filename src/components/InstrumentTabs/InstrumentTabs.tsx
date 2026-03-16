import { useAppState } from '../../state/AppContext';
import { InstrumentType } from '../../types';

export function InstrumentTabs() {
  const { state, dispatch } = useAppState();

  const tabs: { inst: InstrumentType; label: string }[] = [
    { inst: 'guitar', label: 'Guitar' },
    { inst: 'bass', label: 'Bass' },
    { inst: 'drums', label: 'Drums' },
  ];

  const hasData = (inst: InstrumentType) => {
    if (inst === 'drums') return state.drums.pattern.some(r => r.some(v => v));
    return state[inst].beats.length > 0;
  };

  return (
    <div className="instrument-tabs">
      {tabs.map(({ inst, label }) => (
        <div
          key={inst}
          className={`instrument-tab ${state.activeInst === inst ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'SET_ACTIVE_INST', payload: inst })}
        >
          {label}
          <span className={`tab-dot ${hasData(inst) ? 'has-data' : ''}`} />
        </div>
      ))}
    </div>
  );
}
