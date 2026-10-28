/* Shared behaviour for every page: theme toggle, scroll reveal, footer year,
   and the Fresnel zone plate drawn in the background. */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Fresnel zone plate: ring radii grow as sqrt(n), like a real flat lens. */
  document.querySelectorAll(".bg.zone").forEach(el => {
    const ns = "http://www.w3.org/2000/svg", R = 380, k = 52;
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 " + 2 * R + " " + 2 * R);
    svg.setAttribute("aria-hidden", "true");
    for (let n = 1; k * Math.sqrt(n) < R; n++) {
      const c = document.createElementNS(ns, "circle");
      c.setAttribute("cx", R); c.setAttribute("cy", R);
      c.setAttribute("r", (k * Math.sqrt(n)).toFixed(1));
      c.setAttribute("fill", "none");
      c.setAttribute("stroke", "currentColor");
      c.setAttribute("stroke-width", n % 2 ? "1" : "0.5");
      svg.appendChild(c);
    }
    el.appendChild(svg);
  });

  /* Reveal on scroll */
  const rv = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: .06 });
    rv.forEach(el => io.observe(el));
  } else rv.forEach(el => el.classList.add("in"));

  /* Theme toggle (remembers choice) */
  const root = document.documentElement, tb = document.getElementById("theme");
  try { const t = localStorage.getItem("theme"); if (t) root.dataset.theme = t; } catch (e) {}
  const isDark = () => root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const label = () => { if (tb) tb.textContent = isDark() ? "[light]" : "[dark]"; };
  label();
  if (tb) tb.addEventListener("click", () => {
    root.dataset.theme = isDark() ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
    label();
    document.dispatchEvent(new Event("themechange"));
  });

  const yr = document.getElementById("yr");
  if (yr) yr.textContent = new Date().getFullYear();
})();
