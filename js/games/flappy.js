/**
 * Cyber Dash (Neon Flappy)
 * High-octane arcade runner with particle trails, neon gates, and sound FX.
 */
class CyberDashGame {
  constructor(canvas, container, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.container = container;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    this.id = 'cyber-dash';

    this.width = 640;
    this.height = 480;
    this.setupCanvas();

    this.bird = {
      x: 120,
      y: this.height / 2,
      vy: 0,
      radius: 16,
      gravity: 0.38,
      jump: -6.8,
      rotation: 0
    };

    this.pipes = [];
    this.particles = [];
    this.stars = [];
    this.score = 0;
    this.highScore = window.storageManager.getHighScore(this.id);
    this.gameState = 'idle'; // 'idle', 'playing', 'gameover'
    this.pipeTimer = 0;
    this.animationId = null;

    this.initStars();
    this.bindEvents();
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

  initStars() {
    this.stars = [];
    for (let i = 0; i < 60; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        speed: 0.5 + Math.random() * 1.5,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.7 + 0.3
      });
    }
  }

  bindEvents() {
    this.handleAction = (e) => {
      if (e.type === 'keydown' && e.code !== 'Space' && e.code !== 'ArrowUp') return;
      if (e.preventDefault && (e.code === 'Space' || e.code === 'ArrowUp')) {
        e.preventDefault();
      }

      if (this.gameState === 'idle') {
        this.gameState = 'playing';
        this.bird.vy = this.bird.jump;
        if (window.soundEngine) window.soundEngine.playJump();
        this.loop();
      } else if (this.gameState === 'playing') {
        this.bird.vy = this.bird.jump;
        this.spawnSparks(this.bird.x, this.bird.y + 10, '#ec4899');
        if (window.soundEngine) window.soundEngine.playJump();
      } else if (this.gameState === 'gameover') {
        this.reset();
        this.gameState = 'playing';
        this.bird.vy = this.bird.jump;
        this.loop();
      }
    };

    window.addEventListener('keydown', this.handleAction);
    this.canvas.addEventListener('pointerdown', this.handleAction);
  }

  spawnSparks(x, y, color) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.7) * 4 - 2,
        vy: (Math.random() - 0.5) * 4,
        size: Math.random() * 3 + 1,
        color: color || '#f472b6',
        alpha: 1,
        life: 25
      });
    }
  }

  spawnPipe() {
    const gap = 135;
    const minHeight = 60;
    const maxHeight = this.height - gap - minHeight;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;

    this.pipes.push({
      x: this.width + 30,
      top: topHeight,
      bottom: this.height - (topHeight + gap),
      width: 52,
      passed: false
    });
  }

  reset() {
    this.bird.y = this.height / 2;
    this.bird.vy = 0;
    this.bird.rotation = 0;
    this.pipes = [];
    this.particles = [];
    this.score = 0;
    this.pipeTimer = 0;
    if (this.onScoreUpdate) this.onScoreUpdate(this.score);
  }

  update() {
    // Background Stars
    this.stars.forEach(s => {
      s.x -= s.speed;
      if (s.x < 0) s.x = this.width;
    });

    if (this.gameState !== 'playing') return;

    // Bird Physics
    this.bird.vy += this.bird.gravity;
    this.bird.y += this.bird.vy;
    this.bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 5, this.bird.vy * 0.06));

    // Thruster exhaust
    if (Math.random() > 0.4) {
      this.particles.push({
        x: this.bird.x - 14,
        y: this.bird.y + Math.sin(this.bird.rotation) * 8,
        vx: -3 - Math.random() * 2,
        vy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 4 + 1.5,
        color: Math.random() > 0.5 ? '#06b6d4' : '#ec4899',
        alpha: 0.9,
        life: 20
      });
    }

    // Floor and Ceiling Collision
    if (this.bird.y + this.bird.radius >= this.height - 10 || this.bird.y - this.bird.radius <= 0) {
      this.triggerDeath();
      return;
    }

    // Pipes generator
    this.pipeTimer++;
    if (this.pipeTimer >= 95) {
      this.spawnPipe();
      this.pipeTimer = 0;
    }

    // Update Pipes
    const pipeSpeed = 2.4 + Math.min(1.5, this.score * 0.05);
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const p = this.pipes[i];
      p.x -= pipeSpeed;

      // Score check
      if (!p.passed && p.x + p.width < this.bird.x) {
        p.passed = true;
        this.score++;
        window.storageManager.addXP(10);
        if (this.onScoreUpdate) this.onScoreUpdate(this.score);
        if (window.soundEngine) window.soundEngine.playScore();
      }

      // Bird vs Pipe Collision (AABB vs Circle)
      const topPipeRect = { x: p.x, y: 0, w: p.width, h: p.top };
      const botPipeRect = { x: p.x, y: this.height - p.bottom, w: p.width, h: p.bottom };

      if (this.checkCollision(this.bird, topPipeRect) || this.checkCollision(this.bird, botPipeRect)) {
        this.triggerDeath();
        return;
      }

      // Remove off-screen pipes
      if (p.x + p.width < -20) {
        this.pipes.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      pt.alpha = pt.life / 25;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  checkCollision(circle, rect) {
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
    const distX = circle.x - closestX;
    const distY = circle.y - closestY;
    return (distX * distX + distY * distY) < (circle.radius - 2) * (circle.radius - 2);
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
    this.spawnSparks(this.bird.x, this.bird.y, '#f43f5e');
  }

  render() {
    const ctx = this.ctx;

    // Background Cyber Grid
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, '#0b0f19');
    bgGrad.addColorStop(0.6, '#180d2b');
    bgGrad.addColorStop(1, '#05070e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Starfield
    this.stars.forEach(s => {
      ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Floor grid lines
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.2)';
    ctx.lineWidth = 1;
    for (let y = this.height - 30; y < this.height; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Pipes (Neon Energy Conduits)
    this.pipes.forEach(p => {
      // Top Pipe
      const topGrad = ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
      topGrad.addColorStop(0, '#0891b2');
      topGrad.addColorStop(0.5, '#06b6d4');
      topGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = topGrad;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.fillRect(p.x, 0, p.width, p.top);
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(p.x - 3, p.top - 12, p.width + 6, 12);

      // Bottom Pipe
      const botY = this.height - p.bottom;
      const botGrad = ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
      botGrad.addColorStop(0, '#0891b2');
      botGrad.addColorStop(0.5, '#06b6d4');
      botGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = botGrad;
      ctx.fillRect(p.x, botY, p.width, p.bottom);
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(p.x - 3, botY, p.width + 6, 12);

      ctx.shadowBlur = 0;
    });

    // Particles
    this.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = pt.alpha;
      ctx.shadowColor = pt.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Bird (Cyber Drone)
    ctx.save();
    ctx.translate(this.bird.x, this.bird.y);
    ctx.rotate(this.bird.rotation);

    // Drone Outer Glow
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.ellipse(0, 0, this.bird.radius, this.bird.radius * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing & Cockpit
    ctx.fillStyle = '#fdf2f8';
    ctx.beginPath();
    ctx.arc(4, -3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(5, -3, 2, 0, Math.PI * 2);
    ctx.fill();

    // Beak / Thruster Visor
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(17, 3);
    ctx.lineTo(8, 7);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
    ctx.shadowBlur = 0;

    // HUD overlays
    if (this.gameState === 'idle') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CYBER DASH', this.width / 2, this.height / 2 - 30);

      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ec4899';
      ctx.fillText('PRESS SPACEBAR OR CLICK TO FLAP', this.width / 2, this.height / 2 + 15);

      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`BEST SCORE: ${this.highScore}`, this.width / 2, this.height / 2 + 45);
    } else if (this.gameState === 'playing') {
      // Live Score
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 8;
      ctx.fillText(this.score, this.width / 2, 50);
      ctx.shadowBlur = 0;
    } else if (this.gameState === 'gameover') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 32px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 12;
      ctx.fillText('SYSTEM CRASH', this.width / 2, this.height / 2 - 50);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Outfit, sans-serif';
      ctx.fillText(`SCORE: ${this.score}`, this.width / 2, this.height / 2 - 10);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`BEST RECORD: ${this.highScore}`, this.width / 2, this.height / 2 + 20);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('TAP OR PRESS SPACE TO RESTART', this.width / 2, this.height / 2 + 65);
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
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    window.removeEventListener('keydown', this.handleAction);
    this.canvas.removeEventListener('pointerdown', this.handleAction);
  }
}

window.CyberDashGame = CyberDashGame;
