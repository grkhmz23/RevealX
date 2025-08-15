// Asset management for realistic slots
import Phaser from 'phaser';
import { ASSETS } from './config';

export interface LoadingProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class AssetLoader {
  private scene: Phaser.Scene;
  private loadedAssets: Set<string> = new Set();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  preloadAllAssets(): void {
    // Skip loading real assets since they don't exist - we'll use fallbacks
    // This prevents the 403 errors and lets fallbacks work immediately
    
    // Set a timeout to allow the loader to initialize properly
    this.scene.time.delayedCall(100, () => {
      this.createFallbackAssets();
    });

    // Real assets don't exist yet - fallbacks will be created instead
  }

  getLoadingProgress(): LoadingProgress {
    const loader = this.scene.load;
    const loaded = loader.totalComplete;
    const total = loader.totalToLoad;
    const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
    
    return { loaded, total, percentage };
  }

  isAssetLoaded(key: string): boolean {
    return this.loadedAssets.has(key) || this.scene.textures.exists(key);
  }

  markAssetLoaded(key: string): void {
    this.loadedAssets.add(key);
  }

  // Get symbol texture key for given symbol ID
  getSymbolTexture(symbolId: string): string {
    return `symbol-${symbolId}`;
  }

  // Get payline overlay texture key
  getPaylineTexture(lineIndex: number): string {
    return `payline-${lineIndex + 1}`;
  }

  // Get button texture key for state
  getButtonTexture(buttonType: 'spin' | 'auto' | 'stop', state: 'idle' | 'hover' | 'pressed'): string {
    return `btn-${buttonType}-${state}`;
  }

  // Play sound with fallback
  playSound(soundKey: string, config?: Phaser.Types.Sound.SoundConfig): void {
    try {
      if (this.scene.sound && this.scene.sound.get(soundKey)) {
        this.scene.sound.play(soundKey, config);
      }
    } catch (error) {
      console.warn(`Sound ${soundKey} not available`);
    }
  }

  // Create fallback assets if actual assets fail to load
  createFallbackAssets(): void {
    this.createFallbackSymbols();
    this.createFallbackCabinet();
    this.createFallbackButtons();
    this.createFallbackEffects();
  }

  private createFallbackSymbols(): void {
    // Create simple colored rectangles as fallback symbols
    const fallbackSymbols = [
      { id: 'seven', color: 0xFF0000, symbol: '7' },
      { id: 'diamond', color: 0xE0E7FF, symbol: '💎' },
      { id: 'rocket', color: 0xFF6B35, symbol: '🚀' },
      { id: 'coin', color: 0xFFD700, symbol: '🪙' },
      { id: 'tear', color: 0x0080FF, symbol: '💧' },
      { id: 'rug', color: 0x8B4513, symbol: '🟥' }
    ];

    fallbackSymbols.forEach(symbol => {
      const key = this.getSymbolTexture(symbol.id);
      if (!this.isAssetLoaded(key)) {
        const graphics = this.scene.add.graphics();
        
        // Create realistic symbol with gradient and chrome effect
        graphics.fillGradientStyle(symbol.color, symbol.color, 
          Phaser.Display.Color.GetColor32(255, 255, 255, 255), 
          Phaser.Display.Color.GetColor32(200, 200, 200, 255));
        graphics.fillRoundedRect(10, 10, 236, 236, 20);
        
        // Chrome border effect
        graphics.lineStyle(6, 0xC0C0C0);
        graphics.strokeRoundedRect(10, 10, 236, 236, 20);
        graphics.lineStyle(2, 0xFFFFFF);
        graphics.strokeRoundedRect(12, 12, 232, 232, 18);
        
        // Symbol text with shadow
        const shadowText = this.scene.add.text(130, 130, symbol.symbol, {
          fontFamily: 'Arial Black',
          fontSize: '48px',
          color: '#000000',
          align: 'center'
        }).setOrigin(0.5);
        
        const mainText = this.scene.add.text(128, 128, symbol.symbol, {
          fontFamily: 'Arial Black',
          fontSize: '48px',
          color: '#FFFFFF',
          align: 'center'
        }).setOrigin(0.5);

        const container = this.scene.add.container(0, 0, [graphics, shadowText, mainText]);
        const renderTexture = this.scene.add.renderTexture(0, 0, 256, 256);
        renderTexture.draw(container);
        
        this.scene.textures.addRenderTexture(key, renderTexture);
        
        container.destroy();
        renderTexture.destroy();
        
        this.markAssetLoaded(key);
      }
    });
  }

