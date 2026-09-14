/**
 * Galaxy Defender
 * Top-down space arcade shooter with enemy formations, weapon drops, and laser volleys.
 */
class GalaxyDefenderGame {
  constructor(canvas, container, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.container = container;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    this.id = 'galaxy-defender';

    this.width = 600;
    this.height = 650;
    this.setupCanvas();

    this.player = {
      x: this.width / 2,
      y: this.height - 80,
      width: 36,
      height: 44,
      speed: 6.5,
      shields: 3,
      weaponLevel: 1,
      invulnerable: 0
    };

    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.asteroids = [];
    this.particles = [];
    this.powerups = [];
    this.stars = [];

    this.score = 0;
    this.wave = 1;
    this.highScore = window.storageManager.getHighScore(this.id);
    this.gameState = 'idle'; // 'idle', 'playing', 'gameover'
    this.screenShake = 0;

    this.keys = {};
    this.lastShotTime = 0;
    this.fireRate = 180; // ms

    this.initStars();
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

  initStars() {
    this.stars = [];
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        speed: 1 + Math.random() * 3,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.7 + 0.3
      });
    }
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
      } else if (this.gameState === 'gameover') {
        this.reset();
        this.gameState = 'playing';
        this.loop();
      }
    };

    this.handleKeyUp = (e) => {
      this.keys[e.code] = false;
    };

    // Mouse / Touch Controls
    let isPointerDown = false;
    this.handlePointerDown = (e) => {
      isPointerDown = true;
      if (this.gameState === 'idle') {
        this.gameState = 'playing';
        this.loop();
      } else if (this.gameState === 'gameover') {
        this.reset();
        this.gameState = 'playing';
        this.loop();
      }
      this.updatePointerPos(e);
    };

    this.handlePointerMove = (e) => {
      if (isPointerDown && this.gameState === 'playing') {
        this.updatePointerPos(e);
      }
    };

    this.handlePointerUp = () => {
      isPointerDown = false;
    };

    this.updatePointerPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const clientX = (e.clientX - rect.left) * scaleX;
      const clientY = (e.clientY - rect.top) * scaleY;
      this.player.x = Math.max(20, Math.min(this.width - 20, clientX));
      this.player.y = Math.max(60, Math.min(this.height - 40, clientY));
      this.fireBullet();
    };

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
  }

  reset() {
    this.player.x = this.width / 2;
    this.player.y = this.height - 80;
    this.player.shields = 3;
    this.player.weaponLevel = 1;
    this.player.invulnerable = 60;
    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.asteroids = [];
    this.particles = [];
    this.powerups = [];
    this.score = 0;
    this.wave = 1;
    if (this.onScoreUpdate) this.onScoreUpdate(this.score);
  }

  fireBullet() {
    const now = performance.now();
    if (now - this.lastShotTime < this.fireRate) return;
    this.lastShotTime = now;

    if (window.soundEngine) window.soundEngine.playJump();

    if (this.player.weaponLevel === 1) {
      this.bullets.push({ x: this.player.x, y: this.player.y - 20, vx: 0, vy: -12 });
    } else if (this.player.weaponLevel === 2) {
      this.bullets.push({ x: this.player.x - 10, y: this.player.y - 15, vx: 0, vy: -12 });
      this.bullets.push({ x: this.player.x + 10, y: this.player.y - 15, vx: 0, vy: -12 });
    } else {
      this.bullets.push({ x: this.player.x, y: this.player.y - 20, vx: 0, vy: -12 });
      this.bullets.push({ x: this.player.x - 12, y: this.player.y - 15, vx: -2.5, vy: -11 });
      this.bullets.push({ x: this.player.x + 12, y: this.player.y - 15, vx: 2.5, vy: -11 });
    }
  }

  spawnEnemy() {
    const types = ['fighter', 'cruiser', 'kamikaze'];
    const type = types[Math.floor(Math.random() * types.length)];
    this.enemies.push({
      x: 40 + Math.random() * (this.width - 80),
      y: -40,
      type,
      width: type === 'cruiser' ? 44 : 32,
      height: type === 'cruiser' ? 44 : 32,
      hp: type === 'cruiser' ? 3 : 1,
      speed: type === 'kamikaze' ? 3.5 : (1.8 + Math.random() * 1.2),
      shootCooldown: Math.random() * 80 + 60,
      sineOffset: Math.random() * Math.PI * 2
    });
  }

  spawnAsteroid() {
    this.asteroids.push({
      x: 30 + Math.random() * (this.width - 60),
      y: -50,
      radius: 18 + Math.random() * 16,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 1.5 + Math.random() * 2,
      rotation: 0,
      vRot: (Math.random() - 0.5) * 0.05,
      hp: 2
    });
  }

  spawnExplosion(x, y, color = '#f59e0b', count = 12) {
    this.screenShake = 6;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color,
        life: 25,
        maxLife: 25
      });
    }
  }

  update() {
    // Stars
    this.stars.forEach(s => {
      s.y += s.speed;
      if (s.y > this.height) {
        s.y = 0;
        s.x = Math.random() * this.width;
      }
    });

    if (this.screenShake > 0) this.screenShake *= 0.85;

    if (this.gameState !== 'playing') return;

    if (this.player.invulnerable > 0) this.player.invulnerable--;

    // Keyboard Movement
    const p = this.player;
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) p.x -= p.speed;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) p.x += p.speed;
    if (this.keys['ArrowUp'] || this.keys['KeyW']) p.y -= p.speed;
    if (this.keys['ArrowDown'] || this.keys['KeyS']) p.y += p.speed;
    if (this.keys['Space']) this.fireBullet();

    p.x = Math.max(20, Math.min(this.width - 20, p.x));
    p.y = Math.max(60, Math.min(this.height - 40, p.y));

    // Player Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      if (b.y < -20 || b.x < -10 || b.x > this.width + 10) {
        this.bullets.splice(i, 1);
      }
    }

    // Enemy Bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const eb = this.enemyBullets[i];
      eb.x += eb.vx;
      eb.y += eb.vy;

      // Hit player
      if (this.player.invulnerable <= 0 && Math.hypot(eb.x - p.x, eb.y - p.y) < 18) {
        this.enemyBullets.splice(i, 1);
        this.hitPlayer();
        continue;
      }

      if (eb.y > this.height + 20) {
        this.enemyBullets.splice(i, 1);
      }
    }

    // Spawn waves
    if (Math.random() < 0.025) this.spawnEnemy();
    if (Math.random() < 0.015) this.spawnAsteroid();

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.y += e.speed;
      if (e.type === 'fighter') {
        e.x += Math.sin(e.y * 0.03 + e.sineOffset) * 2;
      }

      // Enemy Shoot
      e.shootCooldown--;
      if (e.shootCooldown <= 0 && e.type !== 'kamikaze' && e.y > 0 && e.y < this.height - 150) {
        this.enemyBullets.push({
          x: e.x,
          y: e.y + 15,
          vx: (p.x - e.x) * 0.01,
          vy: 4.5
        });
        e.shootCooldown = 120 + Math.random() * 60;
      }

      // Bullet hit enemy
      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const b = this.bullets[j];
        if (Math.hypot(b.x - e.x, b.y - e.y) < e.width / 2 + 8) {
          this.bullets.splice(j, 1);
          e.hp--;
          this.spawnExplosion(b.x, b.y, '#38bdf8', 4);
          if (e.hp <= 0) {
            this.spawnExplosion(e.x, e.y, '#f43f5e', 14);
            if (window.soundEngine) window.soundEngine.playHit();
            this.score += e.type === 'cruiser' ? 50 : 25;
            window.storageManager.addXP(e.type === 'cruiser' ? 15 : 10);
            if (this.onScoreUpdate) this.onScoreUpdate(this.score);

            // Power-up chance
            if (Math.random() < 0.2) {
              this.powerups.push({
                x: e.x,
                y: e.y,
                type: Math.random() > 0.5 ? 'weapon' : 'shield',
                vy: 1.5
              });
            }

            this.enemies.splice(i, 1);
            break;
          }
        }
      }

      // Enemy hit player
      if (this.enemies[i] && this.player.invulnerable <= 0 && Math.hypot(e.x - p.x, e.y - p.y) < 26) {
        this.spawnExplosion(e.x, e.y, '#f43f5e', 12);
        this.enemies.splice(i, 1);
        this.hitPlayer();
        continue;
      }

      if (e.y > this.height + 40) {
        this.enemies.splice(i, 1);
      }
    }

    // Update Asteroids
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const a = this.asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      a.rotation += a.vRot;

      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const b = this.bullets[j];
        if (Math.hypot(b.x - a.x, b.y - a.y) < a.radius + 4) {
          this.bullets.splice(j, 1);
          a.hp--;
          this.spawnExplosion(b.x, b.y, '#94a3b8', 4);
          if (a.hp <= 0) {
            this.spawnExplosion(a.x, a.y, '#cbd5e1', 10);
            if (window.soundEngine) window.soundEngine.playHit();
            this.score += 15;
            if (this.onScoreUpdate) this.onScoreUpdate(this.score);
            this.asteroids.splice(i, 1);
            break;
          }
        }
      }

      if (this.asteroids[i] && this.player.invulnerable <= 0 && Math.hypot(a.x - p.x, a.y - p.y) < a.radius + 14) {
        this.spawnExplosion(a.x, a.y, '#94a3b8', 12);
        this.asteroids.splice(i, 1);
        this.hitPlayer();
        continue;
      }

      if (a.y > this.height + 60) {
        this.asteroids.splice(i, 1);
      }
    }

    // Powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pw = this.powerups[i];
      pw.y += pw.vy;

      if (Math.hypot(pw.x - p.x, pw.y - p.y) < 28) {
        if (pw.type === 'weapon') {
          this.player.weaponLevel = Math.min(3, this.player.weaponLevel + 1);
        } else {
          this.player.shields = Math.min(4, this.player.shields + 1);
        }
        if (window.soundEngine) window.soundEngine.playPowerup();
        this.spawnExplosion(pw.x, pw.y, '#10b981', 8);
        this.powerups.splice(i, 1);
        continue;
      }

      if (pw.y > this.height + 30) {
        this.powerups.splice(i, 1);
      }
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  hitPlayer() {
    this.player.shields--;
    this.player.invulnerable = 60;
    this.spawnExplosion(this.player.x, this.player.y, '#ef4444', 16);
    if (window.soundEngine) window.soundEngine.playHit();

    if (this.player.shields <= 0) {
      this.gameState = 'gameover';
      if (window.soundEngine) window.soundEngine.playGameOver();
      const res = window.storageManager.setHighScore(this.id, this.score);
      this.highScore = res.score;
      if (this.onGameOver) this.onGameOver(this.score, this.highScore, res.isNew);
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.save();

    // Screen Shake
    if (this.screenShake > 0.5) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    ctx.fillStyle = '#050711';
    ctx.fillRect(0, 0, this.width, this.height);

    // Stars
    this.stars.forEach(s => {
      ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Asteroids
    this.asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rotation);
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    // Draw Player Bullets
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 10;
    this.bullets.forEach(b => {
      ctx.beginPath();
      ctx.roundRect(b.x - 2.5, b.y - 8, 5, 16, 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Draw Enemy Bullets
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#e11d48';
    ctx.shadowBlur = 8;
    this.enemyBullets.forEach(eb => {
      ctx.beginPath();
      ctx.arc(eb.x, eb.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Draw Enemies
    this.enemies.forEach(e => {
      ctx.save();
      ctx.translate(e.x, e.y);
      if (e.type === 'cruiser') {
        ctx.fillStyle = '#7c3aed';
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(20, -18);
        ctx.lineTo(-20, -18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(14, -14);
        ctx.lineTo(0, -6);
        ctx.lineTo(-14, -14);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    });

    // Draw Powerups
    this.powerups.forEach(pw => {
      ctx.fillStyle = pw.type === 'weapon' ? '#fbbf24' : '#06b6d4';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(pw.x, pw.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pw.type === 'weapon' ? 'W' : 'S', pw.x, pw.y);
    });

    // Draw Particles
    this.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = pt.life / pt.maxLife;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw Player Ship
    if (this.gameState !== 'gameover') {
      const p = this.player;
      if (p.invulnerable % 8 < 4) {
        ctx.save();
        ctx.translate(p.x, p.y);

        // Thruster flame
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0ea5e9';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(-6, 18);
        ctx.lineTo(0, 26 + Math.random() * 8);
        ctx.lineTo(6, 18);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Ship Body
        ctx.fillStyle = '#6366f1';
        ctx.strokeStyle = '#a5b4fc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(16, 18);
        ctx.lineTo(0, 10);
        ctx.lineTo(-16, 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cockpit
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, -4, 4, 0, Math.PI * 2);
        ctx.fill();

        // Shield Aura
        if (p.shields > 1) {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 24, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    // HUD Status (Score, Shields)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${this.score}`, 20, 36);

    ctx.textAlign = 'right';
    const shieldsDisplay = '🛡️ '.repeat(Math.max(0, this.player.shields));
    ctx.fillText(shieldsDisplay, this.width - 20, 36);

    // Overlays
    if (this.gameState === 'idle') {
      ctx.fillStyle = 'rgba(5, 7, 17, 0.8)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#6366f1';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GALAXY DEFENDER', this.width / 2, this.height / 2 - 35);

      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('USE WASD / ARROWS & SPACEBAR TO BLAST', this.width / 2, this.height / 2 + 10);

      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('OR DRAG MOUSE / FINGER ON SCREEN', this.width / 2, this.height / 2 + 35);
    } else if (this.gameState === 'gameover') {
      ctx.fillStyle = 'rgba(5, 7, 17, 0.85)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 34px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('STARSHIP DESTROYED', this.width / 2, this.height / 2 - 35);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Outfit, sans-serif';
      ctx.fillText(`FINAL SCORE: ${this.score}`, this.width / 2, this.height / 2 + 8);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('PRESS ANY KEY OR TAP TO REDEPLOY', this.width / 2, this.height / 2 + 55);
    }

    ctx.restore();
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
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
  }
}

window.GalaxyDefenderGame = GalaxyDefenderGame;
