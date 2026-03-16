import { useAppState } from '../../state/AppContext';
import { GenerationResult, InstrumentType } from '../../types';
import { TUNINGS, BASS_TUNING } from '../../constants/music';
import { beatsToTab } from '../../utils/tab';
import { drumPatternToText } from '../../utils/tab';

interface Props {
  onPlayOnce: (result: GenerationResult, soloInst?: InstrumentType) => void;
  onLoop: (result: GenerationResult, idx: number) => void;
  onStop: () => void;
}

export function Results({ onPlayOnce, onLoop, onStop }: Props) {
  const { state, dispatch } = useAppState();
  const { results, playingIdx } = state;

  if (!results.length) {
    return (
      <div className="results">
        <h2>Results</h2>
        <div className="placeholder">Select notes and press "Generate"</div>
      </div>
    );
  }

  const gLabels = TUNINGS[state.tuning].labels;
  const bLabels = BASS_TUNING.labels;

  return (
    <div className="results">
      <h2>Results</h2>
      <div className="results-grid">
        {results.map((result, idx) => {
          const gTab = beatsToTab(result.guitarBeats, gLabels);
          const bTab = beatsToTab(result.bassBeats, bLabels);
          const dTab = drumPatternToText(result.drumPattern);
          const diff = result.score > 75 ? 1 : result.score > 50 ? 2 : 3;

          return (
            <div key={idx} className={`variant-card ${playingIdx === idx ? 'playing' : ''}`}>
              <div className="variant-header">
                <span className="variant-title">
                  Variant {idx + 1} {state.genMode === 'remix' ? '(Remix)' : ''}
                </span>
                <div className="variant-actions">
                  <button className="btn-sm" onClick={() => onPlayOnce(result)}>Play</button>
                  <button className="btn-sm" onClick={() => {
                    if (playingIdx === idx) onStop();
                    else onLoop(result, idx);
                  }}>
                    {playingIdx === idx ? 'Stop' : 'Loop'}
                  </button>
                  <button className="btn-sm" onClick={() => {
                    onStop();
                    dispatch({ type: 'USE_RESULT', payload: result });
                  }}>
                    Use
                  </button>
                </div>
              </div>

              <div className="variant-meta">
                Score: {Math.round(result.score)} &nbsp;
                <span className="difficulty-dots">
                  {Array.from({ length: 4 }, (_, i) => (
                    <span key={i} className={`dot ${i < diff ? 'filled' : ''}`} />
                  ))}
                </span>
                &nbsp; {state.style} {state.genMode}
              </div>

              {/* Per-instrument play buttons */}
              <div className="variant-inst-play">
                {gTab && (
                  <button className="btn-sm btn-inst-play guitar-play" onClick={() => onPlayOnce(result, 'guitar')}>
                    Guitar
                  </button>
                )}
                {bTab && (
                  <button className="btn-sm btn-inst-play bass-play" onClick={() => onPlayOnce(result, 'bass')}>
                    Bass
                  </button>
                )}
                {dTab && (
                  <button className="btn-sm btn-inst-play drums-play" onClick={() => onPlayOnce(result, 'drums')}>
                    Drums
                  </button>
                )}
              </div>

              {gTab && (
                <>
                  <div className="tab-label">Guitar</div>
                  <div className="tab-display">{gTab}</div>
                </>
              )}
              {bTab && (
                <>
                  <div className="tab-label">Bass</div>
                  <div className="tab-display bass-tab">{bTab}</div>
                </>
              )}
              {dTab && (
                <>
                  <div className="tab-label">Drums</div>
                  <div className="tab-display drum-tab">{dTab}</div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
