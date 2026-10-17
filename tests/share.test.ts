import { describe, expect, test, vi } from 'vitest';
import { formatTime, shareLine, shareResult } from '../src/share/share';

describe('share', () => {
  test('formats the share line', () => {
    expect(formatTime(402_000)).toBe('6:42');
    expect(formatTime(5_000)).toBe('0:05');
    expect(shareLine(214, 402_000)).toBe('I cleared 214 notifications in 6:42 in Legends of Loot 🔴');
  });

  test('uses Web Share when native sharing is preferred', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn();
    expect(await shareResult('t', 'u', { share, clipboard: { writeText } }, true)).toBe('shared');
    expect(share).toHaveBeenCalledWith({ text: 't', url: 'u' });
    expect(writeText).not.toHaveBeenCalled();
  });

  test('a cancelled share does not fall through to the clipboard', async () => {
    const share = vi.fn().mockRejectedValue(Object.assign(new Error('x'), { name: 'AbortError' }));
    const writeText = vi.fn();
    expect(await shareResult('t', 'u', { share, clipboard: { writeText } }, true)).toBe(
      'cancelled',
    );
    expect(writeText).not.toHaveBeenCalled();
  });

  test('falls back to the clipboard when share fails or is not preferred', async () => {
    const share = vi.fn().mockRejectedValue(new Error('nope'));
    const writeText = vi.fn().mockResolvedValue(undefined);
    expect(await shareResult('t', 'u', { share, clipboard: { writeText } }, true)).toBe('copied');
    expect(writeText).toHaveBeenCalledWith('t u');
    expect(await shareResult('t', 'u', { share, clipboard: { writeText } }, false)).toBe('copied');
  });

  test('asks for manual copy when nothing else works', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('insecure'));
    expect(await shareResult('t', 'u', { clipboard: { writeText } }, false)).toBe('manual');
    expect(await shareResult('t', 'u', {}, true)).toBe('manual');
  });
});
