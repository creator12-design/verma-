/**
 * Cyber Bubble Pop (Bubble Shooter Clone)
 * Aim cannon, bounce off walls, and match 3+ colored bubbles to trigger chain pops.
 */
class CyberBubbleGame {
  constructor(canvas, container, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.container = container;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    this.id = 'bubble-pop';

    this.width = 480;
    this.height = 650;
    this.radius = 18;
    this.cols = 12;
    this.rows = 14;
    this.setupCanvas();

    this.colors = ['#f43f5e', '#3b82f6', '#10b981', '#fbbf24', '#a855f7'];
    this.grid = [];
    this.cannonAngle = -Math.PI / 2;
    this.currentBubbleColor = this.randomColor();
    this.nextBubbleColor = this.randomColor();
    this.flyingBubble = null;
    this.particles = [];
    this.misses = 0;

    this.score = 0;
    this.highScore = window.storageManager.getHighScore(this.id);
    this.gameState = 'idle'; // 'idle', 'playing', 'gameover'

    this.initGrid();
    this.bindEvents();
    this.render();
  }

  setupCanvas() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.maxHeight = '650px';
    this.canvas.style.objectFit = 'contain';
  }

  randomColor() {
    return this.colors[Math.floor(Math.random() * this.colors.length)];
  }

  initGrid() {
    this.grid = [];
    for (let r = 0; r < 5; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        row.push(this.randomColor());
      }
      this.grid.push(row);
    }
  }

  reset() {
    this.score = 0;
    this.misses = 0;
    this.particles = [];
    this.flyingBubble = null;
    this.currentBubbleColor = this.randomColor();
    this.nextBubbleColor = this.randomColor();
    this.initGrid();
    if (this.onScoreUpdate) this.onScoreUpdate(this.score);
  }

  bindEvents() {
    this.handlePointerMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const clientX = (e.clientX - rect.left) * scaleX;
      const clientY = (e.clientY - rect.top) * scaleY;

      const cannonX = this.width / 2;
      const cannonY = this.height - 45;
      const angle = Math.atan2(clientY - cannonY, clientX - cannonX);

      // Clamp angle upwards
      if (angle < -0.2 && angle > -Math.PI + 0.2) {
        this.cannonAngle = angle;
      }
    };

    this.handlePointerDown = (e) => {
      if (this.gameState === 'idle') {
        this.gameState = 'playing';
        this.loop();
        return;
      }
      if (this.gameState === 'gameover') {
        this.reset();
        this.gameState = 'playing';
        this.loop();
        return;
      }

      this.shootBubble();
    };

    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
  }

  shootBubble() {
    if (this.flyingBubble || this.gameState !== 'playing') return;

    const speed = 18;
    this.flyingBubble = {
      x: this.width / 2,
      y: this.height - 45,
      vx: Math.cos(this.cannonAngle) * speed,
      vy: Math.sin(this.cannonAngle) * speed,
      color: this.currentBubbleColor
    };

    this.currentBubbleColor = this.nextBubbleColor;
    this.nextBubbleColor = this.randomColor();
    if (window.soundEngine) window.soundEngine.playJump();
  }

  spawnSparks(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        color,
        size: Math.random() * 3 + 2,
        life: 18
      });
    }
  }

  update() {
    if (this.gameState !== 'playing') return;

    if (this.flyingBubble) {
      const fb = this.flyingBubble;
      fb.x += fb.vx;
      fb.y += fb.vy;

      // Wall Bounces
      if (fb.x - this.radius < 10) {
        fb.x = 10 + this.radius;
        fb.vx = -fb.vx;
        if (window.soundEngine) window.soundEngine.playHover();
      } else if (fb.x + this.radius > this.width - 10) {
        fb.x = this.width - 10 - this.radius;
        fb.vx = -fb.vx;
        if (window.soundEngine) window.soundEngine.playHover();
      }

      // Check collision with ceiling or existing bubbles
      let collided = false;

      // Ceiling hit
      if (fb.y - this.radius <= 20) {
        collided = true;
      } else {
        // Check grid collision
        for (let r = 0; r < this.grid.length; r++) {
          for (let c = 0; c < this.cols; c++) {
            if (this.grid[r][c]) {
              const bx = (c + 0.5) * (this.radius * 2);
              const by = 30 + r * (this.radius * 1.7);
              if (Math.hypot(fb.x - bx, fb.y - by) < this.radius * 1.85) {
                collided = true;
                break;
              }
            }
          }
          if (collided) break;
        }
      }

      if (collided) {
        // Snap into nearest grid slot
        const r = Math.max(0, Math.round((fb.y - 30) / (this.radius * 1.7)));
        const c = Math.max(0, Math.min(this.cols - 1, Math.round((fb.x / (this.radius * 2)) - 0.5)));

        // Expand grid rows if needed
        while (this.grid.length <= r) {
          this.grid.push(Array(this.cols).fill(null));
        }

        this.grid[r][c] = fb.color;
        this.spawnSparks(fb.x, fb.y, fb.color, 8);

        // Match 3 search (Flood fill / BFS)
        const matches = this.findMatches(r, c, fb.color);
        if (matches.length >= 3) {
          matches.forEach(m => {
            this.grid[m.r][m.c] = null;
            const mx = (m.c + 0.5) * (this.radius * 2);
            const my = 30 + m.r * (this.radius * 1.7);
            this.spawnSparks(mx, my, fb.color, 10);
          });

          this.score += matches.length * 30;
          window.storageManager.addXP(matches.length * 5);
          if (this.onScoreUpdate) this.onScoreUpdate(this.score);
          if (window.soundEngine) window.soundEngine.playScore();
        } else {
          this.misses++;
          if (window.soundEngine) window.soundEngine.playClick();
          // Add ceiling row after 5 misses
          if (this.misses >= 5) {
            const newRow = Array(this.cols).fill(null).map(() => this.randomColor());
            this.grid.unshift(newRow);
            this.misses = 0;
          }
        }

        this.flyingBubble = null;

        // Check if bubbles reached the bottom danger line
        if (this.grid.length >= this.rows - 2) {
          this.triggerDeath();
          return;
        }
      }
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
  }

  findMatches(startR, startC, targetColor) {
    const matches = [];
    const visited = Array(this.grid.length).fill(null).map(() => Array(this.cols).fill(false));
    const queue = [{ r: startR, c: startC }];
    visited[startR][startC] = true;

    while (queue.length > 0) {
      const { r, c } = queue.shift();
      matches.push({ r, c });

      const neighbors = [
        { r: r - 1, c }, { r: r + 1, c },
        { r, c: c - 1 }, { r, c: c + 1 }
      ];

      neighbors.forEach(n => {
        if (n.r >= 0 && n.r < this.grid.length && n.c >= 0 && n.c < this.cols) {
          if (!visited[n.r][n.c] && this.grid[n.r][n.c] === targetColor) {
            visited[n.r][n.c] = true;
            queue.push(n);
          }
        }
      });
    }

    return matches;
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

    // Deep Neon Cyber Background
    ctx.fillStyle = '#080d1a';
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw Grid Bubbles
    for (let r = 0; r < this.grid.length; r++) {
      for (let c = 0; c < this.cols; c++) {
        const color = this.grid[r][c];
        if (color) {
          const bx = (c + 0.5) * (this.radius * 2);
          const by = 30 + r * (this.radius * 1.7);

          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(bx, by, this.radius - 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Inner highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(bx - 4, by - 4, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw Trajectory Laser Guide
    if (this.gameState === 'playing' && !this.flyingBubble) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(this.width / 2, this.height - 45);
      ctx.lineTo(
        this.width / 2 + Math.cos(this.cannonAngle) * 350,
        (this.height - 45) + Math.sin(this.cannonAngle) * 350
      );
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Flying Bubble
    if (this.flyingBubble) {
      ctx.fillStyle = this.flyingBubble.color;
      ctx.shadowColor = this.flyingBubble.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(this.flyingBubble.x, this.flyingBubble.y, this.radius - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Draw Cannon Turret
    const cx = this.width / 2;
    const cy = this.height - 45;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.cannonAngle + Math.PI / 2);

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(-8, -35, 16, 35, 4);
    ctx.fill();

    ctx.restore();

    // Ready Bubble in Cannon
    ctx.fillStyle = this.currentBubbleColor;
    ctx.shadowColor = this.currentBubbleColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, this.radius - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Next Bubble Preview
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(60, cy, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.nextBubbleColor;
    ctx.beginPath();
    ctx.arc(60, cy, this.radius - 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw Particles
    this.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Score HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${this.score}`, 20, 36);

    // Overlays
    if (this.gameState === 'idle') {
      ctx.fillStyle = 'rgba(8, 13, 26, 0.85)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CYBER BUBBLE POP', this.width / 2, this.height / 2 - 35);

      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('AIM WITH MOUSE & TAP TO FIRE BUBBLE', this.width / 2, this.height / 2 + 10);

      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('MATCH 3 OR MORE BUBBLES OF THE SAME COLOR!', this.width / 2, this.height / 2 + 38);
    } else if (this.gameState === 'gameover') {
      ctx.fillStyle = 'rgba(8, 13, 26, 0.88)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 34px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BUBBLES REACHED BOTTOM!', this.width / 2, this.height / 2 - 35);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Outfit, sans-serif';
      ctx.fillText(`FINAL SCORE: ${this.score}`, this.width / 2, this.height / 2 + 8);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('TAP TO PLAY AGAIN', this.width / 2, this.height / 2 + 55);
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
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
  }
}

window.CyberBubbleGame = CyberBubbleGame;
