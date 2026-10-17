import { useEffect, useState } from 'preact/hooks';
import { Badge } from './components/Badge';
import { FocusKeeper } from './components/FocusKeeper';
import { Modal } from './components/Modal';
import { ModalHost } from './components/ModalHost';
import { Toasts } from './components/Toasts';
import { TopBar } from './components/TopBar';
import { game } from './game';
import { Credits } from './screens/Credits';
import { Home } from './screens/Home';
import { MenuScreen } from './screens/MenuScreen';
import { Results } from './screens/Results';
import { Title } from './screens/Title';

function Launcher() {
  const route = game.route.value;
  const zen = game.screen.value === 'zen';
  const [leaving, setLeaving] = useState(false);

  // Esc on a menu screen goes home (modals handle their own Esc).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('[aria-modal="true"]') && game.route.value)
        game.navigate('');
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  return (
    <div class={`launcher${zen ? ' launcher--zen' : ''}`}>
      <TopBar />
      {route ? <MenuScreen key={route} /> : <Home />}
      {zen && (
        <button class="exit-zen" onClick={() => setLeaving(true)}>
          Exit Zen <Badge count={1} />
        </button>
      )}
      {leaving && (
        <Modal title="Leave Zen Mode?" icon="🧘" onClose={() => setLeaving(false)} layer={5}>
          <p class="modal__body">
            You have {game.engine.activeCount} unread notifications. They will miss you.
          </p>
          <div class="modal__actions">
            <button class="btn" onClick={() => setLeaving(false)}>
              Stay
            </button>
            <button class="btn btn--gold" onClick={() => game.toTitle()}>
              Leave
            </button>
          </div>
        </Modal>
      )}
      <ModalHost />
      <Credits />
      <Toasts />
      <FocusKeeper />
    </div>
  );
}

export function App() {
  switch (game.screen.value) {
    case 'title':
      return <Title />;
    case 'results':
      return <Results />;
    default:
      return <Launcher />;
  }
}
