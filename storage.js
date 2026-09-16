/**
 * Storage & Gamification Manager
 * Manages favorites, play history, XP, achievements, and high scores.
 */
class StorageManager {
  constructor() {
    this.FAVORITES_KEY = 'arcade_favorites';
    this.RECENT_KEY = 'arcade_recent';
    this.XP_KEY = 'arcade_xp';
    this.SCORES_KEY = 'arcade_scores';
    this.LIKES_KEY = 'arcade_likes';
    this.ACHIEVEMENTS_KEY = 'arcade_achievements';
  }

  getFavorites() {
    try {
      return JSON.parse(localStorage.getItem(this.FAVORITES_KEY)) || [];
    } catch {
      return [];
    }
  }

  isFavorite(gameId) {
    return this.getFavorites().includes(gameId);
  }

  toggleFavorite(gameId) {
    let favs = this.getFavorites();
    const index = favs.indexOf(gameId);
    let added = false;
    if (index > -1) {
      favs.splice(index, 1);
    } else {
      favs.unshift(gameId);
      added = true;
      this.checkAchievement('first_favorite');
    }
    localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favs));
    return { isFav: added, count: favs.length };
  }

  getRecentlyPlayed() {
    try {
      return JSON.parse(localStorage.getItem(this.RECENT_KEY)) || [];
    } catch {
      return [];
    }
  }

  addRecentlyPlayed(gameId) {
    let recent = this.getRecentlyPlayed().filter(id => id !== gameId);
    recent.unshift(gameId);
    if (recent.length > 8) recent.pop();
    localStorage.setItem(this.RECENT_KEY, JSON.stringify(recent));

    if (recent.length >= 3) {
      this.checkAchievement('explorer_badge');
    }
    if (recent.length >= 5) {
      this.checkAchievement('arcade_veteran');
    }
  }

  getXP() {
    return parseInt(localStorage.getItem(this.XP_KEY) || '50', 10);
  }

  addXP(amount) {
    const current = this.getXP();
    const newXP = current + amount;
    localStorage.setItem(this.XP_KEY, newXP.toString());
    
    // Check level up
    const prevLevel = this.getLevel(current).level;
    const currentLevel = this.getLevel(newXP).level;
    
    if (currentLevel > prevLevel) {
      if (window.soundEngine) window.soundEngine.playVictory();
      this.triggerToast(`🎉 Level Up! You reached Level ${currentLevel}!`, 'achievement');
    }

    if (newXP >= 500) {
      this.checkAchievement('xp_500');
    }

    return { xp: newXP, levelInfo: this.getLevel(newXP) };
  }

  getLevel(xp = null) {
    const currentXP = xp !== null ? xp : this.getXP();
    // Level formula: Level = Math.floor(Math.sqrt(XP / 50)) + 1
    const level = Math.floor(Math.sqrt(currentXP / 50)) + 1;
    const currentLevelBaseXP = Math.pow(level - 1, 2) * 50;
    const nextLevelXP = Math.pow(level, 2) * 50;
    const progress = Math.min(100, Math.max(0, ((currentXP - currentLevelBaseXP) / (nextLevelXP - currentLevelBaseXP)) * 100));
    
    return {
      level,
      currentXP,
      nextLevelXP,
      progress: Math.round(progress)
    };
  }

  getHighScore(gameId) {
    try {
      const scores = JSON.parse(localStorage.getItem(this.SCORES_KEY)) || {};
      return scores[gameId] || 0;
    } catch {
      return 0;
    }
  }

  setHighScore(gameId, score) {
    try {
      const scores = JSON.parse(localStorage.getItem(this.SCORES_KEY)) || {};
      const prev = scores[gameId] || 0;
      if (score > prev) {
        scores[gameId] = score;
        localStorage.setItem(this.SCORES_KEY, JSON.stringify(scores));
        this.addXP(50); // High score bonus
        this.checkAchievement('high_scorer');
        return { isNew: true, score };
      }
      return { isNew: false, score: prev };
    } catch {
      return { isNew: false, score: 0 };
    }
  }

  hasLiked(gameId) {
    try {
      const likes = JSON.parse(localStorage.getItem(this.LIKES_KEY)) || [];
      return likes.includes(gameId);
    } catch {
      return false;
    }
  }

  toggleLike(gameId) {
    try {
      let likes = JSON.parse(localStorage.getItem(this.LIKES_KEY)) || [];
      const idx = likes.indexOf(gameId);
      let liked = false;
      if (idx > -1) {
        likes.splice(idx, 1);
      } else {
        likes.push(gameId);
        liked = true;
        this.addXP(25);
      }
      localStorage.setItem(this.LIKES_KEY, JSON.stringify(likes));
      return liked;
    } catch {
      return false;
    }
  }

  getAchievements() {
    try {
      return JSON.parse(localStorage.getItem(this.ACHIEVEMENTS_KEY)) || [];
    } catch {
      return [];
    }
  }

  checkAchievement(badgeId) {
    const list = this.getAchievements();
    if (!list.includes(badgeId)) {
      list.push(badgeId);
      localStorage.setItem(this.ACHIEVEMENTS_KEY, JSON.stringify(list));
      this.addXP(100);
      const meta = this.ACHIEVEMENT_DEFS[badgeId];
      if (meta) {
        if (window.soundEngine) window.soundEngine.playPowerup();
        this.triggerToast(`🏆 Unlocked: ${meta.title}! (${meta.desc})`, 'achievement');
      }
    }
  }

  triggerToast(message, type = 'info') {
    if (window.showToast) {
      window.showToast(message, type);
    }
  }
}

StorageManager.prototype.ACHIEVEMENT_DEFS = {
  first_game: { title: 'First Play', desc: 'Started your first game' },
  first_favorite: { title: 'Lover of Games', desc: 'Added a game to your favorites' },
  explorer_badge: { title: 'World Hopper', desc: 'Played 3 different games' },
  arcade_veteran: { title: 'Arcade Veteran', desc: 'Played 5 different games' },
  high_scorer: { title: 'Record Smasher', desc: 'Achieved a new high score' },
  xp_500: { title: 'Rising Star', desc: 'Earned over 500 XP' }
};

window.storageManager = new StorageManager();
