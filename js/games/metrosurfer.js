/**
 * Metro Surfer (Subway Surfers Clone)
 * 3-Lane pseudo-3D endless runner dodging oncoming metro trains, barriers, and collecting coins.
 */
class MetroSurferGame {
  constructor(canvas, container, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.container = container;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    this.id = 'metro-surfer';

    this.width = 600;
    this.height = 680;
    this.setupCanvas();

    // 3 Lanes: -1 (Left), 0 (Center), 1 (Right)
    this.lanes = [-1, 0, 1];
    this.currentLane = 0;
    this.targetLaneX = 0;
    this.currentLaneX = 0;

    // Player state
    this.player = {
      yOffset: 0, // for jump (positive is up)
      vy: 0,
      isJumping: false,
      isSliding: false,
      slideTimer: 0,
      gravity: 0.65,
      jumpPower: 14,
      magnetTimer: 0
    };

    this.speed = 10;
    this.distance = 0;
    this.coins = 0;
    this.score = 0;
    this.highScore = window.storageManager.getHighScore(this.id);
    this.gameState = 'idle'; // 'idle', 'playing', 'gameover'

    this.obstacles = [];
    this.coinItems = [];
    this.particles = [];
    this.trackLines = [];
    this.spawnTimer = 0;

    this.initTrack();
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

  initTrack() {
    this.trackLines = [];
    for (let i = 0; i < 20; i++) {
      this.trackLines.push(i * 35);
    }
  }

  reset() {
    this.currentLane = 0;
    this.targetLaneX = 0;
    this.currentLaneX = 0;
    this.player.yOffset = 0;
    this.player.vy = 0;
    this.player.isJumping = false;
    this.player.isSliding = false;
    this.player.slideTimer = 0;
    this.player.magnetTimer = 0;

    this.speed = 10;
    this.distance = 0;
    this.coins = 0;
    this.score = 0;
    this.obstacles = [];
    this.coinItems = [];
    this.particles = [];
    this.spawnTimer = 0;

    if (this.onScoreUpdate) this.onScoreUpdate(this.score);
  }

  bindEvents() {
    this.handleKeyDown = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'Space'].includes(e.code)) {
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

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.shiftLane(-1);
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.shiftLane(1);
      } else if ((e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') && !this.player.isJumping) {
        this.jump();
      } else if ((e.code === 'ArrowDown' || e.code === 'KeyS') && !this.player.isSliding) {
        this.slide();
      }
    };

