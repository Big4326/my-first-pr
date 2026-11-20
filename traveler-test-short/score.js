// THE SCORE: the single source of truth for music AND picture.
// Test short: "800 men vs 100,000" (Battle of Xiaoyao Ford, 215 AD), told by an original traveler narrator.
(function () {
  const node = typeof require !== 'undefined';
  const U = node ? require('./engine/util') : globalThis.U;
  const MU = node ? require('./engine/music') : globalThis.MUSIC;
  const { m, makeClock } = MU;

  const FPS = 30;
  const FORMAT = U.pickFormat('9:16');
  const [W, H] = U.formatSize(FORMAT);
  const SAFE = U.safeArea(W, H);
  const WIDE = W / H > 1.2;
  const STYLE = 'flat';
  const clock = makeClock({ bpm: 100, offset: 0 });
  const { T, BEAT } = clock;
  const DURATION = 14;

  // shots: every cut lands on a whoosh in song.js
  const cut = { map: 2.2, wall: 5.0, charge: 8.6, react: 10.6 };
  const ev = { ...cut, end: 13.2 };

  // voice lines (English, British male narrator)
  const vo = [
    { at: 0.3, text: 'You have eight hundred men.', who: 'traveler' },
    { at: 2.35, text: 'Your enemy has one hundred thousand.', who: 'traveler' },
    { at: 5.15, text: 'Any sane general would hide behind the walls.', who: 'general' },
    { at: 8.8, text: 'Zhang Liao attacked.', who: 'traveler' },
    { at: 10.95, text: 'Straight at the enemy warlord.', who: 'traveler' },
  ];

  const S = {
    hook: [0, cut.map],
    map: [cut.map, cut.wall],
    wall: [cut.wall, cut.charge],
    charge: [cut.charge, cut.react],
    react: [cut.react, DURATION],
  };

  // seeded armies for the top-down maps (identical in every worker)
  const rnd = U.mulberry32(215);
  const reds = [];
  for (let ring = 0; ring < 9; ring++) {
    const r = 330 + ring * 46;
    const n = Math.floor((2 * Math.PI * r) / 40);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ring * 0.13 + (rnd() - 0.5) * 0.03;
      if (Math.abs(Math.sin(a * 3 + ring)) < 0.12) continue; // gaps between regiments
      reds.push({ a, r: r + (rnd() - 0.5) * 10, ph: rnd() * 6.28 });
    }
  }
  const blues = [];
  for (let i = 0; i < 64; i++) blues.push({ x: (i % 8) - 3.5, y: Math.floor(i / 8) - 3.5, ph: rnd() * 6.28 });
  const tents = [];
  for (let i = 0; i < 34; i++) tents.push({ x: rnd(), y: rnd(), rot: (rnd() - 0.5) * 0.3, s: 0.8 + rnd() * 0.4 });

  const markers = {
    map: { t: cut.map, sync: 'av' },
    wall: { t: cut.wall, sync: 'av' },
    charge: { t: cut.charge, sync: 'av' },
    react: { t: cut.react, sync: 'av' },
    end: ev.end,
  };

  const SCORE = { FPS, FORMAT, W, H, SAFE, WIDE, STYLE, DURATION, clock, T, BEAT, S, m, ev, cut, vo, markers, reds, blues, tents };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
