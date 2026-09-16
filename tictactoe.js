/**
 * Neon Tic-Tac-Toe AI
 * Cyber duel against an unbeatable minimax AI or local 2-Player mode with glowing neon graphics.
 */
class NeonTicTacToeGame {
  constructor(canvas, container, onScoreUpdate, onGameOver) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.container = container;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    this.id = 'neon-tictactoe';

    this.width = 460;
    this.height = 540;
    this.setupCanvas();

    this.board = Array(9).fill(null);
    this.turn = 'X'; // 'X' is Player 1 (cyan), 'O' is Player 2 / AI (magenta)
    this.mode = 'ai'; // 'ai' or '2p'
    this.difficulty = 'medium'; // 'easy', 'medium', 'impossible'
    this.winner = null; // 'X', 'O', 'draw'
    this.winningLine = null;
    this.winStreak = 0;
    this.score = 0;
    this.highScore = window.storageManager.getHighScore(this.id);
    this.particles = [];

    this.cellSize = 120;
    this.offsetX = (this.width - this.cellSize * 3) / 2;
    this.offsetY = 90;

    this.bindEvents();
    this.render();
  }

  setupCanvas() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.maxHeight = '560px';
    this.canvas.style.objectFit = 'contain';
  }

  reset() {
    this.board = Array(9).fill(null);
    this.turn = 'X';
    this.winner = null;
    this.winningLine = null;
    this.particles = [];
    this.render();
  }

  bindEvents() {
    this.handleClick = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const clientX = (e.clientX - rect.left) * scaleX;
      const clientY = (e.clientY - rect.top) * scaleY;

      // Mode switch buttons click area at top
      if (clientY >= 20 && clientY <= 60) {
        if (clientX >= 40 && clientX <= 210) {
          this.mode = 'ai';
          this.reset();
          if (window.soundEngine) window.soundEngine.playClick();
          return;
        } else if (clientX >= 250 && clientX <= 420) {
          this.mode = '2p';
          this.reset();
          if (window.soundEngine) window.soundEngine.playClick();
          return;
        }
      }

      // Reset button click area at bottom
      if (clientY >= 475 && clientY <= 520) {
        this.reset();
        if (window.soundEngine) window.soundEngine.playClick();
        return;
      }

      if (this.winner) {
        this.reset();
        return;
      }

      // Grid clicks
      const col = Math.floor((clientX - this.offsetX) / this.cellSize);
      const row = Math.floor((clientY - this.offsetY) / this.cellSize);

      if (col >= 0 && col < 3 && row >= 0 && row < 3) {
        const index = row * 3 + col;
        if (this.board[index] === null) {
          this.makeMove(index, this.turn);

          if (!this.winner && this.mode === 'ai' && this.turn === 'O') {
            setTimeout(() => this.makeAIMove(), 250);
          }
        }
      }
    };

    this.canvas.addEventListener('pointerdown', this.handleClick);
  }

  makeMove(index, player) {
    this.board[index] = player;
    const col = index % 3;
    const row = Math.floor(index / 3);
    const cx = this.offsetX + col * this.cellSize + this.cellSize / 2;
    const cy = this.offsetY + row * this.cellSize + this.cellSize / 2;

    this.spawnSparks(cx, cy, player === 'X' ? '#06b6d4' : '#f43f5e');
    if (window.soundEngine) window.soundEngine.playClick();

    const winData = this.checkWin(this.board);
    if (winData) {
      this.winner = winData.winner;
      this.winningLine = winData.line;

      if (this.winner === 'X') {
        this.winStreak++;
        this.score = this.winStreak * 100;
        window.storageManager.addXP(50);
        if (this.onScoreUpdate) this.onScoreUpdate(this.score);
        if (window.soundEngine) window.soundEngine.playVictory();
        const res = window.storageManager.setHighScore(this.id, this.score);
        this.highScore = res.score;
        if (this.onGameOver) this.onGameOver(this.score, this.highScore, res.isNew);
      } else if (this.winner === 'O') {
        this.winStreak = 0;
        if (window.soundEngine) window.soundEngine.playGameOver();
      }
    } else if (this.board.every(cell => cell !== null)) {
      this.winner = 'draw';
      if (window.soundEngine) window.soundEngine.playHover();
    } else {
      this.turn = this.turn === 'X' ? 'O' : 'X';
    }

    this.render();
  }

  makeAIMove() {
    let move;
    if (this.difficulty === 'easy') {
      const empty = this.board.map((v, i) => v === null ? i : null).filter(v => v !== null);
      move = empty[Math.floor(Math.random() * empty.length)];
    } else if (this.difficulty === 'medium') {
      // 50% minimax, 50% random
      if (Math.random() < 0.6) {
        move = this.getBestMove();
      } else {
        const empty = this.board.map((v, i) => v === null ? i : null).filter(v => v !== null);
        move = empty[Math.floor(Math.random() * empty.length)];
      }
    } else {
      move = this.getBestMove();
    }

    if (move !== undefined && move !== null) {
      this.makeMove(move, 'O');
    }
  }

  getBestMove() {
    // Minimax algorithm for smart AI
    const minimax = (newBoard, depth, isMaximizing) => {
      const result = this.checkWin(newBoard);
      if (result) {
        return result.winner === 'O' ? 10 - depth : depth - 10;
      }
      if (newBoard.every(cell => cell !== null)) return 0;

      if (isMaximizing) {
        let maxScore = -Infinity;
        for (let i = 0; i < 9; i++) {
          if (newBoard[i] === null) {
            newBoard[i] = 'O';
            const score = minimax(newBoard, depth + 1, false);
            newBoard[i] = null;
            maxScore = Math.max(score, maxScore);
          }
        }
        return maxScore;
      } else {
        let minScore = Infinity;
        for (let i = 0; i < 9; i++) {
          if (newBoard[i] === null) {
            newBoard[i] = 'X';
            const score = minimax(newBoard, depth + 1, true);
            newBoard[i] = null;
            minScore = Math.min(score, minScore);
          }
        }
        return minScore;
      }
    };

    let bestScore = -Infinity;
    let bestMove = null;
    for (let i = 0; i < 9; i++) {
      if (this.board[i] === null) {
        this.board[i] = 'O';
        const score = minimax(this.board, 0, false);
        this.board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  }

  checkWin(b) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (let line of lines) {
      const [a, bIdx, c] = line;
      if (b[a] && b[a] === b[bIdx] && b[a] === b[c]) {
        return { winner: b[a], line };
      }
    }
    return null;
  }

  spawnSparks(x, y, color) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        size: Math.random() * 3 + 2,
        color,
        life: 18
      });
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Cyber background
    ctx.fillStyle = '#0b0d17';
    ctx.fillRect(0, 0, this.width, this.height);

    // Mode Selector Buttons
    ctx.fillStyle = this.mode === 'ai' ? '#6366f1' : '#1e293b';
    ctx.beginPath();
    ctx.roundRect(40, 20, 170, 40, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('1P VS SMART AI', 125, 40);

    ctx.fillStyle = this.mode === '2p' ? '#6366f1' : '#1e293b';
    ctx.beginPath();
    ctx.roundRect(250, 20, 170, 40, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText('2-PLAYER LOCAL', 335, 40);

    // Draw Grid Lines with Neon Glow
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    for (let i = 1; i <= 2; i++) {
      // Vertical Lines
      ctx.beginPath();
      ctx.moveTo(this.offsetX + i * this.cellSize, this.offsetY + 10);
      ctx.lineTo(this.offsetX + i * this.cellSize, this.offsetY + this.cellSize * 3 - 10);
      ctx.stroke();

      // Horizontal Lines
      ctx.beginPath();
      ctx.moveTo(this.offsetX + 10, this.offsetY + i * this.cellSize);
      ctx.lineTo(this.offsetX + this.cellSize * 3 - 10, this.offsetY + i * this.cellSize);
      ctx.stroke();
    }

    // Draw X and O marks
    for (let i = 0; i < 9; i++) {
      const val = this.board[i];
      if (!val) continue;

      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx = this.offsetX + col * this.cellSize + this.cellSize / 2;
      const cy = this.offsetY + row * this.cellSize + this.cellSize / 2;
      const rad = 32;

      if (val === 'X') {
        ctx.strokeStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 15;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(cx - rad, cy - rad);
        ctx.lineTo(cx + rad, cy + rad);
        ctx.moveTo(cx + rad, cy - rad);
        ctx.lineTo(cx - rad, cy + rad);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        ctx.strokeStyle = '#f43f5e';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 15;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // Draw Winning Strike Line
    if (this.winningLine) {
      const [startIdx, , endIdx] = this.winningLine;
      const startCol = startIdx % 3;
      const startRow = Math.floor(startIdx / 3);
      const endCol = endIdx % 3;
      const endRow = Math.floor(endIdx / 3);

      const x1 = this.offsetX + startCol * this.cellSize + this.cellSize / 2;
      const y1 = this.offsetY + startRow * this.cellSize + this.cellSize / 2;
      const x2 = this.offsetX + endCol * this.cellSize + this.cellSize / 2;
      const y2 = this.offsetY + endRow * this.cellSize + this.cellSize / 2;

      ctx.strokeStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 20;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw Status / Results & Restart Button
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.textAlign = 'center';

    let statusText = `Turn: ${this.turn === 'X' ? 'Player 1 (Cyan X)' : (this.mode === 'ai' ? 'AI (Red O)' : 'Player 2 (Red O)')}`;
    if (this.winner === 'X') statusText = '🏆 PLAYER 1 WINS!';
    else if (this.winner === 'O') statusText = this.mode === 'ai' ? '🤖 AI WINS!' : '🏆 PLAYER 2 WINS!';
    else if (this.winner === 'draw') statusText = '🤝 IT\'S A DRAW!';

    ctx.fillText(statusText, this.width / 2, 455);

    // Restart Button
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(this.width / 2 - 90, 480, 180, 40, 8);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('RESET BOARD', this.width / 2, 502);
  }

  destroy() {
    this.canvas.removeEventListener('pointerdown', this.handleClick);
  }
}

window.NeonTicTacToeGame = NeonTicTacToeGame;
