// Realistic Classic Slots Phaser Scene
import Phaser from 'phaser';
import { AssetLoader } from './assets';
import { 
  SYMBOLS, 
  PAYLINES, 
  REEL_STRIPS, 
  GAME_CONFIG, 
  getSymbolById, 
  getWeightedReelStop, 
  checkPaylines,
  type SlotSymbol 
} from './config';

export interface SpinResult {
  symbols: string[];
  winningLines: number[];
  totalPayout: number;
  isBigWin: boolean;
}

export interface GameState {
  isSpinning: boolean;
  isAutoSpinning: boolean;
  autoSpinsRemaining: number;
  currentBet: number;
  balance: number;
  lastWin: number;
  isDemoMode: boolean;
}

export class ClassicRealisticScene extends Phaser.Scene {
  private assetLoader!: AssetLoader;
  private gameState: GameState;
  private callbacks: {
    onSpin?: (bet: number) => Promise<SpinResult>;
    onGameStateChange?: (state: GameState) => void;
    onError?: (error: string) => void;
  } = {};

  // Visual elements
  private cabinet!: Phaser.GameObjects.Group;
  private reelWindow!: Phaser.GameObjects.Image;
  private reels: Phaser.GameObjects.Container[] = [];
  private paylineOverlays: Phaser.GameObjects.Image[] = [];
  private controlsGroup!: Phaser.GameObjects.Group;
  private effectsGroup!: Phaser.GameObjects.Group;

  // Reel strips and positions
  private reelStrips: string[][] = [];
  private reelPositions: number[] = [0, 0, 0]; // Current positions on strips
  private targetPositions: number[] = [0, 0, 0]; // Target stop positions

  // UI elements
  private spinButton!: Phaser.GameObjects.Container;
  private autoButton!: Phaser.GameObjects.Container;
  private stopButton!: Phaser.GameObjects.Container;
  private balanceText!: Phaser.GameObjects.Text;
  private betText!: Phaser.GameObjects.Text;
  private winText!: Phaser.GameObjects.Text;
  private modeBadge!: Phaser.GameObjects.Image;

  // Animation tweens
  private reelTweens: Phaser.Tweens.Tween[] = [];
  private glareEffect!: Phaser.GameObjects.Image;

  constructor() {
    super({ key: 'ClassicRealisticScene' });
    
    this.gameState = {
      isSpinning: false,
      isAutoSpinning: false,
      autoSpinsRemaining: 0,
      currentBet: 0,
      balance: 100,
      lastWin: 0,
      isDemoMode: true
    };
  }

  init(data: any) {
    if (data.gameState) {
      this.gameState = { ...this.gameState, ...data.gameState };
    }
    if (data.callbacks) {
      this.callbacks = data.callbacks;
    }
  }

  preload() {
    this.assetLoader = new AssetLoader(this);
    
    // Show simple loading message
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    const loadingText = this.add.text(centerX, centerY, 'Loading Realistic Slot Machine...', {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#00FFFF'
    }).setOrigin(0.5);

    // Remove loading text after a short delay
    this.time.delayedCall(1000, () => {
      loadingText.destroy();
    });
    
    // Initialize asset loader
    this.assetLoader.preloadAllAssets();
  }

  create() {
    // Initialize reel strips
    this.reelStrips = [
      [...REEL_STRIPS.reel1],
      [...REEL_STRIPS.reel2], 
      [...REEL_STRIPS.reel3]
    ];

    // Initialize groups
    this.cabinet = this.add.group();
    this.controlsGroup = this.add.group();
    this.effectsGroup = this.add.group();

    // Create fallback assets immediately
    this.assetLoader.createFallbackAssets();

    // Small delay to ensure assets are ready
    this.time.delayedCall(200, () => {
      // Create cabinet structure
      this.createCabinet();
      this.createReelWindow();
      this.createReels();
      this.createPaylineOverlays();
      this.createControls();
      this.createEffects();

      // Setup interactions
      this.setupInteractions();
      
      // Start idle animations
      this.startIdleAnimations();

      // Update initial display
      this.updateDisplay();
    });
  }



