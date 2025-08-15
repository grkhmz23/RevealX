# Casino (TEMP) - Rebranding Migration Notes

## Overview
This project has been successfully rebranded from a scratch-card-only website to a comprehensive casino platform. The rebranding preserves all existing functionality while restructuring the user experience to position the casino hub as the primary interface.

## Key Changes Made

### 1. Brand Configuration
- **Centralized branding**: All brand names, taglines, and configuration now live in `client/src/config/brand.ts`
- **Current placeholder name**: "Casino (TEMP)" - designed for easy future rebranding
- **Tagline**: "Crypto-native casino on Solana"

### 2. Navigation & Information Architecture
- **Homepage**: `/` now serves the casino hub (was previously scratch-only)
- **Casino hub**: Both `/` and `/casino` show the same comprehensive casino landing
- **Scratch & SOL**: Moved to `/casino/scratch` (preserves all existing functionality)
- **Slots**: Available at `/casino/slots` with Classic 3×3 machine at `/casino/slots/classic`
- **Other games**: Placeholder page at `/casino/other` for future expansion

### 3. Legacy Route Handling
- **Automatic redirects**: Old scratch-specific routes redirect to appropriate casino sections
- **Preserved functionality**: All existing scratch card features remain intact
- **Backward compatibility**: Old links continue to work via redirect system

### 4. UI/UX Consistency
- **Global header/footer**: Consistent navigation across all pages using centralized components
- **Mode system**: Demo/Real mode toggle works platform-wide
- **Wallet integration**: Preserved existing Solana wallet functionality
- **Visual consistency**: Maintained neon cyberpunk aesthetic throughout

## Easy Rebranding Instructions

### To Change the Brand Name:
1. Edit `client/src/config/brand.ts`
2. Update `BRAND_NAME` constant
3. Optionally update `BRAND_TAGLINE` and `BRAND_DESCRIPTION`
4. No other files need modification - the change propagates automatically

### Example Rebrand:
```typescript
// In client/src/config/brand.ts
export const BRAND_NAME = "Solana Stakes"; // Instead of "Casino (TEMP)"
export const BRAND_TAGLINE = "Elite crypto casino experience";
```

## Architecture Benefits

### Scalable Structure
- **Category-based organization**: Easy to add new game types
- **Modular components**: Header, Footer, and navigation components are reusable
- **Centralized configuration**: All brand and navigation settings in one place

### Preserved Features
- **All scratch card functionality**: Complete game mechanics, wallet integration, payouts
- **Demo/Real mode system**: Works across all game categories
- **Solana integration**: Pool management, transaction handling, wallet adapters
- **Database layer**: Game history, statistics, user data all preserved

### Future-Ready
- **Expandable categories**: "Other" section ready for roulette, blackjack, dice games
- **Progressive structure**: Each game type can have multiple variants
- **Consistent UX patterns**: New games follow established design patterns

## Technical Notes

### Environment Variables
All existing environment variables remain unchanged:
- `VITE_SOLANA_NETWORK`
- `VITE_SOLANA_RPC_URL` 
- `VITE_TEAM_WALLET`
- `VITE_POOL_WALLET`
- `POOL_WALLET_PRIVATE_KEY` (server-side only)

### Database Schema
No changes to existing database structure - all game data, statistics, and user information preserved.

### SEO & Metadata
- Updated HTML meta tags for casino focus
- Open Graph and Twitter card optimization
- Maintained performance and accessibility standards

## Deployment Notes

### No Breaking Changes
- Existing users can continue using the platform without interruption
- All wallet connections and game history preserved
- API endpoints remain stable

### Configuration Files
The centralized brand configuration ensures future rebranding can be completed in minutes rather than hours of file hunting.

---

*Last updated: January 29, 2025*
*Migration completed: All scratch card functionality preserved, casino structure implemented*