/**
 * Cyber Pac-Maze (Pac-Man Clone)
 * Neon maze runner with 4 AI ghosts, glowing power pellets, and retro sound FX.
 */
class CyberPacGame {
  constructor(canvas, container, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.container = container;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    this.id = 'cyber-pac';

    this.width = 540;
    this.height = 620;
    this.cellSize = 30;
    this.cols = 18;
    this.rows = 19;
    this.setupCanvas();

    // 0 = empty, 1 = wall, 2 = dot, 3 = power pellet
    this.mapLayout = [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,3,2,2,2,2,2,1,1,2,2,2,2,2,2,2,3,1],
      [1,2,1,1,2,1,2,1,1,2,1,2,1,1,2,1,2,1],
      [1,2,1,1,2,1,2,2,2,2,1,2,1,1,2,1,2,1],
      [1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
      [1,2,1,1,2,1,2,1,1,2,1,2,1,1,2,1,2,1],
      [1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,2,2,1],
      [1,1,1,1,2,1,1,0,0,1,1,2,1,1,1,1,1,1],
      [0,0,0,1,2,1,0,0,0,0,1,2,1,0,0,0,0,0],
      [1,1,1,1,2,1,0,0,0,0,1,2,1,1,1,1,1,1],
      [1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
      [1,2,1,1,2,1,2,1,1,2,1,2,1,1,2,1,2,1],
      [1,3,2,1,2,2,2,0,0,2,2,2,1,2,2,1,3,1],
      [1,1,2,1,2,1,2,1,1,2,1,2,1,2,1,1,2,1],
      [1,2,2,2,2,1,2,1,1,2,1,2,2,2,2,2,2,1],
      [1,2,1,1,1,1,2,2,2,2,1,1,1,1,2,1,2,1],
      [1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ];

    this.grid = [];
    this.score = 0;
    this.highScore = window.storageManager.getHighScore(this.id);
    this.lives = 3;
    this.frightenedTimer = 0;
    this.gameState = 'idle'; // 'idle', 'playing', 'gameover', 'victory'

    this.pac = {
      x: 9,
      y: 12,
      dirX: 0,
      dirY: 0,
      nextDirX: 0,
      nextDirY: 0,
      mouthAngle: 0.2,
      mouthDir: 1
    };

    this.ghosts = [];
    this.initBoard();
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

  initBoard() {
    this.grid = this.mapLayout.map(row => [...row]);
    this.pac = { x: 9, y: 12, dirX: 0, dirY: 0, nextDirX: 0, nextDirY: 0, mouthAngle: 0.2, mouthDir: 1 };
    this.ghosts = [
      { x: 8, y: 8, color: '#f43f5e', dirX: 0, dirY: -1, name: 'Blinky' },
      { x: 9, y: 8, color: '#ec4899', dirX: 0, dirY: 1, name: 'Pinky' },
      { x: 8, y: 9, color: '#06b6d4', dirX: -1, dirY: 0, name: 'Inky' },
      { x: 9, y: 9, color: '#fbbf24', dirX: 1, dirY: 0, name: 'Clyde' }
    ];
  }

  reset() {
    this.score = 0;
    this.lives = 3;
    this.frightenedTimer = 0;
    this.initBoard();
    if (this.onScoreUpdate) this.onScoreUpdate(this.score);
  }

  bindEvents() {
    this.handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }

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

      if (e.code === 'ArrowUp' || e.code === 'KeyW') { this.pac.nextDirX = 0; this.pac.nextDirY = -1; }
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') { this.pac.nextDirX = 0; this.pac.nextDirY = 1; }
      else if (e.code === 'ArrowLeft' || e.code === 'KeyA') { this.pac.nextDirX = -1; this.pac.nextDirY = 0; }
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') { this.pac.nextDirX = 1; this.pac.nextDirY = 0; }
    };

    window.addEventListener('keydown', this.handleKeyDown);
  }

  isWall(x, y) {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return true;
    return this.grid[y][x] === 1;
  }

  update() {
    if (this.gameState !== 'playing') return;

    if (this.frightenedTimer > 0) this.frightenedTimer--;

    // Update Pac-Man direction if turning is valid
    if (!this.isWall(this.pac.x + this.pac.nextDirX, this.pac.y + this.pac.nextDirY)) {
      this.pac.dirX = this.pac.nextDirX;
      this.pac.dirY = this.pac.nextDirY;
    }

    // Move Pac-Man
    if (!this.isWall(this.pac.x + this.pac.dirX, this.pac.y + this.pac.dirY)) {
      this.pac.x += this.pac.dirX;
      this.pac.y += this.pac.dirY;

      // Wrap-around screen portals
      if (this.pac.x < 0) this.pac.x = this.cols - 1;
      if (this.pac.x >= this.cols) this.pac.x = 0;
    }

    // Chomp animation
    this.pac.mouthAngle += 0.08 * this.pac.mouthDir;
    if (this.pac.mouthAngle > 0.45 || this.pac.mouthAngle < 0.05) {
      this.pac.mouthDir *= -1;
    }

    // Eat dots & Power Pellets
    const cell = this.grid[this.pac.y][this.pac.x];
    if (cell === 2) {
      this.grid[this.pac.y][this.pac.x] = 0;
      this.score += 10;
      window.storageManager.addXP(2);
      if (this.onScoreUpdate) this.onScoreUpdate(this.score);
      if (window.soundEngine) window.soundEngine.playHover();
    } else if (cell === 3) {
      this.grid[this.pac.y][this.pac.x] = 0;
      this.score += 50;
      this.frightenedTimer = 350; // ~6 seconds vulnerable
      window.storageManager.addXP(10);
      if (this.onScoreUpdate) this.onScoreUpdate(this.score);
      if (window.soundEngine) window.soundEngine.playPowerup();
    }

    // Move Ghosts (Smart / Random pathfinding)
    this.ghosts.forEach(g => {
      const possibleDirs = [
        { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
      ].filter(d => !this.isWall(g.x + d.x, g.y + d.y) && !(d.x === -g.dirX && d.y === -g.dirY));

      if (possibleDirs.length > 0) {
        // Path toward Pac-Man if normal, away if frightened
        if (this.frightenedTimer > 0) {
          // Frightened: pick random valid turn
          const chosen = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
          g.dirX = chosen.x;
          g.dirY = chosen.y;
        } else {
          // Chase Pac-Man
          possibleDirs.sort((a, b) => {
            const distA = Math.hypot(g.x + a.x - this.pac.x, g.y + a.y - this.pac.y);
            const distB = Math.hypot(g.x + b.x - this.pac.x, g.y + b.y - this.pac.y);
            return distA - distB;
          });
          g.dirX = possibleDirs[0].x;
          g.dirY = possibleDirs[0].y;
        }
      }

      g.x += g.dirX;
      g.y += g.dirY;

      // Wrap portals
      if (g.x < 0) g.x = this.cols - 1;
      if (g.x >= this.cols) g.x = 0;

      // Ghost collision with Pac-Man
      if (g.x === this.pac.x && g.y === this.pac.y) {
        if (this.frightenedTimer > 0) {
          // Pac-Man eats ghost!
          g.x = 8;
          g.y = 8;
          this.score += 200;
          window.storageManager.addXP(25);
          if (this.onScoreUpdate) this.onScoreUpdate(this.score);
          if (window.soundEngine) window.soundEngine.playScore();
        } else {
          // Pac-Man hit
          this.lives--;
          if (window.soundEngine) window.soundEngine.playHit();
          if (this.lives <= 0) {
            this.gameState = 'gameover';
            if (window.soundEngine) window.soundEngine.playGameOver();
            const res = window.storageManager.setHighScore(this.id, this.score);
            this.highScore = res.score;
            if (this.onGameOver) this.onGameOver(this.score, this.highScore, res.isNew);
          } else {
            this.pac.x = 9;
            this.pac.y = 12;
            this.pac.dirX = 0;
            this.pac.dirY = 0;
          }
        }
      }
    });

    // Check Victory (all dots eaten)
    let remaining = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] === 2 || this.grid[r][c] === 3) remaining++;
      }
    }
    if (remaining === 0) {
      this.gameState = 'victory';
      this.score += 1000;
      window.storageManager.addXP(100);
      if (window.soundEngine) window.soundEngine.playVictory();
      const res = window.storageManager.setHighScore(this.id, this.score);
      this.highScore = res.score;
      if (this.onGameOver) this.onGameOver(this.score, this.highScore, res.isNew);
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.fillStyle = '#050711';
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw Maze Walls & Pellets
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = c * this.cellSize;
        const y = r * this.cellSize;
        const cell = this.grid[r][c];

        if (cell === 1) {
          ctx.fillStyle = '#1e1b4b';
          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4, 6);
          ctx.fill();
          ctx.stroke();
        } else if (cell === 2) {
          // Dot
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(x + this.cellSize / 2, y + this.cellSize / 2, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (cell === 3) {
          // Power Pellet
          ctx.fillStyle = '#fbbf24';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(x + this.cellSize / 2, y + this.cellSize / 2, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    // Draw Pac-Man
    const pacX = this.pac.x * this.cellSize + this.cellSize / 2;
    const pacY = this.pac.y * this.cellSize + this.cellSize / 2;
    let angleOffset = 0;
    if (this.pac.dirX === 1) angleOffset = 0;
    else if (this.pac.dirX === -1) angleOffset = Math.PI;
    else if (this.pac.dirY === 1) angleOffset = Math.PI / 2;
    else if (this.pac.dirY === -1) angleOffset = -Math.PI / 2;

    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(
      pacX,
      pacY,
      12,
      angleOffset + this.pac.mouthAngle * Math.PI,
      angleOffset + (2 - this.pac.mouthAngle) * Math.PI
    );
    ctx.lineTo(pacX, pacY);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Ghosts
    this.ghosts.forEach(g => {
      const gx = g.x * this.cellSize + this.cellSize / 2;
      const gy = g.y * this.cellSize + this.cellSize / 2;
      const isFrightened = this.frightenedTimer > 0;

      ctx.fillStyle = isFrightened ? '#38bdf8' : g.color;
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(gx, gy - 2, 11, Math.PI, 0);
      ctx.lineTo(gx + 11, gy + 10);
      ctx.lineTo(gx + 4, gy + 6);
      ctx.lineTo(gx, gy + 10);
      ctx.lineTo(gx - 4, gy + 6);
      ctx.lineTo(gx - 11, gy + 10);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(gx - 4, gy - 3, 3, 0, Math.PI * 2);
      ctx.arc(gx + 4, gy - 3, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(gx - 4, gy - 3, 1.5, 0, Math.PI * 2);
      ctx.arc(gx + 4, gy - 3, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // HUD Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${this.score}`, 20, 595);

    ctx.textAlign = 'right';
    const livesDisplay = '🟡 '.repeat(Math.max(0, this.lives));
    ctx.fillText(livesDisplay, this.width - 20, 595);

    // Overlays
    if (this.gameState === 'idle') {
      ctx.fillStyle = 'rgba(5, 7, 17, 0.85)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CYBER PAC-MAZE', this.width / 2, this.height / 2 - 35);

      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('NAVIGATE CORRIDORS WITH ARROWS / WASD', this.width / 2, this.height / 2 + 10);

      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('EAT POWER PELLETS TO CHASE THE GHOSTS!', this.width / 2, this.height / 2 + 38);
    } else if (this.gameState === 'gameover') {
      ctx.fillStyle = 'rgba(5, 7, 17, 0.88)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CAUGHT BY GHOSTS!', this.width / 2, this.height / 2 - 35);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Outfit, sans-serif';
      ctx.fillText(`FINAL SCORE: ${this.score}`, this.width / 2, this.height / 2 + 8);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('PRESS ANY KEY TO PLAY AGAIN', this.width / 2, this.height / 2 + 65);
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
  }
}

window.CyberPacGame = CyberPacGame;
