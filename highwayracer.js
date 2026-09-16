/**
 * Apex Highway Racer (Mr Racer Clone)
 * High-speed highway traffic racing with nitro boost, near-miss bonuses, and 280+ km/h adrenaline.
 */
class HighwayRacerGame {
  constructor(canvas, container, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.container = container;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    this.id = 'highway-racer';

    this.width = 600;
    this.height = 700;
    this.setupCanvas();

    this.player = {
      x: this.width / 2,
      y: this.height - 110,
      width: 44,
      height: 74,
      vx: 0,
      speed: 120, // km/h
      maxNormalSpeed: 210,
      maxNitroSpeed: 300,
      nitro: 100, // percentage
      isNitro: false,
      isBraking: false
    };

    this.traffic = [];
    this.roadStripes = [];
    this.particles = [];
    this.nearMissText = null;
    this.score = 0;
    this.distance = 0;
    this.overtakes = 0;
    this.highScore = window.storageManager.getHighScore(this.id);
    this.gameState = 'idle'; // 'idle', 'playing', 'gameover'
    this.keys = {};

    this.initRoad();
    this.bindEvents();
    this.render();
  }

  setupCanvas() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.maxHeight = '700px';
    this.canvas.style.objectFit = 'contain';
  }

  initRoad() {
    this.roadStripes = [];
    for (let i = 0; i < 25; i++) {
      this.roadStripes.push(i * 35);
    }
  }

  reset() {
    this.player.x = this.width / 2;
    this.player.vx = 0;
    this.player.speed = 120;
    this.player.nitro = 100;
    this.player.isNitro = false;
    this.player.isBraking = false;

    this.traffic = [];
    this.particles = [];
    this.nearMissText = null;
    this.score = 0;
    this.distance = 0;
    this.overtakes = 0;

    if (this.onScoreUpdate) this.onScoreUpdate(this.score);
  }

  bindEvents() {
    this.handleKeyDown = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'Space'].includes(e.code)) {
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

    // Touch / Pointer controls
    let isTouching = false;
    this.handlePointerDown = (e) => {
      isTouching = true;
      if (this.gameState === 'idle') {
        this.gameState = 'playing';
        this.loop();
      } else if (this.gameState === 'gameover') {
        this.reset();
        this.gameState = 'playing';
        this.loop();
      }
      this.handlePointerMove(e);
    };

    this.handlePointerMove = (e) => {
      if (isTouching && this.gameState === 'playing') {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const clientX = (e.clientX - rect.left) * scaleX;
        this.player.x = Math.max(140, Math.min(this.width - 140, clientX));
      }
    };

    this.handlePointerUp = () => {
      isTouching = false;
    };

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
  }

  spawnTraffic() {
    const lanes = [155, 230, 305, 380, 445];
    const laneX = lanes[Math.floor(Math.random() * lanes.length)];
    const types = ['sedan', 'sports', 'truck', 'suv'];
    const type = types[Math.floor(Math.random() * types.length)];
    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#e2e8f0'];

    this.traffic.push({
      x: laneX,
      y: -120,
      width: type === 'truck' ? 48 : 42,
      height: type === 'truck' ? 100 : 70,
      type,
      color: colors[Math.floor(Math.random() * colors.length)],
      baseSpeed: type === 'truck' ? 70 : (type === 'sports' ? 130 : 95),
      passed: false
    });
  }

  spawnParticles(x, y, color, count = 8) {
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

    const p = this.player;

    // Steering
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      p.vx = -7;
    } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      p.vx = 7;
    } else {
      p.vx *= 0.78;
    }

    p.x += p.vx;
    // Highway boundaries (320px width road centered)
    p.x = Math.max(135, Math.min(this.width - 135, p.x));

    // Nitro / Accelerate / Brake
    p.isNitro = (this.keys['ArrowUp'] || this.keys['KeyW'] || this.keys['Space']) && p.nitro > 0;
    p.isBraking = (this.keys['ArrowDown'] || this.keys['KeyS']);

    if (p.isNitro) {
      p.speed = Math.min(p.maxNitroSpeed, p.speed + 3);
      p.nitro = Math.max(0, p.nitro - 0.35);
      // Nitro exhaust flame particles
      if (Math.random() > 0.3) {
        this.spawnParticles(p.x - 12, p.y + p.height / 2 + 5, '#06b6d4', 2);
        this.spawnParticles(p.x + 12, p.y + p.height / 2 + 5, '#06b6d4', 2);
      }
    } else if (p.isBraking) {
      p.speed = Math.max(70, p.speed - 3);
    } else {
      // Return to baseline cruising speed
      if (p.speed < p.maxNormalSpeed) p.speed += 0.8;
      else if (p.speed > p.maxNormalSpeed) p.speed -= 1.5;
      // Regenerate nitro slowly
      p.nitro = Math.min(100, p.nitro + 0.12);
    }

    // Update Distance & Score
    const deltaDist = (p.speed / 3600) * 1000; // meters per frame approx
    this.distance += deltaDist;
    this.score = Math.floor(this.distance) + this.overtakes * 150;
    if (this.onScoreUpdate) this.onScoreUpdate(this.score);

    // Scroll Road Stripes
    const roadSpeed = (p.speed / 100) * 15;
    for (let i = 0; i < this.roadStripes.length; i++) {
      this.roadStripes[i] += roadSpeed;
      if (this.roadStripes[i] > this.height) {
        this.roadStripes[i] = -20;
      }
    }

    // Spawn Traffic Cars
    if (Math.random() < 0.04) {
      this.spawnTraffic();
    }

    // Update Traffic Cars
    const playerSpeedCoeff = (p.speed / 100) * 14;
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const t = this.traffic[i];
      const carRelSpeed = playerSpeedCoeff - (t.baseSpeed / 100) * 14;
      t.y += carRelSpeed;

      // Near-Miss Check (overtake close call without collision)
      if (!t.passed && t.y > p.y && Math.abs(t.x - p.x) < 56 && Math.abs(t.x - p.x) > 34) {
        t.passed = true;
        this.overtakes++;
        this.score += 200;
        window.storageManager.addXP(25);
        this.nearMissText = { text: '🔥 +200 NEAR MISS!', opacity: 1, y: p.y - 40 };
        if (window.soundEngine) window.soundEngine.playScore();
      } else if (!t.passed && t.y > p.y + p.height) {
        t.passed = true;
        this.overtakes++;
      }

      // Collision Check (AABB box intersection)
      if (Math.abs(t.x - p.x) < (t.width + p.width) * 0.42 &&
          Math.abs(t.y - p.y) < (t.height + p.height) * 0.42) {
        this.triggerCrash();
        return;
      }

      if (t.y > this.height + 150 || t.y < -300) {
        this.traffic.splice(i, 1);
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

    // Fade Near-miss text
    if (this.nearMissText) {
      this.nearMissText.y -= 1.5;
      this.nearMissText.opacity -= 0.03;
      if (this.nearMissText.opacity <= 0) this.nearMissText = null;
    }
  }

  triggerCrash() {
    this.gameState = 'gameover';
    if (window.soundEngine) {
      window.soundEngine.playHit();
      setTimeout(() => window.soundEngine.playGameOver(), 100);
    }
    this.spawnParticles(this.player.x, this.player.y, '#f43f5e', 30);
    const res = window.storageManager.setHighScore(this.id, this.score);
    this.highScore = res.score;
    if (this.onGameOver) this.onGameOver(this.score, this.highScore, res.isNew);
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Highway Shoulder / Cyber Grassland
    ctx.fillStyle = '#0a101f';
    ctx.fillRect(0, 0, this.width, this.height);

    // Speed lines on outer sides
    if (this.player.isNitro) {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        const x = Math.random() * 90;
        const y = Math.random() * this.height;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 40);
        ctx.stroke();

        const rx = this.width - x;
        ctx.beginPath();
        ctx.moveTo(rx, y);
        ctx.lineTo(rx, y + 40);
        ctx.stroke();
      }
    }

    // Asphalt Highway Road
    const roadX = 100;
    const roadW = 400;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(roadX, 0, roadW, this.height);

    // Highway Guardrails
    ctx.fillStyle = '#475569';
    ctx.fillRect(roadX - 8, 0, 8, this.height);
    ctx.fillRect(roadX + roadW, 0, 8, this.height);
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(roadX - 2, 0, 2, this.height);
    ctx.fillRect(roadX + roadW, 0, 2, this.height);

    // Road Lane Dividers (Dashed yellow & white lines)
    const laneXList = [175, 250, 325, 400];
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 3;

    laneXList.forEach(lx => {
      this.roadStripes.forEach(sy => {
        ctx.beginPath();
        ctx.moveTo(lx, sy);
        ctx.lineTo(lx, sy + 18);
        ctx.stroke();
      });
    });

    // Draw Traffic Cars
    this.traffic.forEach(t => {
      ctx.save();
      ctx.translate(t.x, t.y);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.roundRect(-t.width / 2 + 3, 5, t.width, t.height, 6);
      ctx.fill();

      // Car Body
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.roundRect(-t.width / 2, -t.height / 2, t.width, t.height, 8);
      ctx.fill();

      // Roof / Glass
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(-t.width * 0.35, -t.height * 0.25, t.width * 0.7, t.height * 0.45, 4);
      ctx.fill();

      // Taillights
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 8;
      ctx.fillRect(-t.width * 0.4, t.height / 2 - 4, 8, 4);
      ctx.fillRect(t.width * 0.4 - 8, t.height / 2 - 4, 8, 4);
      ctx.shadowBlur = 0;

      ctx.restore();
    });

    // Draw Particles
    this.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Player Supercar
    if (this.gameState !== 'gameover') {
      const p = this.player;
      ctx.save();
      ctx.translate(p.x, p.y);

      // Nitro Flame Exhaust
      if (p.isNitro) {
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(-14, p.height / 2);
        ctx.lineTo(-12, p.height / 2 + 18 + Math.random() * 8);
        ctx.lineTo(-10, p.height / 2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(10, p.height / 2);
        ctx.lineTo(12, p.height / 2 + 18 + Math.random() * 8);
        ctx.lineTo(14, p.height / 2);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Car Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.roundRect(-p.width / 2 + 2, 4, p.width, p.height, 8);
      ctx.fill();

      // Neon Supercar Body
      ctx.fillStyle = '#ec4899';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(-p.width / 2, -p.height / 2, p.width, p.height, 10);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Racing Stripes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-4, -p.height / 2, 8, p.height);

      // Cockpit Windshield
      ctx.fillStyle = '#090d1a';
      ctx.beginPath();
      ctx.roundRect(-p.width * 0.36, -p.height * 0.28, p.width * 0.72, p.height * 0.48, 6);
      ctx.fill();

      // Headlights (beaming forward)
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.fillRect(-p.width * 0.42, -p.height / 2, 8, 4);
      ctx.fillRect(p.width * 0.42 - 8, -p.height / 2, 8, 4);
      ctx.shadowBlur = 0;

      ctx.restore();
    }

    // Near-Miss Notification Pop
    if (this.nearMissText) {
      ctx.save();
      ctx.globalAlpha = this.nearMissText.opacity;
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 22px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;
      ctx.fillText(this.nearMissText.text, this.player.x, this.nearMissText.y);
      ctx.restore();
    }

    // HUD Speedometer & Nitro Gauges
    // Speedometer Dial Container
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(20, 20, 160, 70, 12);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.round(this.player.speed)}`, 32, 60);

    ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('KM / H', 122, 58);

    // Nitro Bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(this.width - 180, 20, 160, 70, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('NITRO BOOST', this.width - 168, 44);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(this.width - 168, 54, 136, 14);
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;
    ctx.fillRect(this.width - 168, 54, 136 * (this.player.nitro / 100), 14);
    ctx.shadowBlur = 0;

    // Overlays
    if (this.gameState === 'idle') {
      ctx.fillStyle = 'rgba(10, 16, 31, 0.82)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#ec4899';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('APEX HIGHWAY RACER', this.width / 2, this.height / 2 - 40);

      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('LEFT / RIGHT (A/D) TO WEAVE THROUGH TRAFFIC', this.width / 2, this.height / 2 + 10);

      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#06b6d4';
      ctx.fillText('HOLD UP / SPACE FOR NITRO BOOST (280+ KM/H!) ⚡', this.width / 2, this.height / 2 + 38);

      ctx.fillStyle = '#fbbf24';
      ctx.fillText('OVERTAKE CLOSELY FOR NEAR-MISS SCORE BONUSES!', this.width / 2, this.height / 2 + 65);
    } else if (this.gameState === 'gameover') {
      ctx.fillStyle = 'rgba(10, 16, 31, 0.88)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HIGH SPEED CRASH!', this.width / 2, this.height / 2 - 35);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Outfit, sans-serif';
      ctx.fillText(`SCORE: ${this.score}`, this.width / 2, this.height / 2 + 8);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`OVERTAKES: ${this.overtakes}  •  BEST: ${this.highScore}`, this.width / 2, this.height / 2 + 36);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('PRESS ANY KEY OR TAP TO RACE AGAIN', this.width / 2, this.height / 2 + 75);
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
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
  }
}

window.HighwayRacerGame = HighwayRacerGame;
