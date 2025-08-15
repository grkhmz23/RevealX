// Centralized brand configuration
// This file allows easy rebranding without hunting through multiple files

export const BRAND_NAME = "Casino (TEMP)";
export const BRAND_TAGLINE = "Crypto-native casino on Solana";
export const BRAND_DESCRIPTION = "A Solana casino hub with Scratch 'n SOL, Slots, and more. DEMO and REAL modes. 90% to prize pool, 10% to team.";

// SEO Configuration
export const SEO_CONFIG = {
  title: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
  description: BRAND_DESCRIPTION,
  keywords: "solana casino, crypto gambling, scratch cards, slots, blockchain gaming, SOL betting",
  ogImage: "/assets/casino/hero-og.png"
};

// Navigation Configuration
export const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Casino", href: "/casino" },
  { label: "Scratch & SOL", href: "/casino/scratch" },
  { label: "Slots", href: "/casino/slots" },
  { label: "Other", href: "/casino/other" }
];

// Footer Configuration
export const FOOTER_LINKS = {
  legal: [
    { label: "Terms", href: "/terms" },
    { label: "Risk Disclaimer", href: "/risk" }
  ],
  social: [
    { label: "Twitter", href: "https://twitter.com", external: true },
    { label: "Telegram", href: "https://telegram.org", external: true },
    { label: "Docs", href: "/docs" }
  ]
};

// Casino Categories Configuration
export const CASINO_CATEGORIES = [
  {
    id: "scratch",
    title: "Scratch & SOL",
    description: "On-chain scratch cards, up to 20x multipliers",
    image: "/assets/casino/scratch.png",
    href: "/casino/scratch",
    status: "available",
    features: ["Instant wins", "Multiple tiers", "Real SOL payouts"]
  },
  {
    id: "slots",
    title: "Slots",
    description: "Classic 3×3, multipliers, 5 paylines",
    image: "/assets/casino/slots.png", 
    href: "/casino/slots",
    status: "available",
    features: ["88-90% RTP", "Auto-play", "Progressive difficulty"]
  },
  {
    id: "other",
    title: "Other Games",
    description: "Roulette, Coin Flip, Dice (coming soon)",
    image: "/assets/casino/other.png",
    href: "/casino/other", 
    status: "coming-soon",
    features: ["Live betting", "Multiple variants", "Fair algorithms"]
  }
];

// Global notices and disclaimers
export const GLOBAL_NOTICES = {
  gambling: "Gambling involves risk. Play responsibly. DEMO available.",
  poolSplit: "Most games support DEMO & REAL modes. 90% to prize pool, 10% to team.",
  demo: "Demo Mode — no real payouts",
  real: "Real Mode — SOL wagers & payouts"
};