  private createCabinet() {
    // Main cabinet background
    const cabinetBg = this.add.image(0, 0, 'cabinet-bg').setOrigin(0);
    this.cabinet.add(cabinetBg);

    // Add title text since marquee might not load
    const titleText = this.add.text(800, 50, 'NOCRYING SLOTS', {
      fontFamily: 'Arial Black',
      fontSize: '48px',
      color: '#00FFFF',
      align: 'center'
    }).setOrigin(0.5);
    this.cabinet.add(titleText);

    // Add subtle ambient glow
    const ambientGlow = this.add.graphics();
    ambientGlow.fillGradientStyle(0x00FFFF, 0x00FFFF, 0x00FFFF, 0x00FFFF, 0.1, 0.05, 0.1, 0.05);
    ambientGlow.fillRect(0, 0, 1600, 1000);
    this.cabinet.add(ambientGlow);
  }

  private createReelWindow() {
    // Reel window frame
    this.reelWindow = this.add.image(200, 300, 'reel-window').setOrigin(0);
    
    // Create mask for reel area
    const reelMask = this.add.graphics();
    reelMask.fillStyle(0xFFFFFF);
    reelMask.fillRect(250, 340, 900, 300); // Inner window area
    
    const mask = reelMask.createGeometryMask();
    this.reelWindow.setMask(mask);
  }

  private createReels() {
    const reelWidth = 300;
    const symbolHeight = 100;
    const startX = 250;
    const startY = 340;

    for (let reelIndex = 0; reelIndex < 3; reelIndex++) {
      const reel = this.add.container(startX + (reelIndex * reelWidth), startY);
      
      // Create visible symbols (3 per reel + buffer)
      const symbolsContainer = this.add.container(0, 0);
      
      for (let symbolIndex = 0; symbolIndex < 6; symbolIndex++) { // Extra symbols for smooth scrolling
        const stripPosition = (this.reelPositions[reelIndex] + symbolIndex) % this.reelStrips[reelIndex].length;
        const symbolId = this.reelStrips[reelIndex][stripPosition];
        
        const symbolSprite = this.add.image(
          reelWidth / 2, 
          symbolIndex * symbolHeight - symbolHeight, 
          this.assetLoader.getSymbolTexture(symbolId)
        );
        symbolSprite.setDisplaySize(90, 90);
        symbolsContainer.add(symbolSprite);
      }

      reel.add(symbolsContainer);
      this.reels.push(reel);
    }

    // Add glare effect overlay
    this.glareEffect = this.add.image(600, 490, 'glare-overlay');
    this.glareEffect.setAlpha(0.3);
    this.glareEffect.setBlendMode(Phaser.BlendModes.ADD);
  }

  private createPaylineOverlays() {
    for (let i = 0; i < PAYLINES.length; i++) {
      const overlay = this.add.image(600, 490, this.assetLoader.getPaylineTexture(i));
      overlay.setAlpha(0);
      overlay.setBlendMode(Phaser.BlendModes.ADD);
      this.paylineOverlays.push(overlay);
    }
  }

  private createControls() {
    // Control deck background
    const controlDeck = this.add.image(0, 780, 'control-deck').setOrigin(0);
    this.controlsGroup.add(controlDeck);

    // Mode badge (create simple text for now)
    const modeText = this.gameState.isDemoMode ? 'DEMO' : 'REAL';
    const modeBadge = this.add.graphics();
    modeBadge.fillStyle(this.gameState.isDemoMode ? 0x00FF00 : 0xFF6600);
    modeBadge.fillRoundedRect(80, 830, 120, 40, 20);
    modeBadge.lineStyle(2, 0xFFFFFF);
    modeBadge.strokeRoundedRect(80, 830, 120, 40, 20);
    this.controlsGroup.add(modeBadge);

    const modeBadgeText = this.add.text(140, 850, modeText, {
      fontFamily: 'Arial Black',
      fontSize: '16px',
      color: '#FFFFFF'
    }).setOrigin(0.5);
    this.controlsGroup.add(modeBadgeText);

    // Text displays
    this.balanceText = this.add.text(300, 820, 'BALANCE: 0', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#00FFFF'
    });
    this.controlsGroup.add(this.balanceText);

