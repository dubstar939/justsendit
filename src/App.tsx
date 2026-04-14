import { useEffect, useRef, useState } from 'react';
import { Trophy, Play, RotateCcw, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

const ROAD_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const CAR_WIDTH = 40;
const CAR_HEIGHT = 70;

type GameState = 'START' | 'PLAYING' | 'GAMEOVER';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  // High score persistence
  useEffect(() => {
    const saved = localStorage.getItem('trafficHighScore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const saveHighScore = (newScore: number) => {
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('trafficHighScore', newScore.toString());
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let isGameOver = false;

    // Game variables
    let playerX = ROAD_WIDTH / 2 - CAR_WIDTH / 2;
    let playerY = CANVAS_HEIGHT - CAR_HEIGHT - 20;
    
    // Player speed components
    let speedX = 0;
    const MAX_SPEED_X = 6;
    let currentSpeed = 5;
    const MIN_SPEED = 4;
    const MAX_SPEED = 20;
    
    let currentScore = 0;
    
    const keys: Record<string, boolean> = {
      ArrowLeft: false,
      ArrowRight: false,
      ArrowUp: false,
      ArrowDown: false,
      a: false,
      d: false,
      w: false,
      s: false,
    };

    interface Enemy {
      x: number;
      y: number;
      speed: number;
      color: string;
      lane: number;
    }
    
    let enemies: Enemy[] = [];
    
    interface Line {
      y: number;
    }
    let lines: Line[] = [];
    for (let i = 0; i < CANVAS_HEIGHT; i += 50) {
      lines.push({ y: i });
    }

    const enemyColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      if (keys.hasOwnProperty(key)) {
        keys[key] = true;
      } else if (keys.hasOwnProperty(key.toLowerCase())) {
        keys[key.toLowerCase()] = true;
      }
      
      // Prevent scrolling when playing
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key) && gameState === 'PLAYING') {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key;
      if (keys.hasOwnProperty(key)) {
        keys[key] = false;
      } else if (keys.hasOwnProperty(key.toLowerCase())) {
        keys[key.toLowerCase()] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);

    const spawnEnemy = () => {
      const lane = Math.floor(Math.random() * 3);
      const laneWidth = ROAD_WIDTH / 3;
      const x = lane * laneWidth + (laneWidth - CAR_WIDTH) / 2;
      const y = -CAR_HEIGHT * 2;
      
      // Prevent spawning directly on top of another recently spawned enemy
      const isOverlapping = enemies.some(e => Math.abs(e.y - y) < CAR_HEIGHT * 2 && e.lane === lane);
      
      if (!isOverlapping) {
        enemies.push({
          x,
          y,
          speed: Math.random() * 2 + 0.5, // Slower/faster modifiers
          color: enemyColors[Math.floor(Math.random() * enemyColors.length)],
          lane
        });
      }
    };

    let frameCount = 0;

    const update = () => {
      if (gameState !== 'PLAYING') return;

      frameCount++;
      
      // Movement logic
      if (keys.ArrowLeft || keys.a) {
        speedX -= 0.6;
      } else if (keys.ArrowRight || keys.d) {
        speedX += 0.6;
      } else {
        speedX *= 0.8; // Friction
      }
      
      // Clamp X speed
      if (speedX > MAX_SPEED_X) speedX = MAX_SPEED_X;
      if (speedX < -MAX_SPEED_X) speedX = -MAX_SPEED_X;
      
      playerX += speedX;
      
      // Boundaries
      if (playerX < 0) {
        playerX = 0;
        speedX = 0;
      }
      if (playerX > ROAD_WIDTH - CAR_WIDTH) {
        playerX = ROAD_WIDTH - CAR_WIDTH;
        speedX = 0;
      }

      // Vertical Speed control
      if (keys.ArrowUp || keys.w) {
        currentSpeed += 0.15;
      } else if (keys.ArrowDown || keys.s) {
        currentSpeed -= 0.3;
      } else {
        const targetBaseSpeed = MIN_SPEED + (currentScore / 800);
        if (currentSpeed < targetBaseSpeed) currentSpeed += 0.05;
        if (currentSpeed > targetBaseSpeed) currentSpeed -= 0.1;
      }
      
      if (currentSpeed < MIN_SPEED) currentSpeed = MIN_SPEED;
      if (currentSpeed > MAX_SPEED) currentSpeed = MAX_SPEED;

      // Move road lines
      for (let i = 0; i < lines.length; i++) {
        lines[i].y += currentSpeed;
        if (lines[i].y > CANVAS_HEIGHT) {
          lines[i].y -= CANVAS_HEIGHT + 50; // Wrap around smoothly
        }
      }

      // Score
      currentScore += currentSpeed / 15;
      if (frameCount % 5 === 0) {
        setScore(Math.floor(currentScore));
      }

      // Spawning enemies dynamically based on score
      const spawnRate = Math.max(15, 60 - Math.floor(currentScore / 100));
      if (frameCount % spawnRate === 0) {
        spawnEnemy();
      }

      // Update and prune enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        enemy.y += (currentSpeed - 3) + enemy.speed; 
        
        // Strict collision detection (slightly forgiving bounding box)
        const hitBoxPadding = 4;
        if (
          playerX + hitBoxPadding < enemy.x + CAR_WIDTH - hitBoxPadding &&
          playerX + CAR_WIDTH - hitBoxPadding > enemy.x + hitBoxPadding &&
          playerY + hitBoxPadding < enemy.y + CAR_HEIGHT - hitBoxPadding &&
          playerY + CAR_HEIGHT - hitBoxPadding > enemy.y + hitBoxPadding
        ) {
          isGameOver = true;
          setGameState('GAMEOVER');
          saveHighScore(Math.floor(currentScore));
        }

        if (enemy.y > CANVAS_HEIGHT + CAR_HEIGHT) {
          enemies.splice(i, 1);
        }
      }
    };

    // Helper for rounded rectangles to support older browsers just in case, though standard in modern ones
    const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
      } else {
        // Fallback
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
      }
    };

    const drawCar = (x: number, y: number, color: string, isPlayer: boolean) => {
      ctx.save();
      ctx.translate(x, y);

      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      drawRoundRect(4, 4, CAR_WIDTH, CAR_HEIGHT, 6);
      ctx.fill();

      // Main body
      ctx.fillStyle = color;
      drawRoundRect(0, 0, CAR_WIDTH, CAR_HEIGHT, 6);
      ctx.fill();
      
      // Roof / Windows
      ctx.fillStyle = '#1e293b'; // slate-800
      drawRoundRect(4, 15, CAR_WIDTH - 8, CAR_HEIGHT - 30, 4);
      ctx.fill();
      
      // Windshield reflection
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.moveTo(6, 17);
      ctx.lineTo(CAR_WIDTH - 6, 17);
      ctx.lineTo(CAR_WIDTH - 8, 25);
      ctx.lineTo(8, 25);
      ctx.closePath();
      ctx.fill();

      // Rear window reflection
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.moveTo(8, CAR_HEIGHT - 23);
      ctx.lineTo(CAR_WIDTH - 8, CAR_HEIGHT - 23);
      ctx.lineTo(CAR_WIDTH - 6, CAR_HEIGHT - 17);
      ctx.lineTo(6, CAR_HEIGHT - 17);
      ctx.closePath();
      ctx.fill();

      // Headlights
      ctx.fillStyle = isPlayer ? '#fef08a' : '#fef08a';
      drawRoundRect(4, 2, 8, 4, 2);
      ctx.fill();
      drawRoundRect(CAR_WIDTH - 12, 2, 8, 4, 2);
      ctx.fill();

      // Taillights
      ctx.fillStyle = isPlayer ? (keys.ArrowDown || keys.s ? '#ef4444' : '#991b1b') : '#ef4444'; // Bright red if player is braking
      drawRoundRect(4, CAR_HEIGHT - 6, 8, 4, 2);
      ctx.fill();
      drawRoundRect(CAR_WIDTH - 12, CAR_HEIGHT - 6, 8, 4, 2);
      ctx.fill();

      // Player flame effect from exhaust when accelerating
      if (isPlayer && (keys.ArrowUp || keys.w) && gameState === 'PLAYING') {
        ctx.fillStyle = '#f97316'; // orange-500
        ctx.beginPath();
        ctx.moveTo(10, CAR_HEIGHT);
        ctx.lineTo(14, CAR_HEIGHT + Math.random() * 8 + 4);
        ctx.lineTo(18, CAR_HEIGHT);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(CAR_WIDTH - 18, CAR_HEIGHT);
        ctx.lineTo(CAR_WIDTH - 14, CAR_HEIGHT + Math.random() * 8 + 4);
        ctx.lineTo(CAR_WIDTH - 10, CAR_HEIGHT);
        ctx.fill();
      }

      ctx.restore();
    };

    const draw = () => {
      // Clear with dark road color directly since we only draw road
      ctx.fillStyle = '#374151'; // slate-700
      ctx.fillRect(0, 0, ROAD_WIDTH, CANVAS_HEIGHT);

      // Road dirt/texture (simple noise lines)
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      for(let i=0; i<10; i++) {
        ctx.fillRect(Math.random() * ROAD_WIDTH, Math.random() * CANVAS_HEIGHT, 2, 20);
      }

      // Draw road borders
      ctx.fillStyle = '#eab308'; // yellow-500
      ctx.fillRect(8, 0, 6, CANVAS_HEIGHT);
      ctx.fillRect(ROAD_WIDTH - 14, 0, 6, CANVAS_HEIGHT);

      // Inner border lines (white)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(16, 0, 2, CANVAS_HEIGHT);
      ctx.fillRect(ROAD_WIDTH - 18, 0, 2, CANVAS_HEIGHT);

      // Draw dashed lane lines
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      const laneWidth = ROAD_WIDTH / 3;
      
      for (let i = 0; i < lines.length; i++) {
        ctx.fillRect(laneWidth - 2, lines[i].y, 4, 30);
        ctx.fillRect(laneWidth * 2 - 2, lines[i].y, 4, 30);
      }

      // Draw enemies
      enemies.forEach(enemy => {
        drawCar(enemy.x, enemy.y, enemy.color, false);
      });

      // Draw player
      if (gameState !== 'GAMEOVER' || Math.floor(Date.now() / 200) % 2 === 0) {
        // Blink player if game over
        drawCar(playerX, playerY, '#eab308', true);
      }
      
      // Speed effect overlay
      if (currentSpeed > 8 && gameState === 'PLAYING') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        for(let i=0; i<4; i++) {
           const sx = Math.random() * ROAD_WIDTH;
           const sy = Math.random() * CANVAS_HEIGHT;
           ctx.fillRect(sx, sy, 1, currentSpeed * 3);
        }
      }
    };

    const loop = () => {
      if (!isGameOver) {
        update();
        draw();
        animationId = requestAnimationFrame(loop);
      } else {
        // Draw one last time to show blinking or crash state
        draw();
        // Continue loop just for visual effects like blinking, but don't update logic
        if (gameState === 'GAMEOVER') {
          animationId = requestAnimationFrame(loop);
        }
      }
    };

    if (gameState === 'PLAYING') {
      playerX = ROAD_WIDTH / 2 - CAR_WIDTH / 2;
      playerY = CANVAS_HEIGHT - CAR_HEIGHT - 20;
      speedX = 0;
      currentSpeed = MIN_SPEED;
      currentScore = 0;
      enemies = [];
      setScore(0);
      isGameOver = false;
      loop();
    } else if (gameState === 'START') {
      draw();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationId);
    };
  }, [gameState]);

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center p-4 font-mono selection:bg-yellow-500/30 relative">
      
      {/* 939pro Logo - upper left corner */}
      <a href="https://github.com/dubstar939/939pro" target="_blank" rel="noopener noreferrer" className="fixed top-3 left-3 z-50 group">
        <img 
          src="https://raw.githubusercontent.com/dubstar939/939pro/main/939logo.jpeg" 
          alt="939pro Logo" 
          className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-slate-700 shadow-lg transition-all duration-300 group-hover:border-yellow-500 group-hover:shadow-[0_0_15px_rgba(234,179,8,0.4)] group-hover:scale-110"
        />
      </a>

      <div className="mb-6 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 uppercase italic tracking-widest flex items-center justify-center gap-3">
          <Play className="w-8 h-8 text-yellow-500 fill-current rotate-90 hidden md:block" />
          Highway Rush
          <Play className="w-8 h-8 text-orange-500 fill-current rotate-90 hidden md:block" />
        </h1>
      </div>

      <div className="max-w-5xl w-full flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-center">
        
        {/* Main Game Container */}
        <div className="relative rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-8 border-slate-800 bg-slate-900 group">
          <canvas 
            ref={canvasRef} 
            width={ROAD_WIDTH} 
            height={CANVAS_HEIGHT}
            className="block w-full max-w-[400px] h-auto object-contain bg-slate-900"
            style={{ aspectRatio: `${ROAD_WIDTH}/${CANVAS_HEIGHT}` }}
          />

          {/* Overlays */}
          {gameState === 'START' && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
              <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(234,179,8,0.5)] animate-pulse">
                <Play className="w-10 h-10 text-slate-900 fill-current ml-2" />
              </div>
              <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-wider">Ready to Drive?</h2>
              <p className="text-slate-400 mb-8 max-w-[250px] text-sm">
                Use arrow keys to steer, accelerate, and brake. Avoid all traffic!
              </p>
              <button 
                onClick={() => setGameState('PLAYING')}
                className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-slate-900 font-black text-xl rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all active:scale-95 uppercase tracking-wider"
              >
                Start Engine
              </button>
            </div>
          )}

          {gameState === 'GAMEOVER' && (
            <div className="absolute inset-0 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10">
              <div className="text-red-500 mb-2">
                <RotateCcw className="w-16 h-16 mx-auto mb-4 opacity-50" />
              </div>
              <h2 className="text-5xl font-black text-white mb-2 tracking-widest uppercase text-red-100">Crashed!</h2>
              
              <div className="bg-red-900/50 p-6 rounded-2xl mb-8 w-full max-w-[250px] border border-red-500/30">
                <p className="text-red-200 text-sm mb-1 uppercase tracking-wider font-bold">Final Score</p>
                <p className="text-5xl font-black text-white drop-shadow-lg mb-4">{score}</p>
                
                {score >= highScore && score > 0 && (
                  <div className="inline-block bg-yellow-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-bounce">
                    New High Score!
                  </div>
                )}
              </div>

              <button 
                onClick={() => setGameState('PLAYING')}
                className="px-8 py-4 bg-white hover:bg-slate-200 text-red-900 font-black text-xl rounded-xl shadow-xl transition-all active:scale-95 flex items-center gap-3 uppercase tracking-wider"
              >
                <RotateCcw className="w-6 h-6" />
                Play Again
              </button>
            </div>
          )}
          
          {/* In-Game HUD */}
          {gameState === 'PLAYING' && (
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none z-10">
              <div className="bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-700/50 backdrop-blur-md shadow-lg">
                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-0.5">Score</p>
                <p className="text-2xl font-black text-white leading-none">{score}</p>
              </div>
              <div className="bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-700/50 backdrop-blur-md shadow-lg flex items-center gap-3">
                <div className="bg-yellow-500/20 p-1.5 rounded-lg">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-0.5">Best</p>
                  <p className="text-lg font-bold text-yellow-500 leading-none">{Math.max(score, highScore)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Controls (Visible only on small screens) */}
        <div className="w-full max-w-[400px] grid grid-cols-3 gap-2 lg:hidden mt-2">
          <div className="col-span-3 flex justify-center gap-2 mb-2">
            <button 
              onPointerDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))}
              onPointerUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }))}
              onPointerLeave={() => window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }))}
              className="bg-slate-800/80 active:bg-slate-700 text-white p-4 rounded-xl flex-1 flex justify-center border border-slate-700 select-none touch-manipulation"
            >
              <ArrowUp className="w-8 h-8" />
            </button>
          </div>
          <button 
            onPointerDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))}
            onPointerUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' }))}
            onPointerLeave={() => window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' }))}
            className="bg-slate-800/80 active:bg-slate-700 text-white p-4 rounded-xl flex justify-center border border-slate-700 select-none touch-manipulation"
          >
            <ArrowLeft className="w-8 h-8" />
          </button>
          <button 
            onPointerDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))}
            onPointerUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }))}
            onPointerLeave={() => window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }))}
            className="bg-slate-800/80 active:bg-slate-700 text-white p-4 rounded-xl flex justify-center border border-slate-700 select-none touch-manipulation"
          >
            <ArrowDown className="w-8 h-8" />
          </button>
          <button 
            onPointerDown={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))}
            onPointerUp={() => window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }))}
            onPointerLeave={() => window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }))}
            className="bg-slate-800/80 active:bg-slate-700 text-white p-4 rounded-xl flex justify-center border border-slate-700 select-none touch-manipulation"
          >
            <ArrowRight className="w-8 h-8" />
          </button>
        </div>

        {/* Controls Info Panel */}
        <div className="hidden lg:flex flex-col gap-6 w-full max-w-[320px]">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="text-xl font-black text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-6 bg-yellow-500 rounded-sm"></span>
              Controls
            </h3>
            
            <div className="space-y-5">
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex items-center gap-4">
                <div className="flex gap-1.5">
                  <kbd className="w-10 h-10 flex items-center justify-center bg-slate-700 rounded-lg border-b-4 border-slate-900 text-sm font-bold shadow-sm text-white"><ArrowLeft className="w-5 h-5" /></kbd>
                  <kbd className="w-10 h-10 flex items-center justify-center bg-slate-700 rounded-lg border-b-4 border-slate-900 text-sm font-bold shadow-sm text-white"><ArrowRight className="w-5 h-5" /></kbd>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Steer</p>
                  <p className="text-slate-400 text-xs">Left / Right Arrow</p>
                </div>
              </div>
              
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex items-center gap-4">
                <div className="flex gap-1.5">
                  <kbd className="w-10 h-10 flex items-center justify-center bg-slate-700 rounded-lg border-b-4 border-slate-900 text-sm font-bold shadow-sm text-white"><ArrowUp className="w-5 h-5" /></kbd>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Accelerate</p>
                  <p className="text-slate-400 text-xs">Up Arrow</p>
                </div>
              </div>
              
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex items-center gap-4">
                <div className="flex gap-1.5">
                  <kbd className="w-10 h-10 flex items-center justify-center bg-slate-700 rounded-lg border-b-4 border-slate-900 text-sm font-bold shadow-sm text-white"><ArrowDown className="w-5 h-5" /></kbd>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Brake</p>
                  <p className="text-slate-400 text-xs">Down Arrow</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-800 text-xs text-slate-500 font-sans text-center">
              A, D, W, S keys are also supported.
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-6 rounded-2xl border border-yellow-500/20 shadow-xl">
            <h4 className="text-sm font-black text-yellow-500 mb-3 uppercase tracking-wider flex items-center gap-2">
              Pro Tips
            </h4>
            <ul className="text-sm text-slate-300 space-y-3 font-sans">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">•</span>
                <span>The longer you survive, the faster the game gets. Stay alert!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">•</span>
                <span>Hold accelerate (UP) to boost your score multiplier.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">•</span>
                <span>Watch out for fast red cars and slow trucks.</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
