import React, { useEffect, useRef, useState } from "react";
import "./style.css";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Container, Row, Col } from "react-bootstrap";
import { meta } from "../../content_option";

const CANVAS_W = 360;
const CANVAS_H = 600;
const GRAVITY = 0.38;
const FLAP_STRENGTH = -7.2;
const PIPE_WIDTH = 54;
const PIPE_GAP = 148;
const PIPE_SPEED = 2.4;
const PIPE_INTERVAL = 88; // frames between pipe spawns
const BIRD_X = 80;
const BIRD_RADIUS = 13;

export const FlappyGame = () => {
  const canvasRef = useRef(null);
  const gameStateRef = useRef("idle"); // idle | playing | gameover
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Mutable game state (lives inside the RAF closure)
    const bird = { x: BIRD_X, y: CANVAS_H / 2, vy: 0 };
    let pipes = [];
    let score = 0;
    let frameCount = 0;
    let gameoverTime = 0;
    let rafId;

    const isDark = () =>
      document.documentElement.getAttribute("data-theme") !== "light";

    const getBg = () => (isDark() ? "#0c0c0c" : "#f5f5f5");
    const getFg = () => (isDark() ? "#ffffff" : "#111111");
    const getPipeColor = () => (isDark() ? "#1a3a2a" : "#2a5a3a");
    const getPipeBorder = () => (isDark() ? "#2ecc71" : "#27ae60");

    const resetGame = () => {
      bird.x = BIRD_X;
      bird.y = CANVAS_H / 2;
      bird.vy = 0;
      pipes = [];
      score = 0;
      frameCount = 0;
    };

    const spawnPipe = () => {
      const gapY = 100 + Math.random() * (CANVAS_H - 200 - PIPE_GAP);
      pipes.push({ x: CANVAS_W + 10, gapY, passed: false });
    };

    const drawRoundedRect = (x, y, w, h, r) => {
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

    const drawBird = () => {
      const fg = getFg();
      // Body
      ctx.beginPath();
      ctx.arc(bird.x, bird.y, BIRD_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = isDark() ? "#ffffff" : "#222222";
      ctx.fill();
      // Eye
      ctx.beginPath();
      ctx.arc(bird.x + 5, bird.y - 4, 3, 0, Math.PI * 2);
      ctx.fillStyle = isDark() ? "#0c0c0c" : "#f5f5f5";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bird.x + 6, bird.y - 4, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = "#333";
      ctx.fill();
      // Beak
      ctx.beginPath();
      ctx.moveTo(bird.x + BIRD_RADIUS - 2, bird.y);
      ctx.lineTo(bird.x + BIRD_RADIUS + 6, bird.y - 2);
      ctx.lineTo(bird.x + BIRD_RADIUS + 6, bird.y + 2);
      ctx.closePath();
      ctx.fillStyle = "#f39c12";
      ctx.fill();
      void fg; // suppress unused warning
    };

    const drawPipes = () => {
      for (const pipe of pipes) {
        const pipeColor = getPipeColor();
        const pipeBorder = getPipeBorder();

        // Top pipe
        ctx.fillStyle = pipeColor;
        drawRoundedRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY - 6, 4);
        ctx.fill();
        ctx.strokeStyle = pipeBorder;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Top pipe cap
        ctx.fillStyle = pipeColor;
        drawRoundedRect(pipe.x - 4, pipe.gapY - 20, PIPE_WIDTH + 8, 20, 4);
        ctx.fill();
        ctx.strokeStyle = pipeBorder;
        ctx.stroke();

        // Bottom pipe
        const botY = pipe.gapY + PIPE_GAP;
        ctx.fillStyle = pipeColor;
        drawRoundedRect(pipe.x, botY + 6, PIPE_WIDTH, CANVAS_H - botY - 6, 4);
        ctx.fill();
        ctx.strokeStyle = pipeBorder;
        ctx.stroke();
        // Bottom pipe cap
        ctx.fillStyle = pipeColor;
        drawRoundedRect(pipe.x - 4, botY, PIPE_WIDTH + 8, 20, 4);
        ctx.fill();
        ctx.strokeStyle = pipeBorder;
        ctx.stroke();
      }
    };

    const drawScore = () => {
      ctx.fillStyle = getFg();
      ctx.font = "bold 28px Raleway, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(score, CANVAS_W / 2, 48);
    };

    const drawGround = () => {
      ctx.fillStyle = isDark() ? "#1a1a1a" : "#d4d4d4";
      ctx.fillRect(0, CANVAS_H - 4, CANVAS_W, 4);
    };

    const checkCollision = () => {
      // Ground / ceiling
      if (bird.y + BIRD_RADIUS >= CANVAS_H - 4 || bird.y - BIRD_RADIUS <= 0)
        return true;
      // Pipes
      for (const pipe of pipes) {
        const birdLeft = bird.x - BIRD_RADIUS + 3;
        const birdRight = bird.x + BIRD_RADIUS - 3;
        const birdTop = bird.y - BIRD_RADIUS + 3;
        const birdBottom = bird.y + BIRD_RADIUS - 3;
        const inPipeX = birdRight > pipe.x && birdLeft < pipe.x + PIPE_WIDTH;
        if (inPipeX) {
          if (birdTop < pipe.gapY || birdBottom > pipe.gapY + PIPE_GAP)
            return true;
        }
      }
      return false;
    };

    const drawSplash = () => {
      ctx.fillStyle = getBg();
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      drawGround();
      drawBird();

      ctx.fillStyle = getFg();
      ctx.font = "bold 26px Raleway, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Flappy Bird", CANVAS_W / 2, CANVAS_H / 2 - 40);

      ctx.font = "15px Raleway, sans-serif";
      ctx.fillStyle = isDark() ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)";
      ctx.fillText("Press Space or Click to Start", CANVAS_W / 2, CANVAS_H / 2 + 10);
    };

    const drawGameOver = () => {
      ctx.fillStyle = "rgba(0,0,0,0.62)";
      const boxW = 240;
      const boxH = 130;
      const boxX = (CANVAS_W - boxW) / 2;
      const boxY = (CANVAS_H - boxH) / 2;
      drawRoundedRect(boxX, boxY, boxW, boxH, 10);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px Raleway, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Game Over", CANVAS_W / 2, boxY + 38);

      ctx.font = "16px Raleway, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(`Score: ${score}`, CANVAS_W / 2, boxY + 68);

      ctx.font = "13px Raleway, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText("Press Space or Click to Restart", CANVAS_W / 2, boxY + 102);
    };

    const loop = () => {
      const state = gameStateRef.current;

      if (state === "idle") {
        drawSplash();
        rafId = requestAnimationFrame(loop);
        return;
      }

      if (state === "playing") {
        frameCount++;

        // Physics
        bird.vy += GRAVITY;
        bird.y += bird.vy;

        // Spawn pipes
        if (frameCount % PIPE_INTERVAL === 0) spawnPipe();

        // Move pipes + score
        for (const pipe of pipes) {
          pipe.x -= PIPE_SPEED;
          if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
            pipe.passed = true;
            score++;
          }
        }
        pipes = pipes.filter((p) => p.x + PIPE_WIDTH + 10 > 0);

        // Collision
        if (checkCollision()) {
          gameStateRef.current = "gameover";
          gameoverTime = Date.now();
          forceUpdate((n) => n + 1);
        }

        // Draw
        ctx.fillStyle = getBg();
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        drawPipes();
        drawGround();
        drawBird();
        drawScore();

        rafId = requestAnimationFrame(loop);
        return;
      }

      if (state === "gameover") {
        // Freeze last frame then overlay
        drawGameOver();
        rafId = requestAnimationFrame(loop);
        return;
      }
    };

    rafId = requestAnimationFrame(loop);

    const flap = () => {
      const state = gameStateRef.current;
      if (state === "idle") {
        resetGame();
        gameStateRef.current = "playing";
        forceUpdate((n) => n + 1);
        bird.vy = FLAP_STRENGTH;
      } else if (state === "playing") {
        bird.vy = FLAP_STRENGTH;
      } else if (state === "gameover") {
        // 600ms lockout to prevent accidental instant restart
        if (Date.now() - gameoverTime > 600) {
          gameStateRef.current = "idle";
          forceUpdate((n) => n + 1);
        }
      }
    };

    const onKey = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        flap();
      }
    };
    const onClick = () => flap();
    const onTouch = (e) => {
      e.preventDefault();
      flap();
    };

    window.addEventListener("keydown", onKey);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("touchstart", onTouch, { passive: false });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("touchstart", onTouch);
    };
  }, []);

  return (
    <HelmetProvider>
      <Container className="About-header">
        <Helmet>
          <meta charSet="utf-8" />
          <title> Flappy Bird | {meta.title} </title>
          <meta name="description" content="Play Flappy Bird — a React + HTML5 Canvas game." />
        </Helmet>
        <Row className="mb-5 mt-3 pt-md-3">
          <Col lg="8">
            <h1 className="display-4 mb-4">Flappy Bird</h1>
            <hr className="t_border my-4 ml-0 text-left" />
          </Col>
        </Row>
        <Row className="justify-content-center mb-5">
          <Col xs="auto">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="game__canvas"
            />
            <p className="game__hint">Space / Click / Tap to flap</p>
          </Col>
        </Row>
      </Container>
    </HelmetProvider>
  );
};
