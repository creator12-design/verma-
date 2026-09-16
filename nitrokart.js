/**
 * Nitro Kart Frenzy (Smash Karts / Micro Machines Clone)
 * Top-down arcade kart racing with drift mechanics, weapon pickups, and rival AI racers.
 */
class NitroKartGame {
  constructor(canvas, container, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.container = container;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    this.id = 'nitro-kart';

    this.width = 620;
    this.height = 620;
    this.setupCanvas();

    this.player = {
      x: 310,
      y: 520,
      angle: 0,
      speed: 0,
      maxSpeed: 8.5,
      accel: 0.22,
      turnSpeed: 0.065,
      friction: 0.96,
      currentLap: 1,
      checkpoint: 0,
      weapon: null,
      spinTimer: 0
    };

    this.aiKarts = [
      { x: 310, y: 550, angle: 0, speed: 6.8, currentLap: 1, checkpoint: 0, color: '#f43f5e', name: 'Blaze' },
      { x: 280, y: 535, angle: 0, speed: 6.5, currentLap: 1, checkpoint: 0, color: '#06b6d4', name: 'Volt' },
      { x: 340, y: 535, angle: 0, speed: 6.2, currentLap: 1, checkpoint: 0, color: '#fbbf24', name: 'Apex' }
    ];

    // Checkpoints around oval track
    this.checkpoints = [
      { x: 480, y: 480, radius: 80 },
      { x: 480, y: 150, radius: 80 },
      { x: 310, y: 100, radius: 80 },
      { x: 140, y: 150, radius: 80 },
      { x: 140, y: 480, radius: 80 },
      { x: 310, y: 520, radius: 80 }
    ];

    this.missiles = [];
    this.oilSlicks = [];
    this.itemBoxes = [
      { x: 480, y: 310, active: true },
      { x: 140, y: 310, active: true }
    ];
    this.particles = [];

    this.totalLaps = 3;
    this.score = 0;
    this.highScore = window.storageManager.getHighScore(this.id);
    this.gameState = 'idle'; // 'idle', 'playing', 'gameover', 'victory'
    this.keys = {};

    this.bindEvents();
    this.render();
  }

