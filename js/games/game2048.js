/**
 * 2048 Neon Pulse
 * High-polish neon themed 2048 tile puzzle with animations, sound FX, and undo.
 */
class Game2048Engine {
  constructor(canvas, container, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.container = container;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    this.id = 'game-2048';

    this.size = 4;
    this.width = 480;
    this.height = 480;
    this.setupCanvas();

    this.board = [];
    this.history = [];
    this.score = 0;
    this.highScore = window.storageManager.getHighScore(this.id);
    this.isOver = false;
    this.won = false;
    this.touchStartX = 0;
    this.touchStartY = 0;

    this.tileColors = {
      2: { bg: '#1e293b', text: '#e2e8f0', glow: '#64748b' },
      4: { bg: '#334155', text: '#f8fafc', glow: '#94a3b8' },
      8: { bg: '#0284c7', text: '#ffffff', glow: '#38bdf8' },
      16: { bg: '#0d9488', text: '#ffffff', glow: '#2dd4bf' },
      32: { bg: '#16a34a', text: '#ffffff', glow: '#4ade80' },
      64: { bg: '#ca8a04', text: '#ffffff', glow: '#facc15' },
      128: { bg: '#ea580c', text: '#ffffff', glow: '#fb923c' },
      256: { bg: '#e11d48', text: '#ffffff', glow: '#fb7185' },
      512: { bg: '#9333ea', text: '#ffffff', glow: '#c084fc' },
      1024: { bg: '#4f46e5', text: '#ffffff', glow: '#818cf8' },
      2048: { bg: '#f59e0b', text: '#ffffff', glow: '#fde047' },
      4096: { bg: '#ec4899', text: '#ffffff', glow: '#f472b6' }
    };

    this.initBoard();
    this.bindEvents();
    this.render();
  }

