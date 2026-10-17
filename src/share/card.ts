import { formatTime } from './share';

export interface CardData {
  cleared: number;
  timeMs: number;
  achievements: number;
  bestMs: number | null;
  host: string;
}

const W = 1080;
const H = 1350;

/**
 * Draws the results as a collectible card (1080x1350, the shape social feeds like) and returns
 * a PNG. Null if canvas isn't available.
 */
export async function renderResultCard(data: CardData): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;
  try {
    await Promise.all([
      document.fonts?.load('900 120px Cinzel'),
      document.fonts?.load('800 40px Nunito'),
    ]);
  } catch {
    // Fall back to whatever fonts are there.
  }
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  if (!g) return null;
  draw(g, data);
  return new Promise((resolve) => c.toBlob((b) => resolve(b), 'image/png'));
}

function roundRect(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function draw(g: CanvasRenderingContext2D, d: CardData): void {
  // Wood background with a warm glow.
  g.fillStyle = '#140c07';
  g.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 14) {
    g.fillStyle = x % 28 ? '#22150b' : '#1d1209';
    g.fillRect(x, 0, 7, H);
  }
  const glow = g.createRadialGradient(W / 2, 380, 40, W / 2, 380, 700);
  glow.addColorStop(0, 'rgba(240,195,90,0.35)');
  glow.addColorStop(1, 'rgba(240,195,90,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);

  // The card: legendary frame.
  const gold = g.createLinearGradient(0, 60, 0, H - 60);
  gold.addColorStop(0, '#ffe29a');
  gold.addColorStop(0.5, '#f0c35a');
  gold.addColorStop(1, '#b9832f');
  roundRect(g, 70, 60, W - 140, H - 120, 48);
  g.fillStyle = gold;
  g.fill();
  roundRect(g, 92, 82, W - 184, H - 164, 34);
  const paper = g.createLinearGradient(0, 82, 0, H - 82);
  paper.addColorStop(0, '#f4e4c1');
  paper.addColorStop(1, '#e6cf9f');
  g.fillStyle = paper;
  g.fill();

  // Red dot in the corner, naturally.
  g.fillStyle = '#e5322d';
  g.beginPath();
  g.arc(W - 120, 110, 52, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = 8;
  g.strokeStyle = '#ffd6d4';
  g.stroke();
  g.fillStyle = '#ff8a84';
  g.beginPath();
  g.arc(W - 136, 94, 14, 0, Math.PI * 2);
  g.fill();

  g.textAlign = 'center';
  g.fillStyle = '#e5322d';
  g.font = '700 38px Cinzel, Georgia, serif';
  g.fillText('I N B O X   Z E R O', W / 2, 230);

  g.fillStyle = '#2a1a0e';
  g.font = '900 64px Cinzel, Georgia, serif';
  g.fillText('I Cleared All', W / 2, 330);
  g.fillText('Notifications', W / 2, 410);

  // Big number.
  g.font = '900 260px Cinzel, Georgia, serif';
  g.fillStyle = '#7a5218';
  g.fillText(String(d.cleared), W / 2 + 6, 716);
  g.fillStyle = '#2a1a0e';
  g.fillText(String(d.cleared), W / 2, 710);
  g.font = '800 44px Nunito, system-ui, sans-serif';
  g.fillStyle = '#5b4430';
  g.fillText('notifications cleared', W / 2, 780);

  // Stat gems.
  const stats: [string, string][] = [
    ['Time', formatTime(d.timeMs)],
    ['Achievements', String(d.achievements)],
    ['Best', d.bestMs === null ? '–' : formatTime(d.bestMs)],
  ];
  stats.forEach(([label, value], i) => {
    const cx = W / 2 + (i - 1) * 290;
    roundRect(g, cx - 130, 850, 260, 170, 24);
    g.fillStyle = 'rgba(122,82,24,0.16)';
    g.fill();
    g.fillStyle = '#5b4430';
    g.font = '800 30px Nunito, system-ui, sans-serif';
    g.fillText(label.toUpperCase(), cx, 900);
    g.fillStyle = '#2a1a0e';
    g.font = '900 64px Cinzel, Georgia, serif';
    g.fillText(value, cx, 985);
  });

  g.fillStyle = '#2a1a0e';
  g.font = '900 72px Cinzel, Georgia, serif';
  g.fillText('Legends of Loot', W / 2, 1150);
  g.fillStyle = '#5b4430';
  g.font = '800 34px Nunito, system-ui, sans-serif';
  g.fillText(d.host, W / 2, 1210);
}
