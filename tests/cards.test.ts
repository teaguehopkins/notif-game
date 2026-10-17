import { describe, expect, test } from 'vitest';
import { story } from '../src/content';
import { backVariant, cardName, hash } from '../src/ui/components/Cards';

describe('cards', () => {
  test('card names come from notification titles', () => {
    expect(cardName('NEW: Badge Golem')).toBe('Badge Golem');
    expect(cardName('Duplicate: Dot Elemental. You can disenchant this!')).toBe('Dot Elemental');
    expect(cardName('NEW Card Back: Ember')).toBe('Ember');
  });

  test('the same name always gets the same art', () => {
    expect(hash('Sir Clicksalot')).toBe(hash('Sir Clicksalot'));
    expect(hash('Sir Clicksalot')).not.toBe(hash('Badge Golem'));
  });

  test('card backs pick their pattern from the name', () => {
    expect(backVariant('NEW Card Back: Ember')).toBe('ember');
    expect(backVariant('NEW Card Back: Inbox Zero')).toBe('red');
    expect(backVariant('NEW Card Back: Season 1')).toBe('season');
  });

  test('the free pack has one of each rarity, and the legendary glow is a duplicate', () => {
    const pack = story.defs.filter(
      (d) =>
        d.trigger.on === 'cleared' &&
        d.trigger.id === 'shop_freepack' &&
        d.at === 'collection/cards',
    );
    expect(new Set(pack.map((d) => d.rarity ?? 'common'))).toEqual(
      new Set(['common', 'rare', 'epic', 'legendary']),
    );
    expect(pack.find((d) => d.id === 'card_dupe')?.rarity).toBe('legendary');
  });
});
