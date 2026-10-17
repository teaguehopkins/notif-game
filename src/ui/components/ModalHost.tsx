import type { NotifDef } from '../../engine/types';
import { game, useEngine } from '../game';
import { Modal } from './Modal';
import { NotifModal } from './NotifModal';

/** Defs that clearing `id` reveals as new collection items (the cards in a pack). */
function contentsOf(id: string): NotifDef[] {
  return game.engine.defs.filter(
    (d) =>
      d.trigger.on === 'cleared' &&
      d.trigger.id === id &&
      d.kind === 'item' &&
      d.at?.startsWith('collection/cards'),
  );
}

/** Item modal underneath, popups on top: popups interrupt whatever you were doing. */
export function ModalHost() {
  const e = useEngine();
  const popups = e.popups();
  const popup = popups[0];
  const openId = game.openItem.value;
  const item = openId ? e.get(openId) : undefined;
  const mm = game.matchmaking.value;

  return (
    <>
      {item && (
        <NotifModal
          inst={item}
          contents={contentsOf(item.def.id)}
          onClear={(o) => game.clear(item.def.id, o)}
          onSnooze={() => {
            game.snooze(item.def.id);
            game.openItem.value = null;
          }}
          onClose={() => (game.openItem.value = null)}
          layer={0}
        />
      )}
      {mm !== 'off' && (
        <Modal
          title={mm === 'searching' ? 'Finding Opponent…' : 'No Opponent Found'}
          icon="⚔️"
          layer={1}
          onClose={() => (game.matchmaking.value = 'off')}
        >
          {mm === 'searching' ? (
            <div class="spinner" role="progressbar" aria-label="Searching" />
          ) : (
            <>
              <p class="modal__body">Everyone else is clearing their notifications.</p>
              <div class="modal__actions">
                <button class="btn btn--gold" onClick={() => (game.matchmaking.value = 'off')}>
                  OK
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
      {popup && (
        <NotifModal
          inst={popup}
          contents={contentsOf(popup.def.id)}
          onClear={(o) => game.clear(popup.def.id, o)}
          onSnooze={() => game.snooze(popup.def.id)}
          layer={2}
          behind={popups.length - 1}
        />
      )}
    </>
  );
}
