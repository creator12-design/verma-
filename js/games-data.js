/**
 * Games Catalog Data
 * Contains game metadata, bento grid configurations, visuals, and control schemes.
 */
const GAMES_CATALOG = [
  {
    id: 'galaxy-defender',
    title: 'Galaxy Defender',
    tagline: 'Defend deep space against waves of enemy invaders and asteroids!',
    category: 'action',
    categories: ['action', 'arcade', 'shooting'],
    tags: ['Space', 'Shooter', 'Sci-Fi', 'Arcade'],
    badge: 'FEATURED 🚀',
    badgeClass: 'badge-featured',
    rating: 4.9,
    plays: '412.5K',
    likesCount: 14200,
    bentoSize: 'bento-2x2',
    colorGradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    accentColor: '#6366f1',
    engine: 'GalaxyDefenderGame',
    controls: [
      { key: 'ARROW KEYS / WASD', desc: 'Move Starship' },
      { key: 'SPACEBAR', desc: 'Fire Plasma Laser' },
      { key: 'MOUSE / TOUCH', desc: 'Drag to Move & Auto-Fire' }
    ],
    description: 'Pilot your quantum star fighter through asteroid belts and alien combat formations. Collect energy shields and weapon multipliers to survive endless waves!',
    iconSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="gd-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#818cf8" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="#4338ca" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="44" fill="url(#gd-glow)"/>
      <path d="M50 15 L66 75 L50 65 L34 75 Z" fill="#6366f1" stroke="#a5b4fc" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M50 25 L58 65 L50 58 L42 65 Z" fill="#38bdf8"/>
      <circle cx="50" cy="45" r="4" fill="#ffffff"/>
      <path d="M34 75 L20 85 L28 68 Z" fill="#4f46e5"/>
      <path d="M66 75 L80 85 L72 68 Z" fill="#4f46e5"/>
      <polygon points="46,68 54,68 50,88" fill="#f43f5e"/>
      <polygon points="48,68 52,68 50,82" fill="#fbbf24"/>
      <circle cx="25" cy="30" r="1.5" fill="#ffffff" opacity="0.8"/>
      <circle cx="75" cy="22" r="2" fill="#ffffff" opacity="0.9"/>
      <circle cx="85" cy="55" r="1" fill="#ffffff" opacity="0.6"/>
    </svg>`
  },
  {
    id: 'cyber-dash',
    title: 'Cyber Dash',
    tagline: 'Flap through glowing cyber gates with ultra-smooth physics!',
    category: 'arcade',
    categories: ['arcade', 'action'],
    tags: ['Retro', 'Physics', 'Addictive', 'Neon'],
    badge: 'HOT 🔥',
    badgeClass: 'badge-hot',
    rating: 4.8,
    plays: '388.9K',
    likesCount: 12540,
    bentoSize: 'bento-2x1',
    colorGradient: 'linear-gradient(135deg, #18002e 0%, #4a044e 50%, #701a75 100%)',
    glowColor: 'rgba(236, 72, 153, 0.4)',
    accentColor: '#ec4899',
    engine: 'CyberDashGame',
    controls: [
      { key: 'SPACEBAR / CLICK / TAP', desc: 'Flap Wing / Thrust Up' },
      { key: 'P', desc: 'Pause Game' }
    ],
    description: 'An electrifying neon reimagining of the tap-to-fly classic. Timing and focus are essential as you navigate vibrant energy conduits and break high score records.',
    iconSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cd-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#f472b6" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#831843" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="44" fill="url(#cd-glow)"/>
      <rect x="75" y="10" width="14" height="28" rx="4" fill="#06b6d4" stroke="#67e8f9" stroke-width="2"/>
      <rect x="75" y="62" width="14" height="28" rx="4" fill="#06b6d4" stroke="#67e8f9" stroke-width="2"/>
      <ellipse cx="44" cy="50" rx="18" ry="14" fill="#ec4899" stroke="#fbcfe8" stroke-width="2"/>
      <path d="M30 52 C26 44, 38 42, 42 48" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
      <circle cx="52" cy="46" r="4" fill="#ffffff"/>
      <circle cx="54" cy="45" r="1.8" fill="#0f172a"/>
      <path d="M58 52 L68 55 L58 59 Z" fill="#fbbf24"/>
      <path d="M22 50 Q12 50 8 46 Q14 54 22 52" fill="#a855f7"/>
    </svg>`
  },
  {
    id: 'game-2048',
    title: '2048 Neon Pulse',
    tagline: 'Slide and merge cyber numbered tiles to conquer the legendary 2048!',
    category: 'puzzle',
    categories: ['puzzle', 'strategy'],
    tags: ['Brain', 'Numbers', 'Relaxing', 'Logic'],
    badge: 'POPULAR ⭐',
    badgeClass: 'badge-popular',
    rating: 4.9,
    plays: '520.1K',
    likesCount: 18900,
    bentoSize: 'bento-1x1',
    colorGradient: 'linear-gradient(135deg, #064e3b 0%, #047857 60%, #059669 100%)',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    accentColor: '#10b981',
    engine: 'Game2048Engine',
    controls: [
      { key: 'ARROW KEYS / WASD', desc: 'Slide All Tiles' },
      { key: 'SWIPE (TOUCH)', desc: 'Slide in any direction' },
      { key: 'U', desc: 'Undo Last Move' }
    ],
    description: 'A stylish cyberpunk iteration of 2048. Merge matching numbered tiles smoothly with satisfying haptic sound effects, dynamic glowing tiles, and undo capabilities.',
    iconSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="12" width="76" height="76" rx="16" fill="#064e3b" stroke="#34d399" stroke-width="2.5"/>
      <rect x="20" y="20" width="26" height="26" rx="6" fill="#10b981"/>
      <rect x="54" y="20" width="26" height="26" rx="6" fill="#059669"/>
      <rect x="20" y="54" width="26" height="26" rx="6" fill="#047857"/>
      <rect x="54" y="54" width="26" height="26" rx="6" fill="#f59e0b"/>
      <text x="33" y="38" font-family="'Outfit', sans-serif" font-weight="900" font-size="14" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">2</text>
      <text x="67" y="38" font-family="'Outfit', sans-serif" font-weight="900" font-size="14" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">4</text>
      <text x="33" y="72" font-family="'Outfit', sans-serif" font-weight="900" font-size="14" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">8</text>
      <text x="67" y="72" font-family="'Outfit', sans-serif" font-weight="900" font-size="12" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">16</text>
    </svg>`
  },
  {
    id: 'neon-serpent',
    title: 'Neon Serpent',
    tagline: 'Classic snake evolved with hyper-fluid mechanics and power pellets!',
    category: 'arcade',
    categories: ['arcade', 'retro'],
    tags: ['Snake', 'Retro', 'Quick Play', 'Speed'],
    badge: 'TRENDING ⚡',
    badgeClass: 'badge-trending',
    rating: 4.7,
    plays: '295.4K',
    likesCount: 9850,
    bentoSize: 'bento-2x1',
    colorGradient: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 50%, #0369a1 100%)',
    glowColor: 'rgba(14, 165, 233, 0.4)',
    accentColor: '#0ea5e9',
    engine: 'NeonSerpentGame',
    controls: [
      { key: 'ARROW KEYS / WASD', desc: 'Direct Serpent' },
      { key: 'SHIFT / SPACE', desc: 'Speed Turbo Boost' },
      { key: 'SWIPE', desc: 'Mobile Direction Control' }
    ],
    description: 'Grow your illuminated neon serpent by gobbling glowing orbs. Features fluid turn mechanics, glowing particle trails, high-speed power pellets, and boundary wrapping.',
    iconSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="serp-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <path d="M20 70 Q25 40 45 45 T70 30" stroke="#06b6d4" stroke-width="8" stroke-linecap="round" fill="none" filter="url(#serp-glow)"/>
      <circle cx="70" cy="30" r="8" fill="#38bdf8"/>
      <circle cx="72" cy="28" r="2.5" fill="#ffffff"/>
      <circle cx="74" cy="27" r="1.2" fill="#0f172a"/>
      <circle cx="35" cy="25" r="6" fill="#f43f5e" filter="url(#serp-glow)"/>
      <circle cx="35" cy="25" r="2" fill="#ffffff"/>
      <circle cx="78" cy="72" r="5" fill="#fbbf24" filter="url(#serp-glow)"/>
    </svg>`
  },
  {
    id: 'brick-breaker',
    title: 'Brick Breaker DX',
    tagline: 'Smash vibrant neon brick prisms with crazy multiball power-ups!',
    category: 'arcade',
    categories: ['arcade', 'retro'],
    tags: ['Breakout', 'Physics', 'Action', 'Classic'],
    badge: 'CLASSIC 🧱',
    badgeClass: 'badge-classic',
    rating: 4.8,
    plays: '264.2K',
    likesCount: 8900,
    bentoSize: 'bento-1x2',
    colorGradient: 'linear-gradient(180deg, #3b0764 0%, #581c87 50%, #7e22ce 100%)',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    accentColor: '#a855f7',
    engine: 'BrickBreakerGame',
    controls: [
      { key: 'MOUSE / TOUCH', desc: 'Slide Paddle Left & Right' },
      { key: 'A / D or LEFT / RIGHT', desc: 'Keyboard Paddle Movement' },
      { key: 'SPACEBAR / CLICK', desc: 'Launch Energy Orb' }
    ],
    description: 'An explosive retro arcade brick smasher. Destroy vibrant prisms, trigger multiball showers, catch laser paddle cannons, and clear challenging stages.',
    iconSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="15" width="18" height="10" rx="3" fill="#f43f5e"/>
      <rect x="41" y="15" width="18" height="10" rx="3" fill="#ec4899"/>
      <rect x="67" y="15" width="18" height="10" rx="3" fill="#f43f5e"/>
      <rect x="15" y="30" width="18" height="10" rx="3" fill="#a855f7"/>
      <rect x="41" y="30" width="18" height="10" rx="3" fill="#8b5cf6"/>
      <rect x="67" y="30" width="18" height="10" rx="3" fill="#a855f7"/>
      <rect x="15" y="45" width="18" height="10" rx="3" fill="#06b6d4"/>
      <rect x="41" y="45" width="18" height="10" rx="3" fill="#0ea5e9"/>
      <rect x="67" y="45" width="18" height="10" rx="3" fill="#06b6d4"/>
      <circle cx="50" cy="65" r="6" fill="#fbbf24" stroke="#ffffff" stroke-width="1.5"/>
      <rect x="30" y="82" width="40" height="8" rx="4" fill="#a855f7" stroke="#c084fc" stroke-width="2"/>
    </svg>`
  },
  {
    id: 'cosmic-jumper',
    title: 'Cosmic Jumper',
    tagline: 'Spring upward through endless space platforms and avoid the abyss!',
    category: 'action',
    categories: ['action', 'arcade'],
    tags: ['Endless', 'Jumper', 'Platformer', 'Vertical'],
    badge: 'NEW ✨',
    badgeClass: 'badge-new',
    rating: 4.85,
    plays: '198.3K',
    likesCount: 7420,
    bentoSize: 'bento-1x2',
    colorGradient: 'linear-gradient(180deg, #083344 0%, #155e75 50%, #0e7490 100%)',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    accentColor: '#06b6d4',
    engine: 'CosmicJumperGame',
    controls: [
      { key: 'A / D or LEFT / RIGHT', desc: 'Move Character Left/Right' },
      { key: 'TILT / TOUCH', desc: 'Tap Sides on Mobile' },
      { key: 'AUTO-BOUNCE', desc: 'Bounces automatically on platforms' }
    ],
    description: 'Jump, bounce, and rocket your way higher and higher! Land on springs, grab rocket jetpacks, and navigate tricky crumbling and moving platforms.',
    iconSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="25" y="78" width="50" height="8" rx="4" fill="#10b981"/>
      <rect x="15" y="48" width="40" height="8" rx="4" fill="#38bdf8"/>
      <rect x="55" y="24" width="35" height="8" rx="4" fill="#fbbf24"/>
      <circle cx="35" cy="38" r="10" fill="#06b6d4" stroke="#e0f2fe" stroke-width="2"/>
      <circle cx="32" cy="36" r="2" fill="#ffffff"/>
      <circle cx="38" cy="36" r="2" fill="#ffffff"/>
      <path d="M30 42 Q35 46 40 42" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M35 28 L35 22 L38 20" stroke="#06b6d4" stroke-width="2" stroke-linecap="round"/>
      <path d="M30 46 L27 52 M40 46 L43 52" stroke="#0891b2" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'neon-tictactoe',
    title: 'Neon Tic-Tac-Toe AI',
    tagline: 'Cyber tactical duel against an unbeatable AI or play with a friend!',
    category: 'puzzle',
    categories: ['puzzle', 'strategy', '2-player'],
    tags: ['2 Player', 'Turn Based', 'Classic', 'AI'],
    badge: '2-PLAYER 👥',
    badgeClass: 'badge-multiplayer',
    rating: 4.7,
    plays: '315.6K',
    likesCount: 11200,
    bentoSize: 'bento-1x1',
    colorGradient: 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #44403c 100%)',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    accentColor: '#f43f5e',
    engine: 'NeonTicTacToeGame',
    controls: [
      { key: 'MOUSE CLICK / TAP', desc: 'Place X or O on the Grid' },
      { key: 'TOGGLE MODE', desc: 'Switch 1P vs Smart AI or 2P Local' }
    ],
    description: 'The definitive neon edition of Tic-Tac-Toe. Challenge our minimax AI across 3 difficulty tiers (Easy, Medium, Mastermind) or duel locally with a friend on the same screen.',
    iconSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="38" y1="16" x2="38" y2="84" stroke="#475569" stroke-width="4" stroke-linecap="round"/>
      <line x1="62" y1="16" x2="62" y2="84" stroke="#475569" stroke-width="4" stroke-linecap="round"/>
      <line x1="16" y1="38" x2="84" y2="38" stroke="#475569" stroke-width="4" stroke-linecap="round"/>
      <line x1="16" y1="62" x2="84" y2="62" stroke="#475569" stroke-width="4" stroke-linecap="round"/>
      <line x1="22" y1="22" x2="32" y2="32" stroke="#06b6d4" stroke-width="4" stroke-linecap="round"/>
      <line x1="32" y1="22" x2="22" y2="32" stroke="#06b6d4" stroke-width="4" stroke-linecap="round"/>
      <circle cx="50" cy="50" r="7" stroke="#f43f5e" stroke-width="4"/>
      <line x1="68" y1="68" x2="78" y2="78" stroke="#06b6d4" stroke-width="4" stroke-linecap="round"/>
      <line x1="78" y1="68" x2="68" y2="78" stroke="#06b6d4" stroke-width="4" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'metro-surfer',
    title: 'Metro Surfer',
    tagline: 'Dodge trains, jump barriers, and slide under signs in this 3D subway runner!',
    category: 'action',
    categories: ['action', 'arcade'],
    tags: ['Subway', 'Runner', '3D', 'Coins'],
    badge: 'TOP HIT 🚇',
    badgeClass: 'badge-hot',
    rating: 4.95,
    plays: '620.4K',
    likesCount: 22400,
    bentoSize: 'bento-2x2',
    colorGradient: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%)',
    glowColor: 'rgba(2, 132, 199, 0.4)',
    accentColor: '#0284c7',
    engine: 'MetroSurferGame',
    controls: [
      { key: 'LEFT / RIGHT (A/D)', desc: 'Switch Track Lanes' },
      { key: 'UP / SPACE (W)', desc: 'Jump Over Low Barriers' },
      { key: 'DOWN (S)', desc: 'Slide Under High Beams' }
    ],
    description: 'An adrenaline-pumping 3-lane subway runner. Dodge oncoming metro express trains, leap over barricades, slide under signs, and collect gold coins and magnetic powerups!',
    iconSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="25" width="60" height="55" rx="12" fill="#f43f5e" stroke="#fb7185" stroke-width="2.5"/>
      <rect x="28" y="34" width="44" height="22" rx="4" fill="#38bdf8"/>
      <circle cx="34" cy="68" r="5" fill="#fbbf24"/>
      <circle cx="66" cy="68" r="5" fill="#fbbf24"/>
      <line x1="12" y1="88" x2="88" y2="88" stroke="#38bdf8" stroke-width="3"/>
      <circle cx="50" cy="18" r="4" fill="#fbbf24"/>
    </svg>`
  },
  {
    id: 'highway-racer',
    title: 'Apex Highway Racer',
    tagline: 'High-speed highway traffic racing with nitro boost, near misses, and 280+ km/h speed!',
    category: 'racing',
    categories: ['racing', 'action', 'arcade'],
    tags: ['Mr Racer', 'Racing', 'Cars', 'Speed'],
    badge: 'SPEED 🏎️',
    badgeClass: 'badge-trending',
    rating: 4.9,
    plays: '540.8K',
    likesCount: 19800,
    bentoSize: 'bento-2x1',
    colorGradient: 'linear-gradient(135deg, #831843 0%, #be185d 50%, #f43f5e 100%)',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    accentColor: '#f43f5e',
    engine: 'HighwayRacerGame',
    controls: [
      { key: 'LEFT / RIGHT (A/D)', desc: 'Weave Through Highway Lanes' },
      { key: 'UP / SPACE (W)', desc: 'Hold for Nitro Boost (280+ km/h)' },
      { key: 'DOWN (S)', desc: 'Emergency Brakes' }
    ],
    description: 'Channel your inner speed demon inspired by Mr Racer! Weave through high-density highway traffic at extreme speeds, trigger near-miss score bonuses, and unleash nitro flames.',
    iconSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="32" y="15" width="36" height="70" rx="10" fill="#ec4899" stroke="#f472b6" stroke-width="2"/>
      <rect x="46" y="15" width="8" height="70" fill="#ffffff"/>
      <rect x="38" y="32" width="24" height="26" rx="4" fill="#0f172a"/>
      <circle cx="28" cy="30" r="4" fill="#38bdf8"/>
      <circle cx="72" cy="30" r="4" fill="#38bdf8"/>
      <polygon points="44,85 56,85 50,96" fill="#06b6d4"/>
    </svg>`
  },
  {
    id: 'cyber-hopper',
    title: 'Cyber Hopper',
    tagline: 'Cross infinite cyber roads, dodge speeding hovercars, and hop on data barges!',
    category: 'arcade',
    categories: ['arcade', 'retro'],
    tags: ['Crossy', 'Frog', 'Endless', 'Retro'],
    badge: 'FUN 🐸',
    badgeClass: 'badge-new',
    rating: 4.8,
    plays: '310.2K',
    likesCount: 11400,
    bentoSize: 'bento-1x2',
    colorGradient: 'linear-gradient(180deg, #064e3b 0%, #047857 50%, #059669 100%)',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    accentColor: '#10b981',
    engine: 'CyberHopperGame',
    controls: [
      { key: 'ARROW KEYS / WASD', desc: 'Hop Forward, Back, Left, Right' },
      { key: 'SCREEN TAP', desc: 'Mobile Quick Forward Hop' }
    ],
    description: 'The beloved Crossy Road formula reborn in neon! Time your forward hops across busy cyber highways, ride floating data logs over rivers, and never stop moving.',
    iconSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="28" y="30" width="44" height="44" rx="10" fill="#10b981" stroke="#6ee7b7" stroke-width="2.5"/>
      <circle cx="38" cy="42" r="5" fill="#ffffff"/>
      <circle cx="62" cy="42" r="5" fill="#ffffff"/>
      <circle cx="39" cy="41" r="2.5" fill="#0f172a"/>
      <circle cx="63" cy="41" r="2.5" fill="#0f172a"/>
      <rect x="40" y="58" width="20" height="4" rx="2" fill="#047857"/>
    </svg>`
  },
  {
    id: 'cyber-pac',
    title: 'Cyber Pac-Maze',
    tagline: 'Eat glowing pellets, evade cyber ghosts, and grab power pellets to strike back!',
    category: 'retro',
    categories: ['retro', 'arcade'],
    tags: ['Pacman', 'Maze', 'Ghosts', 'Classic'],
    badge: 'CLASSIC 👻',
    badgeClass: 'badge-classic',
    rating: 4.85,
    plays: '445.0K',
    likesCount: 15300,
    bentoSize: 'bento-1x1',
    colorGradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    accentColor: '#6366f1',
    engine: 'CyberPacGame',
    controls: [
      { key: 'ARROW KEYS / WASD', desc: 'Steer Pac-Man Through Maze' }
    ],
    description: 'A neon-lit arcade classic. Navigate complex labyrinth corridors, consume all glowing pellets, and turn the tables on Blinky, Pinky, Inky, and Clyde with Power Pellets.',
    iconSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 50 L75 35 A28 28 0 1 0 75 65 Z" fill="#fbbf24" stroke="#fef08a" stroke-width="2"/>
      <circle cx="52" cy="34" r="3" fill="#0f172a"/>
      <circle cx="82" cy="50" r="3" fill="#fef08a"/>
      <circle cx="92" cy="50" r="3" fill="#fef08a"/>
    </svg>`
  },
  {
    id: 'neon-dunk',
    title: 'Neon Dunk Master',
    tagline: 'Slingshot basketball into ascending hoops, score clean swishes, and light the fire streak!',
    category: 'sports',
    categories: ['sports', 'arcade'],
    tags: ['Basketball', 'Dunk', 'Physics', 'Sports'],
    badge: 'SWISH 🏀',
    badgeClass: 'badge-hot',
    rating: 4.88,
    plays: '380.6K',
    likesCount: 14100,
    bentoSize: 'bento-1x2',
    colorGradient: 'linear-gradient(180deg, #7c2d12 0%, #c2410c 50%, #ea580c 100%)',
    glowColor: 'rgba(234, 88, 12, 0.4)',
    accentColor: '#ea580c',
    engine: 'NeonDunkGame',
    controls: [
      { key: 'MOUSE DRAG & RELEASE', desc: 'Aim Trajectory and Shoot Ball' },
      { key: 'TOUCH DRAG', desc: 'Mobile Slingshot Shoot' }
    ],
    description: 'Addictive Dunk Shot arcade basketball. Pull back to calculate the perfect trajectory, bounce off rims, and score clean swishes to trigger an unstoppable fire streak.',
    iconSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="45" rx="35" ry="12" stroke="#f43f5e" stroke-width="4"/>
      <path d="M18 45 L34 75 L66 75 L82 45" stroke="#38bdf8" stroke-width="2"/>
      <circle cx="50" cy="30" r="14" fill="#f97316" stroke="#ea580c" stroke-width="2"/>
      <line x1="38" y1="30" x2="62" y2="30" stroke="#0f172a" stroke-width="1.5"/>
    </svg>`
  },
  {
    id: 'blade-master',
    title: 'Blade Master',
    tagline: 'Fling cyber blades into rotating wheels without hitting existing knives!',
    category: 'action',
    categories: ['action', 'arcade'],
    tags: ['Knife', 'Precision', 'Timing', 'Weapons'],
    badge: 'SHARP 🗡️',
    badgeClass: 'badge-featured',
    rating: 4.82,
    plays: '290.4K',
    likesCount: 10200,
    bentoSize: 'bento-1x1',
    colorGradient: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #047857 100%)',
    glowColor: 'rgba(5, 150, 105, 0.4)',
    accentColor: '#059669',
    engine: 'BladeMasterGame',
    controls: [
      { key: 'SPACEBAR / CLICK / TAP', desc: 'Throw Blade Into Wheel' }
    ],
    description: 'Precision timing meets cyber aesthetics. Launch your daggers into spinning targets, slice energy crystals, and conquer multi-phase boss wheels with erratic rotations.',
    iconSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="45" r="26" fill="#1e1b4b" stroke="#6366f1" stroke-width="3"/>
      <circle cx="50" cy="45" r="10" fill="#312e81"/>
      <polygon points="46,85 54,85 50,68" fill="#38bdf8"/>
      <rect x="48" y="85" width="4" height="8" fill="#0f172a"/>
    </svg>`
  },
  {
    id: 'nitro-kart',
    title: 'Nitro Kart Frenzy',
    tagline: 'Top-down kart drifting with missile volleys, oil slicks, and turbo rocket pads!',
    category: 'racing',
    categories: ['racing', 'action'],
    tags: ['Kart', 'Smash', 'Drift', 'Multiplayer'],
    badge: 'DRIFT 🏎️',
    badgeClass: 'badge-trending',
    rating: 4.87,
    plays: '360.2K',
    likesCount: 13900,
    bentoSize: 'bento-2x1',
    colorGradient: 'linear-gradient(135deg, #581c87 0%, #7e22ce 50%, #9333ea 100%)',
    glowColor: 'rgba(147, 51, 234, 0.4)',
    accentColor: '#9333ea',
    engine: 'NitroKartGame',
    controls: [
      { key: 'ARROW KEYS / WASD', desc: 'Steer, Accelerate, Drift' },
      { key: 'SPACEBAR', desc: 'Launch Collected Weapon' }
    ],
    description: 'High-octane micro-kart mayhem. Drift around hairpin curves against AI competitors, grab mystery weapon boxes, and blast enemies with homing rockets and oil slicks.',
    iconSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="24" width="40" height="52" rx="10" fill="#a855f7" stroke="#c084fc" stroke-width="2.5"/>
      <rect x="42" y="24" width="16" height="52" fill="#ffffff"/>
      <rect x="38" y="38" width="24" height="18" rx="4" fill="#0f172a"/>
      <rect x="22" y="30" width="8" height="14" rx="2" fill="#1e293b"/>
      <rect x="70" y="30" width="8" height="14" rx="2" fill="#1e293b"/>
      <rect x="22" y="56" width="8" height="14" rx="2" fill="#1e293b"/>
      <rect x="70" y="56" width="8" height="14" rx="2" fill="#1e293b"/>
    </svg>`
  },
  {
    id: 'neon-slope',
    title: 'Neon Ball Slope',
    tagline: 'Roll down steep neon runways dodging red obstacles and launching off speed ramps!',
    category: 'arcade',
    categories: ['arcade', 'action'],
    tags: ['Slope', 'Ball', 'Speed', '3D'],
    badge: 'FAST 🌐',
    badgeClass: 'badge-hot',
    rating: 4.91,
    plays: '510.9K',
    likesCount: 18200,
    bentoSize: 'bento-1x2',
    colorGradient: 'linear-gradient(180deg, #042f2e 0%, #0d9488 50%, #14b8a6 100%)',
    glowColor: 'rgba(20, 184, 166, 0.4)',
    accentColor: '#14b8a6',
    engine: 'NeonSlopeGame',
    controls: [
      { key: 'A / D or LEFT / RIGHT', desc: 'Balance Ball & Steer' }
    ],
    description: 'Inspired by the viral hit Slope 3D! Roll down a dynamically tilting neon slope. Dodge sudden red barrier blocks, soar off jump ramps, and chase high speeds.',
    iconSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="20,90 80,90 60,20 40,20" fill="#0b132b" stroke="#10b981" stroke-width="2"/>
      <circle cx="50" cy="55" r="12" fill="#06b6d4" stroke="#38bdf8" stroke-width="2"/>
      <rect x="35" y="70" width="10" height="8" fill="#ef4444"/>
    </svg>`
  },
  {
    id: 'skyscraper-stack',
    title: 'Skyscraper Stack',
    tagline: 'Precision timing block stacking with chopping overhangs and ascending chromatic scales!',
    category: 'puzzle',
    categories: ['puzzle', 'arcade'],
    tags: ['Stack', 'Tower', 'Precision', 'Relaxing'],
    badge: 'TOWER 🏙️',
    badgeClass: 'badge-popular',
    rating: 4.86,
    plays: '415.7K',
    likesCount: 16100,
    bentoSize: 'bento-1x1',
    colorGradient: 'linear-gradient(135deg, #3b0764 0%, #6b21a8 50%, #9333ea 100%)',
    glowColor: 'rgba(147, 51, 234, 0.4)',
    accentColor: '#9333ea',
    engine: 'SkyscraperStackGame',
    controls: [
      { key: 'SPACEBAR / CLICK / TAP', desc: 'Drop Slab Onto Tower' }
    ],
    description: 'A mesmerizing timing puzzle. Drop gliding slabs cleanly atop your tower. Chipped edges fall into the abyss, while perfect alignments reward you with expanding blocks and scale chords.',
    iconSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="25" y="65" width="50" height="14" rx="3" fill="#f43f5e"/>
      <rect x="28" y="48" width="44" height="14" rx="3" fill="#a855f7"/>
      <rect x="31" y="31" width="38" height="14" rx="3" fill="#06b6d4"/>
      <rect x="35" y="14" width="30" height="14" rx="3" fill="#fbbf24"/>
    </svg>`
  },
  {
    id: 'bubble-pop',
    title: 'Cyber Bubble Pop',
    tagline: 'Aim cannon, bank off walls, and match 3+ glowing bubbles to clear clusters!',
    category: 'puzzle',
    categories: ['puzzle', 'arcade'],
    tags: ['Bubbles', 'Match 3', 'Color', 'Shooter'],
    badge: 'MATCH 3 🔮',
    badgeClass: 'badge-new',
    rating: 4.83,
    plays: '340.5K',
    likesCount: 12100,
    bentoSize: 'bento-1x1',
    colorGradient: 'linear-gradient(135deg, #083344 0%, #0e7490 50%, #06b6d4 100%)',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    accentColor: '#06b6d4',
    engine: 'CyberBubbleGame',
    controls: [
      { key: 'MOUSE MOVE', desc: 'Aim Trajectory Guide' },
      { key: 'CLICK / TAP', desc: 'Fire Colored Bubble' }
    ],
    description: 'The definitive bubble match-3 experience. Calculate ricochet angles, cluster like-colored bubbles together, and drop entire hanging formations for huge multiplier points.',
    iconSvg: `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="35" cy="30" r="10" fill="#f43f5e"/>
      <circle cx="55" cy="30" r="10" fill="#f43f5e"/>
      <circle cx="45" cy="46" r="10" fill="#f43f5e"/>
      <circle cx="65" cy="46" r="10" fill="#3b82f6"/>
      <circle cx="25" cy="46" r="10" fill="#10b981"/>
      <polygon points="46,88 54,88 50,68" fill="#38bdf8"/>
    </svg>`
  }
];

window.GAMES_CATALOG = GAMES_CATALOG;

