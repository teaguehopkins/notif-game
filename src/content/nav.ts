export interface NavNode {
  id: string;
  label: string;
  icon: string;
  children?: NavNode[];
  /** Hidden until this notification has spawned (e.g. the event tab). */
  revealedBy?: string;
}

/** The launcher's menu tree. Notifications live at leaf paths like 'collection/cardBacks'. */
export const NAV: NavNode[] = [
  {
    id: 'collection',
    label: 'Collection',
    icon: '🃏',
    children: [
      { id: 'cards', label: 'Cards', icon: '🂠' },
      { id: 'cardBacks', label: 'Card Backs', icon: '🎴' },
      { id: 'avatars', label: 'Avatars', icon: '🧙' },
      { id: 'emotes', label: 'Emotes', icon: '😤' },
      { id: 'decks', label: 'Decks', icon: '🗃️' },
    ],
  },
  {
    id: 'shop',
    label: 'Shop',
    icon: '💰',
    children: [
      { id: 'featured', label: 'Featured', icon: '⭐' },
      { id: 'packs', label: 'Packs', icon: '📦' },
      { id: 'bundles', label: 'Bundles', icon: '🎁' },
    ],
  },
  {
    id: 'quests',
    label: 'Quests',
    icon: '📜',
    children: [
      { id: 'daily', label: 'Daily', icon: '☀️' },
      { id: 'weekly', label: 'Weekly', icon: '🗓️' },
    ],
  },
  {
    id: 'pass',
    label: 'Battle Pass',
    icon: '🎖️',
    children: [
      { id: 'free', label: 'Free Track', icon: '🥉' },
      { id: 'premium', label: 'Premium Track', icon: '👑' },
    ],
  },
  { id: 'mail', label: 'Mail', icon: '✉️' },
  { id: 'login', label: 'Daily Login', icon: '📅' },
  {
    id: 'friends',
    label: 'Friends',
    icon: '👥',
    children: [
      { id: 'requests', label: 'Requests', icon: '🤝' },
      { id: 'online', label: 'Online', icon: '🟢' },
      { id: 'guild', label: 'Guild', icon: '🛡️' },
    ],
  },
  {
    id: 'achievements',
    label: 'Achievements',
    icon: '🏆',
    children: [
      { id: 'general', label: 'General', icon: '🏅' },
      { id: 'meta', label: 'Meta', icon: '🔁' },
      { id: 'progress', label: 'Progress', icon: '📈' },
      { id: 'social', label: 'Social', icon: '💬' },
      { id: 'secret', label: 'Secret', icon: '🤫' },
    ],
  },
  { id: 'news', label: 'News', icon: '📰' },
  {
    id: 'event',
    label: 'Harvest Festival',
    icon: '🎃',
    revealedBy: 'event_begins',
    children: [
      { id: 'eventQuests', label: 'Festival Quests', icon: '🌾' },
      { id: 'eventPass', label: 'Festival Pass', icon: '🍂' },
      { id: 'eventShop', label: 'Festival Shop', icon: '🥧' },
    ],
  },
  { id: 'profile', label: 'Profile', icon: '🪪' },
  {
    id: 'settings',
    label: 'Settings',
    icon: '⚙️',
    children: [
      { id: 'notifications', label: 'Notification Preferences', icon: '🔔' },
      { id: 'audio', label: 'Audio', icon: '🔊' },
      { id: 'account', label: 'Account', icon: '👤' },
    ],
  },
];

/** Locations that aren't menu screens but can hold notifications. */
export const SPECIAL_LOCATIONS = ['play', 'credits'] as const;

export function findNode(path: string): NavNode | undefined {
  let nodes: NavNode[] | undefined = NAV;
  let node: NavNode | undefined;
  for (const id of path.split('/')) {
    node = nodes?.find((n) => n.id === id);
    if (!node) return undefined;
    nodes = node.children;
  }
  return node;
}

/** Every path a notification may live at: leaf menu screens plus special locations. */
export function leafPaths(): string[] {
  const out: string[] = [...SPECIAL_LOCATIONS];
  const walk = (nodes: NavNode[], prefix: string) => {
    for (const n of nodes) {
      const path = prefix ? `${prefix}/${n.id}` : n.id;
      if (n.children) walk(n.children, path);
      else out.push(path);
    }
  };
  walk(NAV, '');
  return out;
}

/** A location is visible if no node along its path is still hidden. */
export function isPathVisible(path: string, hasFired: (id: string) => boolean): boolean {
  let nodes: NavNode[] | undefined = NAV;
  for (const id of path.split('/')) {
    const node: NavNode | undefined = nodes?.find((n) => n.id === id);
    if (!node) return (SPECIAL_LOCATIONS as readonly string[]).includes(path);
    if (node.revealedBy && !hasFired(node.revealedBy)) return false;
    nodes = node.children;
  }
  return true;
}
