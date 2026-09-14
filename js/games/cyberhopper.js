/**
 * Cyber Hopper (Crossy Road Clone)
 * Grid-based forward hopping arcade crossing busy cyber highways and floating data rivers.
 */
class CyberHopperGame {
  constructor(canvas, container, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.container = container;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    this.id = 'cyber-hopper';

    this.width = 560;
    this.height = 680;
    this.gridSize = 40;
    this.cols = Math.floor(this.width / this.gridSize);
    this.setupCanvas();

    this.player = {
      col: Math.floor(this.cols / 2),
      row: 2, // relative to visible camera
      worldRow: 0,
      animX: 0,
      animY: 0,
      isHopping: false
    };

    this.cameraWorldRow = 0;
    this.lanes = [];
    this.particles = [];
    this.score = 0;
    this.maxRow = 0;
    this.highScore = window.storageManager.getHighScore(this.id);
    this.gameState = 'idle'; // 'idle', 'playing', 'gameover'
    this.idleTimer = 0;

    this.initLanes();
    this.bindEvents();
    this.render();
  }

  setupCanvas() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.maxHeight = '680px';
    this.canvas.style.objectFit = 'contain';
  }

  initLanes() {
    this.lanes = [];
    for (let r = 0; r < 24; r++) {
      this.lanes.push(this.generateLane(r));
    }
  }

  generateLane(row) {
    if (row < 3) {
      return { type: 'safe', row, vehicles: [], logs: [] };
    }

    const types = ['road', 'road', 'river', 'safe', 'road', 'river'];
    const type = types[Math.floor(Math.random() * types.length)];
    const speed = (1.5 + Math.random() * 2.5) * (Math.random() > 0.5 ? 1 : -1);

    const lane = {
      type,
      row,
      speed,
      vehicles: [],
      logs: []
    };

    if (type === 'road') {
      const colors = ['#f43f5e', '#ec4899', '#3b82f6', '#06b6d4', '#fbbf24'];
      const count = Math.floor(Math.random() * 2) + 2;
      const spacing = this.width / count;
      for (let i = 0; i < count; i++) {
        lane.vehicles.push({
          x: i * spacing + Math.random() * 40,
          w: 60 + Math.random() * 20,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    } else if (type === 'river') {
      const count = 2;
      const spacing = this.width / count;
      for (let i = 0; i < count; i++) {
        lane.logs.push({
          x: i * spacing,
          w: 95
        });
      }
    }

    return lane;
  }

  reset() {
    this.player.col = Math.floor(this.cols / 2);
    this.player.worldRow = 0;
    this.cameraWorldRow = 0;
    this.score = 0;
    this.maxRow = 0;
    this.idleTimer = 0;
    this.particles = [];
    this.initLanes();

    if (this.onScoreUpdate) this.onScoreUpdate(this.score);
  }

  bindEvents() {
    this.handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }

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

      if (e.code === 'ArrowUp' || e.code === 'KeyW') this.hop(0, 1);
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') this.hop(0, -1);
      else if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.hop(-1, 0);
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') this.hop(1, 0);
    };

    let touchX = 0, touchY = 0;
    this.handleTouchStart = (e) => {
      touchX = e.touches[0].clientX;
      touchY = e.touches[0].clientY;
      if (this.gameState !== 'playing') {
        this.handleKeyDown({ code: 'ArrowUp', preventDefault: () => {} });
      }
    };

    this.handleTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - touchX;
      const dy = e.changedTouches[0].clientY - touchY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) > 20) {
        if (Math.abs(dx) > Math.abs(dy)) {
          this.hop(dx > 0 ? 1 : -1, 0);
        } else {
          this.hop(0, dy < 0 ? 1 : -1);
        }
      } else {
        // Tap means hop forward
        this.hop(0, 1);
      }
    };

    window.addEventListener('keydown', this.handleKeyDown);
    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: true });
  }

  hop(dx, dy) {
    if (this.gameState !== 'playing') return;

    this.player.col = Math.max(0, Math.min(this.cols - 1, this.player.col + dx));
    this.player.worldRow = Math.max(this.cameraWorldRow, this.player.worldRow + dy);
    this.idleTimer = 0;

    if (this.player.worldRow > this.maxRow) {
      this.maxRow = this.player.worldRow;
      this.score = this.maxRow * 10;
      window.storageManager.addXP(5);
      if (this.onScoreUpdate) this.onScoreUpdate(this.score);
    }

    if (window.soundEngine) window.soundEngine.playJump();
    this.spawnParticles(this.player.col * this.gridSize + 20, this.getPlayerScreenY(), '#10b981', 6);
  }

  getPlayerScreenY() {
    const bottomRowY = this.height - this.gridSize * 2;
    return bottomRowY - (this.player.worldRow - this.cameraWorldRow) * this.gridSize;
  }

  spawnParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color,
        size: Math.random() * 3 + 2,
        life: 18
      });
    }
  }

  update() {
    if (this.gameState !== 'playing') return;

    this.idleTimer++;
    if (this.idleTimer > 280) {
      // Idle timeout eagle sweep
      this.triggerDeath('LASER SWEEP!');
      return;
    }

    // Scroll camera up to keep player centered vertically
    if (this.player.worldRow - this.cameraWorldRow > 6) {
      this.cameraWorldRow = this.player.worldRow - 6;
    }

    // Add new lanes ahead as player advances
    while (this.lanes.length <= this.cameraWorldRow + 18) {
      this.lanes.push(this.generateLane(this.lanes.length));
    }

    // Update Lanes
    const playerY = this.getPlayerScreenY();
    const playerX = this.player.col * this.gridSize + this.gridSize / 2;
    const currentLane = this.lanes[this.player.worldRow];

    let onLog = false;

    this.lanes.forEach(lane => {
      // Vehicles
      lane.vehicles.forEach(v => {
        v.x += lane.speed;
        if (lane.speed > 0 && v.x > this.width + 40) v.x = -v.w - 20;
        if (lane.speed < 0 && v.x < -v.w - 20) v.x = this.width + 40;

        // Collision check
        if (lane.row === this.player.worldRow) {
          if (playerX > v.x && playerX < v.x + v.w) {
            this.triggerDeath('SPLATTERED BY HOVERCAR!');
          }
        }
      });

      // Logs
      lane.logs.forEach(l => {
        l.x += lane.speed;
        if (lane.speed > 0 && l.x > this.width + 40) l.x = -l.w - 20;
        if (lane.speed < 0 && l.x < -l.w - 20) l.x = this.width + 40;

        // Check if player is on this log
        if (lane.row === this.player.worldRow) {
          if (playerX >= l.x && playerX <= l.x + l.w) {
            onLog = true;
            // Carry player along with log
            this.player.col += (lane.speed / this.gridSize);
          }
        }
      });
    });

    // River Drowning Check
    if (currentLane && currentLane.type === 'river' && !onLog) {
      this.triggerDeath('DROWNED IN DATA STREAM!');
      return;
    }

    // Out of bounds check
    if (this.player.col < 0 || this.player.col >= this.cols) {
      this.triggerDeath('SWEPT OFF SCREEN!');
      return;
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

  triggerDeath(reason) {
    this.gameState = 'gameover';
    this.deathReason = reason;
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

    // Draw visible lanes from bottom to top
    const bottomRowY = this.height - this.gridSize * 2;

    for (let r = this.cameraWorldRow; r <= this.cameraWorldRow + 18; r++) {
      const lane = this.lanes[r];
      if (!lane) continue;

      const screenY = bottomRowY - (r - this.cameraWorldRow) * this.gridSize;

      if (lane.type === 'safe') {
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(0, screenY, this.width, this.gridSize);
        // Grass flowers / neon pixels
        ctx.fillStyle = '#10b981';
        ctx.fillRect(40, screenY + 12, 6, 6);
        ctx.fillRect(220, screenY + 20, 6, 6);
        ctx.fillRect(440, screenY + 14, 6, 6);
      } else if (lane.type === 'road') {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, screenY, this.width, this.gridSize);
        // Dashed lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, screenY + this.gridSize);
        ctx.lineTo(this.width, screenY + this.gridSize);
        ctx.stroke();

        // Draw Vehicles
        lane.vehicles.forEach(v => {
          ctx.fillStyle = v.color;
          ctx.shadowColor = v.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.roundRect(v.x, screenY + 5, v.w, this.gridSize - 10, 6);
          ctx.fill();
          ctx.shadowBlur = 0;
          // Windshield
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(v.x + 12, screenY + 10, v.w - 24, this.gridSize - 20);
        });
      } else if (lane.type === 'river') {
        ctx.fillStyle = '#082f49';
        ctx.fillRect(0, screenY, this.width, this.gridSize);
        // Water ripples
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, screenY + 15);
        ctx.lineTo(this.width, screenY + 15);
        ctx.stroke();

        // Draw Logs (Data barges)
        lane.logs.forEach(l => {
          ctx.fillStyle = '#0284c7';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.roundRect(l.x, screenY + 6, l.w, this.gridSize - 12, 6);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(l.x + 10, screenY + 12, l.w - 20, 4);
        });
      }
    }

    // Draw Particles
    this.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Player (Cute Cyber Frog Bot)
    if (this.gameState !== 'gameover') {
      const px = this.player.col * this.gridSize + this.gridSize / 2;
      const py = this.getPlayerScreenY() + this.gridSize / 2;

      ctx.save();
      ctx.translate(px, py);

      // Hopper Body
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(-14, -14, 28, 28, 8);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-7, -8, 5, 0, Math.PI * 2);
      ctx.arc(7, -8, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-7, -9, 2.5, 0, Math.PI * 2);
      ctx.arc(7, -9, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // HUD Score
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${this.score}`, 20, 36);

    // Overlays
    if (this.gameState === 'idle') {
      ctx.fillStyle = 'rgba(6, 15, 25, 0.82)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CYBER HOPPER', this.width / 2, this.height / 2 - 35);

      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('USE ARROW KEYS OR WASD TO HOP', this.width / 2, this.height / 2 + 10);

      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('DODGE CARS & HOP ON FLOATING DATA BARGES!', this.width / 2, this.height / 2 + 38);
    } else if (this.gameState === 'gameover') {
      ctx.fillStyle = 'rgba(6, 15, 25, 0.88)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 34px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER!', this.width / 2, this.height / 2 - 35);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Outfit, sans-serif';
      ctx.fillText(this.deathReason || 'CRASHED', this.width / 2, this.height / 2);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`SCORE: ${this.score}  •  BEST: ${this.highScore}`, this.width / 2, this.height / 2 + 35);

      ctx.fillStyle = '#38bdf8';
      ctx.fillText('PRESS ANY KEY TO HOP AGAIN', this.width / 2, this.height / 2 + 75);
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
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
  }
}

window.CyberHopperGame = CyberHopperGame;
