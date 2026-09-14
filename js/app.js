/**
 * Main Application Orchestrator
 * Connects UI, Bento Grid, Search, Categories, Game Arena Modal, and Gamification.
 */

// Global Toast System
window.showToast = function(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'achievement' ? 'toast-achievement' : ''}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  // Animate in
  setTimeout(() => toast.classList.add('visible'), 20);

  // Auto remove
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 350);
  }, 3500);
};

class ArcadeApp {
  constructor() {
    this.games = window.GAMES_CATALOG || [];
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.activeGameInstance = null;
    this.activeGameData = null;

    this.initElements();
    this.bindEvents();
    this.renderBentoGrid();
    this.updateUserStats();
    this.checkDeepLink();
  }

  initElements() {
    this.gridContainer = document.getElementById('bento-grid');
    this.searchInput = document.getElementById('search-input');
    this.searchDropdown = document.getElementById('search-results');
    this.categoryPills = document.querySelectorAll('.category-pill');
    this.surpriseBtn = document.getElementById('btn-surprise');
    this.soundToggleBtn = document.getElementById('btn-sound-toggle');
    this.soundIcon = document.getElementById('sound-icon');
    this.xpChip = document.getElementById('player-xp-chip');
    this.achievementsModal = document.getElementById('achievements-modal');
    this.closeAchievementsBtn = document.getElementById('close-achievements-btn');

    // Arena Modal elements
    this.arena = document.getElementById('game-arena');
    this.arenaCanvas = document.getElementById('arena-canvas');
    this.arenaTitle = document.getElementById('arena-title');
    this.arenaTags = document.getElementById('arena-tags');
    this.arenaControls = document.getElementById('controls-guide');
    this.arenaBackBtn = document.getElementById('arena-back-btn');
    this.arenaCloseBtn = document.getElementById('arena-close-btn');
    this.arenaFullscreenBtn = document.getElementById('arena-fullscreen-btn');
    this.arenaFavBtn = document.getElementById('arena-fav-btn');
    this.arenaLikeBtn = document.getElementById('arena-like-btn');
    this.arenaLikesCount = document.getElementById('arena-likes-count');
    this.arenaShareBtn = document.getElementById('arena-share-btn');
    this.gamesCountBadge = document.getElementById('games-count');

    // Sync audio icon state
    this.updateSoundIcon();
  }

