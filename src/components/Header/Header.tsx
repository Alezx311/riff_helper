interface Props {
  activeView: 'main' | 'jam';
  onSetView: (v: 'main' | 'jam') => void;
}

export function Header({ activeView, onSetView }: Props) {
  return (
    <header className="app-header">
      <h1>GuitarRiff Helper</h1>
      <nav className="app-nav">
        <button
          className={`app-nav-btn ${activeView === 'main' ? 'active' : ''}`}
          onClick={() => onSetView('main')}
        >
          Riff Helper
        </button>
        <button
          className={`app-nav-btn ${activeView === 'jam' ? 'active' : ''}`}
          onClick={() => onSetView('jam')}
        >
          🎸 Jam Session
        </button>
      </nav>
    </header>
  );
}
