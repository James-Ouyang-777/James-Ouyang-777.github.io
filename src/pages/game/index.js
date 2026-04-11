import React, { useEffect, useRef, useState, useCallback } from "react";
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
const PIPE_INTERVAL = 88;
const BIRD_X = 80;
const BIRD_RADIUS = 13;
const MAX_SCORES = 10;
const LS_CACHE_KEY = "flappy_leaderboard_cache";

// ── JSONBin helpers ──────────────────────────────────────────────────────────
const BIN_ID = process.env.REACT_APP_JSONBIN_BIN_ID;
const API_KEY = process.env.REACT_APP_JSONBIN_API_KEY;
const BIN_URL = BIN_ID ? `https://api.jsonbin.io/v3/b/${BIN_ID}` : null;
const HEADERS = {
  "Content-Type": "application/json",
  "X-Master-Key": API_KEY || "",
};

const readCache = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_CACHE_KEY)) || [];
  } catch {
    return [];
  }
};

const writeCache = (board) => {
  try {
    localStorage.setItem(LS_CACHE_KEY, JSON.stringify(board));
  } catch { /* ignore */ }
};

const fetchLeaderboard = async () => {
  if (!BIN_URL) return readCache();
  try {
    const res = await fetch(`${BIN_URL}/latest`, { headers: HEADERS });
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();
    const board = data.record?.leaderboard || [];
    writeCache(board);
    return board;
  } catch {
    return readCache(); // fall back to local cache
  }
};

const pushScore = async (name, score, currentBoard) => {
  const updated = [...currentBoard, { name: name.trim() || "Anonymous", score }]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SCORES);
  writeCache(updated); // always update local cache first
  if (BIN_URL) {
    try {
      await fetch(BIN_URL, {
        method: "PUT",
        headers: HEADERS,
        body: JSON.stringify({ leaderboard: updated }),
      });
    } catch { /* silent fail — local cache already updated */ }
  }
  return updated;
};
// ─────────────────────────────────────────────────────────────────────────────

const qualifies = (score, board) => {
  if (score === 0) return false;
  if (board.length < MAX_SCORES) return true;
  return score > board[board.length - 1].score;
};

const MEDALS = ["🥇", "🥈", "🥉"];