  setupCanvas() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.maxHeight = '620px';
    this.canvas.style.objectFit = 'contain';
  }

  reset() {
    this.player.x = 310;
    this.player.y = 520;
    this.player.angle = 0;
    this.player.speed = 0;
    this.player.currentLap = 1;
    this.player.checkpoint = 0;
    this.player.weapon = null;
    this.player.spinTimer = 0;

    this.aiKarts.forEach((ai, idx) => {
      ai.x = 310 + (idx - 1) * 30;
      ai.y = 550;
      ai.angle = 0;
      ai.speed = 6.2 + Math.random() * 0.8;
      ai.currentLap = 1;
      ai.checkpoint = 0;
    });

    this.missiles = [];
    this.oilSlicks = [];
    this.particles = [];
    this.score = 0;
    if (this.onScoreUpdate) this.onScoreUpdate(this.score);
  }

  bindEvents() {
    this.handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      this.keys[e.code] = true;

      if (this.gameState === 'idle') {
        this.gameState = 'playing';
        this.loop();
        return;
      }
      if (this.gameState === 'gameover' || this.gameState === 'victory') {
        this.reset();
        this.gameState = 'playing';
        this.loop();
        return;
      }

      if (e.code === 'Space') {
        this.fireWeapon();
      }
    };

    this.handleKeyUp = (e) => {
      this.keys[e.code] = false;
    };

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  fireWeapon() {
    if (!this.player.weapon) return;

    if (this.player.weapon === 'missile') {
      this.missiles.push({
        x: this.player.x,
        y: this.player.y,
        angle: this.player.angle,
        speed: 15
      });
      if (window.soundEngine) window.soundEngine.playJump();
    } else if (this.player.weapon === 'oil') {
      this.oilSlicks.push({
        x: this.player.x - Math.cos(this.player.angle) * 25,
        y: this.player.y - Math.sin(this.player.angle) * 25
      });
      if (window.soundEngine) window.soundEngine.playHover();
    } else if (this.player.weapon === 'turbo') {
      this.player.speed = 13;
      if (window.soundEngine) window.soundEngine.playPowerup();
    }

    this.player.weapon = null;
  }

  spawnSparks(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        color,
        size: Math.random() * 3 + 2,
        life: 18
      });
    }
  }

  update() {
    if (this.gameState !== 'playing') return;

    const p = this.player;

    // Spinout recovery
    if (p.spinTimer > 0) {
      p.spinTimer--;
      p.angle += 0.3;
      p.speed *= 0.9;
    } else {
      // Steer
      if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
        p.angle -= p.turnSpeed * (Math.abs(p.speed) / p.maxSpeed);
        if (Math.abs(p.speed) > 4) this.spawnSparks(p.x, p.y, 'rgba(255,255,255,0.4)', 1);
      }
      if (this.keys['ArrowRight'] || this.keys['KeyD']) {
        p.angle += p.turnSpeed * (Math.abs(p.speed) / p.maxSpeed);
        if (Math.abs(p.speed) > 4) this.spawnSparks(p.x, p.y, 'rgba(255,255,255,0.4)', 1);
      }

      // Acceleration / Brake
      if (this.keys['ArrowUp'] || this.keys['KeyW']) {
        p.speed = Math.min(p.maxSpeed, p.speed + p.accel);
      } else if (this.keys['ArrowDown'] || this.keys['KeyS']) {
        p.speed = Math.max(-3, p.speed - p.accel * 1.5);
      } else {
        p.speed *= p.friction;
      }
    }

    p.x += Math.cos(p.angle) * p.speed;
    p.y += Math.sin(p.angle) * p.speed;

    // Checkpoint navigation for Player
    const targetCp = this.checkpoints[p.checkpoint];
    if (Math.hypot(p.x - targetCp.x, p.y - targetCp.y) < targetCp.radius) {
      p.checkpoint = (p.checkpoint + 1) % this.checkpoints.length;
      if (p.checkpoint === 0) {
        p.currentLap++;
        this.score += 500;
        window.storageManager.addXP(50);
        if (this.onScoreUpdate) this.onScoreUpdate(this.score);
        if (window.soundEngine) window.soundEngine.playScore();

        if (p.currentLap > this.totalLaps) {
          this.gameState = 'victory';
          if (window.soundEngine) window.soundEngine.playVictory();
          const res = window.storageManager.setHighScore(this.id, this.score);
          this.highScore = res.score;
          if (this.onGameOver) this.onGameOver(this.score, this.highScore, res.isNew);
        }
      }
    }

    // Update AI Karts
    this.aiKarts.forEach(ai => {
      const cp = this.checkpoints[ai.checkpoint];
      const targetAngle = Math.atan2(cp.y - ai.y, cp.x - ai.x);
      const angleDiff = targetAngle - ai.angle;
      ai.angle += Math.sin(angleDiff) * 0.07;

      ai.x += Math.cos(ai.angle) * ai.speed;
      ai.y += Math.sin(ai.angle) * ai.speed;

      if (Math.hypot(ai.x - cp.x, ai.y - cp.y) < cp.radius) {
        ai.checkpoint = (ai.checkpoint + 1) % this.checkpoints.length;
        if (ai.checkpoint === 0) ai.currentLap++;
      }
    });

    // Item Boxes
    this.itemBoxes.forEach(box => {
      if (Math.hypot(p.x - box.x, p.y - box.y) < 24 && !p.weapon) {
        const weapons = ['missile', 'oil', 'turbo'];
        p.weapon = weapons[Math.floor(Math.random() * weapons.length)];
        this.spawnSparks(box.x, box.y, '#fbbf24', 10);
        if (window.soundEngine) window.soundEngine.playPowerup();
      }
    });

    // Oil Slicks Collision
    this.oilSlicks.forEach((oil, idx) => {
      if (Math.hypot(p.x - oil.x, p.y - oil.y) < 26) {
        p.spinTimer = 35;
        this.oilSlicks.splice(idx, 1);
        if (window.soundEngine) window.soundEngine.playHit();
      }
    });

    // Missiles
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];
      m.x += Math.cos(m.angle) * m.speed;
      m.y += Math.sin(m.angle) * m.speed;

      // Hit AI karts
      this.aiKarts.forEach(ai => {
        if (Math.hypot(m.x - ai.x, m.y - ai.y) < 28) {
          ai.speed = 1;
          setTimeout(() => { ai.speed = 6.5; }, 1500);
          this.spawnSparks(ai.x, ai.y, '#f43f5e', 20);
          this.missiles.splice(i, 1);
          if (window.soundEngine) window.soundEngine.playHit();
        }
      });

      if (m.x < 0 || m.x > this.width || m.y < 0 || m.y > this.height) {
        this.missiles.splice(i, 1);
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

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Grass / Outer Ground
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, this.width, this.height);

    // Outer Track Ring
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(this.width / 2, this.height / 2, 240, 240, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner Island
    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.ellipse(this.width / 2, this.height / 2, 110, 110, 0, 0, Math.PI * 2);
    ctx.fill();

    // Finish / Start Line
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(290, 470, 40, 100);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(290, 470, 20, 50);
    ctx.fillRect(310, 520, 20, 50);

    // Item Boxes
    this.itemBoxes.forEach(box => {
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(box.x - 12, box.y - 12, 24, 24, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', box.x, box.y);
      ctx.shadowBlur = 0;
    });

    // Oil Slicks
    this.oilSlicks.forEach(oil => {
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.ellipse(oil.x, oil.y, 16, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Missiles
    this.missiles.forEach(m => {
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw AI Karts
    this.aiKarts.forEach(ai => {
      ctx.save();
      ctx.translate(ai.x, ai.y);
      ctx.rotate(ai.angle);
      ctx.fillStyle = ai.color;
      ctx.beginPath();
      ctx.roundRect(-14, -9, 28, 18, 5);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-6, -6, 12, 12);
      ctx.restore();
    });

    // Draw Player Kart
    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    ctx.rotate(this.player.angle);
    ctx.fillStyle = '#a855f7';
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(-16, -10, 32, 20, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4, -10, 8, 20);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-6, -6, 12, 12);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Draw Particles
    this.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // HUD Display
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`LAP: ${Math.min(this.totalLaps, this.player.currentLap)} / ${this.totalLaps}`, 20, 36);

    ctx.textAlign = 'right';
    if (this.player.weapon) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`WEAPON: [${this.player.weapon.toUpperCase()}] SPACEBAR`, this.width - 20, 36);
    }

    // Overlays
    if (this.gameState === 'idle') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NITRO KART FRENZY', this.width / 2, this.height / 2 - 35);

      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('WASD / ARROWS TO DRIVE & DRIFT', this.width / 2, this.height / 2 + 10);

      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('COLLECT MYSTERY BOXES & PRESS SPACE TO FIRE!', this.width / 2, this.height / 2 + 38);
    } else if (this.gameState === 'victory') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('1ST PLACE VICTORY! 🏆', this.width / 2, this.height / 2 - 35);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Outfit, sans-serif';
      ctx.fillText(`SCORE: ${this.score}`, this.width / 2, this.height / 2 + 8);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('PRESS ANY KEY TO RACE AGAIN', this.width / 2, this.height / 2 + 55);
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
  }
}

window.NitroKartGame = NitroKartGame;