  private createFallbackCabinet(): void {
    // Cabinet background
    if (!this.isAssetLoaded('cabinet-bg')) {
      const graphics = this.scene.add.graphics();
      graphics.fillGradientStyle(0x1a1a1a, 0x1a1a1a, 0x000000, 0x000000);
      graphics.fillRect(0, 0, 1600, 1000);
      
      // Chrome side trims
      graphics.fillStyle(0xC0C0C0);
      graphics.fillRect(0, 0, 50, 1000);
      graphics.fillRect(1550, 0, 50, 1000);
      
      const renderTexture = this.scene.add.renderTexture(0, 0, 1600, 1000);
      renderTexture.draw(graphics);
      this.scene.textures.addRenderTexture('cabinet-bg', renderTexture);
      
      graphics.destroy();
      renderTexture.destroy();
      this.markAssetLoaded('cabinet-bg');
    }

    // Reel window
    if (!this.isAssetLoaded('reel-window')) {
      const graphics = this.scene.add.graphics();
      
      // Dark inner area
      graphics.fillStyle(0x000000);
      graphics.fillRect(50, 50, 1100, 320);
      
      // Chrome frame with depth
      graphics.lineStyle(20, 0xC0C0C0);
      graphics.strokeRect(50, 50, 1100, 320);
      graphics.lineStyle(4, 0xFFFFFF);
      graphics.strokeRect(60, 60, 1080, 300);
      
      // Glass reflection effect
      graphics.fillGradientStyle(0xFFFFFF, 0xFFFFFF, 0xFFFFFF, 0xFFFFFF, 0.1, 0.05, 0.3, 0.1);
      graphics.fillRect(60, 60, 1080, 100);
      
      const renderTexture = this.scene.add.renderTexture(0, 0, 1200, 420);
      renderTexture.draw(graphics);
      this.scene.textures.addRenderTexture('reel-window', renderTexture);
      
      graphics.destroy();
      renderTexture.destroy();
      this.markAssetLoaded('reel-window');
    }

    // Control deck
    if (!this.isAssetLoaded('control-deck')) {
      const graphics = this.scene.add.graphics();
      graphics.fillGradientStyle(0x2a2a2a, 0x2a2a2a, 0x1a1a1a, 0x1a1a1a);
      graphics.fillRect(0, 0, 1600, 220);
      
      // Chrome accents
      graphics.lineStyle(4, 0xC0C0C0);
      graphics.strokeRect(0, 0, 1600, 220);
      
      const renderTexture = this.scene.add.renderTexture(0, 0, 1600, 220);
      renderTexture.draw(graphics);
      this.scene.textures.addRenderTexture('control-deck', renderTexture);
      
      graphics.destroy();
      renderTexture.destroy();
      this.markAssetLoaded('control-deck');
    }
  }

  private createFallbackButtons(): void {
    const buttonConfigs = [
      { type: 'spin', color: 0x00FF00, width: 300, height: 120 },
      { type: 'auto', color: 0xFFFF00, width: 220, height: 100 },
      { type: 'stop', color: 0xFF0000, width: 220, height: 100 }
    ];

    buttonConfigs.forEach(config => {
      ['idle', 'hover', 'pressed'].forEach((state, index) => {
        const key = this.getButtonTexture(config.type as any, state as any);
        if (!this.isAssetLoaded(key)) {
          const graphics = this.scene.add.graphics();
          
          // Button color variations
          const alpha = state === 'pressed' ? 0.7 : state === 'hover' ? 1.2 : 1.0;
          const brightness = state === 'pressed' ? 0.8 : state === 'hover' ? 1.1 : 1.0;
          
          graphics.fillStyle(Phaser.Display.Color.GetColor32(
            Math.min(255, ((config.color >> 16) & 0xFF) * brightness),
            Math.min(255, ((config.color >> 8) & 0xFF) * brightness),
            Math.min(255, (config.color & 0xFF) * brightness),
            alpha * 255
          ));
          graphics.fillRoundedRect(0, 0, config.width, config.height, 15);
          
          // Chrome border
          graphics.lineStyle(4, 0xC0C0C0);
          graphics.strokeRoundedRect(0, 0, config.width, config.height, 15);
          
          const renderTexture = this.scene.add.renderTexture(0, 0, config.width, config.height);
          renderTexture.draw(graphics);
          this.scene.textures.addRenderTexture(key, renderTexture);
          
          graphics.destroy();
          renderTexture.destroy();
          this.markAssetLoaded(key);
        }
      });
    });
  }

  private createFallbackEffects(): void {
    // Create simple payline overlays
    for (let i = 0; i < 5; i++) {
      const key = this.getPaylineTexture(i);
      if (!this.isAssetLoaded(key)) {
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(8, 0x00FFFF, 0.8);
        
        // Draw different line patterns
        if (i < 3) {
          // Horizontal lines
          const y = 105 + (i * 105);
          graphics.moveTo(200, y);
          graphics.lineTo(1000, y);
        } else if (i === 3) {
          // Diagonal \
          graphics.moveTo(200, 105);
          graphics.lineTo(1000, 315);
        } else {
          // Diagonal /
          graphics.moveTo(200, 315);
          graphics.lineTo(1000, 105);
        }
        graphics.strokePath();
        
        const renderTexture = this.scene.add.renderTexture(0, 0, 1200, 420);
        renderTexture.draw(graphics);
        this.scene.textures.addRenderTexture(key, renderTexture);
        
        graphics.destroy();
        renderTexture.destroy();
        this.markAssetLoaded(key);
      }
    }

    // Win banners
    if (!this.isAssetLoaded('banner-bigwin')) {
      const graphics = this.scene.add.graphics();
      graphics.fillGradientStyle(0xFFD700, 0xFFD700, 0xFFA500, 0xFFA500, 0.9, 0.9, 0.7, 0.7);
      graphics.fillRoundedRect(0, 0, 1100, 220, 30);
      graphics.lineStyle(6, 0xFFFFFF);
      graphics.strokeRoundedRect(0, 0, 1100, 220, 30);
      
      const renderTexture = this.scene.add.renderTexture(0, 0, 1100, 220);
      renderTexture.draw(graphics);
      this.scene.textures.addRenderTexture('banner-bigwin', renderTexture);
      
      graphics.destroy();
      renderTexture.destroy();
      this.markAssetLoaded('banner-bigwin');
    }
  }
}