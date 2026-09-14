/**
 * Brick Breaker DX
 * High energy retro breakout arcade with multiball, powerups, and explosive prisms.
 */
class BrickBreakerGame {
  constructor(canvas, container, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.container = container;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    this.id = 'brick-breaker';

    this.width = 600;
    this.height = 550;
    this.setupCanvas();

    this.paddle = {
      x: this.width / 2 - 50,
      y: this.height - 35,
      width: 100,
      baseWidth: 100,
      height: 12,
      speed: 8
    };

    this.balls = [];
    this.bricks = [];
    this.powerups = [];
    this.particles = [];

    this.lives = 3;
    this.score = 0;
    this.highScore = window.storageManager.getHighScore(this.id);
    this.gameState = 'idle'; // 'idle', 'playing', 'gameover', 'victory'
    this.keys = {};

    this.bindEvents();
    this.initBricks();
    this.resetBall();
    this.render();
  }

  setupCanvas() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.maxHeight = '600px';
    this.canvas.style.objectFit = 'contain';
  }

  initBricks() {
    this.bricks = [];
    const rows = 5;
    const cols = 8;
    const padding = 8;
    const brickW = (this.width - 40 - (cols - 1) * padding) / cols;
    const brickH = 22;
    const colors = ['#f43f5e', '#ec4899', '#a855f7', '#06b6d4', '#10b981'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.bricks.push({
          x: 20 + c * (brickW + padding),
          y: 60 + r * (brickH + padding),
          w: brickW,
          h: brickH,
          color: colors[r % colors.length],
          points: (rows - r) * 10,
          hp: r === 0 ? 2 : 1
        });
      }
    }
  }

  resetBall() {
    this.balls = [{
      x: this.paddle.x + this.paddle.width / 2,
      y: this.paddle.y - 12,
      radius: 7,
      vx: 4 * (Math.random() > 0.5 ? 1 : -1),
      vy: -5,
      stuck: true
    }];
  }

  bindEvents() {
    this.handleKeyDown = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      this.keys[e.code] = true;

      if (e.code === 'Space') {
        this.launchBall();
      }
    };

    this.handleKeyUp = (e) => {
      this.keys[e.code] = false;
    };

    this.handlePointerMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const clientX = (e.clientX - rect.left) * scaleX;
      this.paddle.x = Math.max(10, Math.min(this.width - this.paddle.width - 10, clientX - this.paddle.width / 2));

      // Update stuck ball position
      if (this.balls[0] && this.balls[0].stuck) {
        this.balls[0].x = this.paddle.x + this.paddle.width / 2;
      }
    };

    this.handlePointerDown = (e) => {
      this.launchBall();
    };

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
  }

  launchBall() {
    if (this.gameState === 'idle') {
      this.gameState = 'playing';
      if (this.balls[0]) this.balls[0].stuck = false;
      this.loop();
    } else if (this.gameState === 'playing' && this.balls[0] && this.balls[0].stuck) {
      this.balls[0].stuck = false;
    } else if (this.gameState === 'gameover' || this.gameState === 'victory') {
      this.lives = 3;
      this.score = 0;
      this.initBricks();
      this.resetBall();
      this.gameState = 'playing';
      this.balls[0].stuck = false;
      this.loop();
    }
  }

  spawnSparks(x, y, color) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        size: Math.random() * 3 + 2,
        color,
        life: 20
      });
    }
  }

  update() {
    if (this.gameState !== 'playing') return;

    // Paddle keyboard controls
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      this.paddle.x -= this.paddle.speed;
    }
    if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      this.paddle.x += this.paddle.speed;
    }
    this.paddle.x = Math.max(10, Math.min(this.width - this.paddle.width - 10, this.paddle.x));

    // Update Balls
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const b = this.balls[i];
      if (b.stuck) {
        b.x = this.paddle.x + this.paddle.width / 2;
        continue;
      }

      b.x += b.vx;
      b.y += b.vy;

      // Wall collisions
      if (b.x - b.radius < 5) {
        b.x = 5 + b.radius;
        b.vx = Math.abs(b.vx);
        if (window.soundEngine) window.soundEngine.playHover();
      } else if (b.x + b.radius > this.width - 5) {
        b.x = this.width - 5 - b.radius;
        b.vx = -Math.abs(b.vx);
        if (window.soundEngine) window.soundEngine.playHover();
      }
      if (b.y - b.radius < 5) {
        b.y = 5 + b.radius;
        b.vy = Math.abs(b.vy);
        if (window.soundEngine) window.soundEngine.playHover();
      }

      // Paddle collision
      if (b.y + b.radius >= this.paddle.y &&
          b.y - b.radius <= this.paddle.y + this.paddle.height &&
          b.x >= this.paddle.x - 4 &&
          b.x <= this.paddle.x + this.paddle.width + 4) {
        
        b.y = this.paddle.y - b.radius;
        // Angle depends on where ball hits paddle (-1 to 1)
        const hitOffset = (b.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
        const speed = Math.hypot(b.vx, b.vy);
        b.vx = hitOffset * (speed * 0.85);
        b.vy = -Math.sqrt(Math.max(4, speed * speed - b.vx * b.vx));

        this.spawnSparks(b.x, b.y, '#c084fc');
        if (window.soundEngine) window.soundEngine.playClick();
      }

      // Brick collisions
      for (let j = this.bricks.length - 1; j >= 0; j--) {
        const br = this.bricks[j];
        if (b.x + b.radius > br.x && b.x - b.radius < br.x + br.w &&
            b.y + b.radius > br.y && b.y - b.radius < br.y + br.h) {
          
          b.vy = -b.vy;
          br.hp--;
          this.spawnSparks(b.x, b.y, br.color);

          if (br.hp <= 0) {
            this.score += br.points;
            window.storageManager.addXP(Math.floor(br.points / 2));
            if (this.onScoreUpdate) this.onScoreUpdate(this.score);
            if (window.soundEngine) window.soundEngine.playScore();

            // Powerup drop chance
            if (Math.random() < 0.2) {
              this.powerups.push({
                x: br.x + br.w / 2,
                y: br.y + br.h / 2,
                type: Math.random() > 0.5 ? 'multiball' : 'wide',
                vy: 2.2
              });
            }

            this.bricks.splice(j, 1);
          } else {
            if (window.soundEngine) window.soundEngine.playHover();
          }
          break;
        }
      }

      // Fall off bottom
      if (b.y - b.radius > this.height) {
        this.balls.splice(i, 1);
      }
    }

    // Check ball drain
    if (this.balls.length === 0) {
      this.lives--;
      if (window.soundEngine) window.soundEngine.playHit();

      if (this.lives <= 0) {
        this.gameState = 'gameover';
        if (window.soundEngine) window.soundEngine.playGameOver();
        const res = window.storageManager.setHighScore(this.id, this.score);
        this.highScore = res.score;
        if (this.onGameOver) this.onGameOver(this.score, this.highScore, res.isNew);
      } else {
        this.resetBall();
      }
    }

    // Victory check
    if (this.bricks.length === 0) {
      this.gameState = 'victory';
      if (window.soundEngine) window.soundEngine.playVictory();
      this.score += 500;
      window.storageManager.addXP(100);
      const res = window.storageManager.setHighScore(this.id, this.score);
      this.highScore = res.score;
      if (this.onGameOver) this.onGameOver(this.score, this.highScore, res.isNew);
    }

    // Powerups update
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pw = this.powerups[i];
      pw.y += pw.vy;

      // Catch powerup
      if (pw.y + 10 >= this.paddle.y && pw.y <= this.paddle.y + this.paddle.height &&
          pw.x >= this.paddle.x && pw.x <= this.paddle.x + this.paddle.width) {
        
        if (pw.type === 'multiball') {
          if (this.balls.length > 0) {
            const src = this.balls[0];
            this.balls.push({ x: src.x, y: src.y, radius: src.radius, vx: src.vx * 0.8 - 2, vy: src.vy, stuck: false });
            this.balls.push({ x: src.x, y: src.y, radius: src.radius, vx: src.vx * 0.8 + 2, vy: src.vy, stuck: false });
          }
        } else if (pw.type === 'wide') {
          this.paddle.width = 140;
          setTimeout(() => { this.paddle.width = this.paddle.baseWidth; }, 8000);
        }

        if (window.soundEngine) window.soundEngine.playPowerup();
        this.powerups.splice(i, 1);
        continue;
      }

      if (pw.y > this.height) {
        this.powerups.splice(i, 1);
      }
    }

    // Particles update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Arena background
    ctx.fillStyle = '#0c071e';
    ctx.fillRect(0, 0, this.width, this.height);

    // Border glow
    ctx.strokeStyle = '#4c1d95';
    ctx.lineWidth = 3;
    ctx.strokeRect(3, 3, this.width - 6, this.height - 6);

    // Draw Bricks
    this.bricks.forEach(br => {
      ctx.fillStyle = br.color;
      ctx.shadowColor = br.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(br.x, br.y, br.w, br.h, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Prism highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.roundRect(br.x + 2, br.y + 2, br.w - 4, 4, 2);
      ctx.fill();
    });

    // Draw Paddle
    ctx.fillStyle = '#a855f7';
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.roundRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(this.paddle.x + 8, this.paddle.y + 2, this.paddle.width - 16, 3, 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Balls
    this.balls.forEach(b => {
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw Powerups
    this.powerups.forEach(pw => {
      ctx.fillStyle = pw.type === 'multiball' ? '#06b6d4' : '#10b981';
      ctx.beginPath();
      ctx.roundRect(pw.x - 12, pw.y - 8, 24, 16, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pw.type === 'multiball' ? '3X' : 'WIDE', pw.x, pw.y);
    });

    // Draw Particles
    this.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // HUD Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${this.score}`, 20, 32);

    ctx.textAlign = 'right';
    const hearts = '💖 '.repeat(Math.max(0, this.lives));
    ctx.fillText(hearts, this.width - 20, 32);

    // Overlays
    if (this.gameState === 'idle') {
      ctx.fillStyle = 'rgba(12, 7, 30, 0.8)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BRICK BREAKER DX', this.width / 2, this.height / 2 - 25);

      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('DRAG MOUSE OR USE A / D KEYS TO MOVE PADDLE', this.width / 2, this.height / 2 + 15);

      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#c084fc';
      ctx.fillText('PRESS SPACEBAR OR CLICK TO LAUNCH ORB', this.width / 2, this.height / 2 + 45);
    } else if (this.gameState === 'gameover') {
      ctx.fillStyle = 'rgba(12, 7, 30, 0.88)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 34px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 30);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Outfit, sans-serif';
      ctx.fillText(`SCORE: ${this.score}`, this.width / 2, this.height / 2 + 10);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('CLICK TO TRY AGAIN', this.width / 2, this.height / 2 + 55);
    } else if (this.gameState === 'victory') {
      ctx.fillStyle = 'rgba(12, 7, 30, 0.88)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('STAGE CLEARED! 🏆', this.width / 2, this.height / 2 - 30);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Outfit, sans-serif';
      ctx.fillText(`TOTAL SCORE: ${this.score}`, this.width / 2, this.height / 2 + 10);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('CLICK TO PLAY AGAIN', this.width / 2, this.height / 2 + 55);
    }
  }

  loop() {
    this.update();
    this.render();
    if (this.gameState === 'playing') {
      this.animationId = requestAnimationFrame(() => this.loop());
    }
  }

  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
  }
}

window.BrickBreakerGame = BrickBreakerGame;
