// THE SONG: voiceover + a low war-drum bed + a whoosh on every cut, all from score.js.
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const Voice = require('./engine/audio/voice');
const sc = require('./score');
const { DURATION, m, cut, ev, vo } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const drums = bus(), pad = bus(), fx = bus(), verb = bus();
const out = path.join(__dirname, 'out');

// ---------- voiceover (British narrator, a touch faster than default) ----------
const V = Voice.speak(vo, { out, voice: 'bm_george', rate: 192, length: DURATION });

// ---------- drone: a dark Dm pad under everything ----------
const padSecs = [[0, cut.wall, ['D3', 'A3', 'F4']], [cut.wall, cut.charge, ['Bb2', 'F3', 'D4']], [cut.charge, cut.react, ['C3', 'G3', 'E4']], [cut.react, DURATION, ['D3', 'A3', 'D4']]];
for (const [t0, t1, notes] of padSecs) for (const n of notes) { const { L, R } = I.padNote(m(n), t1 - t0 + 0.4, { cutoff: 900, attack: 0.3, release: 1.0 }); pad.addStereo(L, R, t0, 0.07); }

// ---------- war drums: a slow pulse, doubling up on the charge ----------
const BEAT = 0.6;
for (let t = 0.0; t < DURATION - 1; t += BEAT) {
  const charge = t >= cut.charge && t < cut.react;
  if (Object.values(cut).some((c) => Math.abs(t - c) < 0.25)) continue; // keep every cut's hit clean
  const tom = I.timpani(m(charge ? 'D2' : 'A1'), { decay: 0.6 });
  drums.addMono(tom, t, charge ? 0.55 : 0.35);
  if (charge) drums.addMono(I.tom(110, 0.25), t + BEAT / 2, 0.35);
}

// ---------- a whoosh into every cut, then a hard thud on it ----------
for (const t of [cut.map, cut.wall, cut.charge, cut.react]) {
  fx.addMono(I.noiseSweep(0.28, 600, 5000, { q: 0.8, pink: true, shape: (x) => x * x }), t - 0.28, 0.35);
  fx.addMono(I.thud(70, 0.1), t, 0.7);
  verb.addMono(I.thud(70, 0.1), t, 0.2);
}
fx.addMono(I.subBoom(1.5), cut.charge, 0.6);
fx.addMono(I.thwack(), cut.react, 0.8); // a sharp comic hit on the reaction shot

// ---------- mix: music ducked under the voice ----------
MIX.duck([drums, pad], V.bus, { depth: 0.45, threshold: 0.03 });
const stems = { voice: V.bus, drums, pad, fx, verb: reverb(verb, { room: 0.8, damp: 0.4 }) };
const GAIN = { voice: 1.25, drums: 0.5, pad: 2.2, fx: 0.7, verb: 0.8 };
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 30);
MIX.fadeOut(mix, DURATION - 0.8, DURATION);
const M = MIX.master(mix, 0.8, undefined, { lufs: -14 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION}s, ${M.lufs.toFixed(1)} LUFS) voice engine: ${V.engine}`);
