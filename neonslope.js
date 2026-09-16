/**
 * Neon Ball Slope (Slope 3D Clone)
 * High-speed ball rolling down a tilting perspective neon runway dodging red obstacles.
 */
class NeonSlopeGame {
  constructor(canvas, container, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.container = container;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    this.id = 'neon-slope';

    this.width = 540;
    this.height = 680;
    this.setupCanvas();

    this.ball = {
      x: 0, // -1 to 1 across track
      vx: 0,
      radius: 14,
      yOffset: 0,
      vy: 0,
      isAirborne: false
    };

    this.speed = 12;
    this.distance = 0;
    this.score = 0;
    this.highScore = window.storageManager.getHighScore(this.id);
    this.gameState = 'idle'; // 'idle', 'playing', 'gameover'

    this.trackSegments = [];
    this.obstacles = [];
    this.particles = [];
    this.keys = {};

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
    this.trackSegments = [];
    this.obstacles = [];
    for (let i = 0; i < 20; i++) {
      this.trackSegments.push({ z: i * 0.05 });
    }
  }

  reset() {
    this.ball.x = 0;
    this.ball.vx = 0;
    this.ball.yOffset = 0;
    this.ball.vy = 0;
    this.ball.isAirborne = false;
    this.speed = 12;
    this.distance = 0;
    this.score = 0;
    this.particles = [];
    this.obstacles = [];
    this.initTrack();
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

    // Touch controls
    this.handlePointerDown = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      if (clientX < rect.width / 2) this.keys['ArrowLeft'] = true;
      else this.keys['ArrowRight'] = true;

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

  spawnObstacle() {
    this.obstacles.push({
      x: (Math.random() - 0.5) * 1.6, // -0.8 to 0.8
      z: 0.05,
      w: 0.35,
      type: Math.random() < 0.2 ? 'ramp' : 'block'
    });
  }

  update() {
    if (this.gameState !== 'playing') return;

    // Steering
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      this.ball.vx = -0.055;
    } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      this.ball.vx = 0.055;
    } else {
      this.ball.vx *= 0.8;
    }

    this.ball.x += this.ball.vx;

    // Airborne physics (after hitting ramp)
    if (this.ball.isAirborne) {
      this.ball.yOffset += this.ball.vy;
      this.ball.vy -= 1.2;
      if (this.ball.yOffset <= 0) {
        this.ball.yOffset = 0;
        this.ball.isAirborne = false;
      }
    }

    // Check Fall off slope edges
    if (Math.abs(this.ball.x) > 1.05) {
      this.triggerFall();
      return;
    }

    // Distance progression & speed
    this.distance += this.speed * 0.1;
    this.speed = Math.min(24, 12 + this.distance * 0.006);
    this.score = Math.floor(this.distance);
    if (this.onScoreUpdate) this.onScoreUpdate(this.score);

    // Spawn obstacles
    if (Math.random() < 0.05) {
      this.spawnObstacle();
    }

    // Update Obstacles
    const zSpeed = (this.speed / 12) * 0.02;
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.z += zSpeed;

      // Collision check near player (z ~ 0.85 to 0.95)
      if (obs.z >= 0.85 && obs.z <= 0.95 && Math.abs(obs.x - this.ball.x) < obs.w) {
        if (obs.type === 'ramp') {
          // Launch ball into air!
          this.ball.isAirborne = true;
          this.ball.vy = 18;
          if (window.soundEngine) window.soundEngine.playJump();
        } else if (!this.ball.isAirborne) {
          // Hit red block
          this.triggerCrash();
          return;
        }
      }

