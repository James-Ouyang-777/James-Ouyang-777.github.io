import React, { useEffect, useRef, useState } from "react";

export const GeometricCanvas = () => {
  const canvasRef = useRef(null);
  const [themeVersion, setThemeVersion] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let rafId;

    const NODE_COUNT = 55;
    const CONNECT_DIST = 165;
    const TRI_DIST = 95;      // tighter threshold for triangle mesh fills
    const MOUSE_RADIUS = 130;
    const MOUSE_FORCE = 0.45;
    const MAX_SPEED = 1.4;
    const FRICTION = 0.992;
    const DRIFT = 0.028;      // random nudge per frame — keeps nodes in perpetual motion

    let W = 0;
    let H = 0;

    // Pre-allocate distance cache to avoid GC pressure each frame
    const distCache = new Float32Array(NODE_COUNT * NODE_COUNT);

    // Mouse position in logical (CSS) pixels
    const mouse = { x: -9999, y: -9999 };

    const getColors = () => {
      const isDark =
        document.documentElement.getAttribute("data-theme") !== "light";
      return {
        rgb: isDark ? "140, 200, 255" : "55, 90, 200",
        triAlpha: isDark ? 0.032 : 0.022,
        lineMaxAlpha: isDark ? 0.3 : 0.22,
        nodeAlphaBase: isDark ? 0.55 : 0.5,
      };
    };

    // DPR-aware resize — uses setTransform to avoid accumulating scales
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.55,
      vy: (Math.random() - 0.5) * 0.55,
      r: 1.4 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2, // for per-node pulse offset
    }));

    const animate = (t) => {
      ctx.clearRect(0, 0, W, H);
      const c = getColors();
      const time = t * 0.001;

      // ── Update physics ────────────────────────────────────────────────────
      for (const n of nodes) {
        // Mouse repulsion
        const dx = n.x - mouse.x;
        const dy = n.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < MOUSE_RADIUS * MOUSE_RADIUS && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const force = ((MOUSE_RADIUS - d) / MOUSE_RADIUS) * MOUSE_FORCE;
          n.vx += (dx / d) * force;
          n.vy += (dy / d) * force;
        }

        // Brownian drift — small random nudge keeps nodes in perpetual motion
        n.vx += (Math.random() - 0.5) * DRIFT;
        n.vy += (Math.random() - 0.5) * DRIFT;

        n.vx *= FRICTION;
        n.vy *= FRICTION;

        // Clamp speed
        const spd = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (spd > MAX_SPEED) {
          n.vx = (n.vx / spd) * MAX_SPEED;
          n.vy = (n.vy / spd) * MAX_SPEED;
        }

        n.x += n.vx;
        n.y += n.vy;

        // Soft bounce
        if (n.x < 0) { n.x = 0; n.vx = Math.abs(n.vx); }
        if (n.x > W) { n.x = W; n.vx = -Math.abs(n.vx); }
        if (n.y < 0) { n.y = 0; n.vy = Math.abs(n.vy); }
        if (n.y > H) { n.y = H; n.vy = -Math.abs(n.vy); }
      }

      // ── Compute + cache all pairwise distances ────────────────────────────
      const connections = []; // [i, j, dist]
      for (let i = 0; i < NODE_COUNT; i++) {
        for (let j = i + 1; j < NODE_COUNT; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          distCache[i * NODE_COUNT + j] = dist;
          distCache[j * NODE_COUNT + i] = dist;
          if (dist < CONNECT_DIST) connections.push(i, j, dist);
        }
      }

      // ── Triangle mesh fills (batched in one path) ─────────────────────────
      ctx.beginPath();
      for (let i = 0; i < NODE_COUNT; i++) {
        for (let j = i + 1; j < NODE_COUNT; j++) {
          if (distCache[i * NODE_COUNT + j] >= TRI_DIST) continue;
          for (let k = j + 1; k < NODE_COUNT; k++) {
            if (
              distCache[i * NODE_COUNT + k] < TRI_DIST &&
              distCache[j * NODE_COUNT + k] < TRI_DIST
            ) {
              ctx.moveTo(nodes[i].x, nodes[i].y);
              ctx.lineTo(nodes[j].x, nodes[j].y);
              ctx.lineTo(nodes[k].x, nodes[k].y);
              ctx.closePath();
            }
          }
        }
      }
      ctx.fillStyle = `rgba(${c.rgb},${c.triAlpha})`;
      ctx.fill();

      // ── Connection lines (alpha + width scale with proximity) ─────────────
      for (let idx = 0; idx < connections.length; idx += 3) {
        const i = connections[idx];
        const j = connections[idx + 1];
        const dist = connections[idx + 2];
        const t_ = 1 - dist / CONNECT_DIST;
        const alpha = t_ * c.lineMaxAlpha;
        const lw = 0.4 + t_ * 0.8;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${c.rgb},${alpha.toFixed(3)})`;
        ctx.lineWidth = lw;
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }

      // ── Nodes (pulsing size + alpha) ──────────────────────────────────────
      for (const n of nodes) {
        const pulse = Math.sin(time * 1.4 + n.phase);
        const radius = Math.max(0.5, n.r + pulse * 0.35);
        const alpha = c.nodeAlphaBase + pulse * 0.15;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${c.rgb},${alpha.toFixed(3)})`;
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    // ── Mouse tracking ────────────────────────────────────────────────────────
    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    // canvas has pointer-events:none so we listen on window
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

    // ── Theme observer ────────────────────────────────────────────────────────
    const observer = new MutationObserver(() => {
      setThemeVersion((v) => v + 1);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    // ── Resize handler ────────────────────────────────────────────────────────
    const handleResize = () => {
      resize();
      for (const n of nodes) {
        n.x = Math.min(n.x, W);
        n.y = Math.min(n.y, H);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, [themeVersion]);

  return <canvas ref={canvasRef} className="geometric-canvas" />;
};