export const FlappyGame = () => {
  const canvasRef = useRef(null);
  const gameStateRef = useRef("idle"); // idle | playing | gameover | name_entry
  const finalScoreRef = useRef(0);
  const gameoverTimeRef = useRef(0);
  const leaderboardRef = useRef([]); // sync copy for game loop

  const [uiState, setUiState] = useState("idle");
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nameInput, setNameInput] = useState("");
  const nameInputRef = useRef(null);

  // Load leaderboard from JSONBin on mount
  useEffect(() => {
    fetchLeaderboard().then((board) => {
      leaderboardRef.current = board;
      setLeaderboard(board);
      setLoading(false);
    });
  }, []);

  // Keep ref in sync with state (for game loop access)
  useEffect(() => {
    leaderboardRef.current = leaderboard;
  }, [leaderboard]);

  // Auto-focus the name field when it appears
  useEffect(() => {
    if (uiState === "name_entry" && nameInputRef.current) {
      setTimeout(() => nameInputRef.current && nameInputRef.current.focus(), 50);
    }
  }, [uiState]);

  const submitName = useCallback(async () => {
    const newBoard = await pushScore(nameInput, finalScoreRef.current, leaderboardRef.current);
    leaderboardRef.current = newBoard;
    setLeaderboard(newBoard);
    setNameInput("");
    gameStateRef.current = "idle";
    setUiState("idle");
  }, [nameInput]);

  const handleNameKey = useCallback(
    (e) => {
      if (e.key === "Enter") submitName();
    },
    [submitName]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const bird = { x: BIRD_X, y: CANVAS_H / 2, vy: 0 };
    let pipes = [];
    let score = 0;
    let frameCount = 0;
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
      ctx.beginPath();
      ctx.arc(bird.x, bird.y, BIRD_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = isDark() ? "#ffffff" : "#222222";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bird.x + 5, bird.y - 4, 3, 0, Math.PI * 2);
      ctx.fillStyle = isDark() ? "#0c0c0c" : "#f5f5f5";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bird.x + 6, bird.y - 4, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = "#333";
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(bird.x + BIRD_RADIUS - 2, bird.y);
      ctx.lineTo(bird.x + BIRD_RADIUS + 6, bird.y - 2);
      ctx.lineTo(bird.x + BIRD_RADIUS + 6, bird.y + 2);
      ctx.closePath();
      ctx.fillStyle = "#f39c12";
      ctx.fill();
    };

    const drawPipes = () => {
      for (const pipe of pipes) {
        ctx.fillStyle = getPipeColor();
        drawRoundedRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY - 6, 4);
        ctx.fill();
        ctx.strokeStyle = getPipeBorder();
        ctx.lineWidth = 1.5;
        ctx.stroke();
        drawRoundedRect(pipe.x - 4, pipe.gapY - 20, PIPE_WIDTH + 8, 20, 4);
        ctx.fill();
        ctx.strokeStyle = getPipeBorder();
        ctx.stroke();

        const botY = pipe.gapY + PIPE_GAP;
        ctx.fillStyle = getPipeColor();
        drawRoundedRect(pipe.x, botY + 6, PIPE_WIDTH, CANVAS_H - botY - 6, 4);
        ctx.fill();
        ctx.strokeStyle = getPipeBorder();
        ctx.stroke();
        drawRoundedRect(pipe.x - 4, botY, PIPE_WIDTH + 8, 20, 4);
        ctx.fill();
        ctx.strokeStyle = getPipeBorder();
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
      if (bird.y + BIRD_RADIUS >= CANVAS_H - 4 || bird.y - BIRD_RADIUS <= 0)
        return true;
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
      ctx.fillText(`Score: ${finalScoreRef.current}`, CANVAS_W / 2, boxY + 68);
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
        bird.vy += GRAVITY;
        bird.y += bird.vy;
        if (frameCount % PIPE_INTERVAL === 0) spawnPipe();
        for (const pipe of pipes) {
          pipe.x -= PIPE_SPEED;
          if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
            pipe.passed = true;
            score++;
          }
        }
        pipes = pipes.filter((p) => p.x + PIPE_WIDTH + 10 > 0);

        if (checkCollision()) {
          finalScoreRef.current = score;
          // Use leaderboardRef so game loop always sees latest board
          if (qualifies(score, leaderboardRef.current)) {
            gameStateRef.current = "name_entry";
            setUiState("name_entry");
          } else {
            gameoverTimeRef.current = Date.now();
            gameStateRef.current = "gameover";
            setUiState("gameover");
          }
        }

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
        drawGameOver();
        rafId = requestAnimationFrame(loop);
        return;
      }

      if (state === "name_entry") {
        rafId = requestAnimationFrame(loop);
        return;
      }
    };

    rafId = requestAnimationFrame(loop);

    const flap = () => {
      const state = gameStateRef.current;
      if (state === "name_entry") return;
      if (state === "idle") {
        resetGame();
        gameStateRef.current = "playing";
        setUiState("playing");
        bird.vy = FLAP_STRENGTH;
      } else if (state === "playing") {
        bird.vy = FLAP_STRENGTH;
      } else if (state === "gameover") {
        if (Date.now() - gameoverTimeRef.current > 600) {
          gameStateRef.current = "idle";
          setUiState("idle");
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
        <Row className="justify-content-center mb-5 align-items-start game__row">
          {/* Canvas + name-entry overlay */}
          <Col xs="auto" className="mb-4 mb-md-0">
            <div className="game__canvas-wrapper">
              <canvas
                ref={canvasRef}
                width={CANVAS_W}
                height={CANVAS_H}
                className="game__canvas"
              />
              {uiState === "name_entry" && (
                <div className="game__name-overlay">
                  <div className="game__name-box">
                    <p className="game__name-title">New High Score!</p>
                    <p className="game__name-score">{finalScoreRef.current} pts</p>
                    <input
                      ref={nameInputRef}
                      className="game__name-input"
                      type="text"
                      placeholder="Enter your name"
                      maxLength={20}
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={handleNameKey}
                    />
                    <button className="game__name-btn" onClick={submitName}>
                      Save Score
                    </button>
                  </div>
                </div>
              )}
            </div>
            <p className="game__hint">Space / Click / Tap to flap</p>
          </Col>

          {/* Leaderboard */}
          <Col xs={12} md="auto">
            <div className="game__leaderboard">
              <h5 className="game__lb-title">Top 10 Scores</h5>
              {loading ? (
                <p className="game__lb-empty">Loading…</p>
              ) : leaderboard.length === 0 ? (
                <p className="game__lb-empty">No scores yet — be the first!</p>
              ) : (
                <table className="game__lb-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, i) => (
                      <tr key={i} className={i < 3 ? "game__lb-top" : ""}>
                        <td>{MEDALS[i] || i + 1}</td>
                        <td>{entry.name}</td>
                        <td>{entry.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </HelmetProvider>
  );
};