      if (obs.z > 1.2) {
        this.obstacles.splice(i, 1);
      }
    }

    // Roll track segments
    this.trackSegments.forEach(seg => {
      seg.z += zSpeed;
      if (seg.z > 1) seg.z -= 1;
    });
  }

  triggerCrash() {
    this.gameState = 'gameover';
    if (window.soundEngine) {
      window.soundEngine.playHit();
      setTimeout(() => window.soundEngine.playGameOver(), 100);
    }
    const res = window.storageManager.setHighScore(this.id, this.score);
    this.highScore = res.score;
    if (this.onGameOver) this.onGameOver(this.score, this.highScore, res.isNew);
  }

  triggerFall() {
    this.gameState = 'gameover';
    if (window.soundEngine) {
      window.soundEngine.playHit();
      setTimeout(() => window.soundEngine.playGameOver(), 100);
    }
    const res = window.storageManager.setHighScore(this.id, this.score);
    this.highScore = res.score;
    if (this.onGameOver) this.onGameOver(this.score, this.highScore, res.isNew);
  }

  project(x, z, yOffset = 0) {
    const horizonY = 160;
    const horizonW = 40;
    const bottomW = 420;

    const trackW = horizonW + (bottomW - horizonW) * z;
    const screenX = this.width / 2 + x * (trackW / 2);
    const screenY = horizonY + (this.height - horizonY) * z - yOffset;
    return { x: screenX, y: screenY, scale: z };
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Deep Void Sky
    ctx.fillStyle = '#040714';
    ctx.fillRect(0, 0, this.width, this.height);

    // Perspective Runway Grid
    const horizonY = 160;
    ctx.fillStyle = '#0b132b';
    ctx.beginPath();
    ctx.moveTo(this.width / 2 - 20, horizonY);
    ctx.lineTo(this.width / 2 + 20, horizonY);
    ctx.lineTo(this.width / 2 + 210, this.height);
    ctx.lineTo(this.width / 2 - 210, this.height);
    ctx.closePath();
    ctx.fill();

    // Track Grid Lines
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    this.trackSegments.forEach(seg => {
      const p1 = this.project(-1, seg.z);
      const p2 = this.project(1, seg.z);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    // Draw Obstacles
    this.obstacles.forEach(obs => {
      const p = this.project(obs.x, obs.z);
      const w = 60 * p.scale;
      const h = 40 * p.scale;

      if (obs.type === 'ramp') {
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 10 * p.scale;
        ctx.beginPath();
        ctx.moveTo(p.x - w / 2, p.y);
        ctx.lineTo(p.x, p.y - h);
        ctx.lineTo(p.x + w / 2, p.y);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 12 * p.scale;
        ctx.beginPath();
        ctx.roundRect(p.x - w / 2, p.y - h, w, h, 4 * p.scale);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // Draw Rolling Ball
    if (this.gameState !== 'gameover') {
      const ballP = this.project(this.ball.x, 0.88, this.ball.yOffset);
      ctx.save();
      ctx.translate(ballP.x, ballP.y);

      // Ball glow
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(0, 0, this.ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Ball core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-3, -3, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Score HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`DISTANCE: ${this.score}m`, 20, 36);

    // Overlays
    if (this.gameState === 'idle') {
      ctx.fillStyle = 'rgba(4, 7, 20, 0.85)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NEON BALL SLOPE', this.width / 2, this.height / 2 - 35);

      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('A / D OR LEFT / RIGHT ARROWS TO STEER', this.width / 2, this.height / 2 + 10);

      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#f43f5e';
      ctx.fillText('AVOID RED BLOCKS & DO NOT FALL OFF THE EDGE!', this.width / 2, this.height / 2 + 38);
    } else if (this.gameState === 'gameover') {
      ctx.fillStyle = 'rgba(4, 7, 20, 0.88)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FELL INTO THE VOID!', this.width / 2, this.height / 2 - 35);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Outfit, sans-serif';
      ctx.fillText(`SCORE: ${this.score}`, this.width / 2, this.height / 2 + 8);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('PRESS ANY KEY TO ROLL AGAIN', this.width / 2, this.height / 2 + 55);
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

window.NeonSlopeGame = NeonSlopeGame;
