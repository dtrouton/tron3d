import * as THREE from 'three';
import { Player } from '../entities/Player.js';
import { AI } from '../entities/AI.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { RenderSystem } from '../systems/RenderSystem.js';
import { UIManager } from '../systems/UIManager.js';
import { InputController } from '../systems/InputController.js';
import { CONFIG } from '../utils/Config.js';

export class GameEngine {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    
    document.body.appendChild(this.renderer.domElement);
    
    // Game state
    this.gameOver = false;
    this.gameStarted = false;
    this.score = 0;
    this.gameTime = 0;
    this.difficulty = 1;
    this.frameCount = 0;
    this.animationFrameId = null;
    this.powerUps = [];
    
    // Game systems
    this.collisionSystem = new CollisionSystem();
    this.renderSystem = new RenderSystem(this.scene, this.camera, this.renderer);
    this.uiManager = new UIManager();
    this.inputController = new InputController();
    
    // Initialize entities
    this.player = new Player(this.scene, CONFIG.PLAYER_START_POSITION);
    this.ai = new AI(this.scene, CONFIG.AI_START_POSITION);
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Create arena
    this.createArena();
    
    // Set up lighting
    this.setupLighting();
  }
  
  setupEventListeners() {
    this.inputController.addKeyListener((key) => {
      if (this.gameOver) return;
      
      switch(key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.player.turnLeft();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.player.turnRight();
        break;
      }
    });
    
    // Space to restart after game over
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Space' && this.gameOver) {
        this.resetGame();
      }
    });
    
    // Start button listener
    document.getElementById('startButton').addEventListener('click', () => {
      this.startGame();
    });
    
    // Window resize handler
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }
  
  createArena() {
    const arenaSize = CONFIG.ARENA_SIZE;
    
    // Grid helper
    const gridHelper = new THREE.GridHelper(arenaSize, arenaSize);
    this.scene.add(gridHelper);
    
    const wallHeight = 1;
    const wallThickness = 0.5;

    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x0088ff,
      emissive: 0x0044aa,
      metalness: 0.8,
      roughness: 0.2
    });

    // Create four walls
    const walls = [
      // North wall
      { size: [arenaSize, wallHeight, wallThickness], position: [0, wallHeight / 2, arenaSize / 2] },
      // South wall
      { size: [arenaSize, wallHeight, wallThickness], position: [0, wallHeight / 2, -arenaSize / 2] },
      // East wall
      { size: [wallThickness, wallHeight, arenaSize], position: [arenaSize / 2, wallHeight / 2, 0] },
      // West wall
      { size: [wallThickness, wallHeight, arenaSize], position: [-arenaSize / 2, wallHeight / 2, 0] }
    ];

    walls.forEach(wall => {
      const wallGeometry = new THREE.BoxGeometry(...wall.size);
      const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
      wallMesh.position.set(...wall.position);
      this.scene.add(wallMesh);
    });

    // Add a floor
    const floorGeometry = new THREE.PlaneGeometry(arenaSize, arenaSize);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x001a33,
      roughness: 0.8,
      metalness: 0.2
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);
  }
  
  setupLighting() {
    const arenaSize = CONFIG.ARENA_SIZE;
    
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x111111);
    this.scene.add(ambientLight);

    // Directional light for shadows and depth
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    // Point lights at each corner for dynamic lighting
    const cornerLights = [
      { position: [arenaSize/2, 5, arenaSize/2], color: 0x0088ff },
      { position: [-arenaSize/2, 5, arenaSize/2], color: 0x0088ff },
      { position: [arenaSize/2, 5, -arenaSize/2], color: 0x0088ff },
      { position: [-arenaSize/2, 5, -arenaSize/2], color: 0x0088ff }
    ];

    cornerLights.forEach(light => {
      const pointLight = new THREE.PointLight(light.color, 0.5, arenaSize);
      pointLight.position.set(...light.position);
      this.scene.add(pointLight);
    });
    
    // Add ceiling glow (optional)
    const ceilingLight = new THREE.RectAreaLight(0x0088ff, 1, arenaSize, arenaSize);
    ceilingLight.position.set(0, 10, 0);
    ceilingLight.rotation.x = Math.PI;
    this.scene.add(ceilingLight);
  }
  
  startGame() {
    this.gameStarted = true;
    this.gameOver = false;
    this.score = 0;
    this.difficulty = 1;
    
    // Reset positions and states
    this.player.reset(CONFIG.PLAYER_START_POSITION);
    this.ai.reset(CONFIG.AI_START_POSITION);
    
    // Clear power-ups
    this.powerUps.forEach(powerUp => this.scene.remove(powerUp));
    this.powerUps = [];
    
    // Update UI
    this.uiManager.hideStartScreen();
    this.uiManager.showScoreDisplay(this.score);
    
    // Start the game loop if it's not already running
    if (!this.animationFrameId) {
      this.animate();
    }
  }
  
  resetGame() {
    // Hide game over screen
    this.uiManager.hideGameOverScreen();
    
    // Reset game state
    this.gameOver = false;
    this.score = 0;
    this.gameTime = 0;
    
    // Delay game start
    setTimeout(() => this.startGame(), 1000);
  }
  
  endGame(message) {
    this.gameOver = true;
    this.gameStarted = false;
    
    // Show game over message
    this.uiManager.showGameOverScreen(message, this.score);
    
    // Show start screen after a delay
    setTimeout(() => {
      this.uiManager.hideGameOverScreen();
      this.uiManager.showStartScreen();
    }, 3000);
    
    // Stop the animation loop
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
  }
  
  update() {
    if (this.gameOver || !this.gameStarted) return;
    
    this.gameTime++;
    
    // Update entities
    this.player.update();
    this.ai.update();
    
    // Check collisions
    if (this.collisionSystem.checkPlayerCollisions(this.player, this.ai, CONFIG.ARENA_SIZE)) {
      this.endGame('Game Over: Player crashed!');
      return;
    }
    
    if (this.collisionSystem.checkAICollisions(this.ai, this.player, CONFIG.ARENA_SIZE)) {
      this.endGame('You Win: AI crashed!');
      return;
    }
    
    // Check power-ups
    this.checkPowerUpCollisions();
    
    // Update score
    this.score++;
    this.uiManager.updateScore(this.score);
    
    // Periodically increase difficulty
    if (this.frameCount % 600 === 0) {
      this.difficulty += 0.1;
      this.ai.setSpeed(CONFIG.BASE_AI_SPEED * this.difficulty);
    }
    
    // Periodically create power-ups
    if (this.frameCount % 300 === 0) {
      this.createPowerUp();
    }
    
    this.frameCount++;
    
    // Update minimap
    this.uiManager.updateMinimap(
      this.player.position, 
      this.ai.position, 
      this.player.trail, 
      this.ai.trail,
      CONFIG.ARENA_SIZE
    );
  }
  
  createPowerUp() {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xffff00, 
      emissive: 0xffff00 
    });
    
    const powerUp = new THREE.Mesh(geometry, material);
    const arenaSize = CONFIG.ARENA_SIZE;
    
    powerUp.position.set(
      Math.random() * arenaSize - arenaSize / 2,
      0.5,
      Math.random() * arenaSize - arenaSize / 2
    );
    
    this.scene.add(powerUp);
    this.powerUps.push(powerUp);
  }
  
  checkPowerUpCollisions() {
    this.powerUps.forEach((powerUp, index) => {
      if (this.player.position.distanceTo(powerUp.position) < 1) {
        // Apply power-up effect (e.g., speed boost)
        this.player.applySpeedBoost();
        
        this.scene.remove(powerUp);
        this.powerUps.splice(index, 1);
      }
    });
  }
  
  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    
    if (this.gameStarted && !this.gameOver) {
      this.update();
      
      // Update camera position relative to player
      this.renderSystem.updateCamera(
        this.player.position,
        this.player.direction
      );
    }
    
    this.renderSystem.render();
  }
}