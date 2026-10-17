export type ShareResult = 'shared' | 'copied' | 'manual' | 'cancelled';

export function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function shareLine(cleared: number, ms: number): string {
  return `I cleared ${cleared} notifications in ${formatTime(ms)} in Legends of Loot 🔴`;
}

interface NavLike {
  share?: (data: ShareData) => Promise<void>;
  clipboard?: { writeText(text: string): Promise<void> };
}

/**
 * Web Share where it's native (touch devices), else the clipboard, else tell the caller to show
 * the text for manual copying.
 */
export async function shareResult(
  text: string,
  url: string,
  nav: NavLike = navigator,
  preferNative = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches,
): Promise<ShareResult> {
  if (preferNative && nav.share) {
    try {
      await nav.share({ text, url });
      return 'shared';
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return 'cancelled';
    }
  }
  if (nav.clipboard?.writeText) {
    try {
      await nav.clipboard.writeText(`${text} ${url}`);
      return 'copied';
    } catch {
      // Insecure context or permission denied.
    }
  }
  return 'manual';
}
