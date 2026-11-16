// Soft gradient glow drawn in ASCII glyphs that scramble under the pointer (after React Bits "Gradient ASCII",
// re-done in a 2D canvas: no WebGL, ~30 fps, paused off-screen). Decorative: the canvas is aria-hidden.
// ponytail: 2D canvas, one fillText per lit cell; WebGL glyph atlas if it ever shows up in a profile.
const CHARS = ' .·:-=+*x';
const PALETTE = [[234, 246, 255], [165, 216, 255], [56, 189, 248], [9, 107, 210], [30, 63, 216]];
const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
const ramp = (t) => { const x = Math.min(0.999, Math.max(0, t)) * (PALETTE.length - 1), i = Math.floor(x); return mix(PALETTE[i], PALETTE[i + 1], x - i); };

export function asciiBackground(canvas, { cell = 18, fps = 30 } = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w = 0, h = 0, cols = 0, rows = 0, dpr = 1, raf = 0, last = 0, time = 0, visible = true, intro = still ? 1 : 0;
  const trail = []; // pointer points {x, y, at}
  const resize = () => {
    dpr = Math.min(2, devicePixelRatio || 1); w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    cols = Math.ceil(w / (cell * 0.6)); rows = Math.ceil(h / cell);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.font = `500 ${Math.round(cell * 0.78)}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    draw();
  };
  // "horizon": a glow rising from the bottom, gently warped by two travelling waves.
  const field = (u, v) => {
    const warp = 0.06 * Math.sin(u * 5 + time * 0.7) + 0.04 * Math.sin(u * 11 - time * 0.45 + v * 3);
    const horizon = 1 - Math.abs(v - (0.78 + warp)) * 2.1;
    const orb = 0.55 * Math.exp(-(((u - 0.5 - 0.18 * Math.sin(time * 0.2)) * 1.6) ** 2 + ((v - 0.95) * 2.2) ** 2));
    return Math.max(0, Math.min(1, horizon * 0.85 + orb));
  };
  function draw() {
    ctx.clearRect(0, 0, w, h);
    const cw = cell * 0.6, now = performance.now();
    while (trail.length && now - trail[0].at > 700) trail.shift();
    for (let r = 0; r < rows; r++) {
      const v = (r + 0.5) / rows;
      for (let c = 0; c < cols; c++) {
        const u = (c + 0.5) / cols, x = c * cw + cw / 2, y = r * cell + cell / 2;
        // Intro (2.4 s): the glow rises from the bottom edge.
        let t = field(u, v) * Math.min(1, Math.max(0, (intro * 1.6 - (1 - v)) * 2.5));
        if (t < 0.12) continue;
        let scramble = 0;
        for (const p of trail) { const d = (x - p.x) ** 2 + (y - p.y) ** 2, life = 1 - (now - p.at) / 700; scramble = Math.max(scramble, life * Math.exp(-d / 5000)); }
        const hash = Math.sin(c * 12.9898 + r * 78.233) * 43758.5453 % 1;
        if (Math.abs(hash) > 0.78 - t * 0.25) continue; // sparse holes keep it airy
        let i = Math.round(t * (CHARS.length - 1));
        if (scramble > 0.2) i = 1 + Math.floor(Math.random() * (CHARS.length - 1));
        const [R, G, B] = ramp(t);
        ctx.fillStyle = `rgba(${R},${G},${B},${(0.1 + t * 0.38).toFixed(2)})`;
        ctx.fillText(CHARS[i], x, y);
      }
    }
  }
  const loop = (at) => {
    raf = requestAnimationFrame(loop);
    if (!visible || at - last < 1000 / fps) return;
    const dt = Math.min(0.05, (at - last) / 1000); time += dt; intro = Math.min(1, intro + dt / 2.4); last = at; draw();
  };
  const move = (e) => { const b = canvas.getBoundingClientRect(); trail.push({ x: e.clientX - b.left, y: e.clientY - b.top, at: performance.now() }); if (trail.length > 24) trail.shift(); };
  const ro = new ResizeObserver(resize); ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); io.observe(canvas);
  if (!still) { addEventListener('pointermove', move, { passive: true }); raf = requestAnimationFrame(loop); }
  return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); removeEventListener('pointermove', move); };
}
