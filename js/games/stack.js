/**
 * Skyscraper Stack (Stack Clone)
 * Precision timing block stacking with chopping overhangs, perfect combos, and chromatic scales.
 */
class SkyscraperStackGame {
  constructor(canvas, container, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.container = container;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    this.id = 'skyscraper-stack';

    this.width = 480;
    this.height = 650;
    this.setupCanvas();

    this.blockHeight = 22;
    this.blocks = [];
    this.fallingBlocks = [];
    this.activeBlock = null;
    this.perfectStreak = 0;
    this.score = 0;
    this.highScore = window.storageManager.getHighScore(this.id);
    this.gameState = 'idle'; // 'idle', 'playing', 'gameover'
    this.particles = [];

    this.hue = 0;
    this.initStack();
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

  getColor(index) {
    return `hsl(${(index * 14) % 360}, 85%, 60%)`;
  }

  initStack() {
    this.blocks = [];
    this.fallingBlocks = [];
    this.perfectStreak = 0;
    this.score = 0;

    // Base block
    const baseW = 200;
    this.blocks.push({
      x: this.width / 2 - baseW / 2,
      y: this.height - 100,
      w: baseW,
      h: this.blockHeight,
      color: this.getColor(0)
    });

    this.spawnActiveBlock();
  }

  spawnActiveBlock() {
    const topBlock = this.blocks[this.blocks.length - 1];
    const newY = topBlock.y - this.blockHeight;

    this.activeBlock = {
      x: 0,
      y: newY,
      w: topBlock.w,
      h: this.blockHeight,
      vx: 4.5 + Math.min(4, this.score * 0.1),
      color: this.getColor(this.blocks.length)
    };
  }

  reset() {
    this.initStack();
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

      this.placeBlock();
    };

    window.addEventListener('keydown', this.handleAction);
    this.canvas.addEventListener('pointerdown', this.handleAction);
  }

  placeBlock() {
    if (!this.activeBlock || this.gameState !== 'playing') return;

    const topBlock = this.blocks[this.blocks.length - 1];
    const diff = this.activeBlock.x - topBlock.x;

    // Perfect placement check (within 3 pixels)
    if (Math.abs(diff) < 3.5) {
      this.activeBlock.x = topBlock.x;
      this.perfectStreak++;
      this.score++;
      window.storageManager.addXP(15);
      if (this.onScoreUpdate) this.onScoreUpdate(this.score);

      // Reward: grow block width back if on streak
      if (this.perfectStreak >= 5) {
        this.activeBlock.w = Math.min(220, this.activeBlock.w + 10);
        this.activeBlock.x -= 5;
      }

      if (window.soundEngine) window.soundEngine.playPowerup();
      this.spawnSparks(this.activeBlock.x + this.activeBlock.w / 2, this.activeBlock.y, '#fbbf24', 16);
    } else {
      this.perfectStreak = 0;

      // Miss completely?
      if (Math.abs(diff) >= this.activeBlock.w) {
        this.triggerDeath();
        return;
      }

      // Slice overhang!
      const overlapW = this.activeBlock.w - Math.abs(diff);
      const overhangW = Math.abs(diff);

      // Create falling slice
      const fallX = diff > 0 ? (this.activeBlock.x + overlapW) : this.activeBlock.x;
      this.fallingBlocks.push({
        x: fallX,
        y: this.activeBlock.y,
        w: overhangW,
        h: this.blockHeight,
        vy: 2,
        color: this.activeBlock.color
      });

      // Trim active block to overlap
      this.activeBlock.w = overlapW;
      if (diff > 0) {
        // Kept left portion
        this.activeBlock.x = topBlock.x;
      } else {
        // Kept right portion
        this.activeBlock.x = topBlock.x;
      }

      this.score++;
      window.storageManager.addXP(5);
      if (this.onScoreUpdate) this.onScoreUpdate(this.score);
      if (window.soundEngine) window.soundEngine.playScore();
    }

    // Add block to stack
    this.blocks.push({ ...this.activeBlock });

    // Scroll tower down when reaching top half of screen
    if (this.activeBlock.y < this.height * 0.45) {
      const shift = this.blockHeight;
      this.blocks.forEach(b => b.y += shift);
      this.fallingBlocks.forEach(fb => fb.y += shift);
    }

    this.spawnActiveBlock();
  }

