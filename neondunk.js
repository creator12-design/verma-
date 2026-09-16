/**
 * Neon Dunk Master (Dunk Shot / Basketball Clone)
 * Slingshot trajectory basketball arcade with swish combos, rim physics, and fire streaks.
 */
class NeonDunkGame {
  constructor(canvas, container, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.container = container;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    this.id = 'neon-dunk';

    this.width = 500;
    this.height = 680;
    this.setupCanvas();

    this.ball = {
      x: this.width / 2,
      y: this.height - 140,
      radius: 14,
      vx: 0,
      vy: 0,
      inHoop: true,
      currentHoopIndex: 0
    };

    this.hoops = [];
    this.particles = [];
    this.stars = [];
    this.score = 0;
    this.streak = 0;
    this.highScore = window.storageManager.getHighScore(this.id);
    this.gameState = 'idle'; // 'idle', 'playing', 'gameover'

    this.isAiming = false;
    this.dragStart = { x: 0, y: 0 };
    this.dragCurrent = { x: 0, y: 0 };

    this.initHoops();
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

  initHoops() {
    this.hoops = [
      { x: this.width / 2, y: this.height - 140, radius: 28, rimWidth: 6, angle: 0 },
      { x: this.width / 2 + (Math.random() - 0.5) * 160, y: this.height - 350, radius: 28, rimWidth: 6, angle: 0, vx: 0 },
      { x: this.width / 2 + (Math.random() - 0.5) * 180, y: this.height - 560, radius: 28, rimWidth: 6, angle: 0, vx: 1.5 }
    ];
    this.ball.x = this.hoops[0].x;
    this.ball.y = this.hoops[0].y;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.inHoop = true;
    this.ball.currentHoopIndex = 0;
  }

  reset() {
    this.score = 0;
    this.streak = 0;
    this.particles = [];
    this.initHoops();
    if (this.onScoreUpdate) this.onScoreUpdate(this.score);
  }

  bindEvents() {
    this.handlePointerDown = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const clientX = (e.clientX - rect.left) * scaleX;
      const clientY = (e.clientY - rect.top) * scaleY;

      if (this.gameState === 'idle') {
        this.gameState = 'playing';
        this.loop();
      } else if (this.gameState === 'gameover') {
        this.reset();
        this.gameState = 'playing';
        this.loop();
        return;
      }

      if (this.ball.inHoop) {
        this.isAiming = true;
        this.dragStart = { x: clientX, y: clientY };
        this.dragCurrent = { x: clientX, y: clientY };
      }
    };

    this.handlePointerMove = (e) => {
      if (this.isAiming) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        this.dragCurrent = {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY
        };
      }
    };

