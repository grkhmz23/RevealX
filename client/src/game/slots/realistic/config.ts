// Realistic Slots Configuration
// Target RTP: 88-90% with authentic slot machine behavior

export interface SlotSymbol {
  id: string;
  name: string;
  weight: number;    // Higher weight = more common on reel strips
  payout3: number;   // Payout multiplier for 3 matching symbols
  color: string;     // Display color for UI
}

export const SYMBOLS: SlotSymbol[] = [
  { 
    id: "seven", 
    name: "Lucky Seven", 
    weight: 5, 
    payout3: 20, 
    color: "#FF0000" 
  }, // rare, big payout
  { 
    id: "diamond", 
    name: "Diamond", 
    weight: 8, 
    payout3: 10, 
    color: "#E0E7FF" 
  },
  { 
    id: "rocket", 
    name: "Rocket", 
    weight: 12, 
    payout3: 5, 
    color: "#FF6B35" 
  },
  { 
    id: "coin", 
    name: "Coin", 
    weight: 16, 
    payout3: 3, 
    color: "#FFD700" 
  },
  { 
    id: "tear", 
    name: "Tear", 
    weight: 22, 
    payout3: 2, 
    color: "#0080FF" 
  },
  { 
    id: "rug", 
    name: "Rug", 
    weight: 30, 
    payout3: 0, 
    color: "#8B4513" 
  }  // most common, no payout
];

// Paylines for 3x3 grid (row 0=top, 1=middle, 2=bottom)
export const PAYLINES = [
  { id: 0, name: "Top Line", positions: [0, 1, 2] },      // Top horizontal
  { id: 1, name: "Center Line", positions: [3, 4, 5] },  // Middle horizontal  
  { id: 2, name: "Bottom Line", positions: [6, 7, 8] },  // Bottom horizontal
  { id: 3, name: "Diagonal ↘", positions: [0, 4, 8] },   // Top-left to bottom-right
  { id: 4, name: "Diagonal ↙", positions: [2, 4, 6] }    // Top-right to bottom-left
];

// Bet amounts in SOL (Real mode)
export const REAL_BET_AMOUNTS = [0.1, 0.3, 0.5];

// Demo bet units (no real value)
export const DEMO_BET_AMOUNTS = [1, 2, 5];

// Game configuration
export const GAME_CONFIG = {
  GRID_SIZE: 3,
  REEL_COUNT: 3,
  SYMBOLS_PER_REEL: 3,
  MIN_MATCH_LENGTH: 3,
  TARGET_RTP: 0.89, // 89% return to player
  RESERVE_SOL: 0.2, // Keep 0.2 SOL minimum in pool
  MAX_AUTO_SPINS: 25,
  REEL_SPIN_DURATION: 2000, // 2 seconds for reel animation
  REEL_STOP_STAGGER: 300, // 300ms between reel stops
  BIG_WIN_THRESHOLD: 10 // 10x bet or more triggers big win
};

// Calculate total weight for symbol selection
export const TOTAL_SYMBOL_WEIGHT = SYMBOLS.reduce((sum, symbol) => sum + symbol.weight, 0);

// Build reel strips with weighted distribution
const buildReelStrip = (stripLength: number = 30): string[] => {
  const strip: string[] = [];
  
  for (let i = 0; i < stripLength; i++) {
    const random = Math.random() * TOTAL_SYMBOL_WEIGHT;
    let currentWeight = 0;
    
    for (const symbol of SYMBOLS) {
      currentWeight += symbol.weight;
      if (random <= currentWeight) {
        strip.push(symbol.id);
        break;
      }
    }
  }
  
  return strip;
};

// Pre-built reel strips (can be regenerated or made deterministic)
export const REEL_STRIPS = {
  reel1: buildReelStrip(30),
  reel2: buildReelStrip(30), 
  reel3: buildReelStrip(30)
};