  spawnSparks(x, y, color, count = 10) {
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

  triggerDeath() {
    this.gameState = 'gameover';
    if (this.activeBlock) {
      this.fallingBlocks.push({
        x: this.activeBlock.x,
        y: this.activeBlock.y,
        w: this.activeBlock.w,
        h: this.activeBlock.h,
        vy: 3,
        color: this.activeBlock.color
      });
      this.activeBlock = null;
    }

    if (window.soundEngine) {
      window.soundEngine.playHit();
      setTimeout(() => window.soundEngine.playGameOver(), 100);
    }

    const res = window.storageManager.setHighScore(this.id, this.score);
    this.highScore = res.score;
    if (this.onGameOver) this.onGameOver(this.score, this.highScore, res.isNew);
  }

  update() {
    if (this.gameState !== 'playing') return;

    // Glide Active Block
    if (this.activeBlock) {
      this.activeBlock.x += this.activeBlock.vx;
      if (this.activeBlock.x < 10 || this.activeBlock.x + this.activeBlock.w > this.width - 10) {
        this.activeBlock.vx = -this.activeBlock.vx;
      }
    }

    // Update Falling Slices
    for (let i = this.fallingBlocks.length - 1; i >= 0; i--) {
      const fb = this.fallingBlocks[i];
      fb.vy += 0.5;
      fb.y += fb.vy;
      if (fb.y > this.height) {
        this.fallingBlocks.splice(i, 1);
      }
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

    // Dynamic Gradient Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, '#090d1f');
    skyGrad.addColorStop(0.6, '#131b36');
    skyGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw Stacked Blocks
    this.blocks.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 4);
      ctx.fill();

      // Top highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(b.x, b.y, b.w, 3);
    });

    // Draw Falling Slices
    this.fallingBlocks.forEach(fb => {
      ctx.fillStyle = fb.color;
      ctx.beginPath();
      ctx.roundRect(fb.x, fb.y, fb.w, fb.h, 4);
      ctx.fill();
    });

    // Draw Active Gliding Block
    if (this.activeBlock) {
      ctx.fillStyle = this.activeBlock.color;
      ctx.shadowColor = this.activeBlock.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(this.activeBlock.x, this.activeBlock.y, this.activeBlock.w, this.activeBlock.h, 4);
      ctx.fill();
      ctx.shadowBlur = 0;
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
    ctx.font = 'bold 36px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.score}`, this.width / 2, 70);

    if (this.perfectStreak > 1) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`★ ${this.perfectStreak}X PERFECT!`, this.width / 2, 105);
    }

    // Overlays
    if (this.gameState === 'idle') {
      ctx.fillStyle = 'rgba(9, 13, 31, 0.82)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SKYSCRAPER STACK', this.width / 2, this.height / 2 - 35);

      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('TAP OR PRESS SPACEBAR TO DROP SLAB', this.width / 2, this.height / 2 + 10);

      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('PERFECT PLACEMENTS EXPAND YOUR TOWER! 🏆', this.width / 2, this.height / 2 + 38);
    } else if (this.gameState === 'gameover') {
      ctx.fillStyle = 'rgba(9, 13, 31, 0.88)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 34px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TOWER COLLAPSED!', this.width / 2, this.height / 2 - 35);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Outfit, sans-serif';
      ctx.fillText(`HEIGHT: ${this.score} FLOORS`, this.width / 2, this.height / 2 + 8);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`BEST RECORD: ${this.highScore}`, this.width / 2, this.height / 2 + 38);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('TAP TO STACK AGAIN', this.width / 2, this.height / 2 + 75);
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

window.SkyscraperStackGame = SkyscraperStackGame;
