/** A short burst of confetti over the page, for badges. Skipped for reduced motion. */
export function confetti() {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:100";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.remove();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const colors = ["#7413dc", "#00a794", "#ffe627", "#ff912a", "#e22e12", "#088fdf", "#ffb4e5"];
  const pieces = Array.from({ length: 160 }, (_, i) => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 120,
    y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 13 - 4,
    size: 6 + Math.random() * 6,
    spin: Math.random() * Math.PI,
    vspin: (Math.random() - 0.5) * 0.3,
    color: colors[i % colors.length],
  }));

  const start = performance.now();
  function frame(t: number) {
    const elapsed = t - start;
    ctx!.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of pieces) {
      p.vy += 0.32;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.spin += p.vspin;
      ctx!.save();
      ctx!.globalAlpha = Math.max(0, 1 - elapsed / 3200);
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.spin);
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx!.restore();
    }
    if (elapsed < 3200) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}
