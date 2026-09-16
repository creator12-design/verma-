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
    this.activeMobileButtonCleanups = [];
    this.mobileSliderSyncRaf = null;

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
    this.mobileControls = document.getElementById('mobile-game-controls');
    this.arenaMobileBtn = document.getElementById('arena-mobile-btn');
    this.navMobileBtn = document.getElementById('btn-mobile-toggle');
    this.mobileModeActive = (window.innerWidth <= 850);

    // Sync audio icon state
    this.updateSoundIcon();
    this.updateMobileButtonsState();
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

    if (this.arenaMobileBtn) {
      this.arenaMobileBtn.addEventListener('click', () => this.toggleMobileMode());
    }
    if (this.navMobileBtn) {
      this.navMobileBtn.addEventListener('click', () => this.toggleMobileMode());
    }

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

    // Initialize mobile-only virtual controls for this game
    this.setupMobileControls(game.id);
  }

  closeGameArena() {
    this.teardownMobileControls();

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

  updateMobileButtonsState() {
    const label = this.mobileModeActive ? '📱 Mobile Controls: ON' : '📱 Mobile Controls';
    if (this.arenaMobileBtn) {
      this.arenaMobileBtn.classList.toggle('active', this.mobileModeActive);
      this.arenaMobileBtn.textContent = label;
    }
    if (this.navMobileBtn) {
      this.navMobileBtn.classList.toggle('active', this.mobileModeActive);
      this.navMobileBtn.textContent = label;
    }
    if (this.mobileControls) {
      this.mobileControls.classList.toggle('force-show-mobile', this.mobileModeActive);
      this.mobileControls.classList.toggle('force-hide-mobile', !this.mobileModeActive);
    }
  }

  toggleMobileMode() {
    this.mobileModeActive = !this.mobileModeActive;
    this.updateMobileButtonsState();
    if (window.soundEngine) window.soundEngine.playClick();
    window.showToast(this.mobileModeActive ? '📱 Mobile controls enabled!' : 'Mobile controls disabled.');
  }

  pressVirtualKey(code) {
    if (this.activeGameInstance) {
      if (this.activeGameInstance.keys) {
        this.activeGameInstance.keys[code] = true;
      }
      if (this.activeGameInstance.gameState === 'idle' && typeof this.activeGameInstance.loop === 'function') {
        this.activeGameInstance.gameState = 'playing';
        this.activeGameInstance.loop();
      } else if (this.activeGameInstance.gameState === 'gameover' && typeof this.activeGameInstance.reset === 'function') {
        this.activeGameInstance.reset();
        this.activeGameInstance.gameState = 'playing';
        this.activeGameInstance.loop();
      } else if (this.activeGameInstance.gameState === 'victory' && typeof this.activeGameInstance.reset === 'function') {
        this.activeGameInstance.reset();
        this.activeGameInstance.gameState = 'playing';
        this.activeGameInstance.loop();
      }
    }
    window.dispatchEvent(new KeyboardEvent('keydown', { code: code, key: code, bubbles: true, cancelable: true }));
  }

  releaseVirtualKey(code) {
    if (this.activeGameInstance && this.activeGameInstance.keys) {
      this.activeGameInstance.keys[code] = false;
    }
    window.dispatchEvent(new KeyboardEvent('keyup', { code: code, key: code, bubbles: true, cancelable: true }));
  }

  setupMobileControls(gameId) {
    if (!this.mobileControls) return;
    this.teardownMobileControls();

    let html = '';
    const isFighter = (gameId === 'galaxy-defender');
    const isHighwayRacer = (gameId === 'highway-racer');
    const isNitroKart = (gameId === 'nitro-kart');
    const isSlope = (gameId === 'neon-slope');
    const isBreaker = (gameId === 'brick-breaker');
    const isJumper = (gameId === 'cosmic-jumper');
    const isMetroSurfer = (gameId === 'metro-surfer');
    const isDpadGame = ['cyber-hopper', 'cyber-pac', 'neon-serpent', 'game-2048'].includes(gameId);
    const isSingleTap = ['cyber-dash', 'blade-master', 'skyscraper-stack'].includes(gameId);

    if (isFighter) {
      // Galaxy Defender: Sliding button to control airplane + Left/Right buttons + Rapid Fire
      html = `
        <div class="mobile-slider-wrapper">
          <div class="mobile-slider-header">
            <span>✈️ AIRPLANE SLIDER CONTROLLER</span>
            <span class="slider-hint">SLIDE TO FLY AIRPLANE</span>
          </div>
          <div class="mobile-slider-track" id="airplane-slider-track">
            <div class="mobile-slider-guide"></div>
            <div class="mobile-slider-fill" id="airplane-slider-fill"></div>
            <div class="mobile-slider-thumb" id="airplane-slider-thumb" title="Drag to steer airplane">
              <svg viewBox="0 0 24 24"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
            </div>
          </div>
        </div>
        <div class="mobile-buttons-row">
          <div class="mobile-btn-cluster mobile-btn-cluster-left">
            <button type="button" class="mobile-btn mobile-btn-dir mobile-btn-left" data-key="ArrowLeft" aria-label="Steer Airplane Left">
              <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
              <span>LEFT</span>
            </button>
            <button type="button" class="mobile-btn mobile-btn-dir mobile-btn-right" data-key="ArrowRight" aria-label="Steer Airplane Right">
              <span>RIGHT</span>
              <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
            </button>
          </div>
          <div class="mobile-btn-cluster mobile-btn-cluster-right">
            <button type="button" class="mobile-btn mobile-btn-fire" data-key="Space" aria-label="Fire Plasma Laser">
              <svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span>⚡ FIRE</span>
            </button>
          </div>
        </div>
      `;
    } else if (isHighwayRacer) {
      // Apex Highway Racer: Left & Right buttons + Nitro + Brake
      html = `
        <div class="mobile-buttons-row">
          <div class="mobile-btn-cluster mobile-btn-cluster-left">
            <button type="button" class="mobile-btn mobile-btn-dir mobile-btn-left" data-key="ArrowLeft" aria-label="Steer Left">
              <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
              <span>LEFT</span>
            </button>
            <button type="button" class="mobile-btn mobile-btn-dir mobile-btn-right" data-key="ArrowRight" aria-label="Steer Right">
              <span>RIGHT</span>
              <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
            </button>
          </div>
          <div class="mobile-btn-cluster mobile-btn-cluster-right">
            <button type="button" class="mobile-btn mobile-btn-brake" data-key="ArrowDown" aria-label="Emergency Brake">
              <span>🛑 BRAKE</span>
            </button>
            <button type="button" class="mobile-btn mobile-btn-nitro" data-key="ArrowUp" aria-label="Nitro Boost 280+ km/h">
              <span>🔥 NITRO</span>
            </button>
          </div>
        </div>
      `;
    } else if (isNitroKart) {
      // Nitro Kart Frenzy: Left & Right buttons + Gas + Brake + Weapon
      html = `
        <div class="mobile-buttons-row">
          <div class="mobile-btn-cluster mobile-btn-cluster-left">
            <button type="button" class="mobile-btn mobile-btn-dir mobile-btn-left" data-key="ArrowLeft" aria-label="Steer Left">
              <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
              <span>LEFT</span>
            </button>
            <button type="button" class="mobile-btn mobile-btn-dir mobile-btn-right" data-key="ArrowRight" aria-label="Steer Right">
              <span>RIGHT</span>
              <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
            </button>
          </div>
          <div class="mobile-btn-cluster mobile-btn-cluster-right">
            <button type="button" class="mobile-btn mobile-btn-brake" data-key="ArrowDown" aria-label="Brake">
              <span>🛑</span>
            </button>
            <button type="button" class="mobile-btn mobile-btn-gas" data-key="ArrowUp" aria-label="Gas Acceleration">
              <span>⚡ GAS</span>
            </button>
            <button type="button" class="mobile-btn mobile-btn-fire" data-key="Space" aria-label="Launch Weapon">
              <span>🚀 ITEM</span>
            </button>
          </div>
        </div>
      `;
    } else if (isMetroSurfer) {
      // Metro Surfer: Left & Right Lane switch + Jump + Slide
      html = `
        <div class="mobile-buttons-row">
          <div class="mobile-btn-cluster mobile-btn-cluster-left">
            <button type="button" class="mobile-btn mobile-btn-dir mobile-btn-left" data-key="ArrowLeft" aria-label="Left Lane">
              <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
              <span>LANE</span>
            </button>
            <button type="button" class="mobile-btn mobile-btn-dir mobile-btn-right" data-key="ArrowRight" aria-label="Right Lane">
              <span>LANE</span>
              <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
            </button>
          </div>
          <div class="mobile-btn-cluster mobile-btn-cluster-right">
            <button type="button" class="mobile-btn mobile-btn-jump" data-key="ArrowUp" aria-label="Jump">
              <span>⬆ JUMP</span>
            </button>
            <button type="button" class="mobile-btn mobile-btn-slide" data-key="ArrowDown" aria-label="Slide">
              <span>⬇ SLIDE</span>
            </button>
          </div>
        </div>
      `;
    } else if (isSlope || isJumper) {
      // Neon Slope & Cosmic Jumper: Left & Right steering
      html = `
        <div class="mobile-buttons-row">
          <div class="mobile-btn-cluster mobile-btn-cluster-center" style="gap: 1.5rem;">
            <button type="button" class="mobile-btn mobile-btn-dir mobile-btn-left" style="max-width: 140px; height: 60px;" data-key="ArrowLeft" aria-label="Steer Left">
              <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
              <span>STEER LEFT</span>
            </button>
            <button type="button" class="mobile-btn mobile-btn-dir mobile-btn-right" style="max-width: 140px; height: 60px;" data-key="ArrowRight" aria-label="Steer Right">
              <span>STEER RIGHT</span>
              <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
            </button>
          </div>
        </div>
      `;
    } else if (isBreaker) {
      // Brick Breaker DX: Left & Right paddle + Launch
      html = `
        <div class="mobile-buttons-row">
          <div class="mobile-btn-cluster mobile-btn-cluster-left">
            <button type="button" class="mobile-btn mobile-btn-dir mobile-btn-left" data-key="ArrowLeft" aria-label="Paddle Left">
              <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
              <span>LEFT</span>
            </button>
            <button type="button" class="mobile-btn mobile-btn-dir mobile-btn-right" data-key="ArrowRight" aria-label="Paddle Right">
              <span>RIGHT</span>
              <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
            </button>
          </div>
          <div class="mobile-btn-cluster mobile-btn-cluster-right">
            <button type="button" class="mobile-btn mobile-btn-fire" data-key="Space" aria-label="Launch Ball">
              <span>🚀 LAUNCH</span>
            </button>
          </div>
        </div>
      `;
    } else if (isDpadGame) {
      // 4-Way D-Pad
      html = `
        <div class="mobile-dpad-container">
          <div class="mobile-dpad">
            <button type="button" class="mobile-dpad-btn mobile-dpad-up" data-key="ArrowUp" aria-label="Up">▲</button>
            <button type="button" class="mobile-dpad-btn mobile-dpad-left" data-key="ArrowLeft" aria-label="Left">◀</button>
            <div class="mobile-dpad-btn mobile-dpad-center"></div>
            <button type="button" class="mobile-dpad-btn mobile-dpad-right" data-key="ArrowRight" aria-label="Right">▶</button>
            <button type="button" class="mobile-dpad-btn mobile-dpad-down" data-key="ArrowDown" aria-label="Down">▼</button>
          </div>
          <div class="mobile-btn-cluster mobile-btn-cluster-right">
            <button type="button" class="mobile-btn mobile-btn-nitro" data-key="Space" style="height: 60px; min-width: 120px;" aria-label="Action / Turbo">
              <span>⚡ ACTION</span>
            </button>
          </div>
        </div>
      `;
    } else if (isSingleTap) {
      html = `
        <div class="mobile-buttons-row">
          <button type="button" class="mobile-btn mobile-btn-action-large" data-key="Space" aria-label="Tap Action">
            <span>TAP / FLAP / STACK 🎯</span>
          </button>
        </div>
      `;
    } else {
      // Default: Left & Right + Action
      html = `
        <div class="mobile-buttons-row">
          <div class="mobile-btn-cluster mobile-btn-cluster-left">
            <button type="button" class="mobile-btn mobile-btn-dir mobile-btn-left" data-key="ArrowLeft" aria-label="Left">
              <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
              <span>LEFT</span>
            </button>
            <button type="button" class="mobile-btn mobile-btn-dir mobile-btn-right" data-key="ArrowRight" aria-label="Right">
              <span>RIGHT</span>
              <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
            </button>
          </div>
          <div class="mobile-btn-cluster mobile-btn-cluster-right">
            <button type="button" class="mobile-btn mobile-btn-fire" data-key="Space" aria-label="Action">
              <span>⚡ ACTION</span>
            </button>
          </div>
        </div>
      `;
    }

    this.mobileControls.innerHTML = html;
    this.updateMobileButtonsState();

    // Attach button listeners
    const buttons = this.mobileControls.querySelectorAll('button[data-key]');
    buttons.forEach(btn => {
      const key = btn.dataset.key;
      let repeatTimer = null;

      const handlePress = (e) => {
        if (e.cancelable) e.preventDefault();
        btn.classList.add('active');
        this.pressVirtualKey(key);
        if (window.soundEngine) window.soundEngine.playHover();

        // Repeat for games like metro surfer or hopper
        clearInterval(repeatTimer);
        repeatTimer = setInterval(() => {
          this.pressVirtualKey(key);
        }, 180);
      };

      const handleRelease = (e) => {
        btn.classList.remove('active');
        clearInterval(repeatTimer);
        this.releaseVirtualKey(key);
      };

      btn.addEventListener('pointerdown', handlePress);
      btn.addEventListener('pointerup', handleRelease);
      btn.addEventListener('pointercancel', handleRelease);
      btn.addEventListener('pointerleave', handleRelease);

      this.activeMobileButtonCleanups.push(() => {
        clearInterval(repeatTimer);
        btn.removeEventListener('pointerdown', handlePress);
        btn.removeEventListener('pointerup', handleRelease);
        btn.removeEventListener('pointercancel', handleRelease);
        btn.removeEventListener('pointerleave', handleRelease);
      });
    });

    // Handle Galaxy Defender Airplane Slider
    if (isFighter) {
      const track = document.getElementById('airplane-slider-track');
      const thumb = document.getElementById('airplane-slider-thumb');
      const fill = document.getElementById('airplane-slider-fill');

      if (track && thumb && fill) {
        let isDragging = false;
        let autoFireTimer = null;

        const updatePosition = (clientX) => {
          const rect = track.getBoundingClientRect();
          const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
          const ratio = rect.width > 0 ? (x / rect.width) : 0.5;

          thumb.style.left = `${ratio * 100}%`;
          fill.style.width = `${ratio * 100}%`;

          if (this.activeGameInstance && typeof this.activeGameInstance.setNormalizedX === 'function') {
            this.activeGameInstance.setNormalizedX(ratio);
            this.activeGameInstance.fireBullet();
          }
        };

        const onPointerDown = (e) => {
          if (e.cancelable) e.preventDefault();
          isDragging = true;
          track.classList.add('active');
          if (track.setPointerCapture) {
            try { track.setPointerCapture(e.pointerId); } catch (_) {}
          }
          updatePosition(e.clientX);

          // Continuous fire while sliding/touching
          clearInterval(autoFireTimer);
          autoFireTimer = setInterval(() => {
            if (isDragging && this.activeGameInstance && typeof this.activeGameInstance.fireBullet === 'function') {
              this.activeGameInstance.fireBullet();
            }
          }, 160);
        };

        const onPointerMove = (e) => {
          if (!isDragging) return;
          if (e.cancelable) e.preventDefault();
          updatePosition(e.clientX);
        };

        const onPointerUp = (e) => {
          isDragging = false;
          track.classList.remove('active');
          clearInterval(autoFireTimer);
          if (track.releasePointerCapture) {
            try { track.releasePointerCapture(e.pointerId); } catch (_) {}
          }
        };

        track.addEventListener('pointerdown', onPointerDown);
        track.addEventListener('pointermove', onPointerMove);
        track.addEventListener('pointerup', onPointerUp);
        track.addEventListener('pointercancel', onPointerUp);

        // Keep slider thumb synced if player uses Left/Right buttons
        const syncSliderWithGame = () => {
          if (!isDragging && this.activeGameInstance && typeof this.activeGameInstance.getNormalizedX === 'function') {
            const currentRatio = this.activeGameInstance.getNormalizedX();
            thumb.style.left = `${currentRatio * 100}%`;
            fill.style.width = `${currentRatio * 100}%`;
          }
          this.mobileSliderSyncRaf = requestAnimationFrame(syncSliderWithGame);
        };
        this.mobileSliderSyncRaf = requestAnimationFrame(syncSliderWithGame);

        this.activeMobileButtonCleanups.push(() => {
          isDragging = false;
          clearInterval(autoFireTimer);
          if (this.mobileSliderSyncRaf) cancelAnimationFrame(this.mobileSliderSyncRaf);
          track.removeEventListener('pointerdown', onPointerDown);
          track.removeEventListener('pointermove', onPointerMove);
          track.removeEventListener('pointerup', onPointerUp);
          track.removeEventListener('pointercancel', onPointerUp);
        });
      }
    }
  }

  teardownMobileControls() {
    if (this.mobileSliderSyncRaf) {
      cancelAnimationFrame(this.mobileSliderSyncRaf);
      this.mobileSliderSyncRaf = null;
    }
    if (this.activeMobileButtonCleanups) {
      this.activeMobileButtonCleanups.forEach(fn => fn());
      this.activeMobileButtonCleanups = [];
    }
    // Release any stuck keys
    ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].forEach(key => {
      this.releaseVirtualKey(key);
    });
    if (this.mobileControls) {
      this.mobileControls.innerHTML = '';
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new ArcadeApp();
});
