import React, { useEffect, useRef, useState, useCallback } from "react";
import "./style.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";
import { meta } from "../../content_option";

// ── Canvas / world dimensions ────────────────────────────────────────────────
const CW = 540;
const CH = 320;
const GROUND_Y = 270;
const RUNWAY_X = 2600;   // world x — plane flies right to reach it
const RUNWAY_W = 162;
const CAMERA_LEAD = 160; // plane's screen x while in flight

// ── Physics constants ────────────────────────────────────────────────────────
const GRAVITY = 0.065;
const MAX_THRUST = 0.26;
const LIFT_COEF = 0.015;   // upward force per unit of forward speed
const DRAG = 0.958;
const PITCH_RATE = 2.5;    // degrees per frame while key held
const THR_RATE = 1.1;      // throttle % per frame

// ── Landing thresholds ───────────────────────────────────────────────────────
const SAFE_VY = 1.85;
const SAFE_ANGLE = 22;

// ── Explosion ────────────────────────────────────────────────────────────────
const EXPLOSION_FRAMES = 110;

const createExplosion = (x, y) => {
  const particles = [];
  // 45 sparks: fast, orange/yellow, short-lived
  for (let i = 0; i < 45; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 7;
    particles.push({
      type: "spark", x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      life: 25 + Math.floor(Math.random() * 35), maxLife: 60,
      size: 1.5 + Math.random() * 3,
      color: Math.random() > 0.4 ? "255,200,50" : "255,100,20",
    });
  }
  // 14 debris: heavier, tumbles, gravity-affected
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.5;
    const speed = 1.5 + Math.random() * 4.5;
    particles.push({
      type: "debris", x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2.5,
      life: 55 + Math.floor(Math.random() * 45), maxLife: 100,
      size: 4 + Math.random() * 7,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.2,
      color: i % 3 === 0 ? "180,170,160" : i % 3 === 1 ? "70,55,40" : "100,90,80",
    });
  }
  // 18 smoke: large, dark, rising slowly
  for (let i = 0; i < 18; i++) {
    particles.push({
      type: "smoke",
      x: x + (Math.random() - 0.5) * 25,
      y: y + (Math.random() - 0.5) * 12,
      vx: (Math.random() - 0.5) * 1.2,
      vy: -(0.3 + Math.random() * 1.2),
      life: 70 + Math.floor(Math.random() * 50), maxLife: 120,
      size: 10 + Math.random() * 22,
      color: Math.random() > 0.5 ? "50,50,50" : "35,35,35",
    });
  }
  return { x, y, frame: 0, particles };
};

