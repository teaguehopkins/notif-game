import { findNode } from '../../content/nav';
import type { Instance } from '../../engine/types';
import { Badge, NewPill } from '../components/Badge';
import { formatRewards } from '../components/NotifModal';
import { game, useEngine } from '../game';
import { isHinted } from './Home';
import { SpecialPanel } from './SpecialPanels';

function ItemCard({ inst, active }: { inst: Instance; active: boolean }) {
  useEngine();
  const def = inst.def;
  const view = !def.interaction || def.interaction === 'view';
  const open = () => {
    if (!active) return;
    if (view) game.clear(def.id);
    else game.openItem.value = def.id;
  };
  const rewards = formatRewards(def.rewards).filter(
    (r) => !r.includes('XP') || def.kind !== 'achievement',
  );
  return (
    <li>
      <button
        class={`item-card${active ? ' item-card--new' : ' item-card--seen'}${def.kind === 'achievement' ? ' item-card--ach' : ''}${active && isHinted(def.at ?? '') ? ' hinted' : ''}`}
        onClick={open}
        aria-disabled={!active}
        aria-label={`${inst.title}${active ? (view ? ', new. Activate to mark as seen.' : ', new. Activate to open.') : ', seen'}`}
      >
        <span class="item-card__icon" aria-hidden="true">
          {def.icon ?? '•'}
        </span>
        <span class="item-card__text">
          <span class="item-card__title">{inst.title}</span>
          {inst.body && <span class="item-card__body">{inst.body}</span>}
          {active && rewards.length > 0 && (
            <span class="item-card__rewards">{rewards.join('  ')}</span>
          )}
        </span>
        {active && (view ? <NewPill /> : <Badge count={1} />)}
      </button>
    </li>
  );
}

export function MenuScreen() {
  useEngine();
  const route = game.route.value;
  const node = findNode(route);
  if (!node) return null;
  const e = game.engine;
  const path = game.currentPath();
  const tabs = (node.children ?? []).filter((c) => game.visible(`${route}/${c.id}`));

  const active = e.getActive().filter((i) => i.def.kind !== 'popup' && i.def.at === path);
  const seen = [...game.seen.values()].filter((i) => i.def.at === path).reverse();

  return (
    <main class="screen">
      <header class="screen__header">
        <button class="back-btn" onClick={() => game.navigate('')} aria-label="Back to home">
          ‹ Back
        </button>
        <h1 class="screen__title">
          <span aria-hidden="true">{node.icon}</span> {node.label}
        </h1>
      </header>

      {tabs.length > 0 && (
        <div class="tabs" role="tablist" aria-label={node.label}>
          {tabs.map((c) => {
            const p = `${route}/${c.id}`;
            const selected = game.tab.value === c.id;
            return (
              <button
                key={c.id}
                role="tab"
                aria-selected={selected}
                class={`tab${selected ? ' tab--selected' : ''}${isHinted(p) && !selected ? ' hinted' : ''}`}
                onClick={() => game.selectTab(c.id)}
              >
                <span aria-hidden="true">{c.icon}</span> {c.label}
                <Badge count={e.countUnder(p)} label={c.label} />
              </button>
            );
          })}
        </div>
      )}

      <section class="screen__content" role={tabs.length ? 'tabpanel' : undefined}>
        <SpecialPanel path={path} />
        {active.length + seen.length > 0 ? (
          <ul class="items">
            {active.map((i) => (
              <ItemCard key={i.def.id} inst={i} active />
            ))}
            {seen.map((i) => (
              <ItemCard key={i.def.id} inst={i} active={false} />
            ))}
          </ul>
        ) : (
          <p class="empty">Nothing new here. For now.</p>
        )}
      </section>
    </main>
  );
}