  bindEvents() {
    // Keyboard shortcut '/' to search
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== this.searchInput) {
        e.preventDefault();
        this.searchInput.focus();
      }
      if (e.key === 'Escape') {
        if (this.arena.classList.contains('active')) {
          this.closeGameArena();
        }
        if (this.achievementsModal.classList.contains('active')) {
          this.closeAchievements();
        }
      }
    });

    // Search input
    this.searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.renderBentoGrid();
      this.renderSearchDropdown();
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!this.searchInput.contains(e.target) && !this.searchDropdown.contains(e.target)) {
        this.searchDropdown.classList.remove('active');
      }
    });

    // Category pills
    this.categoryPills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.categoryPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.currentCategory = pill.dataset.category;
        if (window.soundEngine) window.soundEngine.playClick();
        this.renderBentoGrid();
      });
    });

    // Surprise Me / Random game
    this.surpriseBtn.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playPowerup();
      const randomGame = this.games[Math.floor(Math.random() * this.games.length)];
      this.openGame(randomGame.id);
    });

    // Global sound toggle
    this.soundToggleBtn.addEventListener('click', () => {
      if (window.soundEngine) {
        window.soundEngine.toggleMute();
        this.updateSoundIcon();
        if (!window.soundEngine.isMuted) {
          window.soundEngine.playClick();
        }
      }
    });

    // XP player chip -> open achievements
    this.xpChip.addEventListener('click', () => {
      this.openAchievements();
    });

    this.closeAchievementsBtn.addEventListener('click', () => {
      this.closeAchievements();
    });

    // Arena Modal buttons
    this.arenaBackBtn.addEventListener('click', () => this.closeGameArena());
    this.arenaCloseBtn.addEventListener('click', () => this.closeGameArena());

    this.arenaFullscreenBtn.addEventListener('click', () => {
      const viewport = document.getElementById('canvas-viewport');
      if (!document.fullscreenElement) {
        viewport.requestFullscreen().catch(err => {
          console.warn('Fullscreen request failed:', err);
        });
      } else {
        document.exitFullscreen();
      }
    });

    this.arenaFavBtn.addEventListener('click', () => {
      if (!this.activeGameData) return;
      const res = window.storageManager.toggleFavorite(this.activeGameData.id);
      this.arenaFavBtn.classList.toggle('active', res.isFav);
      this.arenaFavBtn.textContent = res.isFav ? '❤️ Saved' : '🤍 Favorite';
      if (window.soundEngine) window.soundEngine.playClick();
      window.showToast(res.isFav ? `Added to favorites!` : `Removed from favorites.`);
      this.renderBentoGrid();
    });

    this.arenaLikeBtn.addEventListener('click', () => {
      if (!this.activeGameData) return;
      const isLiked = window.storageManager.toggleLike(this.activeGameData.id);
      this.arenaLikeBtn.classList.toggle('liked', isLiked);
      const count = this.activeGameData.likesCount + (isLiked ? 1 : 0);
      this.arenaLikesCount.textContent = count.toLocaleString();
      if (window.soundEngine) window.soundEngine.playScore();
      this.updateUserStats();
    });

    this.arenaShareBtn.addEventListener('click', () => {
      if (!this.activeGameData) return;
      const url = `${window.location.origin}${window.location.pathname}?game=${this.activeGameData.id}`;
      navigator.clipboard.writeText(url).then(() => {
        window.showToast('🔗 Game link copied to clipboard!');
        if (window.soundEngine) window.soundEngine.playClick();
      }).catch(() => {
        window.showToast(`Share URL: ${url}`);
      });
    });

    // Spotlight featured play button
    const heroBtn = document.getElementById('hero-play-btn');
    if (heroBtn) {
      heroBtn.addEventListener('click', () => {
        this.openGame('galaxy-defender');
      });
    }

    // Footer link shortcuts
    const favLink = document.getElementById('footer-favorites-link');
    if (favLink) {
      favLink.addEventListener('click', (e) => {
        e.preventDefault();
        const favPill = document.querySelector('[data-category="favorites"]');
        if (favPill) favPill.click();
        window.scrollTo({ top: 400, behavior: 'smooth' });
      });
    }

    const surpriseLink = document.getElementById('footer-surprise-link');
    if (surpriseLink) {
      surpriseLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.surpriseBtn.click();
      });
    }
  }

  updateSoundIcon() {
    const isMuted = window.soundEngine ? window.soundEngine.isMuted : false;
    this.soundIcon.textContent = isMuted ? '🔇' : '🔊';
  }

  getFilteredGames() {
    return this.games.filter(game => {
      // Category check
      if (this.currentCategory === 'favorites') {
        if (!window.storageManager.isFavorite(game.id)) return false;
      } else if (this.currentCategory !== 'all') {
        const matchesCategory = game.category === this.currentCategory ||
                                (game.categories && game.categories.includes(this.currentCategory));
        if (!matchesCategory) return false;
      }

      // Search query check
      if (this.searchQuery) {
        const matchTitle = game.title.toLowerCase().includes(this.searchQuery);
        const matchTags = game.tags.some(t => t.toLowerCase().includes(this.searchQuery));
        const matchDesc = game.description.toLowerCase().includes(this.searchQuery);
        if (!matchTitle && !matchTags && !matchDesc) return false;
      }

      return true;
    });
  }

  renderBentoGrid() {
    const filtered = this.getFilteredGames();
    this.gridContainer.innerHTML = '';

    if (this.gamesCountBadge) {
      this.gamesCountBadge.textContent = `${filtered.length} Games Available`;
    }

    if (filtered.length === 0) {
      this.gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
          <h3 style="color: #ffffff; margin-bottom: 0.5rem; font-family: var(--font-heading);">No Games Found</h3>
          <p>Try searching for something else or explore all categories.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(game => {
      const card = document.createElement('article');
      card.className = `bento-card ${game.bentoSize}`;
      card.style.background = game.colorGradient;
      card.setAttribute('data-id', game.id);
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');

      const isFav = window.storageManager.isFavorite(game.id);

      card.innerHTML = `
        <div class="card-top">
          <span class="game-badge ${game.badgeClass}">${game.badge}</span>
          <button class="card-fav-btn ${isFav ? 'active' : ''}" data-fav-id="${game.id}" title="Favorite">
            ${isFav ? '❤️' : '🤍'}
          </button>
        </div>

        <div class="card-illustration">
          ${game.iconSvg}
        </div>

        <div class="card-hover-overlay">
          <div class="hover-play-btn">
            <svg viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"/></svg>
          </div>
        </div>

        <div class="card-bottom">
          <h3 class="card-title">${game.title}</h3>
          <div class="card-meta">
            <div class="card-rating">
              <span>★</span>
              <span>${game.rating}</span>
            </div>
            <span>${game.plays} plays</span>
          </div>
        </div>
      `;

      // Quick favorite button click
      const favBtn = card.querySelector('.card-fav-btn');
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const res = window.storageManager.toggleFavorite(game.id);
        favBtn.classList.toggle('active', res.isFav);
        favBtn.textContent = res.isFav ? '❤️' : '🤍';
        if (window.soundEngine) window.soundEngine.playClick();
        window.showToast(res.isFav ? `Added to favorites!` : `Removed from favorites.`);
      });

      // Open game on card click
      card.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.playClick();
        this.openGame(game.id);
      });

      // Sound hover micro-interaction
      card.addEventListener('mouseenter', () => {
        if (window.soundEngine) window.soundEngine.playHover();
      });

      this.gridContainer.appendChild(card);
    });
  }

  renderSearchDropdown() {
    if (!this.searchQuery) {
      this.searchDropdown.classList.remove('active');
      this.searchDropdown.innerHTML = '';
      return;
    }

    const filtered = this.games.filter(g => 
      g.title.toLowerCase().includes(this.searchQuery) ||
      g.tags.some(t => t.toLowerCase().includes(this.searchQuery))
    );

    if (filtered.length === 0) {
      this.searchDropdown.innerHTML = `
        <div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
          No matching games found
        </div>
      `;
    } else {
      this.searchDropdown.innerHTML = filtered.map(game => `
        <div class="search-result-item" data-id="${game.id}">
          <div class="search-result-thumb">
            ${game.iconSvg}
          </div>
          <div class="search-result-info">
            <h4>${game.title}</h4>
            <span>${game.category.toUpperCase()} • ${game.rating} ★</span>
          </div>
        </div>
      `).join('');

      this.searchDropdown.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          this.openGame(item.dataset.id);
          this.searchDropdown.classList.remove('active');
          this.searchInput.value = '';
          this.searchQuery = '';
          this.renderBentoGrid();
        });
      });
    }

    this.searchDropdown.classList.add('active');
  }

  openGame(gameId) {
    const game = this.games.find(g => g.id === gameId);
    if (!game) return;

    // Destroy existing game instance cleanly
    if (this.activeGameInstance && typeof this.activeGameInstance.destroy === 'function') {
      this.activeGameInstance.destroy();
      this.activeGameInstance = null;
    }

    this.activeGameData = game;

    // Record recently played
    window.storageManager.addRecentlyPlayed(game.id);
    window.storageManager.checkAchievement('first_game');
    this.updateUserStats();

    // Populate Arena Metadata
    this.arenaTitle.textContent = game.title;
    this.arenaTags.innerHTML = `
      <span>${game.category.toUpperCase()}</span>
      <span>•</span>
      <span>${game.rating} ★</span>
      <span>•</span>
      <span>${game.plays} plays</span>
    `;

    // Render controls guide
    this.arenaControls.innerHTML = game.controls.map(c => `
      <div class="control-pill">
        <span class="control-key">${c.key}</span>
        <span>${c.desc}</span>
      </div>
    `).join('');

    // Update Fav button
    const isFav = window.storageManager.isFavorite(game.id);
    this.arenaFavBtn.classList.toggle('active', isFav);
    this.arenaFavBtn.textContent = isFav ? '❤️ Saved' : '🤍 Favorite';

    // Update Likes button
    const isLiked = window.storageManager.hasLiked(game.id);
    this.arenaLikeBtn.classList.toggle('liked', isLiked);
    this.arenaLikesCount.textContent = (game.likesCount + (isLiked ? 1 : 0)).toLocaleString();

    // Open Modal
    this.arena.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Update URL query parameter
    const newUrl = `${window.location.pathname}?game=${game.id}`;
    window.history.pushState({ game: game.id }, '', newUrl);

    // Instantiate game engine
    const EngineClass = window[game.engine];
    if (EngineClass) {
      this.activeGameInstance = new EngineClass(
        this.arenaCanvas,
        this.arena,
        (score) => {
          // On score update
        },
        (score, highScore, isNewRecord) => {
          if (isNewRecord) {
            window.showToast(`🔥 New High Score: ${highScore}!`, 'achievement');
          }
          this.updateUserStats();
        }
      );
    } else {
      console.error(`Engine ${game.engine} not loaded.`);
    }
  }

  closeGameArena() {
    if (this.activeGameInstance && typeof this.activeGameInstance.destroy === 'function') {
      this.activeGameInstance.destroy();
      this.activeGameInstance = null;
    }

    this.activeGameData = null;
    this.arena.classList.remove('active');
    document.body.style.overflow = '';

    // Clear URL query parameter
    window.history.pushState({}, '', window.location.pathname);
  }

  checkDeepLink() {
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('game');
    if (gameId) {
      setTimeout(() => this.openGame(gameId), 150);
    }
  }

  updateUserStats() {
    const levelInfo = window.storageManager.getLevel();
    const xpBadge = document.getElementById('xp-level-badge');
    const xpText = document.getElementById('xp-text');
    const xpBar = document.getElementById('xp-bar-mini-fill');

    if (xpBadge) xpBadge.textContent = `LVL ${levelInfo.level}`;
    if (xpText) xpText.textContent = `${levelInfo.currentXP} XP`;
    if (xpBar) xpBar.style.width = `${levelInfo.progress}%`;
  }

  openAchievements() {
    const unlocked = window.storageManager.getAchievements();
    const listContainer = document.getElementById('achievements-list');
    const defs = window.storageManager.ACHIEVEMENT_DEFS;

    listContainer.innerHTML = Object.keys(defs).map(key => {
      const item = defs[key];
      const isUnlocked = unlocked.includes(key);
      return `
        <div class="achievement-card ${isUnlocked ? 'unlocked' : ''}">
          <div class="achievement-icon">${isUnlocked ? '🏆' : '🔒'}</div>
          <div class="achievement-details">
            <h4>${item.title} ${isUnlocked ? '✅' : ''}</h4>
            <p>${item.desc}</p>
          </div>
        </div>
      `;
    }).join('');

    this.achievementsModal.classList.add('active');
  }

  closeAchievements() {
    this.achievementsModal.classList.remove('active');
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new ArcadeApp();
});