// ── Decorative clouds (world x coords) ───────────────────────────────────────
const CLOUDS = [
  { x:  180, y: 52, rx: 28, ry: 10 },
  { x:  480, y: 38, rx: 35, ry: 13 },
  { x:  820, y: 55, rx: 22, ry:  8 },
  { x: 1150, y: 35, rx: 30, ry: 11 },
  { x: 1480, y: 50, rx: 26, ry:  9 },
  { x: 1780, y: 40, rx: 20, ry:  7 },
  { x: 2100, y: 58, rx: 32, ry: 12 },
  { x: 2420, y: 44, rx: 24, ry:  8 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

// ── Component ────────────────────────────────────────────────────────────────
export const AirplaneLanding = () => {
  const canvasRef = useRef(null);
  const gameStateRef = useRef("idle");
  const keysRef = useRef({});
  const planeRef = useRef(null);
  const windRef = useRef(0);
  const frameRef = useRef(0);
  const explosionRef = useRef(null);
  const pendingResultRef = useRef(null);

  const [uiState, setUiState] = useState("idle");
  const [result, setResult] = useState({ success: false, score: 0, msg: "" });

  const makePlane = () => ({ x: -100, y: 90, vx: 2.8, vy: 0.05, angle: 3, throttle: 65 });

  const startFlight = useCallback(() => {
    planeRef.current = makePlane();
    explosionRef.current = null;
    pendingResultRef.current = null;
    windRef.current = (Math.random() - 0.5) * 0.032;
    frameRef.current = 0;
    gameStateRef.current = "flying";
    setUiState("flying");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let rafId;

    // DPR-aware sizing
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(CW * dpr);
    canvas.height = Math.round(CH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // seed initial plane for idle display
    if (!planeRef.current) planeRef.current = makePlane();

    // ── Draw helpers ─────────────────────────────────────────────────────────
    const drawSky = () => {
      const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      g.addColorStop(0, "#08121e");
      g.addColorStop(0.65, "#0c2240");
      g.addColorStop(1, "#163660");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, CW, GROUND_Y);
    };

    const drawStars = () => {
      // A few fixed "stars" for depth
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      [[30,18],[80,8],[150,30],[280,12],[420,22],[510,14],[55,44],[320,38]].forEach(([x,y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 0.8, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawClouds = (camX) => {
      ctx.fillStyle = "rgba(180,210,255,0.09)";
      for (const c of CLOUDS) {
        const sx = c.x - camX;
        if (sx < -100 || sx > CW + 100) continue;
        ctx.beginPath();
        ctx.ellipse(sx,              c.y,             c.rx,       c.ry,       0, 0, Math.PI * 2);
        ctx.ellipse(sx + c.rx * 0.5, c.y - c.ry*0.4, c.rx*0.6,   c.ry*0.7,  0, 0, Math.PI * 2);
        ctx.ellipse(sx - c.rx * 0.4, c.y - c.ry*0.3, c.rx*0.5,   c.ry*0.6,  0, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawGround = (camX) => {
      // Grass (always full canvas width)
      const g = ctx.createLinearGradient(0, GROUND_Y, 0, CH);
      g.addColorStop(0, "#1a3a1a");
      g.addColorStop(1, "#0c1e0c");
      ctx.fillStyle = g;
      ctx.fillRect(0, GROUND_Y, CW, CH - GROUND_Y);

      const rsx = RUNWAY_X - camX; // runway start in screen coords
      if (rsx > CW + 20 || rsx + RUNWAY_W < -20) return; // off-screen

      // Runway base
      ctx.fillStyle = "#252525";
      ctx.fillRect(rsx, GROUND_Y - 7, RUNWAY_W, 11);

      // Runway shoulder lines
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rsx,            GROUND_Y - 7);
      ctx.lineTo(rsx,            GROUND_Y + 4);
      ctx.moveTo(rsx + RUNWAY_W, GROUND_Y - 7);
      ctx.lineTo(rsx + RUNWAY_W, GROUND_Y + 4);
      ctx.stroke();

      // Centerline dashes
      ctx.fillStyle = "#ffffff";
      for (let mx = rsx + 16; mx < rsx + RUNWAY_W - 8; mx += 22) {
        ctx.fillRect(mx, GROUND_Y - 1.5, 14, 3);
      }

      // Edge lights
      for (let i = 0; i * 20 <= RUNWAY_W; i++) {
        const lx = rsx + i * 20;
        ctx.fillStyle = i === 0 || i * 20 >= RUNWAY_W - 5 ? "#ff4444" : "#ffee55";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(lx, GROUND_Y - 7, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    const drawPAPI = (plane, camX) => {
      // 4 PAPI approach lights left of runway threshold
      const px = RUNWAY_X - 18 - camX;
      const py = GROUND_Y - 8;
      if (px < -30 || px > CW + 10) return; // off-screen
      // actual glidepath angle from plane to runway
      const dx = RUNWAY_X - plane.x;
      const dy = plane.y - GROUND_Y; // positive = above ground
      const actualAngle = dx > 5 ? Math.atan2(dy, dx) * 180 / Math.PI : 0;
      const IDEAL = 22; // expected approach angle (degrees above runway level)
      const diff = actualAngle - IDEAL;

      for (let i = 0; i < 4; i++) {
        const threshold = -4 + i * 2.5;
        const isWhite = diff > threshold;
        ctx.fillStyle = isWhite ? "#ffffff" : "#ff2222";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(px - i * 8, py, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    const drawPlane = (plane, camX) => {
      ctx.save();
      ctx.translate(plane.x - camX, plane.y);
      ctx.rotate(-plane.angle * Math.PI / 180); // positive angle = nose up

      // Engine exhaust flame
      if (plane.throttle > 6) {
        const fl = (plane.throttle / 100) * 20 + 3;
        const eg = ctx.createLinearGradient(-22, 0, -22 - fl, 0);
        eg.addColorStop(0, `rgba(255,155,30,${(plane.throttle / 160).toFixed(2)})`);
        eg.addColorStop(0.5, `rgba(255,80,10,${(plane.throttle / 320).toFixed(2)})`);
        eg.addColorStop(1, "transparent");
        ctx.fillStyle = eg;
        ctx.beginPath();
        ctx.ellipse(-22 - fl * 0.45, 0, fl * 0.55, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Fuselage
      ctx.fillStyle = "#c2cedf";
      ctx.beginPath();
      ctx.moveTo(25, 0);
      ctx.bezierCurveTo(20, -5, 8, -6, -10, -5);
      ctx.lineTo(-22, -3);
      ctx.lineTo(-25, 0);
      ctx.lineTo(-22, 3);
      ctx.lineTo(-10, 5);
      ctx.bezierCurveTo(8, 5, 20, 4, 25, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#7a8ea8";
      ctx.lineWidth = 0.6;
      ctx.stroke();

      // Cockpit glass
      ctx.fillStyle = "rgba(80, 185, 255, 0.88)";
      ctx.beginPath();
      ctx.moveTo(21, -2);
      ctx.lineTo(14, -8);
      ctx.lineTo(6,  -8);
      ctx.lineTo(4,  -4);
      ctx.lineTo(21, -3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(120,200,255,0.5)";
      ctx.lineWidth = 0.4;
      ctx.stroke();

      // Main wing (swept-back, visible as planform chord in side view)
      ctx.fillStyle = "#96a8be";
      ctx.beginPath();
      ctx.moveTo(3,  3);
      ctx.lineTo(-8, 3);
      ctx.lineTo(-17, 19);
      ctx.lineTo(-4, 19);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#647890";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Vertical tail fin
      ctx.fillStyle = "#a8b8cc";
      ctx.beginPath();
      ctx.moveTo(-14, -5);
      ctx.lineTo(-23, -5);
      ctx.lineTo(-23, -17);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#647890";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Horizontal stabilizer
      ctx.fillStyle = "#a8b8cc";
      ctx.beginPath();
      ctx.moveTo(-16, 3);
      ctx.lineTo(-25, 3);
      ctx.lineTo(-25, 10);
      ctx.lineTo(-17, 8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#647890";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.restore();
    };

    const drawHUD = (plane) => {
      const spd = Math.sqrt(plane.vx * plane.vx + plane.vy * plane.vy).toFixed(1);
      const alt = Math.max(0, Math.round(GROUND_Y - plane.y));
      const descending = plane.vy > 0;
      const vsColor = plane.vy > SAFE_VY * 0.8 ? "#ff7755" : "#6fd49a";
      const hdgColor = Math.abs(plane.angle) > SAFE_ANGLE * 0.8 ? "#ff7755" : "#6fd49a";
      const windKts = (windRef.current * 100).toFixed(1);
      const dist = Math.max(0, Math.round(RUNWAY_X - plane.x));
      const distColor = dist < 400 ? "#ffd070" : "#8ab8d4";

      // HUD box
      ctx.fillStyle = "rgba(0,5,15,0.52)";
      roundRect(ctx, 8, 8, 142, 122, 7);
      ctx.fill();
      ctx.strokeStyle = "rgba(100,180,255,0.15)";
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.font = "bold 11px 'Courier New', monospace";
      ctx.textAlign = "left";
      const rows = [
        { label: "SPD",  val: `${spd} kn`,                                          color: "#6fd49a" },
        { label: "V/S",  val: `${descending?"↓":"↑"}${Math.abs(plane.vy).toFixed(2)}`, color: vsColor },
        { label: "ALT",  val: `${alt} ft`,                                           color: "#6fd49a" },
        { label: "HDG",  val: `${plane.angle.toFixed(0)}°`,                          color: hdgColor },
        { label: "THR",  val: `${plane.throttle.toFixed(0)}%`,                       color: "#6fd49a" },
        { label: "WND",  val: windKts,                                               color: "#8ab8d4" },
        { label: "DIST", val: `${dist}`,                                             color: distColor },
      ];
      rows.forEach(({ label, val, color }, i) => {
        ctx.fillStyle = "rgba(120,160,200,0.6)";
        ctx.fillText(label, 18, 26 + i * 16);
        ctx.fillStyle = color;
        ctx.fillText(val, 60, 26 + i * 16);
      });

      // Throttle bar (right edge)
      ctx.fillStyle = "rgba(0,5,15,0.50)";
      ctx.fillRect(CW - 28, 8, 20, 112);
      const barH = (plane.throttle / 100) * 108;
      const barColor = plane.throttle > 80 ? "#ff8822" : plane.throttle > 40 ? "#44cc66" : "#cc4444";
      ctx.fillStyle = barColor;
      ctx.fillRect(CW - 26, 8 + (108 - barH), 16, barH);
      ctx.fillStyle = "#888";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("T", CW - 18, 128);
    };

    const drawScene = (plane, camX) => {
      drawSky();
      drawStars();
      drawClouds(camX);
      drawGround(camX);
      drawPAPI(plane, camX);
      drawPlane(plane, camX);
    };

    const drawExplosion = (exp, camX) => {
      const sx = exp.x - camX;
      const sy = exp.y;
      const t = exp.frame;

      // Full-screen flash (frames 0-12)
      if (t < 12) {
        const a = Math.pow(1 - t / 12, 1.5) * 0.85;
        ctx.fillStyle = `rgba(255,210,80,${a.toFixed(3)})`;
        ctx.fillRect(0, 0, CW, CH);
      }

      // Shockwave ring (frames 0-22)
      if (t < 22) {
        const r = t * 9 + 4;
        const a = 1 - t / 22;
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,160,30,${(a * 0.9).toFixed(3)})`;
        ctx.lineWidth = Math.max(0.5, 5 - t * 0.2);
        ctx.stroke();
      }

      // Second delayed ring (frames 8-28)
      if (t > 8 && t < 28) {
        const r = (t - 8) * 7 + 2;
        const a = 1 - (t - 8) / 20;
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,100,20,${(a * 0.6).toFixed(3)})`;
        ctx.lineWidth = Math.max(0.5, 3 - (t - 8) * 0.15);
        ctx.stroke();
      }

      // Core fireball (frames 0-30)
      if (t < 30) {
        const r = Math.max(0, 18 - t * 0.5);
        const a = 1 - t / 30;
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 2);
        grad.addColorStop(0, `rgba(255,255,200,${a.toFixed(3)})`);
        grad.addColorStop(0.4, `rgba(255,160,30,${(a * 0.8).toFixed(3)})`);
        grad.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.arc(sx, sy, r * 2, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Particles
      for (const p of exp.particles) {
        if (p.life <= 0) continue;
        const alpha = p.life / p.maxLife;
        const psx = p.x - camX;
        if (p.type === "spark") {
          ctx.beginPath();
          ctx.arc(psx, p.y, Math.max(0.3, p.size * alpha), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color},${alpha.toFixed(3)})`;
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(psx, p.y);
          ctx.lineTo(psx - p.vx * 2, p.y - p.vy * 2);
          ctx.strokeStyle = `rgba(${p.color},${(alpha * 0.4).toFixed(3)})`;
          ctx.lineWidth = p.size * 0.4;
          ctx.stroke();
        } else if (p.type === "debris") {
          ctx.save();
          ctx.translate(psx, p.y);
          ctx.rotate(p.rotation + exp.frame * p.spin);
          ctx.fillStyle = `rgba(${p.color},${(alpha * 0.95).toFixed(3)})`;
          ctx.fillRect(-p.size / 2, -p.size * 0.2, p.size, p.size * 0.4);
          ctx.restore();
        } else if (p.type === "smoke") {
          ctx.beginPath();
          ctx.arc(psx, p.y, p.size * (1.2 - alpha * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color},${(alpha * 0.28).toFixed(3)})`;
          ctx.fill();
        }
      }
    };

    // ── Main loop ─────────────────────────────────────────────────────────────
    const loop = () => {
      const state = gameStateRef.current;
      const plane = planeRef.current;

      if (state === "idle" || state === "result") {
        const camX = plane.x - CAMERA_LEAD;
        drawScene(plane, camX);
        rafId = requestAnimationFrame(loop);
        return;
      }

      if (state === "exploding") {
        const exp = explosionRef.current;
        exp.frame++;
        for (const p of exp.particles) {
          if (p.life <= 0) continue;
          p.x += p.vx; p.y += p.vy;
          p.vy += 0.13; p.vx *= 0.97; p.vy *= 0.97;
          p.life--;
        }
        const camX = exp.x - CAMERA_LEAD;
        drawScene(planeRef.current, camX);
        drawExplosion(exp, camX);
        if (exp.frame >= EXPLOSION_FRAMES) {
          setResult(pendingResultRef.current);
          gameStateRef.current = "result";
          setUiState("result");
        }
        rafId = requestAnimationFrame(loop);
        return;
      }

      if (state === "flying") {
        frameRef.current++;
        const keys = keysRef.current;

        // Controls
        if (keys["w"] || keys["arrowup"])    plane.throttle = Math.min(100, plane.throttle + THR_RATE);
        if (keys["s"] || keys["arrowdown"])  plane.throttle = Math.max(0,   plane.throttle - THR_RATE);
        if (keys["a"] || keys["arrowleft"])  plane.angle += PITCH_RATE;
        if (keys["d"] || keys["arrowright"]) plane.angle -= PITCH_RATE;
        plane.angle = Math.max(-75, Math.min(75, plane.angle));

        // Physics (angle > 0 = nose up)
        const rad = plane.angle * Math.PI / 180;
        const thrust = (plane.throttle / 100) * MAX_THRUST;
        const ax = thrust * Math.cos(rad) + windRef.current;
        const ay = GRAVITY - thrust * Math.sin(rad) - LIFT_COEF * Math.max(0, plane.vx);

        plane.vx = plane.vx * DRAG + ax;
        plane.vy = plane.vy * DRAG + ay;
        plane.x += plane.vx;
        plane.y += plane.vy;

        // ── Landing / crash check ─────────────────────────────────────────────
        if (plane.y >= GROUND_Y - 8) {
          plane.y = GROUND_Y - 8;
          const onRunway   = plane.x >= RUNWAY_X + 8 && plane.x <= RUNWAY_X + RUNWAY_W - 8;
          const safeVspeed = Math.abs(plane.vy) < SAFE_VY;
          const safeAngle  = Math.abs(plane.angle) < SAFE_ANGLE;
          const fwdMotion  = plane.vx > -0.3;

          if (onRunway && safeVspeed && safeAngle && fwdMotion) {
            const offset = Math.abs(plane.x - (RUNWAY_X + RUNWAY_W / 2));
            const sc = Math.max(0, Math.round(
              2000 - frameRef.current * 1.1 - Math.abs(plane.vy) * 160
                   - offset * 3.5 - Math.abs(plane.angle) * 7
            ));
            const msg = sc > 1600 ? "Perfect greaser!" : sc > 1000 ? "Nice landing!" : "A bit rough, but safe!";
            setResult({ success: true, score: sc, msg });
            gameStateRef.current = "result";
            setUiState("result");
          } else {
            let msg = "Missed the runway!";
            if (onRunway && !safeVspeed) msg = "Came in too fast!";
            else if (onRunway && !safeAngle) msg = "Too much nose tilt!";
            pendingResultRef.current = { success: false, score: 0, msg };
            explosionRef.current = createExplosion(plane.x, plane.y);
            gameStateRef.current = "exploding";
          }
        }

        // Out of bounds
        if (plane.x > RUNWAY_X + RUNWAY_W + 300 || plane.y < -160) {
          pendingResultRef.current = { success: false, score: 0, msg: "Out of bounds!" };
          explosionRef.current = createExplosion(plane.x, Math.max(plane.y, 10));
          gameStateRef.current = "exploding";
        }

        const camX = plane.x - CAMERA_LEAD;
        drawScene(plane, camX);
        drawHUD(plane);
        rafId = requestAnimationFrame(loop);
      }
    };

    rafId = requestAnimationFrame(loop);

    // ── Input ─────────────────────────────────────────────────────────────────
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k)) e.preventDefault();
      keysRef.current[k] = true;
    };
    const onKeyUp = (e) => { keysRef.current[e.key.toLowerCase()] = false; };

    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup",   onKeyUp);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup",   onKeyUp);
    };
  }, []);

  // Mobile button helpers
  const press   = useCallback((k) => { keysRef.current[k] = true;  }, []);
  const release  = useCallback((k) => { keysRef.current[k] = false; }, []);
  const btnProps = (k) => ({
    onMouseDown:  () => press(k),
    onMouseUp:    () => release(k),
    onMouseLeave: () => release(k),
    onTouchStart: (e) => { e.preventDefault(); press(k); },
    onTouchEnd:   (e) => { e.preventDefault(); release(k); },
  });

  return (
    <HelmetProvider>
      <Container className="About-header">
        <Helmet>
          <meta charSet="utf-8" />
          <title> Airplane Landing | {meta.title} </title>
          <meta name="description" content="2D airplane landing simulator — control throttle and pitch to touch down on the runway." />
        </Helmet>
        <Row className="mb-5 mt-3 pt-md-3">
          <Col lg="8">
            <h1 className="display-4 mb-4">Airplane Landing</h1>
            <hr className="t_border my-4 ml-0 text-left" />
          </Col>
        </Row>

        <Row className="justify-content-center mb-3">
          <Col xs="auto">
            <div className="airplane__wrapper">
              <canvas
                ref={canvasRef}
                width={CW}
                height={CH}
                className="game__canvas"
              />

              {/* Idle overlay */}
              {uiState === "idle" && (
                <div className="airplane__overlay">
                  <div className="airplane__panel">
                    <p className="airplane__title">✈ Airplane Landing</p>
                    <div className="airplane__key-grid">
                      <span><kbd>W</kbd><kbd>↑</kbd></span><span>Throttle up</span>
                      <span><kbd>S</kbd><kbd>↓</kbd></span><span>Throttle down</span>
                      <span><kbd>A</kbd><kbd>←</kbd></span><span>Pitch up</span>
                      <span><kbd>D</kbd><kbd>→</kbd></span><span>Pitch down</span>
                    </div>
                    <p className="airplane__sub">Land smoothly on the runway →</p>
                    <button className="airplane__btn-start" onClick={startFlight}>
                      Start Flight
                    </button>
                  </div>
                </div>
              )}

              {/* Result overlay */}
              {uiState === "result" && (
                <div className="airplane__overlay">
                  <div className="airplane__panel">
                    <p className={`airplane__title ${result.success ? "success" : "crash"}`}>
                      {result.success ? "✈ Landed!" : "💥 Crashed!"}
                    </p>
                    {result.success && (
                      <p className="airplane__score">{result.score} pts</p>
                    )}
                    <p className="airplane__sub">{result.msg}</p>
                    <button className="airplane__btn-start" onClick={startFlight}>
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Col>
        </Row>

        {/* Mobile on-screen controls */}
        <Row className="justify-content-center mb-5">
          <Col xs="auto">
            <div className="airplane__controls">
              <div className="airplane__ctrl-row">
                <button className="airplane__ctrl-btn" {...btnProps("w")}>▲ Throttle</button>
              </div>
              <div className="airplane__ctrl-row">
                <button className="airplane__ctrl-btn" {...btnProps("a")}>↺ Pitch Up</button>
                <button className="airplane__ctrl-btn" {...btnProps("s")}>▼ Throttle</button>
                <button className="airplane__ctrl-btn" {...btnProps("d")}>↻ Pitch Dn</button>
              </div>
            </div>
            <p className="game__hint">Keyboard or buttons above · Land on the lit runway</p>
          </Col>
        </Row>
      </Container>
    </HelmetProvider>
  );
};