// Asset paths
export const ASSETS = {
  cabinet: {
    bg: '/assets/slots/realistic-classic/cabinet_bg.png',
    marquee: '/assets/slots/realistic-classic/top_marquee.png',
    paytable: '/assets/slots/realistic-classic/paytable_panel.png',
    controls: '/assets/slots/realistic-classic/control_deck.png',
    lampGlow: '/assets/slots/realistic-classic/lamp_glow.png'
  },
  reels: {
    window: '/assets/slots/realistic-classic/reel_window.png',
    stripBase: '/assets/slots/realistic-classic/reel_strip_base.png'
  },
  symbols: {
    seven: '/assets/slots/realistic-classic/seven.png',
    diamond: '/assets/slots/realistic-classic/diamond.png',
    rocket: '/assets/slots/realistic-classic/rocket.png',
    coin: '/assets/slots/realistic-classic/coin.png',
    tear: '/assets/slots/realistic-classic/tear.png',
    rug: '/assets/slots/realistic-classic/rug.png'
  },
  paylines: {
    line1: '/assets/slots/realistic-classic/line_1.png',
    line2: '/assets/slots/realistic-classic/line_2.png',
    line3: '/assets/slots/realistic-classic/line_3.png',
    line4: '/assets/slots/realistic-classic/line_4.png',
    line5: '/assets/slots/realistic-classic/line_5.png'
  },
  buttons: {
    spin: {
      idle: '/assets/slots/realistic-classic/btn_spin_idle.png',
      hover: '/assets/slots/realistic-classic/btn_spin_hover.png',
      pressed: '/assets/slots/realistic-classic/btn_spin_pressed.png'
    },
    auto: {
      idle: '/assets/slots/realistic-classic/btn_auto_idle.png',
      hover: '/assets/slots/realistic-classic/btn_auto_hover.png',
      pressed: '/assets/slots/realistic-classic/btn_auto_pressed.png'
    },
    stop: {
      idle: '/assets/slots/realistic-classic/btn_stop_idle.png',
      hover: '/assets/slots/realistic-classic/btn_stop_hover.png',
      pressed: '/assets/slots/realistic-classic/btn_stop_pressed.png'
    }
  },
  badges: {
    demo: '/assets/slots/realistic-classic/badge_demo.png',
    real: '/assets/slots/realistic-classic/badge_real.png'
  },
  effects: {
    bigWin: '/assets/slots/realistic-classic/banner_bigwin.png',
    win: '/assets/slots/realistic-classic/banner_win.png',
    glare: '/assets/slots/realistic-classic/glare_overlay.png',
    sparkles: '/assets/slots/realistic-classic/sparkles.png',
    vignette: '/assets/slots/realistic-classic/vignette.png'
  },
  sounds: {
    spinStart: '/assets/slots/realistic-classic/spin_start.mp3',
    reelStop: '/assets/slots/realistic-classic/reel_stop.mp3',
    winChime: '/assets/slots/realistic-classic/win_chime.mp3',
    bigWin: '/assets/slots/realistic-classic/bigwin.mp3',
    uiClick: '/assets/slots/realistic-classic/ui_click.mp3'
  }
};

// Helper function to get symbol by ID
export const getSymbolById = (id: string): SlotSymbol | undefined => {
  return SYMBOLS.find(symbol => symbol.id === id);
};

// Helper function to calculate theoretical RTP
export const calculateTheoreticalRTP = (): number => {
  const totalWeight = TOTAL_SYMBOL_WEIGHT;
  let expectedReturn = 0;
  
  SYMBOLS.forEach(symbol => {
    const probability = Math.pow(symbol.weight / totalWeight, 3); // 3 matching symbols
    const payout = symbol.payout3;
    expectedReturn += probability * payout * PAYLINES.length;
  });
  
  return expectedReturn;
};

// Generate weighted random symbol for reel strips
export const generateRandomSymbol = (): SlotSymbol => {
  const random = Math.random() * TOTAL_SYMBOL_WEIGHT;
  let currentWeight = 0;
  
  for (const symbol of SYMBOLS) {
    currentWeight += symbol.weight;
    if (random <= currentWeight) {
      return symbol;
    }
  }
  
  // Fallback to last symbol (should never reach here)
  return SYMBOLS[SYMBOLS.length - 1];
};

// Get reel stop position for weighted outcome
export const getWeightedReelStop = (reelIndex: number): number => {
  const strip = reelIndex === 0 ? REEL_STRIPS.reel1 : 
                reelIndex === 1 ? REEL_STRIPS.reel2 : 
                REEL_STRIPS.reel3;
  
  // For fair gaming, we want to randomly select any position
  // In a real casino, this would be determined by the RNG at spin moment
  return Math.floor(Math.random() * strip.length);
};

// Check paylines for wins
export const checkPaylines = (symbols: string[]): { winningLines: number[], totalPayout: number } => {
  const winningLines: number[] = [];
  let totalPayout = 0;
  
  PAYLINES.forEach((line, lineIndex) => {
    const lineSymbols = line.positions.map(pos => symbols[pos]);
    
    // Check if all 3 symbols match
    if (lineSymbols[0] === lineSymbols[1] && lineSymbols[1] === lineSymbols[2]) {
      const symbol = getSymbolById(lineSymbols[0]);
      if (symbol && symbol.payout3 > 0) {
        winningLines.push(lineIndex);
        totalPayout += symbol.payout3;
      }
    }
  });
  
  return { winningLines, totalPayout };
};