import type { NavNode } from '../../content/nav';
import { Badge } from '../components/Badge';
import { game, useEngine } from '../game';

function isHinted(path: string): boolean {
  const hint = game.hint.value;
  return !!hint && (hint === path || hint.startsWith(path + '/'));
}

function MenuTile({ node }: { node: NavNode }) {
  const count = useEngine().countUnder(node.id);
  return (
    <button
      class={`menu-tile${isHinted(node.id) ? ' hinted' : ''}${node.revealedBy ? ' menu-tile--event' : ''}`}
      onClick={() => game.navigate(node.id)}
    >
      <span class="menu-tile__icon" aria-hidden="true">
        {node.icon}
      </span>
      <span class="menu-tile__label">{node.label}</span>
      <Badge count={count} />
    </button>
  );
}

export function Home() {
  const playCount = useEngine().countUnder('play');
  return (
    <main class="home">
      <h1 class="logo">
        <span class="logo__top">Legends</span>
        <span class="logo__of">of</span>
        <span class="logo__big">Loot</span>
      </h1>
      <button
        class={`play-btn${playCount ? ' play-btn--zen' : ''}`}
        onClick={() => game.pressPlay()}
      >
        <span>{playCount ? 'ZEN' : 'PLAY'}</span>
        <Badge count={playCount} />
      </button>
      <nav class="menu-grid" aria-label="Main menu">
        {game.visibleMenus().map((n) => (
          <MenuTile key={n.id} node={n} />
        ))}
      </nav>
    </main>
  );
}

export { isHinted };
