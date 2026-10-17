// Pacing report for tuning content. Run with: SIM_REPORT=1 npx vitest run tests/sim-report.test.ts
import { test } from 'vitest';
import { OPTIONAL_EVENTS, story } from '../src/content';
import { isPathVisible } from '../src/content/nav';
import { simulate } from '../src/engine/simulate';

test.runIf(process.env.SIM_REPORT)('pacing report', () => {
  const rs = [];
  for (let seed = 1; seed <= 500; seed++) {
    rs.push(
      simulate(story, {
        seed,
        optionalEvents: OPTIONAL_EVENTS,
        isVisible: (at, e) => isPathVisible(at, (id) => e.hasFired(id)),
      }),
    );
  }
  const q = (xs: number[], p: number) =>
    [...xs].sort((a, b) => a - b)[Math.floor(p * (xs.length - 1))];
  const row = (name: string, xs: number[]) =>
    console.log(
      name.padEnd(12),
      [
        'min',
        q(xs, 0),
        'p10',
        q(xs, 0.1),
        'p50',
        q(xs, 0.5),
        'p90',
        q(xs, 0.9),
        'max',
        q(xs, 1),
      ].join(' '),
    );
  row(
    'clears',
    rs.map((r) => r.clears),
  );
  row(
    'mainClears',
    rs.map((r) => r.mainClears),
  );
  row(
    'peakActive',
    rs.map((r) => r.peakActive),
  );
  row(
    'zero (min)',
    rs.map((r) => Math.round(r.zeroAtMs / 6000) / 10),
  );
  console.log('defs', story.defs.length, 'markAll runs', rs.filter((r) => r.usedMarkAll).length);
  console.log(
    'violations',
    rs.flatMap((r) => r.violations.map((v) => `${r.seed}: ${v}`)).slice(0, 15),
  );
});
