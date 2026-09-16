/**
 * Blade Master (Knife Hit Clone)
 * Precision blade throwing arcade into rotating cyber wheels with target slicing and boss wheels.
 */
class BladeMasterGame {
  constructor(canvas, container, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.container = container;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    this.id = 'blade-master';

    this.width = 480;
    this.height = 650;
    this.setupCanvas();

    this.target = {
      x: this.width / 2,
      y: 200,
      radius: 80,
      angle: 0,
      speed: 0.03,
      speedDir: 1
    };

    this.knivesNeeded = 7;
    this.knivesThrown = 0;
    this.embeddedKnives = []; // angles in radians
    this.flyingKnife = null;
    this.apples = []; // angles in radians
    this.particles = [];

    this.score = 0;
    this.stage = 1;
    this.highScore = window.storageManager.getHighScore(this.id);
    this.gameState = 'idle'; // 'idle', 'playing', 'gameover'

    this.initStage();
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

  initStage() {
    this.knivesNeeded = 6 + this.stage;
    this.knivesThrown = 0;
    this.embeddedKnives = [];
    this.flyingKnife = null;
    this.apples = [];

    // Pre-embedded obstacles on higher stages
    const preCount = Math.min(4, Math.floor(this.stage / 2));
    for (let i = 0; i < preCount; i++) {
      this.embeddedKnives.push((i * (Math.PI * 2 / (preCount + 2))) + Math.random() * 0.5);
    }

    // Spawn bonus crystals
    if (Math.random() < 0.7) {
      this.apples.push(Math.random() * Math.PI * 2);
    }

    // Target spin variation
    this.target.speed = (0.025 + this.stage * 0.005);
    this.target.speedDir = Math.random() > 0.5 ? 1 : -1;
  }

  reset() {
    this.score = 0;
    this.stage = 1;
    this.particles = [];
    this.initStage();
    if (this.onScoreUpdate) this.onScoreUpdate(this.score);
  }

  bindEvents() {
    this.handleAction = (e) => {
      if (e.type === 'keydown' && e.code !== 'Space') return;
      if (e.preventDefault && e.code === 'Space') e.preventDefault();

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

      this.throwKnife();
    };

    window.addEventListener('keydown', this.handleAction);
    this.canvas.addEventListener('pointerdown', this.handleAction);
  }

  throwKnife() {
    if (this.flyingKnife || this.gameState !== 'playing') return;

    this.flyingKnife = {
      x: this.width / 2,
      y: this.height - 110,
      vy: -22
    };

    if (window.soundEngine) window.soundEngine.playHover();
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

    // Rotate Target Wheel
    this.target.angle += this.target.speed * this.target.speedDir;

    // Sudden speed reversal on boss stages
    if (Math.random() < 0.015 && this.stage >= 2) {
      this.target.speedDir *= -1;
    }

    // Update Flying Knife
    if (this.flyingKnife) {
      this.flyingKnife.y += this.flyingKnife.vy;

      // Check hit with target wheel perimeter
      if (this.flyingKnife.y <= this.target.y + this.target.radius) {
        // Knife hit the wheel!
        const hitAngle = (Math.PI / 2 - this.target.angle) % (Math.PI * 2);
        const normalizedHitAngle = (hitAngle + Math.PI * 2) % (Math.PI * 2);

        // Check collision with already embedded knives
        let collision = false;
        for (let a of this.embeddedKnives) {
          const normA = (a + Math.PI * 2) % (Math.PI * 2);
          const diff = Math.abs(normA - normalizedHitAngle);
          const angleDist = Math.min(diff, Math.PI * 2 - diff);
          if (angleDist < 0.22) { // Knife collision threshold
            collision = true;
            break;
          }
        }

        if (collision) {
          // Clang into existing knife -> Game Over
          this.triggerCrash();
          return;
        }

        // Successfully embedded knife!
        this.embeddedKnives.push(normalizedHitAngle);
        this.knivesThrown++;
        this.score += 20;
        window.storageManager.addXP(5);
        if (this.onScoreUpdate) this.onScoreUpdate(this.score);

        if (window.soundEngine) window.soundEngine.playClick();
        this.spawnSparks(this.width / 2, this.target.y + this.target.radius, '#38bdf8', 12);

        // Check slicing bonus crystals
        for (let i = this.apples.length - 1; i >= 0; i--) {
          const appleAngle = (this.apples[i] + Math.PI * 2) % (Math.PI * 2);
          const diff = Math.abs(appleAngle - normalizedHitAngle);
          const angleDist = Math.min(diff, Math.PI * 2 - diff);
          if (angleDist < 0.3) {
            this.apples.splice(i, 1);
            this.score += 100;
            window.storageManager.addXP(20);
            if (window.soundEngine) window.soundEngine.playPowerup();
            this.spawnSparks(this.width / 2, this.target.y + this.target.radius, '#f43f5e', 16);
          }
        }

        this.flyingKnife = null;

        // Stage Completed?
        if (this.knivesThrown >= this.knivesNeeded) {
          this.stage++;
          this.score += 250;
          window.storageManager.addXP(50);
          if (window.soundEngine) window.soundEngine.playVictory();
          this.spawnSparks(this.target.x, this.target.y, '#fbbf24', 25);
          setTimeout(() => this.initStage(), 300);
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

  triggerCrash() {
    this.gameState = 'gameover';
    if (window.soundEngine) {
      window.soundEngine.playHit();
      setTimeout(() => window.soundEngine.playGameOver(), 100);
    }
    this.spawnSparks(this.width / 2, this.target.y + this.target.radius, '#f43f5e', 20);
    const res = window.storageManager.setHighScore(this.id, this.score);
    this.highScore = res.score;
    if (this.onGameOver) this.onGameOver(this.score, this.highScore, res.isNew);
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.fillStyle = '#0a0d18';
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw Rotating Target Wheel
    ctx.save();
    ctx.translate(this.target.x, this.target.y);
    ctx.rotate(this.target.angle);

    // Wheel Body
    ctx.fillStyle = '#1e1b4b';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#818cf8';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(0, 0, this.target.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Wheel Core Emblem
    ctx.fillStyle = '#312e81';
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a5b4fc';
    ctx.font = 'bold 16px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`LVL ${this.stage}`, 0, 0);

    // Draw Slicing Crystals / Apples
    this.apples.forEach(angle => {
      ctx.save();
      ctx.rotate(angle);
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, this.target.radius + 12, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    // Draw Embedded Knives
    this.embeddedKnives.forEach(angle => {
      ctx.save();
      ctx.rotate(angle);
      // Blade sticking outward
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(-4, this.target.radius - 8);
      ctx.lineTo(0, this.target.radius + 36);
      ctx.lineTo(4, this.target.radius - 8);
      ctx.closePath();
      ctx.fill();
      // Handle
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-3, this.target.radius + 36, 6, 14);
      ctx.shadowBlur = 0;
      ctx.restore();
    });

    ctx.restore();

    // Draw Flying Knife
    if (this.flyingKnife) {
      const fk = this.flyingKnife;
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(fk.x - 5, fk.y + 14);
      ctx.lineTo(fk.x, fk.y - 20);
      ctx.lineTo(fk.x + 5, fk.y + 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(fk.x - 3, fk.y + 14, 6, 16);
      ctx.shadowBlur = 0;
    }

    // Draw Ready Knife at Bottom
    if (!this.flyingKnife && this.gameState === 'playing') {
      const ky = this.height - 110;
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(this.width / 2 - 5, ky + 14);
      ctx.lineTo(this.width / 2, ky - 20);
      ctx.lineTo(this.width / 2 + 5, ky + 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(this.width / 2 - 3, ky + 14, 6, 16);
      ctx.shadowBlur = 0;
    }

    // Draw Remaining Knives Inventory Meter
    const remaining = this.knivesNeeded - this.knivesThrown;
    for (let i = 0; i < this.knivesNeeded; i++) {
      ctx.fillStyle = i < remaining ? '#38bdf8' : '#334155';
      ctx.beginPath();
      ctx.roundRect(24, this.height - 60 - i * 16, 10, 12, 3);
      ctx.fill();
    }

    // Draw Particles
    this.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Score HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${this.score}`, 20, 36);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`STAGE ${this.stage}`, this.width - 20, 36);

    // Overlays
    if (this.gameState === 'idle') {
      ctx.fillStyle = 'rgba(10, 13, 24, 0.85)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BLADE MASTER', this.width / 2, this.height / 2 - 35);

      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('TAP OR PRESS SPACEBAR TO THROW BLADES', this.width / 2, this.height / 2 + 10);

      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#f43f5e';
      ctx.fillText('DO NOT HIT PREVIOUSLY EMBEDDED BLADES!', this.width / 2, this.height / 2 + 38);
    } else if (this.gameState === 'gameover') {
      ctx.fillStyle = 'rgba(10, 13, 24, 0.88)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 34px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BLADE DEFLECTED!', this.width / 2, this.height / 2 - 35);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Outfit, sans-serif';
      ctx.fillText(`SCORE: ${this.score}`, this.width / 2, this.height / 2 + 8);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`BEST RECORD: ${this.highScore}`, this.width / 2, this.height / 2 + 38);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('TAP TO THROW AGAIN', this.width / 2, this.height / 2 + 75);
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
    window.removeEventListener('keydown', this.handleAction);
    this.canvas.removeEventListener('pointerdown', this.handleAction);
  }
}

window.BladeMasterGame = BladeMasterGame;
