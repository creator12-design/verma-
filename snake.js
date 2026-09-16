/**
 * Neon Serpent (Cyber Snake)
 * Fluid high-speed snake game with glowing orbs, turbo boost, and particle effects.
 */
class NeonSerpentGame {
  constructor(canvas, container, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.container = container;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    this.id = 'neon-serpent';

    this.width = 600;
    this.height = 450;
    this.gridSize = 20;
    this.cols = this.width / this.gridSize;
    this.rows = this.height / this.gridSize;
    this.setupCanvas();

    this.snake = [];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.food = { x: 0, y: 0, type: 'normal' };
    this.particles = [];
    this.score = 0;
    this.highScore = window.storageManager.getHighScore(this.id);
    this.gameState = 'idle'; // 'idle', 'playing', 'gameover'
    this.isTurbo = false;
    this.lastStepTime = 0;
    this.speed = 105; // ms per step

    this.bindEvents();
    this.reset();
    this.render();
  }

  setupCanvas() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.maxHeight = '550px';
    this.canvas.style.objectFit = 'contain';
  }

  reset() {
    const midX = Math.floor(this.cols / 2);
    const midY = Math.floor(this.rows / 2);
    this.snake = [
      { x: midX, y: midY },
      { x: midX - 1, y: midY },
      { x: midX - 2, y: midY }
    ];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.score = 0;
    this.particles = [];
    this.spawnFood();
    if (this.onScoreUpdate) this.onScoreUpdate(this.score);
  }

  spawnFood() {
    let valid = false;
    while (!valid) {
      this.food.x = Math.floor(Math.random() * this.cols);
      this.food.y = Math.floor(Math.random() * this.rows);
      valid = !this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y);
    }
    this.food.type = Math.random() < 0.25 ? 'golden' : 'normal';
  }

  bindEvents() {
    this.handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space', 'ShiftLeft'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'Space' || e.code === 'ShiftLeft') {
        this.isTurbo = true;
      }

      if (this.gameState === 'idle') {
        this.gameState = 'playing';
        this.loop(performance.now());
        return;
      }

      if (this.gameState === 'gameover') {
        this.reset();
        this.gameState = 'playing';
        this.loop(performance.now());
        return;
      }

      const { x, y } = this.dir;
      if ((e.code === 'ArrowUp' || e.code === 'KeyW') && y === 0) this.nextDir = { x: 0, y: -1 };
      else if ((e.code === 'ArrowDown' || e.code === 'KeyS') && y === 0) this.nextDir = { x: 0, y: 1 };
      else if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && x === 0) this.nextDir = { x: -1, y: 0 };
      else if ((e.code === 'ArrowRight' || e.code === 'KeyD') && x === 0) this.nextDir = { x: 1, y: 0 };
    };

    this.handleKeyUp = (e) => {
      if (e.code === 'Space' || e.code === 'ShiftLeft') {
        this.isTurbo = false;
      }
    };

    let touchX = 0, touchY = 0;
    this.handleTouchStart = (e) => {
      touchX = e.touches[0].clientX;
      touchY = e.touches[0].clientY;
      if (this.gameState !== 'playing') {
        this.handleKeyDown({ code: 'Space', preventDefault: () => {} });
      }
    };

    this.handleTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - touchX;
      const dy = e.changedTouches[0].clientY - touchY;
      const { x, y } = this.dir;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) {
        if (dx > 0 && x === 0) this.nextDir = { x: 1, y: 0 };
        else if (dx < 0 && x === 0) this.nextDir = { x: -1, y: 0 };
      } else if (Math.abs(dy) > 20) {
        if (dy > 0 && y === 0) this.nextDir = { x: 0, y: 1 };
        else if (dy < 0 && y === 0) this.nextDir = { x: 0, y: -1 };
      }
    };

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: true });
  }

  step() {
    this.dir = { ...this.nextDir };
    const head = {
      x: this.snake[0].x + this.dir.x,
      y: this.snake[0].y + this.dir.y
    };

    // Boundary wrapping
    if (head.x < 0) head.x = this.cols - 1;
    if (head.x >= this.cols) head.x = 0;
    if (head.y < 0) head.y = this.rows - 1;
    if (head.y >= this.rows) head.y = 0;

    // Self-collision check
    for (let i = 0; i < this.snake.length; i++) {
      if (this.snake[i].x === head.x && this.snake[i].y === head.y) {
        this.triggerDeath();
        return;
      }
    }

    this.snake.unshift(head);

    // Food collision
    if (head.x === this.food.x && head.y === this.food.y) {
      const points = this.food.type === 'golden' ? 30 : 10;
      this.score += points;
      window.storageManager.addXP(points);
      if (this.onScoreUpdate) this.onScoreUpdate(this.score);

      if (window.soundEngine) {
        if (this.food.type === 'golden') window.soundEngine.playPowerup();
        else window.soundEngine.playScore();
      }

      this.spawnSparks(head.x * this.gridSize + 10, head.y * this.gridSize + 10, this.food.type === 'golden' ? '#fbbf24' : '#06b6d4');
      this.spawnFood();
    } else {
      this.snake.pop();
    }
  }

  spawnSparks(x, y, color) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        color,
        size: Math.random() * 3 + 2,
        life: 20
      });
    }
  }

  triggerDeath() {
    this.gameState = 'gameover';
    if (window.soundEngine) {
      window.soundEngine.playHit();
      setTimeout(() => window.soundEngine.playGameOver(), 100);
    }
    const res = window.storageManager.setHighScore(this.id, this.score);
    this.highScore = res.score;
    if (this.onGameOver) this.onGameOver(this.score, this.highScore, res.isNew);
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Cyber Grid Canvas Background
    ctx.fillStyle = '#060a17';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.strokeStyle = 'rgba(30, 58, 138, 0.2)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += this.gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Draw Particles
    this.particles.forEach((p, idx) => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) this.particles.splice(idx, 1);
    });

    // Draw Food Orb
    const foodX = this.food.x * this.gridSize + this.gridSize / 2;
    const foodY = this.food.y * this.gridSize + this.gridSize / 2;
    const isGold = this.food.type === 'golden';

    ctx.shadowColor = isGold ? '#fbbf24' : '#06b6d4';
    ctx.shadowBlur = 15;
    ctx.fillStyle = isGold ? '#fbbf24' : '#06b6d4';
    ctx.beginPath();
    ctx.arc(foodX, foodY, this.gridSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(foodX, foodY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Snake Segments
    this.snake.forEach((seg, index) => {
      const sx = seg.x * this.gridSize + 2;
      const sy = seg.y * this.gridSize + 2;
      const size = this.gridSize - 4;

      if (index === 0) {
        // Snake Head
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.roundRect(sx, sy, size, size, 6);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Eyes
        ctx.fillStyle = '#ffffff';
        const eyeOffset = 4;
        ctx.beginPath();
        ctx.arc(sx + eyeOffset + 2, sy + eyeOffset + 2, 2.5, 0, Math.PI * 2);
        ctx.arc(sx + size - eyeOffset - 2, sy + eyeOffset + 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Body Segments with fade gradient
        const ratio = 1 - (index / this.snake.length) * 0.6;
        ctx.fillStyle = `rgba(14, 165, 233, ${ratio})`;
        ctx.beginPath();
        ctx.roundRect(sx, sy, size, size, 4);
        ctx.fill();
      }
    });

    // Overlays
    if (this.gameState === 'idle') {
      ctx.fillStyle = 'rgba(6, 10, 23, 0.75)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 32px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NEON SERPENT', this.width / 2, this.height / 2 - 30);

      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('PRESS ARROW KEYS OR WASD TO START', this.width / 2, this.height / 2 + 15);

      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('HOLD SPACEBAR FOR TURBO SPEED ⚡', this.width / 2, this.height / 2 + 45);
    } else if (this.gameState === 'gameover') {
      ctx.fillStyle = 'rgba(6, 10, 23, 0.85)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 32px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SERPENT CRASHED', this.width / 2, this.height / 2 - 40);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Outfit, sans-serif';
      ctx.fillText(`SCORE: ${this.score}`, this.width / 2, this.height / 2);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('PRESS ANY KEY TO PLAY AGAIN', this.width / 2, this.height / 2 + 50);
    }
  }

  loop(currentTime) {
    if (this.gameState !== 'playing') return;

    const currentInterval = this.isTurbo ? this.speed * 0.5 : this.speed;
    if (currentTime - this.lastStepTime > currentInterval) {
      this.step();
      this.lastStepTime = currentTime;
    }

    this.render();

    if (this.gameState === 'playing') {
      this.animationId = requestAnimationFrame((t) => this.loop(t));
    }
  }

  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
  }
}

window.NeonSerpentGame = NeonSerpentGame;