    // Touch Swipe Controls
    let touchStartX = 0, touchStartY = 0;
    this.handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      if (this.gameState !== 'playing') {
        this.handleKeyDown({ code: 'Space', preventDefault: () => {} });
      }
    };

    this.handleTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 25) {
        if (dx > 0) this.shiftLane(1);
        else this.shiftLane(-1);
      } else if (Math.abs(dy) > 25) {
        if (dy < 0 && !this.player.isJumping) this.jump();
        else if (dy > 0 && !this.player.isSliding) this.slide();
      }
    };

    window.addEventListener('keydown', this.handleKeyDown);
    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: true });
  }

  shiftLane(dir) {
    const newLane = Math.max(-1, Math.min(1, this.currentLane + dir));
    if (newLane !== this.currentLane) {
      this.currentLane = newLane;
      this.targetLaneX = this.currentLane * 140;
      if (window.soundEngine) window.soundEngine.playHover();
    }
  }

  jump() {
    this.player.isJumping = true;
    this.player.vy = this.player.jumpPower;
    this.player.isSliding = false;
    if (window.soundEngine) window.soundEngine.playJump();
    this.spawnParticles(this.width / 2 + this.currentLaneX, this.height - 90, '#38bdf8', 6);
  }

  slide() {
    this.player.isSliding = true;
    this.player.slideTimer = 35; // frames
    if (this.player.isJumping) {
      // Fast drop
      this.player.vy = -16;
    }
    if (window.soundEngine) window.soundEngine.playHover();
  }

  spawnObstacle() {
    const lane = Math.floor(Math.random() * 3) - 1;
    const types = ['train', 'barrier_low', 'barrier_high', 'train'];
    const type = types[Math.floor(Math.random() * types.length)];

    this.obstacles.push({
      lane,
      z: 0.05, // 0 is horizon, 1 is player position
      type,
      width: type === 'train' ? 120 : 90,
      passed: false
    });

    // Spawn coin line in an empty lane
    if (Math.random() < 0.6) {
      const coinLane = (lane === 0) ? (Math.random() > 0.5 ? 1 : -1) : 0;
      for (let i = 0; i < 4; i++) {
        this.coinItems.push({
          lane: coinLane,
          z: 0.05 + i * 0.04,
          collected: false
        });
      }
    }

    // Rare Magnet power-up
    if (Math.random() < 0.08 && this.player.magnetTimer <= 0) {
      this.coinItems.push({
        lane: (lane + 1) > 1 ? -1 : lane + 1,
        z: 0.08,
        isMagnet: true,
        collected: false
      });
    }
  }

  spawnParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        color,
        size: Math.random() * 3 + 2,
        life: 20
      });
    }
  }

  update() {
    if (this.gameState !== 'playing') return;

    // Smooth lane interpolation
    this.currentLaneX += (this.targetLaneX - this.currentLaneX) * 0.25;

    // Jump / Slide Physics
    if (this.player.isJumping) {
      this.player.yOffset += this.player.vy;
      this.player.vy -= this.player.gravity;
      if (this.player.yOffset <= 0) {
        this.player.yOffset = 0;
        this.player.isJumping = false;
      }
    }

    if (this.player.isSliding) {
      this.player.slideTimer--;
      if (this.player.slideTimer <= 0) {
        this.player.isSliding = false;
      }
    }

    if (this.player.magnetTimer > 0) {
      this.player.magnetTimer--;
    }

    // Distance & Speed progression
    this.distance += this.speed * 0.1;
    this.speed = Math.min(22, 10 + this.distance * 0.005);
    this.score = Math.floor(this.distance) + this.coins * 25;
    if (this.onScoreUpdate) this.onScoreUpdate(this.score);

    // Track scroll
    for (let i = 0; i < this.trackLines.length; i++) {
      this.trackLines[i] += this.speed * 0.35;
      if (this.trackLines[i] > this.height) {
        this.trackLines[i] = 200;
      }
    }

    // Obstacles Generation
    this.spawnTimer++;
    if (this.spawnTimer >= Math.max(35, 75 - Math.floor(this.distance * 0.02))) {
      this.spawnObstacle();
      this.spawnTimer = 0;
    }

    // Update Obstacles
    const zSpeed = (this.speed / 10) * 0.015;
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.z += zSpeed;

      // Collision Check (when obstacle reaches player z ~ 0.85 to 0.98)
      if (obs.z >= 0.82 && obs.z <= 0.96 && obs.lane === this.currentLane) {
        let hit = false;
        if (obs.type === 'train') {
          hit = true; // Train hits regardless
        } else if (obs.type === 'barrier_low') {
          // Low barrier requires jump (player height > 40)
          if (this.player.yOffset < 35) hit = true;
        } else if (obs.type === 'barrier_high') {
          // High barrier requires slide
          if (!this.player.isSliding && this.player.yOffset < 60) hit = true;
        }

        if (hit) {
          this.triggerCrash();
          return;
        }
      }

      if (obs.z > 1.2) {
        this.obstacles.splice(i, 1);
      }
    }

    // Update Coins
    for (let i = this.coinItems.length - 1; i >= 0; i--) {
      const c = this.coinItems[i];
      c.z += zSpeed;

      // Magnet pull
      if (this.player.magnetTimer > 0 && c.z > 0.4) {
        c.lane += (this.currentLane - c.lane) * 0.15;
      }

      // Collect Coin
      if (!c.collected && c.z >= 0.82 && c.z <= 0.98 && Math.abs(c.lane - this.currentLane) < 0.4) {
        c.collected = true;
        if (c.isMagnet) {
          this.player.magnetTimer = 350; // ~6 seconds
          if (window.soundEngine) window.soundEngine.playPowerup();
        } else {
          this.coins++;
          window.storageManager.addXP(5);
          if (window.soundEngine) window.soundEngine.playScore();
        }
        this.spawnParticles(this.width / 2 + this.currentLaneX, this.height - 110 - this.player.yOffset, '#fbbf24', 8);
      }

      if (c.z > 1.2 || c.collected) {
        this.coinItems.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  triggerCrash() {
    this.gameState = 'gameover';
    if (window.soundEngine) {
      window.soundEngine.playHit();
      setTimeout(() => window.soundEngine.playGameOver(), 120);
    }
    this.spawnParticles(this.width / 2 + this.currentLaneX, this.height - 100, '#f43f5e', 20);
    const res = window.storageManager.setHighScore(this.id, this.score);
    this.highScore = res.score;
    if (this.onGameOver) this.onGameOver(this.score, this.highScore, res.isNew);
  }

  // Perspective projection helper
  project(lane, z, yOffset = 0) {
    const horizonY = 220;
    const horizonW = 60;
    const bottomW = 420;
    const scale = z; // 0 (far) to 1 (near)

    const trackWidthAtZ = horizonW + (bottomW - horizonW) * scale;
    const laneOffset = lane * (trackWidthAtZ / 3);
    const screenX = this.width / 2 + laneOffset;
    const screenY = horizonY + (this.height - horizonY) * scale - yOffset * scale;

    return { x: screenX, y: screenY, scale };
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Cyber Subway Sky / Horizon
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 220);
    skyGrad.addColorStop(0, '#090d1a');
    skyGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, 220);

    // City Skyline Silhouette
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(40, 140, 50, 80);
    ctx.fillRect(110, 110, 65, 110);
    ctx.fillRect(200, 150, 45, 70);
    ctx.fillRect(360, 120, 70, 100);
    ctx.fillRect(450, 130, 80, 90);
    ctx.fillRect(540, 160, 50, 60);

    // Subway Ground Tunnel
    const groundGrad = ctx.createLinearGradient(0, 220, 0, this.height);
    groundGrad.addColorStop(0, '#111827');
    groundGrad.addColorStop(1, '#030712');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, 220, this.width, this.height - 220);

    // 3 Rail Tracks
    const horizonY = 220;
    const rails = [-1.5, -0.5, 0.5, 1.5];
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;

    rails.forEach(r => {
      const topX = this.width / 2 + r * 20;
      const botX = this.width / 2 + r * 140;
      ctx.beginPath();
      ctx.moveTo(topX, horizonY);
      ctx.lineTo(botX, this.height);
      ctx.stroke();
    });

    // Railway Sleepers / Ties
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    this.trackLines.forEach(y => {
      if (y >= horizonY) {
        const factor = (y - horizonY) / (this.height - horizonY);
        const w = 60 + (420 - 60) * factor;
        ctx.beginPath();
        ctx.moveTo(this.width / 2 - w / 2, y);
        ctx.lineTo(this.width / 2 + w / 2, y);
        ctx.stroke();
      }
    });

    // Draw Obstacles (sorted by z from far to near)
    const sortedObstacles = [...this.obstacles].sort((a, b) => a.z - b.z);
    sortedObstacles.forEach(obs => {
      const p = this.project(obs.lane, obs.z);
      const w = 110 * p.scale;
      const h = obs.type === 'train' ? 140 * p.scale : (obs.type === 'barrier_high' ? 70 * p.scale : 40 * p.scale);

      if (obs.type === 'train') {
        // Metro Train Front
        ctx.fillStyle = '#f43f5e';
        ctx.shadowColor = '#e11d48';
        ctx.shadowBlur = 10 * p.scale;
        ctx.beginPath();
        ctx.roundRect(p.x - w / 2, p.y - h, w, h, 8 * p.scale);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Train Windshield
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.roundRect(p.x - w * 0.38, p.y - h * 0.85, w * 0.76, h * 0.35, 4 * p.scale);
        ctx.fill();

        // Train Headlights
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 8 * p.scale;
        ctx.beginPath();
        ctx.arc(p.x - w * 0.28, p.y - h * 0.2, 5 * p.scale, 0, Math.PI * 2);
        ctx.arc(p.x + w * 0.28, p.y - h * 0.2, 5 * p.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (obs.type === 'barrier_low') {
        // Low Barrier (Jump over)
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.roundRect(p.x - w * 0.45, p.y - h, w * 0.9, h, 4 * p.scale);
        ctx.fill();
        // Warning stripes
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(p.x - w * 0.2, p.y - h, w * 0.15, h);
        ctx.fillRect(p.x + w * 0.1, p.y - h, w * 0.15, h);
      } else if (obs.type === 'barrier_high') {
        // High Overhead Sign (Slide under)
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        // Two posts
        ctx.fillRect(p.x - w * 0.45, p.y - h * 1.5, 8 * p.scale, h * 1.5);
        ctx.fillRect(p.x + w * 0.45 - 8 * p.scale, p.y - h * 1.5, 8 * p.scale, h * 1.5);
        // Top sign
        ctx.roundRect(p.x - w * 0.48, p.y - h * 1.6, w * 0.96, h * 0.7, 4 * p.scale);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(8, 12 * p.scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('SLIDE', p.x, p.y - h * 1.2);
      }
    });

    // Draw Coins
    this.coinItems.forEach(c => {
      const p = this.project(c.lane, c.z, 20);
      const rad = 10 * p.scale;

      if (c.isMagnet) {
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 10 * p.scale;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad * 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(7, 10 * p.scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧲', p.x, p.y);
      } else {
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 10 * p.scale;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad * 0.5, 0, Math.PI * 2);
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

    // Draw Surfer Player
    if (this.gameState !== 'gameover') {
      const playerX = this.width / 2 + this.currentLaneX;
      const playerY = this.height - 70 - this.player.yOffset;

      ctx.save();
      ctx.translate(playerX, playerY);

      // Shadow on track
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      const shadowScale = Math.max(0.3, 1 - this.player.yOffset / 120);
      ctx.ellipse(0, 10 + this.player.yOffset, 24 * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Surfer Hoverboard
      ctx.fillStyle = '#ec4899';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(-24, 6, 48, 10, 5);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, 11, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Character Body / Hoodie
      if (this.player.isSliding) {
        // Sliding posture (low horizontal ball)
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.roundRect(-16, -14, 32, 18, 8);
        ctx.fill();
        // Cap
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(10, -8, 8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Standing / Running posture
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.roundRect(-14, -38, 28, 38, 8);
        ctx.fill();

        // Cap & Head
        ctx.fillStyle = '#fcd34d'; // Head
        ctx.beginPath();
        ctx.arc(0, -46, 11, 0, Math.PI * 2);
        ctx.fill();

        // Cool backward baseball cap
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -50, 10, Math.PI, 0);
        ctx.lineTo(12, -49);
        ctx.lineTo(0, -49);
        ctx.fill();

        // Magnet visual glow
        if (this.player.magnetTimer > 0) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, -25, 34, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    // HUD Display
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`DIST: ${Math.floor(this.distance)}m`, 20, 36);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`🪙 ${this.coins}`, this.width - 20, 36);

    if (this.player.magnetTimer > 0) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`🧲 MAGNET ACTIVE (${Math.ceil(this.player.magnetTimer / 60)}s)`, this.width - 20, 62);
    }

    // Overlays
    if (this.gameState === 'idle') {
      ctx.fillStyle = 'rgba(9, 13, 26, 0.82)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('METRO SURFER', this.width / 2, this.height / 2 - 40);

      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('ARROW KEYS / WASD TO SURF TRACKS', this.width / 2, this.height / 2 + 10);

      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('UP / SPACE = JUMP  |  DOWN = SLIDE UNDER BEAMS', this.width / 2, this.height / 2 + 38);

      ctx.fillStyle = '#ec4899';
      ctx.fillText('PRESS ANY KEY OR TAP TO RUN!', this.width / 2, this.height / 2 + 75);
    } else if (this.gameState === 'gameover') {
      ctx.fillStyle = 'rgba(9, 13, 26, 0.88)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TRAIN COLLISION!', this.width / 2, this.height / 2 - 35);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Outfit, sans-serif';
      ctx.fillText(`SCORE: ${this.score}`, this.width / 2, this.height / 2 + 8);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`COINS: ${this.coins}  •  BEST: ${this.highScore}`, this.width / 2, this.height / 2 + 36);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('PRESS ANY KEY OR TAP TO SURF AGAIN', this.width / 2, this.height / 2 + 75);
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

window.MetroSurferGame = MetroSurferGame;
