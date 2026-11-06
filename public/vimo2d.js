/* Vimo 2D: de V-mascotte van Vanerum (Vanerum In MOtion).
   Gedeeld door de startpagina, Motion Missions (houdingen) en het beursscherm.
   Gebruik: Vimo2D.poseURI("staan-op") voor een plaatje, of new Vimo2D.Player(svg, opties) voor een bewegende Vimo. */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const INK = "#1e1e1e";
  const RAD = Math.PI / 180;
  function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }

  /* De V precies zoals in het beeldmerk: twee evenwijdige balken, de gele voet schuift onder de donkere balk. */
  const V_YEL = "M-124 -175 L-83 -175 L0.8 -3.3 L36 0 L-36 0 Z", V_DARK = "M83 -175 L124 -175 L36 0 L0.8 -3.3 Z";

  /* ---------- Motion Cube (naar het echte model) ---------- */
  const CUBE_H = .875;
  function makeCube(parent, cx, ground, s) {
    const g = el("g", {}, parent), h = s * CUBE_H, top = ground - h, d = s * .2, dy = d * .7;
    const tw = s * .47, bw = s * .5, bow = s * .035;
    const L0 = cx - tw, R0 = cx + tw, L1 = cx - bw, R1 = cx + bw;
    const sw = Math.max(1.6, s * .022);
    el("path", { d: `M${L0} ${top} Q${cx} ${top + bow} ${R0} ${top} L${R0 + d} ${top - dy} Q${cx + d} ${top - dy + bow} ${L0 + d} ${top - dy} Z`, fill: "#3a3b3f", stroke: INK, "stroke-width": sw, "stroke-linejoin": "round" }, g);
    el("path", { d: `M${R0} ${top} L${R0 + d} ${top - dy} L${R1 + d * .9} ${ground - dy} L${R1} ${ground} Z`, fill: "#25262a", stroke: INK, "stroke-width": sw, "stroke-linejoin": "round" }, g);
    el("path", { d: `M${L0} ${top} Q${cx} ${top + bow} ${R0} ${top} L${R1} ${ground} Q${cx} ${ground + bow} ${L1} ${ground} Z`, fill: "#2f3033", stroke: INK, "stroke-width": sw, "stroke-linejoin": "round" }, g);
    const OR = "#ee8f55", r = s * .085;
    [[-.27, .2], [.27, .2], [-.28, .76], [.28, .76]].forEach(([fx, fy]) => el("circle", { cx: cx + fx * s, cy: top + fy * h + bow * .6, r, fill: OR }, g));
    const tw2 = s * .085;
    el("path", { d: `M${cx - tw2} ${top + bow} L${cx - tw2} ${top + h * .27} A${tw2} ${tw2} 0 0 0 ${cx + tw2} ${top + h * .27} L${cx + tw2} ${top + bow} Z`, fill: OR }, g);
    const hr = s * .032, hy = top + h * .25;
    el("polygon", { points: [0, 1, 2, 3, 4, 5].map(i => `${cx + hr * Math.cos(i * Math.PI / 3 + Math.PI / 6)},${hy + hr * Math.sin(i * Math.PI / 3 + Math.PI / 6)}`).join(" "), fill: "none", stroke: INK, "stroke-width": Math.max(1.2, s * .016) }, g);
    const YE = "#f4d65e";
    el("ellipse", { cx: L0 + d * .75 + s * .16, cy: top - dy * .75 + bow * .5, rx: r * .8, ry: r * .32, fill: YE }, g);
    el("ellipse", { cx: R0 + d * .25 - s * .16, cy: top - dy * .25 + bow * .5, rx: r * .8, ry: r * .32, fill: YE }, g);
    el("rect", { x: cx + d * .5 - s * .12, y: top - dy * .5 + bow * .5 - s * .022, width: s * .24, height: s * .044, rx: s * .022, fill: "#26272b" }, g);
    const TU = "#6fdcd0";
    el("ellipse", { cx: R0 + d * .5 + s * .005, cy: top + h * .48, rx: r * .3, ry: r * .8, fill: TU }, g);
    el("path", { d: `M${R1 + d * .45} ${ground - dy * .45 - h * .06} l${-d * .05} ${-h * .2} l${d * .3} ${-dy * .3} l${d * .05} ${h * .2} Z`, fill: TU, opacity: .95 }, g);
    g.cubeTop = top; g.cubeTopFace = top - dy * .5;
    return g;
  }

  /* ---------- Vimo ---------- */
  function makeChar(parent, opts) {
    opts = opts || {};
    const R = {};
    R.root = el("g", {}, parent);
    R.shadow = el("ellipse", { cx: 0, cy: 0, rx: 44, ry: 7, fill: "rgba(30,30,30,.16)" }, R.root);
    R.flip = el("g", {}, R.root);
    const hose = p => ({ u: el("path", { fill: "none", stroke: INK, "stroke-width": 9, "stroke-linecap": "round" }, p), o: el("path", { fill: "none", stroke: "#fff", "stroke-width": 4.5, "stroke-linecap": "round" }, p) });
    R.legs = el("g", {}, R.flip);
    R.legL = hose(R.legs); R.legR = hose(R.legs);
    R.shoeL = el("ellipse", { rx: 17, ry: 9, fill: "#fff", stroke: INK, "stroke-width": 3 }, R.legs);
    R.shoeR = el("ellipse", { rx: 17, ry: 9, fill: "#fff", stroke: INK, "stroke-width": 3 }, R.legs);
    R.body = el("g", {}, R.flip);
    R.squash = el("g", {}, R.body);
    el("path", { d: V_YEL, fill: "#fbb900" }, R.squash);
    el("path", { d: V_DARK, fill: "#2e3033" }, R.squash);
    R.face = el("g", {}, R.squash);
    el("ellipse", { cx: -31, cy: -27, rx: 7, ry: 4, fill: "#f2a6b8", opacity: .8 }, R.face);
    el("ellipse", { cx: 31, cy: -27, rx: 7, ry: 4, fill: "#f2a6b8", opacity: .65 }, R.face);
    R.eyes = [-42.6, 42.6].map(ex => {
      const g = el("g", {}, R.face);
      return { ex, g,
        w: el("ellipse", { cx: ex, cy: -54, rx: 11.5, ry: 15, fill: "#fff", stroke: INK, "stroke-width": 3 }, g),
        p: el("ellipse", { rx: 6.5, ry: 9.5, fill: INK }, g),
        s: el("circle", { r: 2.6, fill: "#fff" }, g),
        hu: el("path", { d: `M${ex - 10} -50 Q${ex} -65 ${ex + 10} -50`, fill: "none", stroke: "#fff", "stroke-width": 8, "stroke-linecap": "round" }, g),
        h: el("path", { d: `M${ex - 10} -50 Q${ex} -65 ${ex + 10} -50`, fill: "none", stroke: INK, "stroke-width": 3.5, "stroke-linecap": "round" }, g) };
    });
    R.mU = el("path", { fill: "none", stroke: "#fff", "stroke-width": 7, "stroke-linecap": "round", "stroke-linejoin": "round" }, R.face);
    R.m = el("path", { stroke: INK, "stroke-width": 3.5, "stroke-linecap": "round", "stroke-linejoin": "round" }, R.face);
    R.tongue = el("ellipse", { cx: 0, cy: -8.5, rx: 5, ry: 3, fill: "#ef7f9c" }, R.face);
    R.mo = el("ellipse", { cx: 0, cy: -12, rx: 5, ry: 7, fill: INK, stroke: "#fff", "stroke-width": 2.5 }, R.face);
    R.arms = el("g", {}, R.body);
    R.armL = hose(R.arms); R.armR = hose(R.arms);
    const glove = () => { const g = el("g", {}, R.body); el("circle", { r: 10, fill: "#fff", stroke: INK, "stroke-width": 3 }, g); el("circle", { cx: -7, cy: -5, r: 4.5, fill: "#fff", stroke: INK, "stroke-width": 2.5 }, g); return g; };
    R.gloveL = glove(); R.gloveR = glove();
    if (opts.glovesOnly) { [R.shadow, R.legs, R.squash, R.arms].forEach(x => x.setAttribute("display", "none")); }
    if (opts.noShadow) R.shadow.setAttribute("display", "none");
    return R;
  }
  function limb(root, a1, a2, L1, L2) {
    const j = [root[0] + Math.sin(a1 * RAD) * L1, root[1] + Math.cos(a1 * RAD) * L1];
    const e = [j[0] + Math.sin((a1 + a2) * RAD) * L2, j[1] + Math.cos((a1 + a2) * RAD) * L2];
    return { j, e, d: `M${root[0].toFixed(1)} ${root[1].toFixed(1)} Q${(2 * j[0] - (root[0] + e[0]) / 2).toFixed(1)} ${(2 * j[1] - (root[1] + e[1]) / 2).toFixed(1)} ${e[0].toFixed(1)} ${e[1].toFixed(1)}` };
  }
  const MOUTH = { smile: "M-11 -16 Q0 -5 11 -16", open: "M-12 -17 Q0 3 12 -17 Z" };
  const show = (e, on) => { if (on) e.removeAttribute("display"); else e.setAttribute("display", "none"); };
  function draw(R, p, S, eyeOpen) {
    eyeOpen = eyeOpen == null ? 1 : eyeOpen;
    const la = p.legA || 34, lb = p.legB || 34, aL = p.aL || 30;
    const ll = limb([-17, 0], p.lL1, p.lL2, la, lb), rl = limb([17, 0], p.rL1, p.rL2, la, lb);
    const hipY = -9 - Math.max(ll.e[1], rl.e[1]) - p.lift;
    const sx = Math.cos((p.spin || 0) * RAD);
    R.root.setAttribute("transform", `translate(${p.x.toFixed(1)} ${p.g.toFixed(1)}) rotate(${(p.rootRot || 0).toFixed(1)}) scale(${S})`);
    R.flip.setAttribute("transform", `scale(${sx.toFixed(3)} 1)`);
    const k = Math.max(.35, 1 - p.lift / 220);
    R.shadow.setAttribute("rx", (58 * k).toFixed(1)); R.shadow.setAttribute("opacity", k.toFixed(2));
    const legT = `translate(0 ${hipY.toFixed(1)})`;
    for (const [L, leg, shoe, side] of [[ll, R.legL, R.shoeL, -1], [rl, R.legR, R.shoeR, 1]]) {
      leg.u.setAttribute("d", L.d); leg.o.setAttribute("d", L.d);
      leg.u.setAttribute("transform", legT); leg.o.setAttribute("transform", legT);
      shoe.setAttribute("cx", (L.e[0] + side * 7).toFixed(1)); shoe.setAttribute("cy", (L.e[1] + hipY).toFixed(1));
    }
    R.body.setAttribute("transform", `translate(0 ${hipY.toFixed(1)}) rotate(${p.rot.toFixed(2)})`);
    R.squash.setAttribute("transform", `scale(1 ${p.sq.toFixed(3)})`);
    const shY = -62 * p.sq;
    const al = limb([-64, shY], p.lA1, p.lA2, aL, aL), ar = limb([64, shY], p.rA1, p.rA2, aL, aL);
    R.armL.u.setAttribute("d", al.d); R.armL.o.setAttribute("d", al.d);
    R.armR.u.setAttribute("d", ar.d); R.armR.o.setAttribute("d", ar.d);
    R.gloveL.setAttribute("transform", `translate(${al.e[0].toFixed(1)} ${al.e[1].toFixed(1)})`);
    R.gloveR.setAttribute("transform", `translate(${ar.e[0].toFixed(1)} ${ar.e[1].toFixed(1)}) scale(-1 1)`);
    R.face.setAttribute("opacity", sx > 0 ? 1 : 0);
    const happy = p.happy > .5;
    for (const E of R.eyes) {
      show(E.w, !happy); show(E.p, !happy); show(E.h, happy); show(E.hu, happy);
      E.w.setAttribute("ry", (15 * eyeOpen).toFixed(1));
      const px = E.ex + p.look * 4, py = -52 + p.lookY * 3;
      E.p.setAttribute("cx", px.toFixed(1)); E.p.setAttribute("cy", py.toFixed(1)); E.p.setAttribute("ry", (9.5 * eyeOpen).toFixed(1));
      E.s.setAttribute("cx", (px - 2.5).toFixed(1)); E.s.setAttribute("cy", (py - 3.5).toFixed(1)); show(E.s, !happy && eyeOpen >= .5);
    }
    const m = p.mouth;
    show(R.mo, m === "o"); show(R.tongue, m === "open"); show(R.m, m !== "o"); show(R.mU, m !== "o");
    if (m !== "o") { R.m.setAttribute("d", MOUTH[m]); R.mU.setAttribute("d", MOUTH[m]); R.m.setAttribute("fill", m === "open" ? INK : "none"); }
    return hipY;
  }

  /* ---------- Houdingen (de negen Motion Missions-houdingen) ---------- */
  const BASE = { x: 320, g: 395, lift: 0, rot: 0, sq: 1, spin: 0, lA1: -25, lA2: 15, rA1: 25, rA2: -15, lL1: -9, lL2: 0, rL1: 9, rL2: 0, look: 0, lookY: 0, mouth: "smile", happy: 0, say: "" };
  const P = o => Object.assign({}, BASE, o);
  const S = .5;
  const POSES = {
    "ervoor-staan": svg => {
      makeCube(svg, 184, 236, 104);
      draw(makeChar(svg), P({ x: 136, g: 290, lA1: -158, lA2: -14, rA1: 40, rA2: -30, mouth: "open", look: -.3 }), S);
    },
    "boven-hoofd": svg => {
      const p = P({ x: 150, g: 288, lA1: -168, lA2: 0, rA1: 168, rA2: 0, aL: 73, lookY: -1, mouth: "o" });
      const hip = draw(makeChar(svg), p, S);
      makeCube(svg, 150, 288 + S * (hip - 150), 104);
      draw(makeChar(svg, { glovesOnly: true }), p, S);
    },
    "voor-je-houden": svg => {
      const p = P({ x: 150, g: 288, lA1: -12, lA2: 30, rA1: 12, rA2: -30, aL: 40, mouth: "smile", happy: 1 });
      draw(makeChar(svg), p, S);
      makeCube(svg, 150, 291, 58);
      draw(makeChar(svg, { glovesOnly: true }), p, S);
    },
    "liggen-op": svg => {
      const c = makeCube(svg, 150, 290, 124);
      const R = makeChar(svg, { noShadow: true }), rr = -63.3;
      const p = P({ x: 0, g: 0, rootRot: rr, lL1: 100, lL2: 35, rL1: 128, rL2: -30, lA1: 150, lA2: 20, rA1: 60, rA2: 60, mouth: "open", happy: 1 });
      const hip = draw(R, p, S);
      const mx = -80, my = hip - 87.5, a = rr * RAD;
      const wx = S * (mx * Math.cos(a) - my * Math.sin(a)), wy = S * (mx * Math.sin(a) + my * Math.cos(a));
      p.x = 150 - wx + 4; p.g = c.cubeTopFace - wy - 8;
      draw(R, p, S);
    },
    "ernaast-staan": svg => {
      makeCube(svg, 208, 282, 118);
      draw(makeChar(svg), P({ x: 92, g: 282, rA1: 98, rA2: -12, aL: 34, rot: 4, look: 1, mouth: "smile" }), S);
    },
    "erachter-staan": svg => {
      draw(makeChar(svg, { noShadow: true }), P({ x: 150, g: 204, lA1: -140, lA2: -20, rA1: 140, rA2: 20, mouth: "open" }), S);
      makeCube(svg, 148, 288, 124);
    },
    "staan-op": svg => {
      const c = makeCube(svg, 146, 288, 128);
      draw(makeChar(svg), P({ x: 158, g: c.cubeTopFace + 4, lA1: -128, lA2: -38, rA1: 128, rA2: 38, happy: 1, mouth: "open" }), S);
    },
    "erachter-zitten": svg => {
      const p = P({ x: 150, g: 228, lift: 12, lA1: -12, lA2: 22, rA1: 12, rA2: -22, aL: 17, look: .2, mouth: "smile" });
      draw(makeChar(svg, { noShadow: true }), p, S);
      makeCube(svg, 148, 290, 124);
      draw(makeChar(svg, { glovesOnly: true }), p, S);
    },
    "zitten-op": svg => {
      const c = makeCube(svg, 146, 290, 128);
      draw(makeChar(svg, { noShadow: true }), P({ x: 152, g: c.cubeTopFace + 2 + S * 97, legA: 14, legB: 74, lL1: -14, lL2: 10, rL1: 14, rL2: -10, lA1: -112, lA2: -20, rA1: 112, rA2: 20, happy: 1, mouth: "open" }), S);
    }
  };
  function poseSVG(key) {
    const f = POSES[key]; if (!f) return null;
    const svg = el("svg", { xmlns: NS, viewBox: "0 0 300 300", width: 600, height: 600 });
    f(svg);
    /* passend inzoomen: meet de tekening en zet er een vierkant met wat marge omheen */
    try {
      svg.setAttribute("style", "position:absolute;left:-9999px;top:0;visibility:hidden");
      document.body.appendChild(svg);
      const b = svg.getBBox(); svg.remove(); svg.removeAttribute("style");
      const side = Math.max(b.width, b.height) * 1.14, cx = b.x + b.width / 2, cy = b.y + b.height / 2;
      svg.setAttribute("viewBox", `${(cx - side / 2).toFixed(1)} ${(cy - side / 2).toFixed(1)} ${side.toFixed(1)} ${side.toFixed(1)}`);
    } catch (e) { if (svg.parentNode) svg.remove(); }
    return new XMLSerializer().serializeToString(svg);
  }
  const cache = {};
  function poseURI(key) {
    if (!(key in cache)) { const s = poseSVG(key); cache[key] = s ? "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s) : null; }
    return cache[key];
  }

  /* ---------- Bewegingen ---------- */
  const NUM = ["x", "g", "lift", "rot", "sq", "spin", "lA1", "lA2", "rA1", "rA2", "lL1", "lL2", "rL1", "rL2", "look", "lookY"];
  const DISC = ["mouth", "happy", "say"];
  const CROUCH = { lL1: -45, lL2: 50, rL1: 45, rL2: -50, sq: .9 };
  const STAND = { lL1: -9, lL2: 0, rL1: 9, rL2: 0, sq: 1 };
  const AIR = { lL1: -20, lL2: 28, rL1: 20, rL2: -28, sq: 1.06 };
  const UP = { lA1: -148, lA2: -8, rA1: 148, rA2: 8 };
  const CHEER = { lA1: -128, lA2: -38, rA1: 128, rA2: 38 };
  const DOWN = { lA1: -25, lA2: 15, rA1: 25, rA2: -15 };
  const BACK = { lA1: -40, lA2: 0, rA1: 40, rA2: 0 };
  function moves(home, onCube) {
    const H = { x: home.x, g: home.g }, mid = onCube ? { x: (home.x + onCube.x) / 2, g: (home.g + onCube.g) / 2 } : null;
    const M = {
      idle: { loop: true, frames: [[1500, { sq: 1.025, rot: -2, lA1: -21, rA1: 29, look: -.35 }], [1500, { sq: 1, rot: 2, lA1: -29, rA1: 21, look: .35 }]] },
      hoi: { frames: [[380, { rA1: 145, rA2: 28, mouth: "open", happy: 1, look: .3, say: "Hoi! Ik ben Vimo!" }], [260, { rA2: -22, rot: 2 }], [260, { rA2: 28, rot: -1 }], [260, { rA2: -22, rot: 2 }], [260, { rA2: 28, rot: -1 }], [260, { rA2: -22, rot: 2 }], [260, { rA2: 28, rot: 0 }], [700, {}], [400, Object.assign({}, DOWN, { mouth: "smile", happy: 0, look: 0, say: "" })]] },
      wijzen: { frames: [[420, { rA1: 93, rA2: -3, rot: 5, look: 1, lookY: .2, mouth: "open", say: "Kijk, de Motion Cube!" }], [1600, { lA1: -35 }], [420, Object.assign({}, DOWN, { rot: 0, look: 0, lookY: 0, mouth: "smile", say: "" })]] },
      springen: { rep: 2, frames: [[260, Object.assign({}, CROUCH, BACK, { say: "Spring mee!" })], [320, Object.assign({}, AIR, UP, { lift: 90, mouth: "open", happy: 1 }), "out"], [320, Object.assign({}, STAND, { lift: 0 }), "in"], [180, Object.assign({}, CROUCH, { sq: .93 })], [320, Object.assign({}, STAND, CHEER, { say: "Joepie!" })], [380, {}]], end: [[400, Object.assign({}, DOWN, { mouth: "smile", happy: 0, say: "" })]] },
      knieen: { rep: 3, frames: [[560, { lA1: -90, lA2: 0, rA1: 90, rA2: 0, lL1: -74, lL2: 68, rL1: 74, rL2: -68, sq: .95, mouth: "o", say: "{n}!" }], [560, Object.assign({}, STAND, { mouth: "smile" })]], end: [[450, Object.assign({}, CHEER, { happy: 1, mouth: "open", say: "Goed zo!" })], [900, {}], [400, Object.assign({}, DOWN, { happy: 0, mouth: "smile", say: "" })]] },
      balans: { frames: [[500, { rL1: 62, rL2: -95, lL1: -2, lA1: -96, lA2: 8, rA1: 96, rA2: -8, mouth: "o", say: "Kun jij dit ook?" }], [700, { rot: 6, look: -.4 }], [700, { rot: -6, look: .4 }], [700, { rot: 4, mouth: "smile" }], [500, { rot: 0, look: 0 }], [400, Object.assign({}, STAND, DOWN, { say: "" })]] },
      draaien: { frames: [[300, Object.assign({ lift: 14 }, UP, { mouth: "open", happy: 1, say: "Draaien maar!" })], [900, { spin: 360 }, "lin"], [320, Object.assign({ lift: 0 }, DOWN, { mouth: "smile", happy: 0, say: "" })]] }
    };
    if (onCube) M.kubus = { frames: [
      [340, Object.assign({}, CROUCH, BACK, { look: 1, say: "Hup, erop!" })],
      [380, Object.assign({}, AIR, UP, mid, { lift: 110, mouth: "open" }), "out"],
      [380, Object.assign({}, STAND, onCube, { lift: 0 }), "in"],
      [180, Object.assign({}, CROUCH, { sq: .92 })],
      [380, Object.assign({}, STAND, CHEER, { look: 0, happy: 1, say: "Ik sta op de kubus!" })],
      [1300, {}],
      [320, Object.assign({}, CROUCH, BACK, { happy: 0, mouth: "smile", look: -1, say: "" })],
      [380, Object.assign({}, AIR, UP, mid, { lift: 110, mouth: "open" }), "out"],
      [380, Object.assign({}, STAND, H, { lift: 0 }), "in"],
      [180, Object.assign({}, CROUCH, { sq: .92 })],
      [350, Object.assign({}, STAND, DOWN, { look: 0, mouth: "smile" })]] };
    const start = Object.assign({}, BASE, H);
    const build = (frames, st) => { let prev = Object.assign({}, st); return frames.map(([d, p, e]) => { prev = Object.assign({}, prev, p); return { d, p: prev, e: e || "io" }; }); };
    for (const k in M) { const m = M[k]; m.abs = build(m.frames, start); m.rep = m.rep || 1; if (m.end) m.endAbs = build(m.end, m.abs[m.abs.length - 1].p); }
    return { M, start };
  }
  const EASE = { io: t => .5 - .5 * Math.cos(Math.PI * t), lin: t => t, out: t => Math.sin(t * Math.PI / 2), in: t => 1 - Math.cos(t * Math.PI / 2) };
  const REDUCED = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Player: een bewegende Vimo in een eigen SVG.
     opties: {width, height, home:{x,g}, scale, cube:{cx,ground,s} | null, bubble:true, fontFamily} */
  function Player(svg, o) {
    o = o || {};
    const W = o.width || 800, H = o.height || 450;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const home = o.home || { x: W * .4, g: H * .88 }, Sx = o.scale || .8;
    let onCube = null;
    if (o.cube) { const c = makeCube(svg, o.cube.cx, o.cube.ground, o.cube.s); onCube = { x: o.cube.cx + o.cube.s * .1, g: c.cubeTopFace + 4 }; }
    const R = makeChar(svg);
    const { M, start } = moves(home, onCube);
    const bub = el("g", { display: "none" }, svg);
    const bRect = el("rect", { rx: 14, fill: "#fff", stroke: INK, "stroke-width": 2.5 }, bub);
    const bTail = el("path", { fill: "#fff", stroke: INK, "stroke-width": 2.5, "stroke-linejoin": "round" }, bub);
    const bText = el("text", { "font-family": o.fontFamily || '"Neue Montreal", Arial, sans-serif', "font-weight": 700, "font-size": o.fontSize || 22, fill: INK, "letter-spacing": ".6" }, bub);
    let cur = Object.assign({}, start), from, seg, segStart, move, name, list, repN, phase, override = "", queue = [], onDone = null;
    let nextBlink = 0, blinkEnd = 0, raf = 0, visible = true, stopped = false;
    const self = this;
    function startSeg(i, now) { seg = i; segStart = now; from = Object.assign({}, cur); const t = list[i].p; for (const k of DISC) cur[k] = t[k]; }
    function play(n, text, now) {
      now = now || performance.now(); if (!M[n]) n = "hoi";
      move = M[n]; name = n; cur.spin = cur.spin % 360; repN = 1; phase = "main"; list = move.abs; override = text || ""; startSeg(0, now);
    }
    function finished(now) {
      if (queue.length) { const q = queue.shift(); play(q.move, q.text, now); return; }
      play("idle", "", now); const cb = onDone; onDone = null; if (cb) cb();
    }
    function step(now) {
      const s = list[seg], t = Math.min(1, (now - segStart) / s.d), e = EASE[s.e](t);
      for (const k of NUM) { let v = from[k] + (s.p[k] - from[k]) * e; if (REDUCED && name === "idle" && (k === "sq" || k === "rot")) v = start[k]; cur[k] = v; }
      if (t >= 1) {
        if (seg + 1 < list.length) startSeg(seg + 1, now);
        else if (move.loop) startSeg(0, now);
        else if (phase === "main" && repN < move.rep) { repN++; startSeg(0, now); }
        else if (phase === "main" && move.endAbs) { phase = "end"; list = move.endAbs; startSeg(0, now); }
        else finished(now);
      }
      if (now > nextBlink) { blinkEnd = now + 150; nextBlink = now + 2500 + Math.random() * 3000; }
    }
    function bubble(hipY) {
      if (o.bubble === false) return;
      const txt = (name !== "idle" && override) ? override : (cur.say || "").replace("{n}", repN);
      if (!txt) { bub.setAttribute("display", "none"); return; }
      bub.removeAttribute("display");
      if (bText.textContent !== txt) bText.textContent = txt;
      const fs = +bText.getAttribute("font-size"), w = bText.getComputedTextLength() + fs * 1.5, h = fs * 2;
      const headTop = cur.g + Sx * (hipY - 175 * cur.sq), hx = cur.x, left = cur.x - Sx * 140, right = cur.x + Sx * 140;
      let bx, by, tail;
      if (headTop - 16 - h > 6) {
        bx = Math.min(W - w - 6, Math.max(6, hx - w / 2)); by = headTop - 16 - h;
        const tx = Math.min(bx + w - 20, Math.max(bx + 20, hx));
        tail = `M${tx - 8} ${by + h - 1} L${tx} ${by + h + 12} L${tx + 8} ${by + h - 1}`;
      } else if (left - 16 - w > 6) {
        bx = left - 16 - w; by = Math.max(6, headTop + 10);
        tail = `M${bx + w - 1} ${by + h / 2 - 7} L${bx + w + 13} ${by + h / 2} L${bx + w - 1} ${by + h / 2 + 7}`;
      } else {
        bx = Math.min(W - w - 6, right + 16); by = Math.max(6, headTop + 10);
        tail = `M${bx + 1} ${by + h / 2 - 7} L${bx - 13} ${by + h / 2} L${bx + 1} ${by + h / 2 + 7}`;
      }
      bRect.setAttribute("x", bx); bRect.setAttribute("y", by); bRect.setAttribute("width", w); bRect.setAttribute("height", h);
      bTail.setAttribute("d", tail); bText.setAttribute("x", bx + fs * .75); bText.setAttribute("y", by + h * .68);
    }
    function frame(now) {
      raf = 0; if (stopped) return;
      step(now); const hipY = draw(R, cur, Sx, now < blinkEnd ? .12 : 1); bubble(hipY);
      if (visible) raf = requestAnimationFrame(frame);
    }
    function wake() { if (!raf && !stopped && visible) raf = requestAnimationFrame(frame); }
    if (typeof IntersectionObserver === "function") new IntersectionObserver(es => { visible = es[0].isIntersecting && !document.hidden; wake(); }).observe(svg);
    document.addEventListener("visibilitychange", () => { visible = !document.hidden; wake(); });
    this.play = (n, text) => { queue = []; play(n, text); wake(); };
    this.sequence = (steps, done) => { queue = steps.slice(); onDone = done || null; finished(performance.now()); wake(); };
    this.stop = () => { queue = []; onDone = null; play("idle"); };
    this.destroy = () => { stopped = true; queue = []; onDone = null; if (raf) cancelAnimationFrame(raf); raf = 0; };
    this.moves = Object.keys(M).filter(k => k !== "idle");
    this.current = () => name;
    play("idle"); wake();
  }

  window.Vimo2D = { el, makeCube, makeChar, draw, POSES, poseSVG, poseURI, Player, BASE };
})();
