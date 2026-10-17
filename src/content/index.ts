import type { ContentPack } from '../engine/types';
import { act0 } from './acts/act0-boot';
import { act1 } from './acts/act1-meta';
import { act2 } from './acts/act2-escalation';
import { act3 } from './acts/act3-chaos';
import { act4 } from './acts/act4-convergence';
import { finale } from './finale';

export const story: ContentPack = {
  defs: [...act0, ...act1, ...act2, ...act3, ...act4, ...finale],
};

/** UI happenings that content listens for but a player may never trigger. */
export const OPTIONAL_EVENTS = [
  'clickedDot',
  'tabReturn',
  'mute',
  'hintShown',
  'clickedPlay',
  'touchedPrefs',
  'setAvatar',
];
