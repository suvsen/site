/* Interactive mind map: a small force-directed graph of how my work and
   interests connect. Drag nodes, click for a note, and add your own word:
   it links itself to the closest idea while "photons" run along the links. */
(() => {
  const canvas = document.getElementById("mm");
  if (!canvas) return;
  const wrap = canvas.parentElement;
  const card = document.getElementById("mmCard");
  const hint = document.getElementById("mmHint");
  const form = document.getElementById("mmForm");
  const input = document.getElementById("mmInput");
  const shake = document.getElementById("mmShake");
  const ctx = canvas.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Data. Edit freely: g = group (core | now | past | life). ---- */
  const N = [
    ["core", "Meta-optical photodetector", "core", "My PhD research topic: a photodetector where a metasurface does the light-gathering, so the chip itself sorts and traps light.", "#research", "detector photodetector sensor phd unist research device"],
    ["meta", "Metasurfaces", "now", "Flat layers of nanostructures that bend, filter and sort light, thinner than a wavelength.", "#research", "metasurface meta nano nanostructure flat lens optics optical"],
    ["flat", "Flatbands", "now", "Bands that barely change with angle, so light arriving from many directions gets the same treatment.", "#now", "band flatband angle physics hamiltonian theory math"],
    ["inv", "Inverse design", "now", "State the goal, let an optimizer find the shape. The computer does the guessing.", "#research", "design inverse optimization optimise optimize algorithm ai machine learning gradient"],
    ["rcwa", "RCWA simulations", "now", "Rigorous coupled-wave analysis: the solver that predicts how light meets a periodic structure.", "#research", "simulation simulate python code coding maxwell compute computer numerical"],
    ["ge", "Germanium at 1550 nm", "now", "The material for detecting telecom-wavelength light, built on silicon-on-insulator.", "#now", "germanium telecom infrared 1550 silicon chip semiconductor internet fiber"],
    ["pr", "Photoresponse setup", "now", "A test bench to watch a detector respond in under a nanosecond.", "#now", "lab laboratory fast speed laser measure measurement experiment time"],
    ["hsi", "Hyperspectral imaging", "now", "Cameras that record the full spectrum of every pixel, not just red, green and blue.", "#research", "color colour spectrum camera image imaging rainbow vision see photo"],
    ["pol", "Polarization", "now", "The orientation of light's oscillation, invisible to the eye and to ordinary cameras.", "#research", "polarization polarisation sunglasses glare sky bee"],
    ["pcm", "Phase-change materials", "past", "Thin films that switch their optical state on demand. My RMIT years.", "#journey", "phase change switch memory material film thin tunable"],
    ["vo2", "VO₂", "past", "Vanadium dioxide: turns from transparent to reflective in the infrared when warmed.", "#journey", "vanadium vo2 heat temperature thermal"],
    ["sbse", "Sb₂Se₃", "past", "A low-loss phase-change material for tunable optics.", "#publications", "antimony selenide sb2se3 tunable"],
    ["pvk", "Perovskites", "past", "Crystals that make cheap solar cells and bright LEDs. My master's years.", "#publications", "perovskite crystal tin lead chemistry"],
    ["sol", "Solar cells", "past", "Turning sunlight into electricity, cheaply and without lead.", "#publications", "solar sun energy renewable power climate green electricity"],
    ["led", "LEDs", "past", "Making light rather than catching it: perovskites and carbon dots.", "#publications", "led emit emission glow display screen bright"],
    ["pl", "Plasma processing", "past", "Cold plasma as a gentle tool to make and treat nanomaterials.", "#publications", "plasma ion fire gas quantum dots carbon"],
    ["glu", "Glucose sensing", "past", "Reading blood sugar with near-infrared light instead of needles.", "#p-glucose", "glucose health medical medicine body diabetes blood sugar"],
    ["light", "Light", "life", "The thread through all of it, in the lab and out of it.", "#research", "light photon photons sun shine shadow optics wave"],
    ["art", "Art", "life", "Painting and drawing: playing with colour from the other side.", "artworks.html", "art paint painting draw drawing sketch creative beauty music aesthetic"],
    ["phil", "Philosophy", "life", "Questions without convergence criteria. Notes go to Musings.", "musings.html", "philosophy mind think thinking idea meaning truth consciousness why"],
    ["quo", "Quotes", "life", "Lines worth keeping.", "quotes.html", "quote quotes words book books read reading writing poetry poem"],
    ["kor", "Korean", "life", "Learning one Hangul block at a time.", "#now", "korea korean language hangul seoul travel words"],
    ["gym", "Gym", "life", "Where the optimizer is me.", "#now", "gym fitness sport run running exercise strength workout"],
    ["uls", "Life in Ulsan", "life", "New city, new campus, new chapter.", "#journey", "ulsan life campus city food home move"]
  ];
  const E = [
    ["core","meta"],["core","flat"],["core","ge"],["core","pr"],["core","inv"],
    ["meta","inv"],["meta","hsi"],["meta","pol"],["meta","pcm"],["meta","light"],
    ["inv","rcwa"],["flat","rcwa"],["hsi","pol"],["ge","pr"],
    ["pcm","vo2"],["pcm","sbse"],["pvk","sol"],["pvk","led"],["pvk","pl"],["pl","sol"],
    ["led","light"],["sol","light"],["glu","hsi"],["glu","ge"],["pvk","pcm"],
    ["light","art"],["art","hsi"],["art","phil"],["phil","quo"],
    ["kor","uls"],["gym","uls"],["uls","core"],["gym","phil"]
  ];

  const nodes = N.map(([id, label, g, note, href, kw], i) => ({
    id, label, g, note, href, kw: (kw + " " + label.toLowerCase()).split(/\s+/),
    x: 0, y: 0, vx: 0, vy: 0, fixed: false, user: false
  }));
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  let edges = E.map(([a, b]) => ({ a: byId[a], b: byId[b] }));

  /* ---- Sizing ---- */
  let W = 0, H = 0, dpr = 1;
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const scatter = () => {
    nodes.forEach((n, i) => {
      const a = (i / nodes.length) * Math.PI * 2, rr = Math.min(W, H) * (n.g === "core" ? 0 : .3 + Math.random() * .12);
      n.x = W / 2 + Math.cos(a) * rr; n.y = H / 2 + Math.sin(a) * rr * .8; n.vx = n.vy = 0;
    });
    heat = 1;
  };

  /* ---- Colours from CSS so dark mode just works ---- */
  let C = {};
  const readColors = () => {
    const s = getComputedStyle(document.documentElement);
    const v = k => s.getPropertyValue(k).trim();
    C = { ink: v("--ink"), ink2: v("--ink-2"), hair: v("--hair"), plum: v("--plum"), rub: v("--rub"), paper: v("--paper"),
      g: { core: v("--rub"), now: v("--plum"), past: "#6f8a66", life: "#b48434", you: v("--rub") } };
  };
  document.addEventListener("themechange", readColors);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", readColors);

  /* ---- Physics ---- */
  let heat = 1;
  const deg = n => edges.reduce((c, e) => c + (e.a === n || e.b === n), 0);
  const radius = n => n.g === "core" ? 11 : n.user ? 6 : 4.5 + Math.min(deg(n), 5) * .6;
  const step = () => {
    const k = heat;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        let dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy + .01;
        let f = (W < 520 ? 2600 : 3400) / d2;
        if (a.g === "core" || b.g === "core") f *= 2.2;
        // keep labels from sitting on top of each other
        if (Math.abs(a.y - b.y) < 16 && Math.abs(a.x - b.x) < 130) f += .9;
        const d = Math.sqrt(d2); dx /= d; dy /= d;
        a.vx += dx * f * k; a.vy += dy * f * k; b.vx -= dx * f * k; b.vy -= dy * f * k;
      }
    }
    const rest = Math.max(60, Math.min(W * .14, H * .2));
    edges.forEach(({ a, b }) => {
      let dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy) || 1;
      const f = (d - rest) * .02 * k; dx /= d; dy /= d;
      a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
    });
    nodes.forEach(n => {
      n.vx += (W / 2 - n.x) * .0010 * k; n.vy += (H / 2 - n.y) * (W < 520 ? .0009 : .0024) * k;
      if (n.fixed) { n.vx = n.vy = 0; return; }
      n.vx *= .82; n.vy *= .82;
      n.x += n.vx; n.y += n.vy;
      const m = 30; n.x = Math.max(m, Math.min(W - m, n.x)); n.y = Math.max(m, Math.min(H - m, n.y));
    });
    heat = Math.max(.08, heat * .995);
  };

  /* ---- Photons travelling along links ---- */
  let photons = [];
  const emitFrom = (n, count = 1) => {
    edges.forEach(e => {
      if (e.a === n || e.b === n) for (let i = 0; i < count; i++)
        photons.push({ e, from: n, t: -i * .35, speed: .012 + Math.random() * .006 });
    });
  };
  let ambient = 0;

  /* ---- Interaction ---- */
  let hover = null, active = null, drag = null, downAt = null;
  const pick = (x, y) => {
    let best = null, bd = 18;
    nodes.forEach(n => { const d = Math.hypot(n.x - x, n.y - y); if (d < Math.max(bd, radius(n) + 6)) { bd = d; best = n; } });
    return best;
  };
  const pos = ev => { const r = canvas.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; };
  const neighbours = n => new Set(edges.flatMap(e => e.a === n ? [e.b] : e.b === n ? [e.a] : []));

  const showCard = (n, extra) => {
    if (!n) { card.classList.remove("show"); return; }
    const group = { core: "PhD topic", now: "Now", past: "Before UNIST", life: "Off duty", you: "Your idea" }[n.g];
    const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    card.innerHTML = '<span class="k">' + group + '</span><b>' + esc(n.label) + '</b>' + (extra || esc(n.note)) +
      (n.href ? ' <a href="' + n.href + '">Go there →</a>' : "");
    card.classList.add("show");
  };

  canvas.addEventListener("pointerdown", ev => {
    const [x, y] = pos(ev); const n = pick(x, y);
    downAt = [x, y];
    if (n) { drag = n; n.fixed = true; canvas.setPointerCapture(ev.pointerId); canvas.classList.add("dragging"); heat = Math.max(heat, .5); }
  });
  canvas.addEventListener("pointermove", ev => {
    const [x, y] = pos(ev);
    if (drag) { drag.x = x; drag.y = y; heat = Math.max(heat, .4); return; }
    const n = pick(x, y);
    if (n !== hover) { hover = n; canvas.style.cursor = n ? "pointer" : "grab"; if (n && !reduce) emitFrom(n); }
  });
  const up = ev => {
    const [x, y] = pos(ev);
    const moved = downAt && Math.hypot(x - downAt[0], y - downAt[1]) > 4;
    if (drag) { drag.fixed = false; canvas.classList.remove("dragging"); }
    if (!moved) {
      const n = pick(x, y);
      active = n; showCard(n);
      if (n) emitFrom(n, 3);
      if (hint) hint.style.opacity = 0;
    }
    drag = null; downAt = null;
  };
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointerleave", () => { hover = null; });

  /* ---- "Add a thought": links your word to the closest idea ---- */
  const added = [];
  form.addEventListener("submit", ev => {
    ev.preventDefault();
    const raw = input.value.trim().slice(0, 28);
    if (!raw) return;
    const words = raw.toLowerCase().split(/[^a-z0-9₂₃]+/).filter(Boolean);
    let best = null, score = 0;
    nodes.forEach(n => {
      if (n.user) return;
      let s = 0;
      words.forEach(w => n.kw.forEach(k => {
        if (k === w) s += 3;
        else if (w.length > 3 && (k.startsWith(w) || w.startsWith(k)) && k.length > 3) s += 1;
      }));
      if (s > score) { score = s; best = n; }
    });
    const guess = !best;
    if (!best) best = byId.light;
    const n = { id: "u" + Date.now(), label: raw, g: "you", note: "", href: null, kw: words, user: true,
      x: best.x + (Math.random() - .5) * 40, y: best.y + (Math.random() - .5) * 40, vx: 0, vy: 0, fixed: false };
    nodes.push(n); edges.push({ a: n, b: best }); added.push(n);
    if (added.length > 6) { const old = added.shift(); nodes.splice(nodes.indexOf(old), 1); edges = edges.filter(e => e.a !== old && e.b !== old); }
    heat = .8; active = n; emitFrom(n, 4);
    showCard(n, guess
      ? "No direct match, so it orbits <em>Light</em>, which connects to everything here."
      : "Linked to <em>" + best.label + "</em>. " + best.note);
    input.value = "";
    if (hint) hint.style.opacity = 0;
  });
  shake.addEventListener("click", () => { scatter(); active = null; showCard(null); });

  /* ---- Drawing ---- */
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const focus = drag || hover || active;
    const near = focus ? neighbours(focus) : null;

    edges.forEach(e => {
      const lit = focus && (e.a === focus || e.b === focus);
      ctx.strokeStyle = lit ? C.plum : C.hair;
      ctx.globalAlpha = focus && !lit ? .5 : 1;
      ctx.lineWidth = lit ? 1.6 : 1;
      if (e.a.user || e.b.user) ctx.setLineDash([3, 4]); else ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
    });
    ctx.setLineDash([]); ctx.globalAlpha = 1;

    photons.forEach(p => {
      if (p.t < 0) return;
      const { a, b } = p.e, from = p.from === a ? a : b, to = from === a ? b : a;
      const x = from.x + (to.x - from.x) * p.t, y = from.y + (to.y - from.y) * p.t;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 7);
      g.addColorStop(0, C.rub); g.addColorStop(1, "transparent");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill();
    });

    ctx.textBaseline = "middle";
    nodes.forEach(n => {
      const r = radius(n), dim = focus && n !== focus && !near.has(n);
      ctx.globalAlpha = dim ? .35 : 1;
      ctx.fillStyle = C.g[n.g];
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fill();
      if (n === focus || n.g === "core") { ctx.strokeStyle = C.g[n.g]; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(n.x, n.y, r + 4, 0, Math.PI * 2); ctx.stroke(); }
      const big = n.g === "core" || n === focus;
      // On narrow screens, label only the topic, the focused node, its neighbours and hubs.
      if (W < 520 && !big && !(near && near.has(n)) && !n.user && deg(n) < 4) return;
      const fs = W < 520 ? (big ? 13 : 11.5) : (big ? 15 : 13);
      ctx.font = (big ? 500 : 400) + " " + fs + "px Newsreader, Georgia, serif";
      ctx.fillStyle = n.g === "core" ? C.ink : C.ink2;
      const tx = n.x + r + 6, w = ctx.measureText(n.label).width;
      const left = tx + w > W - 6;
      ctx.textAlign = left ? "right" : "left";
      ctx.fillText(n.label, left ? n.x - r - 6 : tx, n.y);
    });
    ctx.globalAlpha = 1; ctx.textAlign = "left";
  };

  const tick = () => {
    step();
    photons.forEach(p => p.t += p.speed);
    photons = photons.filter(p => p.t < 1);
    if (!reduce && ++ambient % 90 === 0 && photons.length < 6) {
      const e = edges[Math.floor(Math.random() * edges.length)];
      photons.push({ e, from: Math.random() < .5 ? e.a : e.b, t: 0, speed: .008 });
    }
    draw();
    if (visible) requestAnimationFrame(tick); else running = false;
  };

  /* Run only while on screen */
  let visible = false, running = false;
  const start = () => { if (!running) { running = true; requestAnimationFrame(tick); } };
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) start(); }).observe(canvas);
  new ResizeObserver(() => { const ow = W, oh = H; resize(); if (!ow) scatter(); else nodes.forEach(n => { n.x *= W / ow; n.y *= H / oh; }); draw(); }).observe(wrap);

  readColors(); resize(); scatter();
  if (reduce) { for (let i = 0; i < 400; i++) step(); }
})();
