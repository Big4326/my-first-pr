// THE FILM: clean-vector history-explainer look (bean-head characters, thick ink outlines,
// blue vs red armies, top-down battle maps, bold word-by-word captions). Pure function of t.
(function () {
  const U = globalThis.U, S = globalThis.SCORE, Studio = globalThis.Studio, Subs = globalThis.Subs;
  const { clamp, lerp, ease } = U;
  const W = S.W, H = S.H, cut = S.cut;
  const INK = '#2B2522', SKIN = '#FBFAF6';
  let VO = null;

  const PAL = {
    blue: { main: '#33558F', dark: '#22396A', trim: '#E2B547', pants: '#2A2F45', plume: '#3F7BD6', gear: 'helmet' },
    red: { main: '#C23A30', dark: '#8E2621', trim: '#E2B547', pants: '#3A2A2A', plume: '#D9402F', gear: 'helmet' },
    traveler: { main: '#6F7D4C', dark: '#55613A', trim: '#7A5233', pants: '#4A3B2E', plume: null, gear: 'hat' },
  };

  // ---------- tiny clean-vector helpers ----------
  const fs = (ctx, fill, lw = 6, stroke = INK) => {
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (lw > 0) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
  };
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
  const el = (ctx, x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); };
  const ln = (ctx, pts, color = INK, lw = 6) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]); ctx.lineWidth = lw; ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); };
  const H1 = (a, b = 0) => U.hash(a, b);
  const cam = (ctx, cx, cy, z, fn) => { ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-cx, -cy); fn(); ctx.restore(); };

  // ---------- the bean-head character ----------
  function arm(ctx, side, ang, P, hold) {
    const sx = side * 76, sy = -212;
    const a = 0.22 + ang;
    const ex = sx + side * Math.sin(a) * 70, ey = sy + Math.cos(a) * 70;
    const hx = ex + side * Math.sin(a * 0.8) * 62, hy = ey + Math.cos(a * 0.8) * 62;
    const pts = [[sx, sy], [ex, ey], [hx, hy]];
    ln(ctx, pts, INK, 50); ln(ctx, pts, P.main, 38);
    if (hold === 'map') {
      ctx.save(); ctx.translate(hx, hy - 8); ctx.rotate(-0.5 * side);
      rr(ctx, -16, -70, 32, 120, 10); fs(ctx, '#EAD9B0', 5);
      ln(ctx, [[-16, -40], [16, -40]], '#B99A63', 4); ln(ctx, [[-16, 20], [16, 20]], '#B99A63', 4);
      ctx.restore();
    }
    el(ctx, hx, hy, 23, 23); fs(ctx, SKIN, 5);
  }

  function face(ctx, o) {
    const lk = (o.look || 0) * 12, f = o.face || 'normal';
    const ex = [-34 + lk, 34 + lk], ey = -335;
    if (f === 'shock') {
      for (const x of ex) { el(ctx, x, ey - 4, 26, 28); fs(ctx, '#FFFFFF', 5); el(ctx, x + lk * 0.3, ey - 2, 6, 7); fs(ctx, INK, 0); }
    } else if (f === 'grin') {
      for (const x of ex) { ctx.beginPath(); ctx.arc(x, ey + 6, 14, Math.PI * 1.1, Math.PI * 1.9); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke(); }
    } else if (o.blink) {
      for (const x of ex) ln(ctx, [[x - 11, ey], [x + 11, ey]], INK, 6);
    } else {
      for (const x of ex) { el(ctx, x, ey, 9, 13); fs(ctx, INK, 0); }
      if (f === 'smug') for (const x of ex) { ctx.fillStyle = SKIN; ctx.fillRect(x - 14, ey - 18, 28, 16); ln(ctx, [[x - 15, ey - 3], [x + 15, ey - 1]], INK, 6); }
    }
    if (f === 'determined' || f === 'smug') { ln(ctx, [[ex[0] - 20, ey - 40], [ex[0] + 14, ey - 28]], INK, 8); ln(ctx, [[ex[1] + 20, ey - 40], [ex[1] - 14, ey - 28]], INK, 8); }
    if (f === 'worried') { ln(ctx, [[ex[0] - 18, ey - 28], [ex[0] + 14, ey - 40]], INK, 7); ln(ctx, [[ex[1] + 18, ey - 28], [ex[1] - 14, ey - 40]], INK, 7); }
    if (o.sweat) { ctx.save(); ctx.globalAlpha = o.sweat; ctx.beginPath(); ctx.moveTo(78, -380); ctx.quadraticCurveTo(96, -350, 86, -338); ctx.quadraticCurveTo(70, -340, 78, -380); fs(ctx, '#8FC9F0', 4); ctx.restore(); }
    // beards under the mouth
    if (o.beard === 'general') {
      ctx.beginPath(); ctx.moveTo(-48, -292); ctx.quadraticCurveTo(-20, -318, 0, -300); ctx.quadraticCurveTo(20, -318, 48, -292); ctx.quadraticCurveTo(20, -300, 0, -290); ctx.quadraticCurveTo(-20, -300, -48, -292); fs(ctx, INK, 3);
      ctx.beginPath(); ctx.moveTo(-14, -262); ctx.lineTo(14, -262); ctx.lineTo(0, -228); ctx.closePath(); fs(ctx, INK, 3);
    }
    if (o.beard === 'big') { ctx.beginPath(); ctx.moveTo(-72, -315); ctx.quadraticCurveTo(-70, -215, 0, -205); ctx.quadraticCurveTo(70, -215, 72, -315); ctx.quadraticCurveTo(0, -280, -72, -315); fs(ctx, '#6B3B2A', 5); }
    // mouth
    const mo = o.mouth || { open: 0, wide: 0 };
    const my = o.beard ? -276 : -285;
    if (mo.open > 0.06) { el(ctx, lk * 0.5, my + 4, 16 + 10 * (mo.wide || 0), 5 + 17 * mo.open); fs(ctx, '#5A1F1F', 5); }
    else if (f === 'grin') { ctx.beginPath(); ctx.moveTo(-40 + lk, my - 6); ctx.quadraticCurveTo(lk, my + 44, 40 + lk, my - 6); ctx.closePath(); fs(ctx, '#5A1F1F', 6); }
    else if (f === 'shock') { el(ctx, lk * 0.5, my + 6, 12, 16); fs(ctx, '#5A1F1F', 5); }
    else if (f === 'smug') ln(ctx, [[-22 + lk, my + 2], [6 + lk, my + 4], [26 + lk, my - 8]], INK, 6);
    else if (f === 'worried') { ctx.beginPath(); ctx.moveTo(-20 + lk, my + 6); for (let i = 1; i <= 4; i++) ctx.lineTo(-20 + lk + i * 10, my + 6 + (i % 2 ? -5 : 5)); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(lk * 0.5, my - 10, 16, Math.PI * 0.2, Math.PI * 0.8); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); }
  }

  function bean(ctx, o) {
    const P = PAL[o.team || 'blue'];
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot || 0); ctx.scale((o.s || 1) * (o.flip || 1), o.s || 1);
    el(ctx, 0, 0, 110, 18); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fill();
    for (const lx of [-36, 36]) { rr(ctx, lx - 24, -84, 48, 72, 14); fs(ctx, P.pants, 6); rr(ctx, lx - 30, -24, 60, 26, 11); fs(ctx, '#3A2A22', 6); }
    arm(ctx, -1, o.armL ?? 0.1, P, o.holdL);
    // torso + armour scales
    ctx.beginPath(); ctx.moveTo(-78, -238); ctx.lineTo(78, -238); ctx.quadraticCurveTo(96, -150, 92, -74); ctx.lineTo(-92, -74); ctx.quadraticCurveTo(-96, -150, -78, -238); ctx.closePath();
    fs(ctx, P.main, 7);
    ctx.save(); ctx.clip();
    if (P.gear === 'helmet') { ctx.fillStyle = P.dark; for (let r = 0; r < 7; r++) for (let c = 0; c < 9; c++) { el(ctx, -88 + c * 22 + (r % 2) * 11, -220 + r * 21, 4, 4); ctx.fill(); } }
    else { ln(ctx, [[-52, -238], [-40, -74]], '#7A5233', 18); ln(ctx, [[52, -238], [40, -74]], '#7A5233', 18); el(ctx, 30, -150, 13, 13); fs(ctx, '#E2B547', 3); }
    ctx.restore();
    rr(ctx, -95, -116, 190, 26, 10); fs(ctx, P.trim, 6);
    if (P.gear === 'hat') { rr(ctx, -72, -258, 144, 36, 18); fs(ctx, '#C8553D', 6); } // scarf
    // head
    el(ctx, 0, -340, 100, 122); fs(ctx, SKIN, 7);
    face(ctx, o);
    if (P.gear === 'helmet') {
      ctx.beginPath(); ctx.moveTo(-110, -368); ctx.bezierCurveTo(-116, -505, 116, -505, 110, -368); ctx.closePath(); fs(ctx, P.main, 7);
      for (const k of [-2, -1, 0, 1, 2]) ln(ctx, [[k * 38, -372], [k * 26, -455 + Math.abs(k) * 12]], P.dark, 4);
      for (const sx of [-1, 1]) { rr(ctx, sx * 106 - 18, -372, 36, 118, 12); fs(ctx, P.main, 6); ln(ctx, [[sx * 106 - 10, -330], [sx * 106 + 10, -330]], P.dark, 4); ln(ctx, [[sx * 106 - 10, -295], [sx * 106 + 10, -295]], P.dark, 4); }
      rr(ctx, -116, -382, 232, 26, 13); fs(ctx, P.trim, 6);
      ctx.save(); ctx.translate(10, -478); ctx.rotate(0.5 + Math.sin((o.t || 0) * 3) * 0.05); el(ctx, 0, -48, 20, 56); fs(ctx, P.plume, 6); ln(ctx, [[0, 4], [0, -92]], 'rgba(0,0,0,0.25)', 3); ctx.restore();
    } else {
      el(ctx, 0, -392, 168, 30); fs(ctx, '#C9A26B', 7);
      ctx.beginPath(); ctx.moveTo(-86, -398); ctx.quadraticCurveTo(-94, -512, 0, -506); ctx.quadraticCurveTo(94, -512, 86, -398); ctx.closePath(); fs(ctx, '#C9A26B', 7);
      ln(ctx, [[0, -500], [0, -470]], '#A9844F', 6);
      rr(ctx, -88, -432, 176, 28, 6); fs(ctx, '#6B4A2E', 6);
    }
    arm(ctx, 1, o.armR ?? 0.1, P, o.holdR);
    ctx.restore();
  }

  // ---------- backgrounds ----------
  function sky(ctx, c0, c1, c2) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, c0); g.addColorStop(0.55, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fillRect(-400, -400, W + 800, H + 800);
  }
  function sun(ctx, x, y, r) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
    g.addColorStop(0, 'rgba(255,240,200,0.9)'); g.addColorStop(0.25, 'rgba(255,220,160,0.45)'); g.addColorStop(1, 'rgba(255,200,140,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
    el(ctx, x, y, r, r); ctx.fillStyle = '#FFF4D6'; ctx.fill();
  }
  function hills(ctx, y, color, seed, amp = 60) {
    ctx.beginPath(); ctx.moveTo(-400, H + 400); ctx.lineTo(-400, y);
    for (let x = -400; x <= W + 400; x += 60) ctx.lineTo(x, y - amp * (0.5 + 0.5 * Math.sin(x * 0.004 + seed)) - 20 * H1(seed, x));
    ctx.lineTo(W + 400, H + 400); ctx.closePath(); fs(ctx, color, 0);
  }
  function stoneWall(ctx, top, bottom, crenels = true) {
    const bw = 150, bh = 70;
    if (crenels) for (let x = -300, i = 0; x < W + 300; x += 210, i++) { rr(ctx, x, top - 70, 130, 80, 6); fs(ctx, '#D8C29A', 6); }
    rr(ctx, -300, top, W + 600, bottom - top, 0); fs(ctx, '#D8C29A', 6);
    for (let r = 0, y = top; y < bottom; y += bh, r++) for (let x = -300 + (r % 2) * (bw / 2); x < W + 300; x += bw) {
      rr(ctx, x + 6, y + 6, bw - 12, bh - 12, 8); fs(ctx, H1(r, x) > 0.5 ? '#CDB68C' : '#D3BD94', 4, '#9C855E');
    }
    ctx.fillStyle = 'rgba(80,50,20,0.18)'; ctx.fillRect(-300, top, W + 600, 18);
  }
  function banner(ctx, x, y, color, t) {
    ln(ctx, [[x, y], [x, y - 520]], INK, 16); ln(ctx, [[x, y], [x, y - 520]], '#7A5233', 9);
    const wv = Math.sin(t * 4) * 10;
    ctx.beginPath(); ctx.moveTo(x, y - 500); ctx.lineTo(x + 130, y - 500 + wv * 0.3); ctx.quadraticCurveTo(x + 140 + wv, y - 380, x + 130, y - 250); ctx.lineTo(x, y - 260); ctx.closePath(); fs(ctx, color, 6);
    el(ctx, x + 66, y - 380, 34, 34); fs(ctx, '#F2E6C9', 5);
  }
  function grass(ctx, y0, y1, seed, n = 40) {
    for (let i = 0; i < n; i++) {
      const x = H1(seed, i) * W, y = lerp(y0, y1, H1(seed, i + 99));
      ln(ctx, [[x - 10, y], [x - 16, y - 26]], '#4E7A3A', 5); ln(ctx, [[x, y], [x + 2, y - 34]], '#4E7A3A', 5); ln(ctx, [[x + 10, y], [x + 18, y - 24]], '#4E7A3A', 5);
    }
  }

  // ---------- top-down battle map ----------
  const MC = { x: W / 2, y: H * 0.46 };
  const RK = 0.62;
  function soldierTop(ctx, x, y, team, r = 12, rot = 0) {
    const P = PAL[team];
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ln(ctx, [[r * 0.8, 0], [r * 1.2, -r * 2.4]], '#5A4632', 3);
    el(ctx, 0, r * 0.35, r * 1.3, r * 0.75); fs(ctx, P.dark, 2.5);
    el(ctx, 0, 0, r, r); fs(ctx, P.main, 2.5);
    el(ctx, -r * 0.2, -r * 0.25, r * 0.3, r * 0.3); ctx.fillStyle = P.plume; ctx.fill();
    ctx.restore();
  }
  function tent(ctx, x, y, rot, s, color = '#EFE6D2', big = false) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    rr(ctx, -34, -24, 68, 48, 4); fs(ctx, color, 4);
    ln(ctx, [[-34, 0], [34, 0]], 'rgba(0,0,0,0.35)', 3);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-34, 0, 68, 24);
    if (big) { ln(ctx, [[0, 0], [0, -90]], INK, 5); ctx.beginPath(); ctx.moveTo(0, -90); ctx.lineTo(48, -76); ctx.lineTo(0, -62); ctx.closePath(); fs(ctx, '#D9402F', 4); }
    ctx.restore();
  }
  function ground(ctx) {
    ctx.fillStyle = '#9CAE63'; ctx.fillRect(-800, -800, W + 1600, H + 1600);
    for (let i = 0; i < 70; i++) { el(ctx, -500 + H1(7, i) * (W + 1000), -500 + H1(8, i) * (H + 1000), 60 + H1(9, i) * 140, 40 + H1(10, i) * 90, H1(11, i) * 3); ctx.fillStyle = H1(12, i) > 0.5 ? 'rgba(120,140,70,0.35)' : 'rgba(190,190,110,0.3)'; ctx.fill(); }
    // a dirt road
    ctx.beginPath(); ctx.moveTo(MC.x - 40, -800); ctx.bezierCurveTo(MC.x - 60, MC.y - 300, MC.x + 40, MC.y, MC.x, H + 800); ctx.lineWidth = 70; ctx.strokeStyle = '#CDB98A'; ctx.stroke();
    for (let i = 0; i < 40; i++) { const x = -400 + H1(21, i) * (W + 800), y = -400 + H1(22, i) * (H + 800); for (let k = 0; k < 3; k++) ln(ctx, [[x + k * 9, y], [x + k * 9 + 3, y - 14]], '#6E8A42', 3); }
  }
  function fort(ctx, t) {
    const s = 150;
    rr(ctx, MC.x - s, MC.y - s, s * 2, s * 2, 6); fs(ctx, '#D9C79C', 6);
    for (const [bx, by] of [[-80, -80], [40, -90], [-90, 40], [50, 50]]) { rr(ctx, MC.x + bx, MC.y + by, 54, 34, 3); fs(ctx, '#5B6B86', 4); ln(ctx, [[MC.x + bx, MC.y + by + 17], [MC.x + bx + 54, MC.y + by + 17]], '#3F4C63', 3); }
    ctx.lineWidth = 34; ctx.strokeStyle = INK; ctx.strokeRect(MC.x - s, MC.y - s, s * 2, s * 2);
    ctx.lineWidth = 26; ctx.strokeStyle = '#CDB78E'; ctx.strokeRect(MC.x - s, MC.y - s, s * 2, s * 2);
    for (const [cx, cy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { rr(ctx, MC.x + cx * s - 30, MC.y + cy * s - 30, 60, 60, 6); fs(ctx, '#3F4C63', 6); }
  }
  // where a red soldier stands, knocked aside if the charge has already passed through it
  function chargePath(t) {
    const u = clamp((t - cut.charge) / 1.9);
    const dir = -0.95, dist = 560 * ease.inOutCubic(u);
    return { u, dir, cx: MC.x + Math.cos(dir) * dist, cy: MC.y + Math.sin(dir) * dist, dist };
  }
  function redPos(r, t, charging) {
    let x = MC.x + Math.cos(r.a) * r.r * RK, y = MC.y + Math.sin(r.a) * r.r * RK + Math.sin(t * 5 + r.ph) * 1.5;
    let rot = r.a + Math.PI / 2 + Math.PI, down = 0;
    if (charging) {
      const c = chargePath(t), dx = Math.cos(c.dir), dy = Math.sin(c.dir);
      const px = x - MC.x, py = y - MC.y, along = px * dx + py * dy, perp = -px * dy + py * dx;
      if (along > 0 && along < c.dist + 40 && Math.abs(perp) < 95) {
        const push = (95 - Math.abs(perp)) * 1.1 * clamp((c.dist + 40 - along) / 60);
        x += -dy * Math.sign(perp || 1) * push; y += dx * Math.sign(perp || 1) * push; down = clamp(push / 60); rot += down * 2.2 * Math.sign(perp || 1);
      }
    }
    return { x, y, rot, down };
  }
  function battleMap(ctx, t, charging) {
    ground(ctx);
    for (const tn of S.tents) { const a = tn.x * Math.PI * 2, r = (780 + tn.y * 260) * RK; tent(ctx, MC.x + Math.cos(a) * r, MC.y + Math.sin(a) * r, a + tn.rot, tn.s); }
    const target = { x: MC.x + Math.cos(-0.95) * 610, y: MC.y + Math.sin(-0.95) * 610 };
    tent(ctx, target.x, target.y, -0.95 + Math.PI / 2, 1.6, '#E9C9A0', true);
    fort(ctx, t);
    for (const r of S.reds) { const p = redPos(r, t, charging); soldierTop(ctx, p.x, p.y, 'red', 11, p.rot); }
    if (!charging) {
      for (const b of S.blues) soldierTop(ctx, MC.x + b.x * 30, MC.y + b.y * 30 + Math.sin(t * 6 + b.ph) * 1.2, 'blue', 10, 0);
    } else {
      const c = chargePath(t);
      // the planned route, dashed, toward the warlord's tent
      ctx.save(); ctx.setLineDash([26, 18]); ctx.lineDashOffset = -t * 120;
      ln(ctx, [[c.cx, c.cy], [target.x, target.y]], 'rgba(40,90,200,0.85)', 10); ctx.restore();
      // the wedge: an arrowhead of 64 riders
      let k = 0;
      for (let row = 0; row < 8; row++) for (let i = 0; i <= row && k < 64; i++, k++) {
        const back = row * 26, side = (i - row / 2) * 28;
        const dx = Math.cos(c.dir), dy = Math.sin(c.dir);
        const x = c.cx - dx * back - dy * side, y = c.cy - dy * back + dx * side;
        soldierTop(ctx, x + Math.sin(t * 20 + k) * 1.5, y, 'blue', 10, c.dir + Math.PI / 2);
      }
      // dust behind them
      for (let i = 0; i < 14; i++) { const b = 220 + i * 18 + H1(4, i) * 30; el(ctx, c.cx - Math.cos(c.dir) * b + (H1(5, i) - 0.5) * 120, c.cy - Math.sin(c.dir) * b + (H1(6, i) - 0.5) * 120, 30 + i * 3, 22 + i * 2); ctx.fillStyle = `rgba(230,215,180,${0.35 - i * 0.02})`; ctx.fill(); }
    }
    return target;
  }
  function tag(ctx, text, x, y, color = INK) {
    ctx.save(); ctx.font = '800 46px Inter'; const w = ctx.measureText(text).width + 44;
    rr(ctx, x - w / 2, y - 38, w, 68, 14); fs(ctx, color, 5, '#FFFFFF');
    ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y - 3); ctx.restore();
  }

  // ---------- captions: 1-2 words at a time, bold white with a dark outline ----------
  let CHUNKS = [];
  function buildChunks() {
    CHUNKS = [];
    for (const l of (VO && VO.lines) || []) {
      const ws = l.words;
      for (let i = 0; i < ws.length;) {
        const n = ws[i].w.length > 7 || (ws[i + 1] && ws[i + 1].w.length > 7) ? 1 : 2;
        const grp = ws.slice(i, i + n);
        const next = ws[i + n];
        CHUNKS.push({ t: grp[0].t, end: next ? next.t : l.end + 0.15, text: grp.map((w) => w.w).join(' ').toUpperCase() });
        i += n;
      }
    }
  }
  function captions(ctx, t) {
    const c = CHUNKS.find((k) => t >= k.t && t < k.end);
    if (!c) return;
    const pop = 1 + 0.18 * Math.exp(-(t - c.t) * 18);
    ctx.save(); ctx.translate(W / 2 - 40, H * 0.72); ctx.scale(pop, pop);
    ctx.font = '800 92px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = 22; ctx.strokeStyle = 'rgba(20,16,14,0.95)';
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowOffsetY = 8; ctx.shadowBlur = 6;
    ctx.strokeText(c.text, 0, 0); ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#FFFFFF'; ctx.fillText(c.text, 0, 0);
    ctx.restore();
  }

  const mouthOf = (t) => (VO ? Subs.mouth(VO, t, 'traveler') : { open: 0, wide: 0 });

  // ---------- shots ----------
  function shotHook(ctx, t) {
    const z = lerp(1.0, 1.07, ease.outCubic(clamp(t / cut.map)));
    cam(ctx, W / 2, H * 0.48, z, () => {
      sky(ctx, '#F3C78E', '#F6DDB0', '#E9C994');
      sun(ctx, 820, 520, 70);
      hills(ctx, 980, '#B9C48A', 1, 70); hills(ctx, 1080, '#93A86A', 3, 50);
      stoneWall(ctx, 1170, H + 300);
      banner(ctx, 150, 1170, '#33558F', t);
      grass(ctx, 1700, 1900, 4, 14);
      const talking = mouthOf(t);
      bean(ctx, { x: W / 2 + 10, y: 1580, s: 2.0, team: 'traveler', face: 'normal', mouth: talking, look: 0.2, blink: t > 1.25 && t < 1.36, armL: 0.1, armR: 0.25 + 1.6 * ease.outBack(clamp((t - 0.55) / 0.35)) * (1 - clamp((t - 1.9) / 0.3)), holdR: 'map', t });
    });
  }
  function shotMap(ctx, t) {
    const u = clamp((t - cut.map) / (cut.wall - cut.map));
    const z = lerp(2.4, 0.92, ease.inOutCubic(clamp(u * 1.25)));
    cam(ctx, MC.x, MC.y, z, () => battleMap(ctx, t, false));
    if (t > cut.map + 1.3) tag(ctx, '800  vs  100,000', W / 2, S.SAFE.y + 70, '#B0322A');
  }
  function shotWall(ctx, t) {
    const z = lerp(1.12, 1.25, ease.inOutCubic(clamp((t - cut.wall) / (cut.charge - cut.wall))));
    const turn = t > 7.45;
    cam(ctx, W / 2, 1180, z, () => {
      sky(ctx, '#3C3F6E', '#B86B5E', '#E9A46A');
      hills(ctx, 1080, '#6C6A5A', 2, 40);
      // the enemy camp on the horizon: a sea of red
      for (let i = 0; i < 260; i++) { const x = H1(31, i) * (W + 200) - 100, y = 1010 + H1(32, i) * 70; el(ctx, x, y, 6, 6); ctx.fillStyle = H1(33, i) > 0.85 ? '#F2E6C9' : '#B83A2F'; ctx.fill(); }
      for (const tx of [120, 960]) { ln(ctx, [[tx, 1400], [tx, 1020]], INK, 14); ln(ctx, [[tx, 1400], [tx, 1020]], '#7A5233', 7); const fl = 1 + 0.15 * Math.sin(t * 17 + tx); ctx.beginPath(); ctx.moveTo(tx - 22, 1020); ctx.quadraticCurveTo(tx - 20 * fl, 960, tx, 920 - 20 * fl); ctx.quadraticCurveTo(tx + 20 * fl, 960, tx + 22, 1020); ctx.closePath(); fs(ctx, '#F2A33A', 5); }
      const tr = (k) => Math.sin(t * 40 + k) * 2.5;
      bean(ctx, { x: 230 + tr(1), y: 1620, s: 1.25, team: 'blue', face: 'shock', t, flip: 1, armL: 0.0, armR: 0.0 });
      bean(ctx, { x: 860 + tr(2), y: 1630, s: 1.25, team: 'blue', face: 'worried', sweat: 1, t, flip: -1 });
      bean(ctx, { x: W / 2, y: 1700, s: 1.65, team: 'blue', face: turn ? 'smug' : 'worried', sweat: turn ? 0 : 1, beard: 'general', look: turn ? 0 : -0.6, t, armR: turn ? 0.5 : 0.05, armL: 0.05 });
      stoneWall(ctx, 1420, H + 300);
    });
  }
  function shotCharge(ctx, t) {
    const c = chargePath(t);
    const fx = lerp(MC.x, c.cx, 0.75), fy = lerp(MC.y, c.cy, 0.75);
    const sh = 8 * Math.exp(-(t - cut.charge) * 3);
    let target;
    cam(ctx, fx + U.noise1(t * 25, 1) * sh, fy + U.noise1(t * 25, 2) * sh, 1.55, () => {
      target = battleMap(ctx, t, true);
      if (t > cut.charge + 0.25) tag(ctx, 'ZHANG LIAO', c.cx - 40, c.cy + 120, '#2E4F8F');
      if (t > cut.charge + 0.9) tag(ctx, 'SUN QUAN', target.x - 20, target.y - 120, '#B0322A');
    });
    ctx.fillStyle = 'rgba(255,160,80,0.13)'; ctx.fillRect(0, 0, W, H); // dawn light
  }
  function shotReact(ctx, t) {
    const a = t - cut.react;
    const z = 1.12 + 0.05 * Math.exp(-a * 6);
    cam(ctx, W / 2, 990, z, () => {
      sky(ctx, '#F3C78E', '#F6DDB0', '#E9C994');
      // impact rays behind him
      ctx.save(); ctx.globalAlpha = 0.35 * Math.exp(-a * 1.2) + 0.12; ctx.translate(W / 2, 800);
      for (let i = 0; i < 20; i++) { ctx.rotate(Math.PI / 10); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1400, -110); ctx.lineTo(1400, 110); ctx.closePath(); ctx.fillStyle = i % 2 ? '#FFF2D0' : '#F2B66A'; ctx.fill(); }
      ctx.restore();
      hills(ctx, 1200, '#93A86A', 3, 50);
      const grin = t > 12.05;
      const hop = a < 0.4 ? Math.sin((a / 0.4) * Math.PI) * 50 : 0;
      bean(ctx, { x: W / 2, y: 1900 - hop, s: 2.45, team: 'traveler', face: grin ? 'grin' : 'shock', mouth: grin ? { open: 0 } : mouthOf(t), t, armL: grin ? 2.3 : 0.3, armR: 0.2, holdR: 'map', sweat: grin ? 0 : 0.9 });
    });
  }

  Studio.film({
    async init() { VO = await Studio.loadJSON('out/voice.json'); buildChunks(); },
    draw(ctx, t) {
      if (t < cut.map) shotHook(ctx, t);
      else if (t < cut.wall) shotMap(ctx, t);
      else if (t < cut.charge) shotWall(ctx, t);
      else if (t < cut.react) shotCharge(ctx, t);
      else shotReact(ctx, t);
      const fl = t >= cut.charge ? 0.7 * Math.exp(-(t - cut.charge) * 14) : 0;
      if (fl > 0.02) { ctx.fillStyle = `rgba(255,250,235,${fl})`; ctx.fillRect(0, 0, W, H); }
      captions(ctx, t);
    },
    post: { paper: 0, vignette: 0.28, grain: 0.03 },
    fadeOut: 0.5,
  });
})();