    this.handlePointerUp = () => {
      if (this.isAiming) {
        this.isAiming = false;
        // Launch ball in opposite direction of drag
        const dx = this.dragStart.x - this.dragCurrent.x;
        const dy = this.dragStart.y - this.dragCurrent.y;
        const power = Math.min(22, Math.hypot(dx, dy) * 0.16);

        if (power > 3) {
          const angle = Math.atan2(dy, dx);
          this.ball.vx = Math.cos(angle) * power;
          this.ball.vy = Math.sin(angle) * power;
          this.ball.inHoop = false;
          if (window.soundEngine) window.soundEngine.playJump();
        }
      }
    };

    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
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
        life: 20
      });
    }
  }

  update() {
    if (this.gameState !== 'playing') return;

    // Move oscillating hoops
    this.hoops.forEach(h => {
      if (h.vx) {
        h.x += h.vx;
        if (h.x < 100 || h.x > this.width - 100) h.vx = -h.vx;
      }
    });

    if (this.ball.inHoop) {
      // Pin ball to active hoop center
      const activeHoop = this.hoops[this.ball.currentHoopIndex];
      if (activeHoop) {
        this.ball.x = activeHoop.x;
        this.ball.y = activeHoop.y;
      }
      return;
    }

    // Ball Flight Physics
    this.ball.vy += 0.45; // Gravity
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // Wall Bounces
    if (this.ball.x - this.ball.radius < 10) {
      this.ball.x = 10 + this.ball.radius;
      this.ball.vx = -this.ball.vx * 0.75;
      if (window.soundEngine) window.soundEngine.playHover();
    } else if (this.ball.x + this.ball.radius > this.width - 10) {
      this.ball.x = this.width - 10 - this.ball.radius;
      this.ball.vx = -this.ball.vx * 0.75;
      if (window.soundEngine) window.soundEngine.playHover();
    }

    // Check collision with Target Hoops (all hoops above the starting one)
    for (let i = this.ball.currentHoopIndex + 1; i < this.hoops.length; i++) {
      const h = this.hoops[i];

      // Ball enters basket from above
      if (this.ball.vy > 0 &&
          Math.abs(this.ball.x - h.x) < h.radius * 0.8 &&
          Math.abs(this.ball.y - h.y) < 14) {

        // SWISH!
        this.streak++;
        const points = this.streak > 1 ? 200 * this.streak : 100;
        this.score += points;
        window.storageManager.addXP(Math.floor(points / 5));
        if (this.onScoreUpdate) this.onScoreUpdate(this.score);

        if (window.soundEngine) {
          if (this.streak > 1) window.soundEngine.playPowerup();
          else window.soundEngine.playScore();
        }

        this.spawnSparks(h.x, h.y, '#f59e0b', 16);

        // Capture ball in this hoop
        this.ball.inHoop = true;
        this.ball.currentHoopIndex = i;
        this.ball.vx = 0;
        this.ball.vy = 0;

        // Scroll camera down so active hoop is near bottom
        const deltaY = (this.height - 180) - h.y;
        this.hoops.forEach(hp => hp.y += deltaY);

        // Spawn next hoop higher up
        const topHoopY = Math.min(...this.hoops.map(hp => hp.y));
        this.hoops.push({
          x: 120 + Math.random() * (this.width - 240),
          y: topHoopY - (180 + Math.random() * 60),
          radius: 28,
          rimWidth: 6,
          angle: 0,
          vx: Math.random() < 0.4 ? (Math.random() > 0.5 ? 2 : -2) : 0
        });

        // Clean off-screen hoops
        this.hoops = this.hoops.filter(hp => hp.y < this.height + 100);
        this.ball.currentHoopIndex = this.hoops.indexOf(h);
        break;
      }
    }

    // Fall Death
    if (this.ball.y - this.ball.radius > this.height) {
      this.gameState = 'gameover';
      if (window.soundEngine) {
        window.soundEngine.playHit();
        setTimeout(() => window.soundEngine.playGameOver(), 100);
      }
      const res = window.storageManager.setHighScore(this.id, this.score);
      this.highScore = res.score;
      if (this.onGameOver) this.onGameOver(this.score, this.highScore, res.isNew);
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

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Basketball Court Cyber Arena
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, this.width, this.height);

    // Arena lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.width / 2, this.height / 2, 120, 0, Math.PI * 2);
    ctx.stroke();

    // Draw Aim Trajectory Dots
    if (this.isAiming) {
      const dx = this.dragStart.x - this.dragCurrent.x;
      const dy = this.dragStart.y - this.dragCurrent.y;
      const power = Math.min(22, Math.hypot(dx, dy) * 0.16);
      const angle = Math.atan2(dy, dx);
      let simX = this.ball.x;
      let simY = this.ball.y;
      let simVx = Math.cos(angle) * power;
      let simVy = Math.sin(angle) * power;

      ctx.fillStyle = '#fbbf24';
      for (let step = 0; step < 18; step++) {
        simVy += 0.45;
        simX += simVx;
        simY += simVy;
        ctx.beginPath();
        ctx.arc(simX, simY, Math.max(1, 4 - step * 0.18), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw Hoops
    this.hoops.forEach((h, idx) => {
      const isCurrent = idx === this.ball.currentHoopIndex;

      // Rim Net
      ctx.strokeStyle = isCurrent ? '#38bdf8' : '#ec4899';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(h.x - h.radius, h.y);
      ctx.lineTo(h.x - h.radius * 0.6, h.y + 24);
      ctx.lineTo(h.x + h.radius * 0.6, h.y + 24);
      ctx.lineTo(h.x + h.radius, h.y);
      ctx.stroke();

      // Rim Ring
      ctx.strokeStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(h.x, h.y, h.radius, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Draw Particles
    this.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Basketball
    if (this.gameState !== 'gameover') {
      ctx.save();
      ctx.translate(this.ball.x, this.ball.y);

      // Fire aura if on streak
      if (this.streak > 1) {
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(0, 0, this.ball.radius + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Ball Body
      ctx.fillStyle = '#f97316';
      ctx.shadowColor = '#ea580c';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, this.ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Ball Lines
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.ball.radius, -Math.PI / 3, Math.PI / 3);
      ctx.arc(0, 0, this.ball.radius, (2 * Math.PI) / 3, (4 * Math.PI) / 3);
      ctx.moveTo(-this.ball.radius, 0);
      ctx.lineTo(this.ball.radius, 0);
      ctx.stroke();

      ctx.restore();
    }

    // HUD Display
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${this.score}`, 20, 36);

    if (this.streak > 1) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`🔥 ${this.streak}X SWISH STREAK!`, this.width - 20, 36);
    }

    // Overlays
    if (this.gameState === 'idle') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NEON DUNK MASTER', this.width / 2, this.height / 2 - 35);

      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('DRAG BACK & RELEASE TO SLINGSHOT BASKETBALL', this.width / 2, this.height / 2 + 10);

      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('CLEAN SWISHES LIGHT THE BALL ON FIRE! 🔥', this.width / 2, this.height / 2 + 38);
    } else if (this.gameState === 'gameover') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('MISSED BASKET!', this.width / 2, this.height / 2 - 35);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Outfit, sans-serif';
      ctx.fillText(`SCORE: ${this.score}`, this.width / 2, this.height / 2 + 8);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`BEST RECORD: ${this.highScore}`, this.width / 2, this.height / 2 + 38);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('TAP TO DUNK AGAIN', this.width / 2, this.height / 2 + 75);
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
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
  }
}

window.NeonDunkGame = NeonDunkGame;
