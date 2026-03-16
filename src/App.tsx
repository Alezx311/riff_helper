import { useCallback, useEffect } from 'react';
import { AppProvider, useAppState } from './state/AppContext';
import { Header } from './components/Header/Header';
import { Controls } from './components/Controls/Controls';
import { InstrumentTabs } from './components/InstrumentTabs/InstrumentTabs';
import { Fretboard } from './components/Fretboard/Fretboard';
import { DrumGrid } from './components/DrumGrid/DrumGrid';
import { BeatInput } from './components/BeatInput/BeatInput';
import { GenerationControls } from './components/GenerationControls/GenerationControls';
import { MixerPanel } from './components/MixerPanel/MixerPanel';
import { Results } from './components/Results/Results';
import { generate } from './generation/generate';
import { useAudioEngine } from './audio/useAudioEngine';
import { GenerationResult, InstrumentType } from './types';
import './App.css';

function AppInner() {
  const { state, dispatch } = useAppState();
  const { playAllOnce, playLoop, stopPlayback, playPreview } = useAudioEngine(state.mixer, state.tempo);

  const isDrum = state.activeInst === 'drums';

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'SELECT') return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        dispatch({ type: 'ADVANCE_BEAT', payload: state.activeInst });
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [dispatch, state.activeInst]);

  const handleNotePreview = useCallback((midi: number) => {
    playPreview(midi, state.activeInst);
  }, [playPreview, state.activeInst]);

  const handleGenerate = useCallback(() => {
    const results = generate(state);
    dispatch({ type: 'SET_RESULTS', payload: results });
  }, [state, dispatch]);

  const handlePlayInput = useCallback(() => {
    stopPlayback();
    playAllOnce(state.guitar.beats, state.bass.beats, state.drums.pattern);
  }, [stopPlayback, playAllOnce, state.guitar.beats, state.bass.beats, state.drums.pattern]);

  const handleClear = useCallback(() => {
    stopPlayback();
    dispatch({ type: 'CLEAR_TRACK', payload: state.activeInst });
    dispatch({ type: 'SET_RESULTS', payload: [] });
  }, [stopPlayback, dispatch, state.activeInst]);

  const handleStop = useCallback(() => {
    stopPlayback();
    dispatch({ type: 'STOP_PLAYING' });
  }, [stopPlayback, dispatch]);

  const handlePlayOnce = useCallback((result: GenerationResult, soloInst?: InstrumentType) => {
    stopPlayback();
    dispatch({ type: 'STOP_PLAYING' });
    playAllOnce(result.guitarBeats, result.bassBeats, result.drumPattern, soloInst);
  }, [stopPlayback, dispatch, playAllOnce]);

  const handleLoop = useCallback((result: GenerationResult, idx: number) => {
    dispatch({ type: 'SET_PLAYING', payload: idx });
    playLoop(result.guitarBeats, result.bassBeats, result.drumPattern);
  }, [dispatch, playLoop]);

  return (
    <div className="app">
      <Header />
      <Controls />
      <InstrumentTabs />

      <div className="beat-mode-info">
        {isDrum
          ? 'Click cells to toggle drum hits.'
          : <>Click = add note to beat. <kbd>Space</kbd>/<kbd>Enter</kbd> = next beat. Right-click = remove.</>
        }
      </div>

      {isDrum ? <DrumGrid /> : <Fretboard onNotePreview={handleNotePreview} />}

      <BeatInput />

      <div className="main-layout">
        <div className="main-content">
          <GenerationControls
            onGenerate={handleGenerate}
            onPlayInput={handlePlayInput}
            onClear={handleClear}
            onStop={handleStop}
            isPlaying={state.playingIdx >= 0}
          />

          <Results
            onPlayOnce={handlePlayOnce}
            onLoop={handleLoop}
            onStop={handleStop}
          />
        </div>

        <MixerPanel />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
