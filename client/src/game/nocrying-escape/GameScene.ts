import Phaser from 'phaser';

interface Obstacle {
  sprite: Phaser.Physics.Arcade.Sprite;
  type: 'rug' | 'tear' | 'coin';
}

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private gameSpeed = 200;
  private obstacleTimer = 0;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private isGameOver = false;
  private onGameEnd?: (score: number) => void;
  private backgroundSpeed = 100;
  
  // Ground and background elements
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private backgroundElements!: Phaser.GameObjects.Group;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // Load our custom SVG assets as images
    this.load.image('character', '/assets/nocrying-escape/character.svg');
    this.load.image('background', '/assets/nocrying-escape/background.svg');
    this.load.image('obstacle-rug', '/assets/nocrying-escape/obstacle-rug.svg');
    this.load.image('obstacle-tear', '/assets/nocrying-escape/obstacle-tear.svg');
    this.load.image('obstacle-coin', '/assets/nocrying-escape/obstacle-coin.svg');
  }

  create() {
    // Set up background
    this.createBackground();
    
    // Create ground
    this.ground = this.physics.add.staticGroup();
    const groundY = this.sys.game.config.height as number - 40;
    
    // Create multiple ground pieces for scrolling effect
    for (let x = 0; x < (this.sys.game.config.width as number) + 100; x += 100) {
      const groundPiece = this.ground.create(x, groundY, '');
      groundPiece.setSize(100, 40);
      groundPiece.setVisible(false); // Invisible collision boxes
    }

    // Create player
    this.player = this.physics.add.sprite(100, groundY - 60, 'character');
    this.player.setCollideWorldBounds(true);
    this.player.setSize(32, 48); // Smaller hitbox for better gameplay
    this.player.setScale(0.8);

    // Player physics
    this.physics.add.collider(this.player, this.ground);

    // Create obstacles group
    this.obstacles = this.physics.add.group();

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Touch/click input for mobile
    this.input.on('pointerdown', () => {
      this.jump();
    });

    // Score display
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontSize: '24px',
      color: '#00FFFF',
      fontStyle: 'bold'
    });

    // Instructions
    this.add.text(this.sys.game.config.width as number / 2, 50, 'TAP SPACE OR CLICK TO JUMP', {
      fontSize: '16px',
      color: '#FF6B35',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Collision detection
    this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, undefined, this);

    // Start the game loop
    this.startGameLoop();
  }

  private createBackground() {
    // Add moving background elements for parallax effect
    this.backgroundElements = this.add.group();
    
    // Create multiple background layers
    for (let i = 0; i < 3; i++) {
      const bg = this.add.image(i * (this.sys.game.config.width as number), 0, 'background');
      bg.setOrigin(0, 0);
      bg.setScale((this.sys.game.config.width as number) / 1280, (this.sys.game.config.height as number) / 720);
      this.backgroundElements.add(bg);
    }
  }

  private startGameLoop() {
    // Score timer
    this.time.addEvent({
      delay: 100,
      callback: () => {
        if (!this.isGameOver) {
          this.score += 0.1;
          this.scoreText.setText(`Score: ${Math.floor(this.score)}s`);
          
          // Increase difficulty every 10 seconds
          if (Math.floor(this.score) % 10 === 0 && this.score % 1 < 0.1) {
            this.gameSpeed += 20;
            this.backgroundSpeed += 10;
          }
        }
      },
      loop: true
    });

    // Obstacle spawner
    this.time.addEvent({
      delay: 2000,
      callback: this.spawnObstacle,
      callbackScope: this,
      loop: true
    });
  }

  private jump() {
    if (!this.isGameOver && this.player.body && this.player.body.touching.down) {
      this.player.setVelocityY(-400);
    }
  }

  private spawnObstacle() {
    if (this.isGameOver) return;

    const obstacleTypes = ['rug', 'tear', 'coin'];
    const randomType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)] as 'rug' | 'tear' | 'coin';
    
    const x = this.sys.game.config.width as number + 50;
    const y = (this.sys.game.config.height as number) - 100;
    
    const obstacle = this.physics.add.sprite(x, y, `obstacle-${randomType}`);
    obstacle.setVelocityX(-this.gameSpeed);
    obstacle.setSize(40, 40);
    obstacle.setScale(0.6);
    
    this.obstacles.add(obstacle);

    // Clean up obstacles that go off-screen
    obstacle.body?.setSize(40, 40);
    this.time.delayedCall(5000, () => {
      if (obstacle && obstacle.active) {
        obstacle.destroy();
      }
    });
  }

  private hitObstacle() {
    if (this.isGameOver) return;
    
    this.isGameOver = true;
    
    // Stop player
    this.player.setVelocity(0, 0);
    this.player.setTint(0xff0000); // Red tint to show hit
    
    // Stop all obstacles
    this.obstacles.children.entries.forEach((obstacle) => {
      const sprite = obstacle as Phaser.Physics.Arcade.Sprite;
      sprite.setVelocity(0, 0);
    });

    // Game over text
    this.add.text(this.sys.game.config.width as number / 2, this.sys.game.config.height as number / 2, 'GAME OVER', {
      fontSize: '48px',
      color: '#FF0000',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // End game after delay
    this.time.delayedCall(2000, () => {
      if (this.onGameEnd) {
        this.onGameEnd(Math.floor(this.score));
      }
    });
  }

  update() {
    if (this.isGameOver) return;

    // Handle jump input
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.cursors.up!)) {
      this.jump();
    }

    // Move background elements
    this.backgroundElements.children.entries.forEach((element) => {
      const bg = element as Phaser.GameObjects.Image;
      bg.x -= this.backgroundSpeed * 0.5 / 60; // Slower parallax
      
      // Reset position when off-screen
      if (bg.x <= -(this.sys.game.config.width as number)) {
        bg.x = (this.sys.game.config.width as number) * 2 - 10;
      }
    });
  }

  public setGameEndCallback(callback: (score: number) => void) {
    this.onGameEnd = callback;
  }

  public resetGame() {
    this.score = 0;
    this.gameSpeed = 200;
    this.backgroundSpeed = 100;
    this.isGameOver = false;
    this.player.setTint(0xffffff); // Reset tint
    this.player.setPosition(100, (this.sys.game.config.height as number) - 100);
    
    // Clear obstacles
    this.obstacles.clear(true, true);
    
    // Reset score display
    this.scoreText.setText('Score: 0s');
  }
}