    this.betText = this.add.text(300, 860, 'BET: 0', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#FFFFFF'
    });
    this.controlsGroup.add(this.betText);

    this.winText = this.add.text(300, 890, 'WIN: 0', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#FFD700'
    });
    this.controlsGroup.add(this.winText);

    // Create buttons
    this.createButton('spin', 800, 850, 150, 60);
    this.createButton('auto', 1000, 850, 110, 50);
    this.createButton('stop', 1150, 850, 110, 50);
  }

  private createButton(type: 'spin' | 'auto' | 'stop', x: number, y: number, width: number, height: number) {
    const button = this.add.container(x, y);
    
    const buttonImage = this.add.image(0, 0, this.assetLoader.getButtonTexture(type, 'idle'));
    buttonImage.setDisplaySize(width, height);
    
    const buttonText = this.add.text(0, 0, type.toUpperCase(), {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    button.add([buttonImage, buttonText]);
    button.setSize(width, height);
    button.setInteractive();

    // Store references
    if (type === 'spin') this.spinButton = button;
    else if (type === 'auto') this.autoButton = button;
    else if (type === 'stop') this.stopButton = button;

    this.controlsGroup.add(button);
  }

  private createEffects() {
    // Create a simple vignette effect
    const vignette = this.add.graphics();
    vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.3, 0, 0.3, 0);
    vignette.fillEllipse(800, 500, 1600, 1000);
    vignette.setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.effectsGroup.add(vignette);
  }

  private setupInteractions() {
    // Spin button
    this.spinButton.on('pointerdown', () => {
      if (!this.gameState.isSpinning) {
        this.handleSpin();
      }
    });

    // Auto button
    this.autoButton.on('pointerdown', () => {
      this.handleAutoSpin();
    });

    // Stop button
    this.stopButton.on('pointerdown', () => {
      this.handleStop();
    });
  }

  private startIdleAnimations() {
    // Subtle reel drift
    this.reels.forEach((reel, index) => {
      this.tweens.add({
        targets: reel,
        y: reel.y + 2,
        duration: 3000 + (index * 500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    // Occasional glare sweep
    this.time.addEvent({
      delay: 8000,
      callback: this.animateGlareSweep,
      callbackScope: this,
      loop: true
    });
  }

  private animateGlareSweep() {
    this.glareEffect.setAlpha(0);
    this.glareEffect.x = 200;
    
    this.tweens.add({
      targets: this.glareEffect,
      x: 1000,
      alpha: 0.6,
      duration: 1500,
      ease: 'Power2.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: this.glareEffect,
          alpha: 0.3,
          duration: 500
        });
      }
    });
  }

  private async handleSpin() {
    if (this.gameState.isSpinning || !this.callbacks.onSpin) return;

    this.gameState.isSpinning = true;
    this.updateGameStateCallback();

    try {
      // Get spin result from callback
      const result = await this.callbacks.onSpin(this.gameState.currentBet);
      
      // Animate the spin
      await this.animateSpin(result);
      
      // Update game state
      this.gameState.lastWin = result.totalPayout;
      this.gameState.isSpinning = false;
      
      // Handle auto-spin continuation
      if (this.gameState.isAutoSpinning && this.gameState.autoSpinsRemaining > 0) {
        this.gameState.autoSpinsRemaining--;
        if (this.gameState.autoSpinsRemaining > 0) {
          setTimeout(() => this.handleSpin(), 1000);
        } else {
          this.gameState.isAutoSpinning = false;
        }
      }

      this.updateDisplay();
      this.updateGameStateCallback();
      
    } catch (error) {
      this.gameState.isSpinning = false;
      this.updateGameStateCallback();
      if (this.callbacks.onError) {
        this.callbacks.onError(error instanceof Error ? error.message : 'Spin failed');
      }
    }
  }

  private async animateSpin(result: SpinResult) {
    // Play spin sound
    this.assetLoader.playSound('spin-start');

    // Calculate target positions for each reel
    for (let i = 0; i < 3; i++) {
      this.targetPositions[i] = getWeightedReelStop(i);
    }

    // Animate each reel with staggered stops
    const promises: Promise<void>[] = [];
    
    for (let reelIndex = 0; reelIndex < 3; reelIndex++) {
      const delay = reelIndex * GAME_CONFIG.REEL_STOP_STAGGER;
      promises.push(this.animateReel(reelIndex, delay));
    }

    await Promise.all(promises);

    // Update reel symbols to match result
    this.updateReelSymbols(result.symbols);

    // Show winning effects
    if (result.totalPayout > 0) {
      await this.showWinEffects(result);
    }
  }

  private animateReel(reelIndex: number, delay: number): Promise<void> {
    return new Promise((resolve) => {
      const reel = this.reels[reelIndex];
      const symbolsContainer = reel.list[0] as Phaser.GameObjects.Container;
      
      // Start spinning animation
      const spinTween = this.tweens.add({
        targets: symbolsContainer,
        y: symbolsContainer.y - 600, // Spin effect
        duration: GAME_CONFIG.REEL_SPIN_DURATION - delay,
        ease: 'Power2.easeOut',
        delay: delay,
        onComplete: () => {
          // Snap to final position with slight bounce
          this.assetLoader.playSound('reel-stop');
          
          this.tweens.add({
            targets: symbolsContainer,
            y: symbolsContainer.y + 10,
            duration: 100,
            yoyo: true,
            onComplete: () => resolve()
          });
        }
      });

      this.reelTweens.push(spinTween);
    });
  }

  private updateReelSymbols(symbols: string[]) {
    // Update each reel's visible symbols to match the result
    for (let reelIndex = 0; reelIndex < 3; reelIndex++) {
      const reel = this.reels[reelIndex];
      const symbolsContainer = reel.list[0] as Phaser.GameObjects.Container;
      
      // Update the 3 visible symbols for this reel
      for (let symbolIndex = 0; symbolIndex < 3; symbolIndex++) {
        const gridIndex = (reelIndex * 3) + symbolIndex;
        const symbolId = symbols[gridIndex];
        const symbolSprite = symbolsContainer.list[symbolIndex + 1] as Phaser.GameObjects.Image; // +1 for buffer
        
        symbolSprite.setTexture(this.assetLoader.getSymbolTexture(symbolId));
      }
    }
  }

  private async showWinEffects(result: SpinResult): Promise<void> {
    // Highlight winning paylines
    const linePromises = result.winningLines.map(lineIndex => 
      this.highlightPayline(lineIndex)
    );

    await Promise.all(linePromises);

    // Play appropriate win sound
    if (result.isBigWin) {
      this.assetLoader.playSound('big-win');
      await this.showBigWinBanner();
    } else {
      this.assetLoader.playSound('win-chime');
    }
  }

  private highlightPayline(lineIndex: number): Promise<void> {
    return new Promise((resolve) => {
      const overlay = this.paylineOverlays[lineIndex];
      
      this.tweens.add({
        targets: overlay,
        alpha: 0.8,
        duration: 300,
        yoyo: true,
        repeat: 2,
        onComplete: () => resolve()
      });
    });
  }

  private async showBigWinBanner(): Promise<void> {
    const banner = this.add.image(800, 400, 'banner-bigwin');
    banner.setAlpha(0);
    banner.setScale(0.5);

    return new Promise((resolve) => {
      this.tweens.add({
        targets: banner,
        alpha: 1,
        scale: 1,
        duration: 500,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.time.delayedCall(2000, () => {
            this.tweens.add({
              targets: banner,
              alpha: 0,
              scale: 0.8,
              duration: 300,
              onComplete: () => {
                banner.destroy();
                resolve();
              }
            });
          });
        }
      });
    });
  }

  private handleAutoSpin() {
    if (this.gameState.isAutoSpinning) {
      this.gameState.isAutoSpinning = false;
      this.gameState.autoSpinsRemaining = 0;
    } else {
      this.gameState.isAutoSpinning = true;
      this.gameState.autoSpinsRemaining = GAME_CONFIG.MAX_AUTO_SPINS;
      this.handleSpin();
    }
    this.updateGameStateCallback();
  }

  private handleStop() {
    this.gameState.isAutoSpinning = false;
    this.gameState.autoSpinsRemaining = 0;
    
    // Stop any ongoing reel animations
    this.reelTweens.forEach(tween => tween.stop());
    this.reelTweens = [];
    
    this.updateGameStateCallback();
  }

  private updateDisplay() {
    const currency = this.gameState.isDemoMode ? 'credits' : 'SOL';
    
    if (this.balanceText) {
      this.balanceText.setText(`BALANCE: ${this.gameState.balance.toFixed(2)} ${currency}`);
    }
    if (this.betText) {
      this.betText.setText(`BET: ${this.gameState.currentBet.toFixed(2)} ${currency}`);
    }
    if (this.winText) {
      this.winText.setText(`WIN: ${this.gameState.lastWin.toFixed(2)} ${currency}`);
    }
  }

  private updateGameStateCallback() {
    if (this.callbacks.onGameStateChange) {
      this.callbacks.onGameStateChange({ ...this.gameState });
    }
  }

  // Public methods for external control
  public updateGameState(newState: Partial<GameState>) {
    this.gameState = { ...this.gameState, ...newState };
    this.updateDisplay();
  }

  public getGameState(): GameState {
    return { ...this.gameState };
  }

  public setCallbacks(callbacks: typeof this.callbacks) {
    this.callbacks = callbacks;
  }
}