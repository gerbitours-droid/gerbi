// "Back to top" as a slingshot (after React Bits "Sling Button"): tap = scroll up; pull it down and let go = it
// fires upward with a burst of dots. Native <button>, so Enter/Space work; reduced motion = plain scroll.
const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)', ARM = 48, MAX = 140;

export function slingTop(label) {
  const root = document.createElement('div');
  root.className = 'sling-top'; root.hidden = true;
  root.innerHTML = `<svg class="sling-fx" viewBox="-60 -60 120 120" aria-hidden="true"><circle class="sling-well" r="33"/><path class="sling-band"/></svg>
    <button type="button" class="sling-pad" aria-label="${label}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>`;
  document.body.append(root);
  const pad = root.querySelector('.sling-pad'), band = root.querySelector('.sling-band');
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const up = () => scrollTo({ top: 0, behavior: still() ? 'auto' : 'smooth' });
  let start = null, d = 0, moved = false;
  const paint = (x, y) => {
    pad.style.transform = `translate(${x}px, ${y}px)`;
    band.setAttribute('d', d > 2 ? `M0 0 L${x} ${y}` : '');
    root.toggleAttribute('data-armed', d >= ARM);
  };
  pad.addEventListener('pointerdown', (e) => { if (still()) return; start = { x: e.clientX, y: e.clientY }; moved = false; pad.setPointerCapture(e.pointerId); pad.style.transition = 'none'; });
  pad.addEventListener('pointermove', (e) => {
    if (!start) return;
    const dx = e.clientX - start.x, dy = Math.max(0, e.clientY - start.y), raw = Math.hypot(dx, dy);
    if (raw > 6) moved = true;
    d = (MAX * raw) / (MAX + raw); const k = raw ? d / raw : 0; // rubber band
    paint(dx * k, dy * k);
  });
  const release = () => {
    if (!start) return;
    const fired = moved && d >= ARM; start = null;
    pad.style.transition = `transform 420ms ${moved ? 'cubic-bezier(.34,1.56,.64,1)' : EASE}`; d = 0; paint(0, 0);
    if (fired) { burst(); up(); }
  };
  pad.addEventListener('pointerup', release); pad.addEventListener('pointercancel', release);
  pad.addEventListener('click', (e) => { if (moved) { e.preventDefault(); moved = false; return; } up(); });
  function burst() {
    for (let i = 0; i < 12; i++) {
      const dot = document.createElement('span'); dot.className = 'sling-dot'; root.append(dot);
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.2, r = 40 + Math.random() * 70;
      dot.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * r}px, ${Math.sin(a) * r}px) scale(.4)`, opacity: 0 }], { duration: 300 + Math.random() * 250, easing: EASE }).onfinish = () => dot.remove();
    }
  }
  const onScroll = () => { root.hidden = scrollY < 500; };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  return () => { removeEventListener('scroll', onScroll); root.remove(); };
}
