/* ==========================================================
   Living mind map
   ----------------------------------------------------------
   The map rebuilds itself from the site every time it loads:
   - Core ideas below are the backbone (edit them freely).
   - Papers (this page), Musings, Artworks and Quotes (their pages)
     are read live and attached to the ideas they talk about.
   - Ideas grow with the amount of work attached to them.
   - Ideas mentioned in "Now" or in recent News get a glowing
     "current focus" ring, so the map follows what you are doing.
   - Hashtags that match no idea become new ideas, and ideas that
     appear together in one piece of work get a new dashed link.
   - Clicking an idea unfolds the work attached to it.
   ========================================================== */
(() => {
  const canvas = document.getElementById("mm");
  if (!canvas) return;
  const wrap = canvas.parentElement;
  const card = document.getElementById("mmCard");
  const hint = document.getElementById("mmHint");
  const form = document.getElementById("mmForm");
  const input = document.getElementById("mmInput");
  const shake = document.getElementById("mmShake");
  const status = document.getElementById("mmStatus");
  const ctx = canvas.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Core ideas (the backbone) ----------
     g: core | now | past | life.  kw: words that point to this idea.
     hub: true means the idea is only matched by an explicit #tag. */
  const IDEAS = [
    { id: "core", label: "Meta-optical photodetector", g: "core", href: "#research", note: "My PhD research topic: a photodetector where a metasurface does the light-gathering, so the chip itself sorts and traps light.", kw: "meta-optical photodetector photodetectors detector detectors phd unist" },
    { id: "meta", label: "Metasurfaces", g: "now", href: "#research", note: "Flat layers of nanostructures that bend, filter and sort light, thinner than a wavelength.", kw: "metasurface metasurfaces meta-optics metaoptics nanostructure nanostructures metalens flat-optics lens" },
    { id: "flat", label: "Flatbands", g: "now", href: "#now", note: "Bands that barely change with angle, so light arriving from many directions gets the same treatment.", kw: "flatband flatbands band bands hamiltonian angle angular lattice" },
    { id: "inv", label: "Inverse design", g: "now", href: "#research", note: "State the goal, let an optimizer find the shape. The computer does the guessing.", kw: "inverse-design optimization optimisation optimizer optimiser gradient adjoint algorithm ai machine-learning" },
    { id: "rcwa", label: "RCWA simulations", g: "now", href: "#research", note: "Rigorous coupled-wave analysis: the solver that predicts how light meets a periodic structure.", kw: "rcwa simulation simulations solver python code numerical maxwell fdtd" },
    { id: "ge", label: "Germanium at 1550 nm", g: "now", href: "#now", note: "The material for detecting telecom-wavelength light, built on silicon-on-insulator.", kw: "germanium ge 1550 telecom silicon-on-insulator soi swir c-band" },
    { id: "pr", label: "Photoresponse setup", g: "now", href: "#now", note: "A test bench to watch a detector respond in under a nanosecond.", kw: "photoresponse time-resolved nanosecond response setup bench laser measurement" },
    { id: "hsi", label: "Hyperspectral imaging", g: "now", href: "#research", note: "Cameras that record the full spectrum of every pixel, not just red, green and blue.", kw: "hyperspectral spectral spectrum spectra imaging camera colour color rainbow" },
    { id: "pol", label: "Polarization", g: "now", href: "#research", note: "The orientation of light's oscillation, invisible to the eye and to ordinary cameras.", kw: "polarization polarisation polarimetric polarized chiral" },
    { id: "pcm", label: "Phase-change materials", g: "past", href: "#journey", note: "Thin films that switch their optical state on demand. My RMIT years.", kw: "phase-change tunable tunability amorphous crystalline" },
    { id: "vo2", label: "VO₂", g: "past", href: "#journey", note: "Vanadium dioxide: turns from transparent to reflective in the infrared when warmed.", kw: "vo₂ vo2 vanadium thermochromic" },
    { id: "sbse", label: "Sb₂Se₃", g: "past", href: "#publications", note: "A low-loss phase-change material for tunable optics.", kw: "sb₂se₃ sb2se3 antimony selenide" },
    { id: "ufs", label: "Ultrafast spectroscopy", g: "past", href: "#publications", note: "Watching carriers and lattice vibrations relax on picosecond timescales.", kw: "ultrafast spectroscopy spectroscopic phonon carrier topological pump-probe" },
    { id: "pvk", label: "Perovskites", g: "past", href: "#publications", note: "Crystals that make cheap solar cells and bright LEDs. My master's years.", kw: "perovskite perovskites halide cs-halide tin lead-free" },
    { id: "sol", label: "Solar cells", g: "past", href: "#publications", note: "Turning sunlight into electricity, cheaply and without lead.", kw: "solar photovoltaic photovoltaics dye-sensitized dssc sustainable energy" },
    { id: "led", label: "LEDs", g: "past", href: "#publications", note: "Making light rather than catching it: perovskites and carbon dots.", kw: "led leds emitting emission electroluminescence" },
    { id: "pl", label: "Plasma processing", g: "past", href: "#publications", note: "Cold plasma as a gentle tool to make and treat nanomaterials.", kw: "plasma tof-sims quantum carbon dots nanomaterial nanomaterials" },
    { id: "glu", label: "Glucose sensing", g: "past", href: "#publications", note: "Reading blood sugar with near-infrared light instead of needles.", kw: "glucose diabetes blood health medical biosensing" },
    { id: "light", label: "Light", g: "life", href: "#research", note: "The thread through all of it, in the lab and out of it.", kw: "light photon photons optics", hub: true },
    { id: "art", label: "Art", g: "life", href: "artworks.html", note: "Painting and drawing: playing with colour from the other side.", kw: "art painting paint drawing sketch watercolour watercolor ink canvas", hub: true },
    { id: "phil", label: "Philosophy", g: "life", href: "musings.html", note: "Questions without convergence criteria. Notes live in Musings.", kw: "philosophy mind meaning consciousness ethics truth", hub: true },
    { id: "quo", label: "Quotes", g: "life", href: "quotes.html", note: "Lines worth keeping.", kw: "quote quotes", hub: true },
    { id: "kor", label: "Korean", g: "life", href: "#now", note: "Learning one Hangul block at a time.", kw: "korean hangul korea" },
    { id: "gym", label: "Gym", g: "life", href: "#now", note: "Where the optimizer is me.", kw: "gym fitness workout training" },
    { id: "uls", label: "Life in Ulsan", g: "life", href: "#journey", note: "New city, new campus, new chapter.", kw: "ulsan campus" }
  ];
  const LINKS = [
    ["core","meta"],["core","flat"],["core","ge"],["core","pr"],["core","inv"],
    ["meta","inv"],["meta","hsi"],["meta","pol"],["meta","pcm"],["meta","light"],
    ["inv","rcwa"],["flat","rcwa"],["hsi","pol"],["ge","pr"],
    ["pcm","vo2"],["pcm","sbse"],["pvk","sol"],["pvk","led"],["pvk","pl"],["pl","sol"],
    ["led","light"],["sol","light"],["glu","hsi"],["glu","ge"],["pvk","pcm"],["ufs","hsi"],["ufs","pcm"],
    ["light","art"],["art","hsi"],["art","phil"],["phil","quo"],
    ["kor","uls"],["gym","uls"],["uls","core"],["gym","phil"]
  ];
  const KIND_HOME = { paper: "light", musing: "phil", art: "art", quote: "quo" };
  const KIND_NAME = { paper: "paper", musing: "musing", art: "artwork", quote: "quote" };

  /* ---------- helpers ---------- */
  const stem = w => (w.length > 4 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w);
  // Text → words (hyphenated words also split) plus two-word pairs, so
  // "phase change" and "phase-change" both reach the same idea.
  const tokens = s => {
    const ws = (s || "").toLowerCase().replace(/[–—]/g, "-").split(/[^a-z0-9₂₃\-]+/).filter(Boolean);
    const out = ws.flatMap(w => w.includes("-") ? [w, ...w.split("-")] : [w]).map(stem);
    for (let i = 0; i + 1 < ws.length; i++) out.push(stem(ws[i] + "-" + ws[i + 1]));
    return out;
  };
  // Keywords of an idea are taken as written (no splitting).
  const kwTokens = s => (s || "").toLowerCase().split(/\s+/).filter(Boolean).map(stem);
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const hashf = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; };
  const pretty = t => t.replace(/[-_]+/g, " ").replace(/^\w/, c => c.toUpperCase());
  const parseDate = s => { const m = (s || "").match(/(20\d\d)(?:\D{1,3}(\d{1,2}))?/); return m ? new Date(+m[1], m[2] ? +m[2] - 1 : 0, 15) : null; };
  const clip = (s, n) => s.length > n ? s.slice(0, n - 1) + "…" : s;

  /* ---------- graph state ---------- */
  let nodes = [], edges = [], byId = {}, items = [], current = new Set();

  const makeIdea = (d, extra = {}) => ({
    ...d, kwset: new Set(kwTokens(d.kw)), items: [], weight: 0,
    x: 0, y: 0, vx: 0, vy: 0, fixed: false, ...extra
  });
  const addEdge = (a, b, emergent = false) => {
    if (!a || !b || a === b) return null;
    let e = edges.find(e => (e.a === a && e.b === b) || (e.a === b && e.b === a));
    if (e) { if (emergent) e.w = (e.w || 1) + 1; return e; }
    e = { a, b, emergent, w: 1 }; edges.push(e); return e;
  };

  /* Score how strongly a piece of text (and its #tags) points at each idea. */
  // Tag hit = 3, word in the title = 2, word elsewhere = 1, idea named outright = +2.
  const match = (text, tags = [], max = 3, title = "", min = 2) => {
    const tk = new Set(tokens(text)), tt = new Set(tokens(title)), tg = new Set(tags.flatMap(kwTokens)), low = (text + " " + title).toLowerCase();
    const tagged = [], scored = [];
    nodes.forEach(n => {
      if (n.kind) return;
      if ([...n.kwset].some(k => tg.has(k))) { tagged.push(n); return; }   // explicit #tags always count
      let s = 0;
      n.kwset.forEach(k => { if (!n.hub && tt.has(k)) s += 2; else if (!n.hub && tk.has(k)) s += 1; });
      if (!n.hub && n.label.length > 3 && low.includes(n.label.toLowerCase())) s += 2;
      if (s >= min) scored.push([s, n]);
    });
    const rest = scored.sort((a, b) => b[0] - a[0]).map(x => x[1]);
    return tagged.concat(rest.slice(0, Math.max(0, max - tagged.length)));
  };

  /* ---------- 2. Read the site ---------- */
  const harvestHere = () => {
    const found = [];
    document.querySelectorAll("#pubs .pub").forEach((p, i) => {
      if (!p.id) p.id = "pub-" + (i + 1);
      const t = p.querySelector(".t")?.textContent.trim() || "Paper";
      found.push({ kind: "paper", title: t, href: "#" + p.id, date: parseDate(p.querySelector(".v")?.textContent),
        text: t + " " + (p.querySelector(".desc")?.textContent || "") + " " + (p.querySelector(".tag")?.textContent || ""),
        tags: (p.dataset.tags || "").split(/[\s,]+/).filter(Boolean) });
    });
    return found;
  };
  const focusText = () => {
    const parts = [document.querySelector("#now dl")?.textContent || ""];
    const yearAgo = Date.now() - 365 * 864e5;
    document.querySelectorAll("#newsList li").forEach(li => {
      const d = parseDate(li.querySelector(".d")?.textContent);
      if (d && d.getTime() > yearAgo) parts.push(li.textContent);
    });
    return parts;
  };
  const fetchDoc = async url => {
    try { const r = await fetch(url, { cache: "no-cache" }); if (!r.ok) return null; return new DOMParser().parseFromString(await r.text(), "text/html"); }
    catch (e) { return null; }
  };
  const harvestPages = async () => {
    const [mus, art, quo] = await Promise.all(["musings.html", "artworks.html", "quotes.html"].map(fetchDoc));
    const found = [];
    mus && mus.querySelectorAll(".musings li:not([data-placeholder])").forEach(li => {
      const t = li.querySelector("h3")?.textContent.trim(); if (!t) return;
      found.push({ kind: "musing", title: t, href: li.querySelector("h3 a")?.getAttribute("href") || "musings.html",
        date: parseDate(li.querySelector(".d")?.textContent), text: t + " " + (li.querySelector("p")?.textContent || ""),
        tags: (li.querySelector(".tags")?.textContent.match(/#[\w\-₂₃]+/g) || []).map(s => s.slice(1).toLowerCase()) });
    });
    art && art.querySelectorAll(".art:not([data-placeholder])").forEach(f => {
      const t = f.dataset.title || "Artwork";
      found.push({ kind: "art", title: t, href: "artworks.html", date: parseDate(f.dataset.meta), text: t + " " + (f.dataset.meta || ""),
        tags: ["art", ...(f.dataset.tags || "").split(/[\s,#]+/).filter(Boolean).map(s => s.toLowerCase())] });
    });
    const qd = quo && quo.getElementById("quotes-data");
    if (qd) { try { JSON.parse(qd.textContent).forEach(([q, who]) => found.push({ kind: "quote", title: who, quote: q, href: "quotes.html", text: q, tags: ["quote"] })); } catch (e) {} }
    return found;
  };

  /* ---------- 3. Build the graph from ideas + harvested work ---------- */
  const build = (harvested, focus) => {
    const keep = new Map(nodes.map(n => [n.id, n]));
    nodes = IDEAS.map(d => { const o = keep.get(d.id); return makeIdea(d, o ? { x: o.x, y: o.y } : {}); });
    byId = Object.fromEntries(nodes.map(n => [n.id, n]));
    edges = []; LINKS.forEach(([a, b]) => addEdge(byId[a], byId[b]));
    items = harvested;

    items.forEach(it => {
      let hits = it.kind === "quote" ? [] : match(it.text, it.tags, 3, it.title);
      // Tags that match no idea grow into new ideas.
      if (it.kind === "musing" || it.kind === "art") {
        it.tags.forEach(tag => {
          const tk = kwTokens(tag); if (!tk.length || tag === "placeholder") return;
          const known = nodes.some(n => !n.kind && tk.some(t => n.kwset.has(t)));
          if (known) return;
          const id = "x-" + tk.join("-");
          if (!byId[id]) {
            const o = keep.get(id);
            const n = makeIdea({ id, label: pretty(tag), g: "emergent", href: it.href, note: "A new thread, grown from your " + KIND_NAME[it.kind] + "s.", kw: tag }, o ? { x: o.x, y: o.y } : {});
            nodes.push(n); byId[id] = n;
          }
          hits.push(byId[id]);
        });
      }
      if (!hits.length) hits = [byId[KIND_HOME[it.kind]]];
      it.ideas = hits;
      hits.forEach(n => { n.items.push(it); n.weight++; });
      if (it.kind !== "quote" && !hits.includes(byId[KIND_HOME[it.kind]]) && (it.kind === "musing" || it.kind === "art")) addEdge(hits[0], byId[KIND_HOME[it.kind]], true);
      for (let i = 0; i < hits.length; i++) for (let j = i + 1; j < hits.length; j++) addEdge(hits[i], hits[j], true);
    });

    // "Current focus": ideas named in the Now section or in news from the last year.
    current = new Set();
    focus.forEach(t => {
      const low = t.toLowerCase();
      match(t, [], 20, "", 1).forEach(n => current.add(n));
      nodes.forEach(n => { if (!n.kind && low.includes(n.label.toLowerCase())) current.add(n); });
      // hubs (Art, Philosophy…) count when their own words appear
      const tk = new Set(tokens(t));
      nodes.forEach(n => { if (n.hub && [...n.kwset].some(k => k.length > 4 && tk.has(k))) current.add(n); });
    });

    nodes.forEach(n => { if (!keep.has(n.id)) place(n); });
    sats = []; expanded = null; active = null; showCard(null);
    heat = Math.max(heat, .7);
    const c = k => items.filter(i => i.kind === k).length, plural = (n, w) => n + " " + w + (n === 1 ? "" : "s");
    if (status) status.textContent = "built live from " + [plural(c("paper"), "paper"), plural(c("musing"), "musing"), plural(c("art"), "artwork"), plural(c("quote"), "quote")].join(" · ");
  };

  /* Stable starting layout: each family has its own region, jittered by name. */
  const SECTOR = { core: [0, 0], now: [-.35, .9], past: [2.6, 3.7], life: [4.1, 5.3], emergent: [.9, 1.9] };
  const place = n => {
    if (!W) return;
    const [a0, a1] = SECTOR[n.g] || [0, 6.28], j = hashf(n.id);
    const a = a0 + (a1 - a0) * j, rr = n.g === "core" ? 0 : Math.min(W, H) * (.28 + .14 * hashf(n.id + "r"));
    n.x = W / 2 + Math.cos(a) * rr * (W > H ? 1.3 : 1); n.y = H / 2 + Math.sin(a) * rr * (H > W ? 1.35 : .85); n.vx = n.vy = 0;
  };

  /* ---------- sizing ---------- */
  let W = 0, H = 0, dpr = 1;
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  /* ---------- colours (follow light/dark theme) ---------- */
  let C = {};
  const readColors = () => {
    const s = getComputedStyle(document.documentElement), v = k => s.getPropertyValue(k).trim();
    C = { ink: v("--ink"), ink2: v("--ink-2"), hair: v("--hair"), plum: v("--plum"), rub: v("--rub"), paper: v("--paper"), card: v("--card"),
      g: { core: v("--rub"), now: v("--plum"), past: "#6f8a66", life: "#b48434", emergent: "#3f86a0", you: v("--rub") },
      k: { paper: v("--plum"), musing: "#3f86a0", art: "#b48434", quote: "#8a7f73", more: v("--grey") } };
  };
  document.addEventListener("themechange", readColors);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", readColors);

  /* ---------- physics ---------- */
  let heat = 1, sats = [], expanded = null;
  const all = () => nodes.concat(sats);
  const radius = n => n.kind ? 4 : n.g === "core" ? 11 : n.user ? 6 : Math.min(13, 4.5 + Math.sqrt(n.weight) * 1.9 + (n.g === "emergent" ? .5 : 0));
  const step = () => {
    const k = heat, list = all(), narrow = W < 520;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        let dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy + .01;
        let f = (narrow ? 2600 : 3400) / d2;
        if (a.kind || b.kind) f *= .45;
        if (a.g === "core" || b.g === "core") f *= 2.2;
        if (!a.kind && !b.kind && Math.abs(a.y - b.y) < 16 && Math.abs(a.x - b.x) < 130) f += .9;
        const d = Math.sqrt(d2); dx /= d; dy /= d;
        a.vx += dx * f * k; a.vy += dy * f * k; b.vx -= dx * f * k; b.vy -= dy * f * k;
      }
    }
    const rest = Math.max(60, Math.min(W * .14, H * .2));
    edges.forEach(({ a, b, emergent }) => {
      let dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy) || 1;
      const f = (d - rest * (emergent ? 1.15 : 1)) * (emergent ? .012 : .02) * k; dx /= d; dy /= d;
      a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
    });
    sats.forEach(s => {
      const p = s.parent; let dx = p.x - s.x, dy = p.y - s.y; const d = Math.hypot(dx, dy) || 1;
      const f = (d - 52) * .06; s.vx += dx / d * f; s.vy += dy / d * f;
    });
    list.forEach(n => {
      n.vx += (W / 2 - n.x) * .0010 * k; n.vy += (H / 2 - n.y) * (narrow ? .0009 : .0024) * k;
      if (n.fixed) { n.vx = n.vy = 0; return; }
      n.vx *= .82; n.vy *= .82; n.x += n.vx; n.y += n.vy;
      const m = 28; n.x = Math.max(m, Math.min(W - m, n.x)); n.y = Math.max(m, Math.min(H - m, n.y));
    });
    heat = Math.max(.08, heat * .995);
  };

  /* ---------- unfold the work attached to an idea ---------- */
  const expand = n => {
    sats = []; expanded = n;
    if (!n || n.kind || !n.items.length) return;
    const list = [...n.items].sort((a, b) => (b.date || 0) - (a.date || 0));
    const show = list.slice(0, 7);
    show.forEach((it, i) => {
      const a = (i / Math.max(show.length, 1)) * Math.PI * 2 + hashf(n.id) * 6;
      sats.push({ kind: it.kind, item: it, parent: n, label: clip(it.kind === "quote" ? "“" + it.quote + "”" : it.title, 30),
        x: n.x + Math.cos(a) * 40, y: n.y + Math.sin(a) * 40, vx: 0, vy: 0, fixed: false });
    });
    if (list.length > show.length) {
      const href = { paper: "#publications", musing: "musings.html", art: "artworks.html", quote: "quotes.html" }[list[7].kind];
      sats.push({ kind: "more", item: { kind: "more", title: (list.length - 7) + " more", href }, parent: n, label: "+" + (list.length - 7) + " more", x: n.x, y: n.y + 40, vx: 0, vy: 0 });
    }
    heat = Math.max(heat, .5);
  };

  /* ---------- photons along links ---------- */
  let photons = [], ambient = 0;
  const emitFrom = (n, count = 1) => edges.forEach(e => {
    if (e.a === n || e.b === n) for (let i = 0; i < count; i++) photons.push({ e, from: n, t: -i * .35, speed: .012 + Math.random() * .006 });
  });

  /* ---------- the note card ---------- */
  const GROUP = { core: "PhD topic", now: "Now", past: "Before UNIST", life: "Off duty", emergent: "New thread", you: "Your idea" };
  function showCard(n, extra) {
    if (!n) { card.classList.remove("show"); return; }
    let html;
    if (n.kind) {
      const it = n.item;
      html = '<span class="k">' + (it.kind === "more" ? "More" : KIND_NAME[it.kind]) + "</span><b>" + esc(it.kind === "quote" ? "“" + it.quote + "”" : it.title) + "</b>" +
        (it.kind === "quote" ? esc(it.title) + " " : "") + (it.ideas && it.ideas.length > 1 ? "Also connects to " + it.ideas.filter(x => x !== n.parent).map(x => "<em>" + esc(x.label) + "</em>").join(", ") + ". " : "") +
        '<a href="' + esc(it.href) + '" data-go>Open →</a>';
    } else {
      const counts = {}; n.items.forEach(it => counts[it.kind] = (counts[it.kind] || 0) + 1);
      const parts = Object.entries(counts).map(([k, v]) => v + " " + KIND_NAME[k] + (v > 1 ? "s" : ""));
      html = '<span class="k">' + (GROUP[n.g] || "") + (current.has(n) ? " · current focus" : "") + "</span><b>" + esc(n.label) + "</b>" + (extra || esc(n.note || "")) +
        (parts.length ? '<span class="cnt">' + parts.join(" · ") + (sats.length ? ", shown around it" : "") + "</span>" : "") +
        (n.href ? ' <a href="' + esc(n.href) + '" data-go>Go there →</a>' : "");
    }
    card.innerHTML = html; card.classList.add("show");
  }
  card.addEventListener("click", e => {
    const a = e.target.closest("a[data-go]"); if (!a) return;
    const h = a.getAttribute("href");
    if (h.startsWith("#")) { const t = document.querySelector(h); if (t && t.classList.contains("hidden")) document.querySelector('.toggle button[data-f="all"]')?.click(); }
  });

  /* ---------- pointer interaction ---------- */
  let hover = null, active = null, drag = null, downAt = null;
  const pick = (x, y) => {
    let best = null, bd = 18;
    all().forEach(n => { const d = Math.hypot(n.x - x, n.y - y); if (d < Math.max(bd, radius(n) + 6)) { bd = d; best = n; } });
    return best;
  };
  const pos = ev => { const r = canvas.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; };
  const neighbours = n => new Set(n.kind ? [n.parent] : edges.flatMap(e => e.a === n ? [e.b] : e.b === n ? [e.a] : []).concat(n === expanded ? sats : []));

  canvas.addEventListener("pointerdown", ev => {
    const [x, y] = pos(ev), n = pick(x, y); downAt = [x, y];
    if (n) { drag = n; n.fixed = true; canvas.setPointerCapture(ev.pointerId); canvas.classList.add("dragging"); heat = Math.max(heat, .5); }
  });
  canvas.addEventListener("pointermove", ev => {
    const [x, y] = pos(ev);
    if (drag) { drag.x = x; drag.y = y; heat = Math.max(heat, .4); return; }
    const n = pick(x, y);
    if (n !== hover) { hover = n; canvas.style.cursor = n ? "pointer" : "grab"; if (n && !n.kind && !reduce) emitFrom(n); }
  });
  canvas.addEventListener("pointerup", ev => {
    const [x, y] = pos(ev), moved = downAt && Math.hypot(x - downAt[0], y - downAt[1]) > 4;
    if (drag) { drag.fixed = false; canvas.classList.remove("dragging"); }
    if (!moved) {
      const n = pick(x, y);
      if (!n) { active = null; expand(null); showCard(null); }
      else if (n.kind) { active = n; showCard(n); }
      else { active = n; expand(n); showCard(n); emitFrom(n, 3); }
      if (hint) hint.style.opacity = 0;
    }
    drag = null; downAt = null;
  });
  canvas.addEventListener("pointerleave", () => { hover = null; });

  /* ---------- visitors' thoughts (remembered on their own device) ---------- */
  const STORE = "mm-thoughts";
  let thoughts = [];
  try { thoughts = JSON.parse(localStorage.getItem(STORE) || "[]").slice(-6); } catch (e) {}
  const addThought = (raw, announce) => {
    const words = tokens(raw);
    let best = null, score = 0;
    nodes.forEach(n => {
      if (n.kind || n.user) return;
      let s = 0;
      words.forEach(w => n.kwset.forEach(k => { if (k === w) s += 3; else if (w.length > 3 && k.length > 3 && (k.startsWith(w) || w.startsWith(k))) s += 1; }));
      if (s > score) { score = s; best = n; }
    });
    const guess = !best; if (!best) best = byId.light;
    const n = makeIdea({ id: "u-" + raw, label: raw, g: "you", note: "", kw: raw }, { user: true, x: best.x + (Math.random() - .5) * 40, y: best.y + (Math.random() - .5) * 40 });
    nodes.push(n); addEdge(n, best).emergent = true;
    if (announce) {
      heat = .8; active = n; emitFrom(n, 4);
      showCard(n, guess ? "No direct match, so it orbits <em>Light</em>, which connects to everything here. "
        : "Linked to <em>" + esc(best.label) + "</em>. " + esc(best.note || "") + " ");
    }
  };
  form.addEventListener("submit", ev => {
    ev.preventDefault();
    const raw = input.value.trim().slice(0, 28); if (!raw) return;
    const old = nodes.filter(n => n.user);
    if (old.length >= 6) { const o = old[0]; nodes = nodes.filter(n => n !== o); edges = edges.filter(e => e.a !== o && e.b !== o); }
    addThought(raw, true);
    thoughts = nodes.filter(n => n.user).map(n => n.label);
    try { localStorage.setItem(STORE, JSON.stringify(thoughts)); } catch (e) {}
    input.value = ""; if (hint) hint.style.opacity = 0;
  });
  shake.addEventListener("click", () => { nodes.forEach(n => { n.x = W / 2 + (Math.random() - .5) * W * .6; n.y = H / 2 + (Math.random() - .5) * H * .6; }); heat = 1; expand(null); active = null; showCard(null); });

  /* ---------- drawing ---------- */
  let tclock = 0;
  const shape = (n, r) => {
    ctx.beginPath();
    if (n.kind === "paper") ctx.rect(n.x - r, n.y - r, r * 2, r * 2);
    else if (n.kind === "musing") { ctx.moveTo(n.x, n.y - r * 1.3); ctx.lineTo(n.x + r * 1.3, n.y); ctx.lineTo(n.x, n.y + r * 1.3); ctx.lineTo(n.x - r * 1.3, n.y); ctx.closePath(); }
    else if (n.kind === "art") { ctx.moveTo(n.x, n.y - r * 1.4); ctx.lineTo(n.x + r * 1.3, n.y + r); ctx.lineTo(n.x - r * 1.3, n.y + r); ctx.closePath(); }
    else ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
  };
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const focus = drag || hover || active, near = focus ? neighbours(focus) : null;
    tclock += .03;

    edges.forEach(e => {
      const lit = focus && (e.a === focus || e.b === focus);
      ctx.strokeStyle = lit ? C.plum : C.hair;
      ctx.globalAlpha = focus && !lit ? .45 : 1;
      ctx.lineWidth = lit ? 1.6 : Math.min(2.2, .8 + (e.emergent ? (e.w - 1) * .4 : .2));
      ctx.setLineDash(e.emergent || e.a.user || e.b.user ? [3, 4] : []);
      ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
    });
    ctx.setLineDash([]);
    sats.forEach(s => { ctx.globalAlpha = .7; ctx.strokeStyle = C.k[s.kind]; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(s.parent.x, s.parent.y); ctx.lineTo(s.x, s.y); ctx.stroke(); });
    ctx.globalAlpha = 1;

    photons.forEach(p => {
      if (p.t < 0) return;
      const { a, b } = p.e, from = p.from === a ? a : b, to = from === a ? b : a;
      const x = from.x + (to.x - from.x) * p.t, y = from.y + (to.y - from.y) * p.t;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 7); g.addColorStop(0, C.rub); g.addColorStop(1, "transparent");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill();
    });

    ctx.textBaseline = "middle";
    const narrow = W < 520;
    all().forEach(n => {
      const r = radius(n), dim = focus && n !== focus && !near.has(n) && !(n.kind && n.parent === focus);
      ctx.globalAlpha = dim ? .3 : 1;
      if (!n.kind && current.has(n)) {
        const pr = r + 6 + (reduce ? 0 : Math.sin(tclock + hashf(n.id) * 6) * 1.6);
        ctx.strokeStyle = C.rub; ctx.globalAlpha = (dim ? .15 : .5); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(n.x, n.y, pr, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = dim ? .3 : 1;
      }
      ctx.fillStyle = n.kind ? C.k[n.kind] : C.g[n.g];
      shape(n, r); ctx.fill();
      if (n === focus && !n.kind) { ctx.strokeStyle = C.g[n.g]; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(n.x, n.y, r + 3, 0, Math.PI * 2); ctx.stroke(); }

      const big = n.g === "core" || n === focus;
      if (narrow && !big && !(near && near.has(n)) && !n.user && !n.kind && n.weight < 2) return;
      const fs = n.kind ? (narrow ? 10.5 : 12) : narrow ? (big ? 13 : 11.5) : (big ? 15 : 13);
      ctx.font = (n.kind ? "italic 400 " : (big ? "500 " : "400 ")) + fs + "px Newsreader, Georgia, serif";
      ctx.fillStyle = n.g === "core" ? C.ink : C.ink2;
      const tx = n.x + r + 6, w = ctx.measureText(n.label).width, left = tx + w > W - 6;
      ctx.textAlign = left ? "right" : "left";
      ctx.fillText(n.label, left ? n.x - r - 6 : tx, n.y);
    });
    ctx.globalAlpha = 1; ctx.textAlign = "left";
  };

  const tick = () => {
    step();
    photons.forEach(p => p.t += p.speed);
    photons = photons.filter(p => p.t < 1);
    if (!reduce && ++ambient % 90 === 0 && photons.length < 6 && edges.length) {
      // ambient light favours the ideas you're focused on right now
      const pool = edges.filter(e => current.has(e.a) || current.has(e.b));
      const src = pool.length && Math.random() < .7 ? pool : edges;
      const e = src[Math.floor(Math.random() * src.length)];
      photons.push({ e, from: current.has(e.a) ? e.a : e.b, t: 0, speed: .008 });
    }
    draw();
    if (visible) requestAnimationFrame(tick); else running = false;
  };

  /* ---------- start ---------- */
  let visible = false, running = false;
  const start = () => { if (!running) { running = true; requestAnimationFrame(tick); } };
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) start(); }).observe(canvas);
  new ResizeObserver(() => {
    const ow = W, oh = H; resize();
    if (ow) all().forEach(n => { n.x *= W / ow; n.y *= H / oh; }); else nodes.forEach(place);
    draw();
  }).observe(wrap);

  canvas.mindmap = { get nodes() { return nodes; }, get sats() { return sats; }, get current() { return current; } };
  readColors(); resize();
  const here = harvestHere(), focus = focusText();
  build(here, focus);
  nodes.forEach(place);
  thoughts.forEach(t => addThought(t, false));
  harvestPages().then(more => {
    if (!more.length) return;
    const saved = nodes.filter(n => n.user).map(n => n.label);
    build(here.concat(more), focus);
    saved.forEach(t => addThought(t, false));
  });
  if (reduce) for (let i = 0; i < 400; i++) step();
})();
