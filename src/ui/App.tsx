import { useEffect, useState } from 'preact/hooks';
import { Ambience } from './components/Ambience';
import { Badge } from './components/Badge';
import { FocusKeeper } from './components/FocusKeeper';
import { FxLayer } from './components/FxLayer';
import { Modal } from './components/Modal';
import { ModalHost } from './components/ModalHost';
import { Toasts } from './components/Toasts';
import { TopBar } from './components/TopBar';
import { game, useEngine } from './game';
import { Credits } from './screens/Credits';
import { Home } from './screens/Home';
import { MenuScreen } from './screens/MenuScreen';
import { Results } from './screens/Results';
import { Title } from './screens/Title';

function Launcher() {
  const e = useEngine();
  const route = game.route.value;
  const zen = game.screen.value === 'zen';
  const festival = !zen && e.phase === 'main' && e.hasFired('event_begins');
  const zero = !zen && e.phase !== 'main';
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
    <div
      class={`launcher${zen ? ' launcher--zen' : ''}${festival ? ' launcher--event' : ''}${zero ? ' launcher--zero' : ''}${game.zeroMoment.value ? ' launcher--zero-moment' : ''}`}
    >
      <TopBar />
      <Ambience />
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

function Screen() {
  switch (game.screen.value) {
    case 'title':
      return <Title />;
    case 'results':
      return <Results />;
    default:
      return <Launcher />;
  }
}

export function App() {
  return (
    <>
      <Screen />
      <FxLayer />
    </>
  );
}
