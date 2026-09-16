/**
 * Cosmic Jumper
 * Endless vertical platform jumping arcade with springs, boosters, and altitude scoring.
 */
class CosmicJumperGame {
  constructor(canvas, container, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.container = container;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    this.id = 'cosmic-jumper';

    this.width = 450;
    this.height = 650;
    this.setupCanvas();

    this.player = {
      x: this.width / 2,
      y: this.height - 120,
      radius: 16,
      vx: 0,
      vy: 0,
      jumpPower: -12.5,
      gravity: 0.38,
      facingRight: true
    };

    this.platforms = [];
    this.particles = [];
    this.stars = [];
    this.maxAltitude = 0;
    this.score = 0;
    this.highScore = window.storageManager.getHighScore(this.id);
    this.gameState = 'idle'; // 'idle', 'playing', 'gameover'
    this.keys = {};

    this.initStars();
    this.bindEvents();
    this.reset();
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
    for (let i = 0; i < 70; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.8 + 0.2
      });
    }
  }

  reset() {
    this.player.x = this.width / 2;
    this.player.y = this.height - 120;
    this.player.vx = 0;
    this.player.vy = this.player.jumpPower;
    this.maxAltitude = 0;
    this.score = 0;
    this.particles = [];

    // Initial platforms
    this.platforms = [
      { x: this.width / 2 - 40, y: this.height - 50, w: 80, h: 14, type: 'standard' }
    ];

    let currentY = this.height - 120;
    while (currentY > 0) {
      const type = Math.random() < 0.15 ? 'moving' : (Math.random() < 0.12 ? 'spring' : 'standard');
      this.platforms.push({
        x: Math.random() * (this.width - 80),
        y: currentY,
        w: 75,
        h: 14,
        type,
        vx: type === 'moving' ? (Math.random() > 0.5 ? 2 : -2) : 0
      });
      currentY -= 55 + Math.random() * 35;
    }

    if (this.onScoreUpdate) this.onScoreUpdate(this.score);
  }

  bindEvents() {
    this.handleKeyDown = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
      this.keys[e.code] = true;

      if (this.gameState === 'idle') {
        this.gameState = 'playing';
        this.player.vy = this.player.jumpPower;
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

    // Mobile / Pointer control (tap left/right side of screen)
    this.handlePointerDown = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      if (clientX < rect.width / 2) {
        this.keys['ArrowLeft'] = true;
      } else {
        this.keys['ArrowRight'] = true;
      }

      if (this.gameState === 'idle') {
        this.gameState = 'playing';
        this.loop();
      } else if (this.gameState === 'gameover') {
        this.reset();
        this.gameState = 'playing';
        this.loop();
      }
    };

    this.handlePointerUp = () => {
      this.keys['ArrowLeft'] = false;
      this.keys['ArrowRight'] = false;
    };

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointerup', this.handlePointerUp);
  }

  spawnSparks(x, y, color) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: Math.random() * 3 + 1,
        color,
        life: 18
      });
    }
  }

  update() {
    if (this.gameState !== 'playing') return;

    const p = this.player;

    // Left / Right Movement
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      p.vx = -6.5;
      p.facingRight = false;
    } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      p.vx = 6.5;
      p.facingRight = true;
    } else {
      p.vx *= 0.82;
    }

    p.x += p.vx;

    // Screen wrap
    if (p.x < -p.radius) p.x = this.width + p.radius;
    if (p.x > this.width + p.radius) p.x = -p.radius;

    // Vertical Physics
    p.vy += p.gravity;
    p.y += p.vy;

    // Platform bouncing (only when falling downward)
    if (p.vy > 0) {
      this.platforms.forEach(plat => {
        if (p.x + p.radius * 0.6 > plat.x &&
            p.x - p.radius * 0.6 < plat.x + plat.w &&
            p.y + p.radius >= plat.y &&
            p.y - p.radius <= plat.y + plat.h) {
          
          if (plat.type === 'spring') {
            p.vy = this.player.jumpPower * 1.55; // Super spring bounce!
            this.spawnSparks(p.x, plat.y, '#fbbf24');
            if (window.soundEngine) window.soundEngine.playPowerup();
          } else {
            p.vy = this.player.jumpPower;
            this.spawnSparks(p.x, plat.y, '#06b6d4');
            if (window.soundEngine) window.soundEngine.playJump();
          }
        }
      });
    }

    // Scroll Camera Upwards
    if (p.y < this.height * 0.45) {
      const deltaY = (this.height * 0.45) - p.y;
      p.y = this.height * 0.45;
      this.maxAltitude += Math.round(deltaY);
      this.score = this.maxAltitude;
      if (this.onScoreUpdate) this.onScoreUpdate(this.score);

      // Scroll stars
      this.stars.forEach(s => {
        s.y += deltaY * 0.3;
        if (s.y > this.height) s.y = 0;
      });

      // Scroll platforms
      this.platforms.forEach(plat => {
        plat.y += deltaY;
      });

      // Spawn new platforms as old ones drop below screen
      this.platforms = this.platforms.filter(plat => plat.y < this.height + 40);
      let highestPlatY = Math.min(...this.platforms.map(plat => plat.y));

      while (highestPlatY > 0) {
        const type = Math.random() < 0.2 ? 'moving' : (Math.random() < 0.12 ? 'spring' : 'standard');
        const newY = highestPlatY - (55 + Math.random() * 35);
        this.platforms.push({
          x: Math.random() * (this.width - 80),
          y: newY,
          w: 75,
          h: 14,
          type,
          vx: type === 'moving' ? (Math.random() > 0.5 ? 2.2 : -2.2) : 0
        });
        highestPlatY = newY;
      }
    }

    // Update Moving Platforms
    this.platforms.forEach(plat => {
      if (plat.type === 'moving') {
        plat.x += plat.vx;
        if (plat.x < 10 || plat.x + plat.w > this.width - 10) {
          plat.vx = -plat.vx;
        }
      }
    });

    // Check Fall Death
    if (p.y - p.radius > this.height) {
      this.gameState = 'gameover';
      if (window.soundEngine) {
        window.soundEngine.playHit();
        setTimeout(() => window.soundEngine.playGameOver(), 100);
      }
      window.storageManager.addXP(Math.floor(this.score / 20));
      const res = window.storageManager.setHighScore(this.id, this.score);
      this.highScore = res.score;
      if (this.onGameOver) this.onGameOver(this.score, this.highScore, res.isNew);
    }

    // Update Particles
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

    // Deep cosmic space background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, '#031424');
    bgGrad.addColorStop(0.6, '#082f49');
    bgGrad.addColorStop(1, '#0c4a6e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Stars
    this.stars.forEach(s => {
      ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Platforms
    this.platforms.forEach(plat => {
      if (plat.type === 'spring') {
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(plat.x, plat.y, plat.w, plat.h, 6);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Spring Coil Visual
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.roundRect(plat.x + plat.w / 2 - 8, plat.y - 6, 16, 6, 2);
        ctx.fill();
      } else if (plat.type === 'moving') {
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(plat.x, plat.y, plat.w, plat.h, 6);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = '#10b981';
        ctx.shadowColor = '#059669';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(plat.x, plat.y, plat.w, plat.h, 6);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // Draw Particles
    this.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Jumper Character (Cute Cosmic Alien)
    const p = this.player;
    ctx.save();
    ctx.translate(p.x, p.y);

    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Eye direction
    const eyeShift = p.facingRight ? 3 : -3;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-4 + eyeShift, -3, 4, 0, Math.PI * 2);
    ctx.arc(6 + eyeShift, -3, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-4 + eyeShift * 1.5, -3, 2, 0, Math.PI * 2);
    ctx.arc(6 + eyeShift * 1.5, -3, 2, 0, Math.PI * 2);
    ctx.fill();

    // Antenna
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -p.radius);
    ctx.lineTo(eyeShift, -p.radius - 8);
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(eyeShift, -p.radius - 8, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Score HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${this.score} m`, 20, 38);

    // Overlays
    if (this.gameState === 'idle') {
      ctx.fillStyle = 'rgba(3, 20, 36, 0.8)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('COSMIC JUMPER', this.width / 2, this.height / 2 - 30);

      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('A / D OR ARROWS TO MOVE HORIZONTALLY', this.width / 2, this.height / 2 + 15);

      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('YELLOW SPRINGS GIVE A MASSIVE SUPER JUMP! 🚀', this.width / 2, this.height / 2 + 45);
    } else if (this.gameState === 'gameover') {
      ctx.fillStyle = 'rgba(3, 20, 36, 0.85)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 34px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FELL INTO ORBIT', this.width / 2, this.height / 2 - 30);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Outfit, sans-serif';
      ctx.fillText(`ALTITUDE: ${this.score} m`, this.width / 2, this.height / 2 + 10);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('PRESS ANY KEY OR TAP TO TRY AGAIN', this.width / 2, this.height / 2 + 55);
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
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointerup', this.handlePointerUp);
  }
}

window.CosmicJumperGame = CosmicJumperGame;
