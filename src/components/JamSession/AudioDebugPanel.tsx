import { useState } from 'react';
import { AudioParams, DebugInfo, DEFAULT_AUDIO_PARAMS } from './useJamAudio';

interface Props {
  params: AudioParams;
  debugInfo: DebugInfo;
  isRecording: boolean;
  onUpdate: <K extends keyof AudioParams>(key: K, value: AudioParams[K]) => void;
}

const S = {
  panel: {
    background: '#10172a',
    borderTop: '1px solid #0f3460',
    borderBottom: '1px solid #0f3460',
  } as React.CSSProperties,
  toggle: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '7px 24px',
    background: 'transparent',
    border: 'none',
    color: '#666',
    fontSize: '0.72rem',
    fontWeight: 600,
    cursor: 'pointer',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  body: {
    padding: '10px 24px 14px',
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap' as const,
  },
  section: {
    flex: '1 1 260px',
  },
  sectionTitle: {
    fontSize: '0.65rem',
    color: '#533483',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    fontWeight: 700,
    marginBottom: '8px',
  },
  row: {
    marginBottom: '7px',
  },
  label: {
    fontSize: '0.62rem',
    color: '#777',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.4px',
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '2px',
  },
  val: {
    color: '#aaa',
    fontVariantNumeric: 'tabular-nums',
  },
  range: {
    width: '100%',
    cursor: 'pointer',
    height: '4px',
    accentColor: '#533483',
  } as React.CSSProperties,
  select: {
    background: '#0f3460',
    color: '#e0e0e0',
    border: '1px solid #533483',
    padding: '3px 6px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    cursor: 'pointer',
    width: '100%',
  },
  restartNote: {
    fontSize: '0.6rem',
    color: '#e94560',
    marginLeft: '6px',
  },
  diagRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  diagLabel: {
    fontSize: '0.62rem',
    color: '#666',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.4px',
    minWidth: '120px',
  },
  diagVal: {
    fontSize: '0.75rem',
    fontVariantNumeric: 'tabular-nums',
    color: '#aaa',
    minWidth: '70px',
  },
  barTrack: {
    flex: 1,
    height: '6px',
    background: '#0f3460',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  resetBtn: {
    marginTop: '10px',
    background: 'transparent',
    border: '1px solid #533483',
    color: '#888',
    padding: '3px 10px',
    borderRadius: '4px',
    fontSize: '0.65rem',
    cursor: 'pointer',
  },
};

function Bar({ value, max, threshold, color = '#533483' }: { value: number; max: number; threshold?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const threshPct = threshold !== undefined ? Math.min(100, (threshold / max) * 100) : undefined;
  const barColor = threshold !== undefined && value < threshold ? '#e94560' : color;
  return (
    <div style={{ ...S.barTrack, position: 'relative' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '3px', transition: 'width 0.08s' }} />
      {threshPct !== undefined && (
        <div style={{ position: 'absolute', top: 0, left: `${threshPct}%`, width: '2px', height: '100%', background: '#e94560', opacity: 0.7 }} />
      )}
    </div>
  );
}

function ParamRow({ label, children, value }: { label: string; children: React.ReactNode; value: string }) {
  return (
    <div style={S.row}>
      <div style={S.label}>
        <span>{label}</span>
        <span style={S.val}>{value}</span>
      </div>
      {children}
    </div>
  );
}

export function AudioDebugPanel({ params, debugInfo, isRecording, onUpdate }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div style={S.panel}>
      <button style={S.toggle} onClick={() => setOpen(o => !o)}>
        <span>{open ? '▾' : '▸'}</span>
        <span>⚙ Параметри аналізу</span>
      </button>

      {open && (
        <div style={S.body}>
          {/* Section 1: Detection params */}
          <div style={S.section}>
            <div style={S.sectionTitle}>Налаштування детекції</div>

            <ParamRow label="FFT розмір" value={String(params.fftSize)}>
              <select
                style={S.select}
                value={params.fftSize}
                onChange={e => onUpdate('fftSize', +e.target.value as AudioParams['fftSize'])}
              >
                {([1024, 2048, 4096, 8192] as const).map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              {isRecording && <span style={S.restartNote}>↻ стосується після рестарту</span>}
            </ParamRow>

            <ParamRow label="Згладжування (smoothing)" value={params.smoothing.toFixed(2)}>
              <input type="range" style={S.range} min={0} max={0.95} step={0.05}
                value={params.smoothing} onChange={e => onUpdate('smoothing', +e.target.value)} />
            </ParamRow>

            <ParamRow label="Поріг гучності (RMS)" value={params.rmsThreshold.toFixed(3)}>
              <input type="range" style={S.range} min={0.001} max={0.15} step={0.001}
                value={params.rmsThreshold} onChange={e => onUpdate('rmsThreshold', +e.target.value)} />
            </ParamRow>

            <ParamRow label="Поріг кореляції" value={params.corrThreshold.toFixed(3)}>
              <input type="range" style={S.range} min={0.001} max={0.1} step={0.001}
                value={params.corrThreshold} onChange={e => onUpdate('corrThreshold', +e.target.value)} />
            </ParamRow>

            <ParamRow label="Мін. частота (Гц)" value={`${params.minFreq} Hz`}>
              <input type="range" style={S.range} min={40} max={300} step={5}
                value={params.minFreq} onChange={e => onUpdate('minFreq', +e.target.value)} />
            </ParamRow>

            <ParamRow label="Макс. частота (Гц)" value={`${params.maxFreq} Hz`}>
              <input type="range" style={S.range} min={500} max={3000} step={50}
                value={params.maxFreq} onChange={e => onUpdate('maxFreq', +e.target.value)} />
            </ParamRow>

            <ParamRow label="Стабільність (фреймів)" value={String(params.stabilityFrames)}>
              <input type="range" style={S.range} min={1} max={10} step={1}
                value={params.stabilityFrames} onChange={e => onUpdate('stabilityFrames', +e.target.value)} />
            </ParamRow>

            <ParamRow label="Мін. тривалість ноти (с)" value={params.minNoteDuration.toFixed(2)}>
              <input type="range" style={S.range} min={0.05} max={1.0} step={0.05}
                value={params.minNoteDuration} onChange={e => onUpdate('minNoteDuration', +e.target.value)} />
            </ParamRow>

            <button
              style={S.resetBtn}
              onClick={() => {
                (Object.keys(DEFAULT_AUDIO_PARAMS) as (keyof AudioParams)[]).forEach(k => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onUpdate(k, DEFAULT_AUDIO_PARAMS[k] as any);
                });
              }}
            >
              ↺ Скинути до дефолту
            </button>
          </div>

          {/* Section 2: Live diagnostics */}
          <div style={S.section}>
            <div style={S.sectionTitle}>Діагностика {!isRecording && <span style={{ color: '#444', fontWeight: 400 }}>(неактивна)</span>}</div>

            <div style={S.diagRow}>
              <div style={S.diagLabel}>RMS (гучність)</div>
              <div style={S.diagVal}>{debugInfo.rms.toFixed(4)}</div>
              <Bar value={debugInfo.rms} max={0.2} threshold={params.rmsThreshold} color="#4caf50" />
            </div>

            <div style={S.diagRow}>
              <div style={S.diagLabel}>Кореляція</div>
              <div style={S.diagVal}>{debugInfo.corrStrength.toFixed(4)}</div>
              <Bar value={debugInfo.corrStrength} max={0.1} threshold={params.corrThreshold} color="#4caf50" />
            </div>

            <div style={S.diagRow}>
              <div style={S.diagLabel}>Сира частота</div>
              <div style={{ ...S.diagVal, color: debugInfo.rawFreq ? '#e0e0e0' : '#444' }}>
                {debugInfo.rawFreq != null ? `${debugInfo.rawFreq.toFixed(1)} Hz` : '—'}
              </div>
            </div>

            <div style={S.diagRow}>
              <div style={S.diagLabel}>Стабільність</div>
              <div style={S.diagVal}>
                {debugInfo.stabilityCount} / {params.stabilityFrames}
              </div>
              <Bar value={Math.min(debugInfo.stabilityCount, params.stabilityFrames)} max={params.stabilityFrames} color="#533483" />
            </div>

            <div style={{ marginTop: '12px', fontSize: '0.62rem', color: '#444', lineHeight: 1.6 }}>
              <div>Червона риска на барах = поточний поріг</div>
              <div>RMS &lt; порогу → нота не детектується</div>
              <div>Кореляція &lt; порогу → частота відкидається</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