  setupCanvas() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.maxHeight = '500px';
    this.canvas.style.objectFit = 'contain';
  }

  initBoard() {
    this.board = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
    this.score = 0;
    this.isOver = false;
    this.won = false;
    this.history = [];
    this.addRandomTile();
    this.addRandomTile();
    if (this.onScoreUpdate) this.onScoreUpdate(this.score);
  }

  saveState() {
    this.history.push({
      board: this.board.map(row => [...row]),
      score: this.score
    });
    if (this.history.length > 5) this.history.shift();
  }

  undo() {
    if (this.history.length > 0 && !this.isOver) {
      const prev = this.history.pop();
      this.board = prev.board;
      this.score = prev.score;
      if (this.onScoreUpdate) this.onScoreUpdate(this.score);
      if (window.soundEngine) window.soundEngine.playClick();
      this.render();
    }
  }

  addRandomTile() {
    const emptyCells = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c] === 0) {
          emptyCells.push({ r, c });
        }
      }
    }
    if (emptyCells.length > 0) {
      const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.board[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  bindEvents() {
    this.handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyU'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'KeyU') {
        this.undo();
        return;
      }

      let moved = false;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') moved = this.move('up');
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') moved = this.move('down');
      else if (e.code === 'ArrowLeft' || e.code === 'KeyA') moved = this.move('left');
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') moved = this.move('right');

      if (moved) {
        this.afterMove();
      }
    };

    this.handleTouchStart = (e) => {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    };

    this.handleTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - this.touchStartX;
      const dy = e.changedTouches[0].clientY - this.touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) > 20) {
        let moved = false;
        if (absDx > absDy) {
          moved = dx > 0 ? this.move('right') : this.move('left');
        } else {
          moved = dy > 0 ? this.move('down') : this.move('up');
        }
        if (moved) this.afterMove();
      }
    };

    this.handleCanvasClick = () => {
      if (this.isOver) {
        this.initBoard();
        this.render();
      }
    };

    window.addEventListener('keydown', this.handleKeyDown);
    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: true });
    this.canvas.addEventListener('click', this.handleCanvasClick);
  }

  move(direction) {
    if (this.isOver) return false;
    this.saveState();

    let moved = false;
    let mergedScore = 0;

    const slide = (row) => {
      let filtered = row.filter(val => val !== 0);
      for (let i = 0; i < filtered.length - 1; i++) {
        if (filtered[i] === filtered[i + 1]) {
          filtered[i] *= 2;
          mergedScore += filtered[i];
          filtered[i + 1] = 0;
          if (filtered[i] === 2048 && !this.won) {
            this.won = true;
            if (window.soundEngine) window.soundEngine.playVictory();
            window.storageManager.checkAchievement('high_scorer');
          }
        }
      }
      filtered = filtered.filter(val => val !== 0);
      while (filtered.length < this.size) {
        filtered.push(0);
      }
      return filtered;
    };

    if (direction === 'left') {
      for (let r = 0; r < this.size; r++) {
        const row = this.board[r];
        const newRow = slide(row);
        if (row.some((val, idx) => val !== newRow[idx])) moved = true;
        this.board[r] = newRow;
      }
    } else if (direction === 'right') {
      for (let r = 0; r < this.size; r++) {
        const row = [...this.board[r]].reverse();
        const newRow = slide(row).reverse();
        if (this.board[r].some((val, idx) => val !== newRow[idx])) moved = true;
        this.board[r] = newRow;
      }
    } else if (direction === 'up') {
      for (let c = 0; c < this.size; c++) {
        const col = [this.board[0][c], this.board[1][c], this.board[2][c], this.board[3][c]];
        const newCol = slide(col);
        if (col.some((val, idx) => val !== newCol[idx])) moved = true;
        for (let r = 0; r < this.size; r++) this.board[r][c] = newCol[r];
      }
    } else if (direction === 'down') {
      for (let c = 0; c < this.size; c++) {
        const col = [this.board[3][c], this.board[2][c], this.board[1][c], this.board[0][c]];
        const newCol = slide(col).reverse();
        if ([this.board[0][c], this.board[1][c], this.board[2][c], this.board[3][c]].some((val, idx) => val !== newCol[idx])) moved = true;
        for (let r = 0; r < this.size; r++) this.board[r][c] = newCol[r];
      }
    }

    if (moved) {
      if (mergedScore > 0) {
        this.score += mergedScore;
        window.storageManager.addXP(Math.floor(mergedScore / 4));
        if (window.soundEngine) window.soundEngine.playScore();
      } else {
        if (window.soundEngine) window.soundEngine.playHover();
      }
      if (this.onScoreUpdate) this.onScoreUpdate(this.score);
    } else {
      this.history.pop(); // Revert state if no actual shift
    }

    return moved;
  }

  afterMove() {
    this.addRandomTile();
    this.render();

    if (this.checkGameOver()) {
      this.isOver = true;
      if (window.soundEngine) window.soundEngine.playGameOver();
      const res = window.storageManager.setHighScore(this.id, this.score);
      this.highScore = res.score;
      if (this.onGameOver) this.onGameOver(this.score, this.highScore, res.isNew);
      this.render();
    }
  }

  checkGameOver() {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c] === 0) return false;
        if (c < this.size - 1 && this.board[r][c] === this.board[r][c + 1]) return false;
        if (r < this.size - 1 && this.board[r][c] === this.board[r + 1][c]) return false;
      }
    }
    return true;
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Board Frame
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(10, 10, this.width - 20, this.height - 20, 18);
    ctx.fill();

    const padding = 16;
    const cellSize = (this.width - 20 - padding * 5) / 4;

    // Draw Grid Cells & Numbers
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const x = 10 + padding + c * (cellSize + padding);
        const y = 10 + padding + r * (cellSize + padding);
        const val = this.board[r][c];

        if (val === 0) {
          ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
          ctx.beginPath();
          ctx.roundRect(x, y, cellSize, cellSize, 12);
          ctx.fill();
        } else {
          const config = this.tileColors[val] || { bg: '#3b82f6', text: '#ffffff', glow: '#60a5fa' };

          // Glow effect
          ctx.shadowColor = config.glow;
          ctx.shadowBlur = val >= 128 ? 16 : 8;
          ctx.fillStyle = config.bg;
          ctx.beginPath();
          ctx.roundRect(x, y, cellSize, cellSize, 12);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Inner highlight border
          ctx.strokeStyle = config.glow;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Value Text
          ctx.fillStyle = config.text;
          ctx.font = `bold ${val > 512 ? '24px' : '32px'} Outfit, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(val.toString(), x + cellSize / 2, y + cellSize / 2);
        }
      }
    }

    // Game Over Overlay
    if (this.isOver) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(10, 10, this.width - 20, this.height - 20, 18);
      ctx.fill();

      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NO MORE MOVES!', this.width / 2, this.height / 2 - 30);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Outfit, sans-serif';
      ctx.fillText(`SCORE: ${this.score}`, this.width / 2, this.height / 2 + 10);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('TAP OR CLICK TO TRY AGAIN', this.width / 2, this.height / 2 + 55);
    }
  }

  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    this.canvas.removeEventListener('click', this.handleCanvasClick);
  }
}

window.Game2048Engine = Game2048Engine;
