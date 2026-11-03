'use client';

import React, { useRef, useEffect, useState } from 'react';
import { sounds } from '@/lib/audio';
import { Play, RotateCcw, Volume2, Gamepad2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

export function BuggyGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [distance, setDistance] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Input states
  const gasRef = useRef(false);
  const brakeRef = useRef(false);

  // Game state refs for animation loop
  const gameStateRef = useRef({
    x: 100,
    y: 180,
    vx: 0,
    vy: 0,
    angle: 0,
    fuel: 100,
    distance: 0,
    coins: 0,
    coinsList: [] as { x: number; y: number; collected: boolean }[],
  });

  // Generate ground height based on sine waves (hill climbs & caves)
  const getGroundY = (worldX: number) => {
    return (
      220 +
      Math.sin(worldX * 0.008) * 35 +
      Math.cos(worldX * 0.018) * 20 +
      Math.sin(worldX * 0.04) * 10
    );
  };

  // Start / Restart game
  const startGame = () => {
    sounds.playVictory();
    gameStateRef.current = {
      x: 100,
      y: getGroundY(100) - 20,
      vx: 0,
      vy: 0,
      angle: 0,
      fuel: 100,
      distance: 0,
      coins: 0,
      coinsList: Array.from({ length: 60 }, (_, i) => {
        const cx = 300 + i * 180 + Math.random() * 50;
        return {
          x: cx,
          y: getGroundY(cx) - 30 - Math.random() * 20,
          collected: false,
        };
      }),
    };
    setGameOver(false);
    setIsPlaying(true);
    setDistance(0);
    setCoinsCollected(0);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowRight', 'KeyD', 'KeyW', 'ArrowUp'].includes(e.code)) {
        gasRef.current = true;
      }
      if (['ArrowLeft', 'KeyA', 'KeyS', 'ArrowDown'].includes(e.code)) {
        brakeRef.current = true;
      }
      if (e.code === 'Space' && !isPlaying) {
        startGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowRight', 'KeyD', 'KeyW', 'ArrowUp'].includes(e.code)) {
        gasRef.current = false;
      }
      if (['ArrowLeft', 'KeyA', 'KeyS', 'ArrowDown'].includes(e.code)) {
        brakeRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying]);

  // Main 60fps Game Loop
  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let revAudioThrottle = 0;

    const loop = () => {
      const state = gameStateRef.current;

      // Handle Inputs
      if (gasRef.current && state.fuel > 0) {
        state.vx += 0.22;
        state.fuel -= 0.05;
        revAudioThrottle++;
        if (revAudioThrottle % 14 === 0) {
          sounds.playBuggyRev(1.0 + Math.min(state.vx * 0.1, 1.2));
        }
      } else if (brakeRef.current) {
        state.vx -= 0.25;
      } else {
        // Friction / drag
        state.vx *= 0.985;
      }

      // Max forward & backward speed
      state.vx = Math.max(-2, Math.min(state.vx, 9.5));

      // Gravity
      state.vy += 0.35;

      // Update positions
      state.x += state.vx;
      state.y += state.vy;

      // Terrain collision & tilt
      const groundY = getGroundY(state.x);
      const groundSlope =
        (getGroundY(state.x + 12) - getGroundY(state.x - 12)) / 24;
      const targetAngle = Math.atan(groundSlope);

      if (state.y >= groundY - 14) {
        state.y = groundY - 14;
        state.vy = 0;
        // Smoothly match slope angle
        state.angle = state.angle * 0.7 + targetAngle * 0.3;
      } else {
        // Air rotation
        if (gasRef.current) state.angle += 0.03;
        if (brakeRef.current) state.angle -= 0.03;
      }

      // Check crash (upside down collision with ground)
      if (state.y >= groundY - 14 && (state.angle > 1.6 || state.angle < -1.6)) {
        sounds.playError();
        setGameOver(true);
        setIsPlaying(false);
        return;
      }

      // Coin collection collision
      state.coinsList.forEach((coin) => {
        if (!coin.collected) {
          const dx = state.x - coin.x;
          const dy = state.y - coin.y;
          if (Math.hypot(dx, dy) < 28) {
            coin.collected = true;
            state.coins += 1;
            sounds.playCoin();
            setCoinsCollected(state.coins);
          }
        }
      });

      // Update distance
      state.distance = Math.max(0, Math.floor(state.x / 10));
      setDistance(state.distance);
      if (state.distance > highScore) {
        setHighScore(state.distance);
      }

      // -------------------------------------------------------------
      // DRAW CANVAS (Underground Cave Tunnel)
      // -------------------------------------------------------------
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Camera follows buggy
      const cameraX = state.x - 150;

      // 1. Cave Ceiling & Background rock gradients
      ctx.fillStyle = '#0f0817';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Distant cave stalactites
      ctx.fillStyle = '#231534';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let x = 0; x <= canvas.width; x += 30) {
        const ceilingY = 25 + Math.sin((x + cameraX) * 0.02) * 15;
        ctx.lineTo(x, ceilingY);
      }
      ctx.lineTo(canvas.width, 0);
      ctx.fill();

      // 2. Draw Rolling Ground Surface
      ctx.fillStyle = '#3a2053';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      for (let sx = 0; sx <= canvas.width; sx += 5) {
        const worldX = sx + cameraX;
        const gy = getGroundY(worldX);
        ctx.lineTo(sx, gy);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.fill();

      // Gold ore layer in rock
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let sx = 0; sx <= canvas.width; sx += 5) {
        const worldX = sx + cameraX;
        const gy = getGroundY(worldX);
        if (Math.sin(worldX * 0.05) > 0.4) {
          ctx.lineTo(sx, gy + 8);
        } else {
          ctx.moveTo(sx, gy + 8);
        }
      }
      ctx.stroke();

      // Dirt top contour line
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let sx = 0; sx <= canvas.width; sx += 5) {
        const worldX = sx + cameraX;
        const gy = getGroundY(worldX);
        if (sx === 0) ctx.moveTo(sx, gy);
        else ctx.lineTo(sx, gy);
      }
      ctx.stroke();

      // 3. Draw Coins
      state.coinsList.forEach((coin) => {
        if (!coin.collected) {
          const screenX = coin.x - cameraX;
          if (screenX > -20 && screenX < canvas.width + 20) {
            ctx.save();
            ctx.fillStyle = '#fbbf24';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(screenX, coin.y, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(screenX - 2, coin.y - 2, 4, 4);
            ctx.restore();
          }
        }
      });

      // 4. Draw Buggy Vehicle & Driver
      ctx.save();
      const screenBuggyX = state.x - cameraX;
      ctx.translate(screenBuggyX, state.y);
      ctx.rotate(state.angle);

      // Chassis
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-18, -10, 36, 10);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-10, -18, 18, 8); // roll cage

      // Driver helmet
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-4, -16, 8, 6);
      ctx.fillStyle = '#ffffff'; // visor
      ctx.fillRect(0, -14, 4, 2);

      // Wheels
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.arc(-12, 4, 7, 0, Math.PI * 2);
      ctx.arc(12, 4, 7, 0, Math.PI * 2);
      ctx.fill();

      // Rims
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(-12, 4, 3, 0, Math.PI * 2);
      ctx.arc(12, 4, 3, 0, Math.PI * 2);
      ctx.fill();

      // Headlight cone in dark cave
      ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
      ctx.beginPath();
      ctx.moveTo(18, -6);
      ctx.lineTo(80, -25);
      ctx.lineTo(95, 15);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-burrow-card border-4 border-burrow-border shadow-pixel-lg overflow-hidden">
        {/* Banner Bar */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between p-4 bg-burrow-surface border-b-2 border-burrow-border cursor-pointer hover:bg-burrow-card transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 border border-red-400 text-white font-pixel text-xs">
              <Gamepad2 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-pixel text-base sm:text-lg text-burrow-cream">
                  PLAYABLE BROWSER PROTOTYPE: MINE BUGGY
                </h3>
                <span className="hidden sm:inline-block bg-emerald-500/20 text-emerald-400 font-pixel text-[9px] border border-emerald-500/40 px-2 py-0.5">
                  60 FPS PHYSICS
                </span>
              </div>
              <p className="font-silkscreen text-xs text-burrow-muted">
                Underground Hill Climb driving teaser. Collect coins and conquer steep cave tunnels!
              </p>
            </div>
          </div>

          <button className="text-burrow-muted hover:text-white p-1">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {isExpanded && (
          <div className="p-4 sm:p-6 bg-burrow-darkest flex flex-col items-center">
            {/* HUD Stats */}
            <div className="w-full max-w-2xl flex items-center justify-between mb-3 px-2 font-pixel text-xs">
              <div className="text-amber-300 flex items-center gap-1.5">
                <span>COINS:</span>
                <span className="text-base text-yellow-400">{coinsCollected}</span>
              </div>
              <div className="text-burrow-cream flex items-center gap-1.5">
                <span>DISTANCE:</span>
                <span className="text-base text-emerald-400">{distance}m</span>
              </div>
              <div className="text-burrow-muted hidden sm:flex items-center gap-1.5">
                <span>BEST:</span>
                <span className="text-base text-burrow-gold">{highScore}m</span>
              </div>
            </div>

            {/* Game Canvas */}
            <div className="relative border-4 border-burrow-border bg-black shadow-pixel w-full max-w-2xl aspect-[16/9] overflow-hidden">
              <canvas
                ref={canvasRef}
                width={640}
                height={360}
                className="w-full h-full object-cover block"
              />

              {/* Start / Game Over Overlay */}
              {(!isPlaying || gameOver) && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                  {gameOver ? (
                    <>
                      <h4 className="font-pixel text-xl sm:text-2xl text-red-400 mb-2">
                        BUGGY CRASHED IN THE MINES!
                      </h4>
                      <p className="font-silkscreen text-xs text-burrow-cream mb-4">
                        Distance: <span className="text-emerald-400 font-pixel">{distance}m</span> | Coins: <span className="text-yellow-400 font-pixel">{coinsCollected}</span>
                      </p>
                      <button
                        onClick={startGame}
                        className="px-6 py-3 bg-burrow-gold hover:bg-yellow-400 text-black font-pixel text-xs border-2 border-amber-200 shadow-pixel flex items-center gap-2 font-bold transition-transform active:translate-y-0.5"
                      >
                        <RotateCcw size={15} />
                        <span>RETRY RUN</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <h4 className="font-pixel text-lg sm:text-xl text-burrow-cream mb-2">
                        BURROW BUGGY TUNNEL RUN
                      </h4>
                      <p className="font-silkscreen text-xs text-burrow-muted max-w-md mb-5">
                        Controls: Press <span className="text-amber-300 font-pixel">GAS</span> (Right Arrow / D) to accelerate, <span className="text-amber-300 font-pixel">BRAKE</span> (Left Arrow / A) to stabilize on steep climbs.
                      </p>
                      <button
                        onClick={startGame}
                        className="px-8 py-3.5 bg-burrow-gold hover:bg-yellow-400 text-black font-pixel text-sm border-2 border-amber-200 shadow-pixel-lg flex items-center gap-2.5 font-bold transition-transform active:translate-y-0.5"
                      >
                        <Play size={18} className="fill-black" />
                        <span>START TEST DRIVE</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile / Touch Pedals */}
            <div className="w-full max-w-2xl flex items-center justify-between gap-4 mt-4">
              <button
                type="button"
                onMouseDown={() => (brakeRef.current = true)}
                onMouseUp={() => (brakeRef.current = false)}
                onTouchStart={() => (brakeRef.current = true)}
                onTouchEnd={() => (brakeRef.current = false)}
                className="flex-1 py-4 bg-red-900/80 hover:bg-red-800 border-2 border-red-500 text-red-200 font-pixel text-xs shadow-pixel active:translate-y-0.5 select-none font-bold"
              >
                ◀ BRAKE / REVERSE
              </button>

              <button
                type="button"
                onMouseDown={() => (gasRef.current = true)}
                onMouseUp={() => (gasRef.current = false)}
                onTouchStart={() => (gasRef.current = true)}
                onTouchEnd={() => (gasRef.current = false)}
                className="flex-1 py-4 bg-emerald-800 hover:bg-emerald-700 border-2 border-emerald-400 text-emerald-100 font-pixel text-xs shadow-pixel active:translate-y-0.5 select-none font-bold"
              >
                GAS / ACCELERATE ▶
              </button>
            </div>
            
            <p className="text-[10px] font-silkscreen text-burrow-muted mt-2 text-center">
              💡 Full game will feature 10+ mines, NFT worker drivers with lamp traits & speed upgrades.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
