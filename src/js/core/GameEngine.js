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
    
    this.gameOver = false;
    this.gameStarted = false;
    this.score = 0;
    this.gameTime = 0;
    this.difficulty = 1;
    this.frameCount = 0;
    this.animationFrameId = null;
    this.powerUps = [];
    this.collisionSystem = new CollisionSystem();
    this.renderSystem = new RenderSystem(this.scene, this.camera, this.renderer);
    this.uiManager = new UIManager();
    this.inputController = new InputController();
    
    this.player = new Player(this.scene, CONFIG.PLAYER_START_POSITION);
    this.ai = new AI(this.scene, CONFIG.AI_START_POSITION, this.player, this.collisionSystem);
    
    this.setupEventListeners();
    this.createArena();
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
    
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Space' && this.gameOver) {
        this.resetGame();
      }
    });
    
    document.getElementById('startButton').addEventListener('click', () => {
      this.startGame();
    });
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }
  
  createArena() {
    const arenaSize = CONFIG.ARENA_SIZE;
    
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

    const walls = [
      { size: [arenaSize, wallHeight, wallThickness], position: [0, wallHeight / 2, arenaSize / 2] },
      { size: [arenaSize, wallHeight, wallThickness], position: [0, wallHeight / 2, -arenaSize / 2] },
      { size: [wallThickness, wallHeight, arenaSize], position: [arenaSize / 2, wallHeight / 2, 0] },
      { size: [wallThickness, wallHeight, arenaSize], position: [-arenaSize / 2, wallHeight / 2, 0] }
    ];

    walls.forEach(wall => {
      const wallGeometry = new THREE.BoxGeometry(...wall.size);
      const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
      wallMesh.position.set(...wall.position);
      this.scene.add(wallMesh);
    });

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
    
    const ambientLight = new THREE.AmbientLight(0x111111);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
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
    
    this.player.reset(CONFIG.PLAYER_START_POSITION);
    this.ai.reset(CONFIG.AI_START_POSITION);
    
    this.powerUps.forEach(powerUp => this.scene.remove(powerUp));
    this.powerUps = [];
    
    this.uiManager.hideStartScreen();
    this.uiManager.showScoreDisplay(this.score);
    if (!this.animationFrameId) {
      this.animate();
    }
  }
  
  resetGame() {
    this.uiManager.hideGameOverScreen();
    
    this.gameOver = false;
    this.score = 0;
    this.gameTime = 0;
    
    setTimeout(() => this.startGame(), 1000);
  }
  
  endGame(message) {
    this.gameOver = true;
    this.gameStarted = false;
    
    this.uiManager.showGameOverScreen(message, this.score);
    
    setTimeout(() => {
      this.uiManager.hideGameOverScreen();
      this.uiManager.showStartScreen();
    }, 3000);
    
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
  }
  
  update() {
    if (this.gameOver || !this.gameStarted) return;
    
    this.gameTime++;
    
    this.player.update();
    
    if (this.powerUps.length > 0 && Math.random() < 0.3) {
      this.ai.targetPowerUp(this.powerUps);
    }
    
    this.ai.update();
    if (this.collisionSystem.checkPlayerCollisions(this.player, this.ai, CONFIG.ARENA_SIZE)) {
      this.renderSystem.createExplosion(this.player.position);
      this.endGame('Game Over: Player crashed!');
      return;
    }
    
    if (this.collisionSystem.checkAICollisions(this.ai, this.player, CONFIG.ARENA_SIZE)) {
      this.renderSystem.createExplosion(this.ai.position);
      this.endGame('You Win: AI crashed!');
      return;
    }
    
    this.checkPowerUpCollisions();
    
    this.score++;
    this.uiManager.updateScore(this.score);
    
    if (this.frameCount % CONFIG.DIFFICULTY_INCREASE_INTERVAL === 0) {
      this.difficulty += 0.1;
      this.ai.setSpeed(CONFIG.BASE_AI_SPEED * Math.min(2.0, this.difficulty));
      
      if (Math.random() < CONFIG.AI_PERSONALITY_SWITCH_CHANCE && this.difficulty > 1.5) {
        const newPersonalityType = Math.floor(Math.random() * 3);
        this.ai.personalityType = newPersonalityType;
        this.ai.adjustPersonality();
        
        this.ai.aggressiveness = Math.min(
          0.95, 
          this.ai.aggressiveness + (CONFIG.AI_DIFFICULTY_SCALING * 0.1)
        );
        
        this.ai.lookAheadDistance = Math.min(
          25,
          this.ai.lookAheadDistance + 1
        );
      }
    }
    
    if (this.frameCount % CONFIG.POWER_UP_SPAWN_INTERVAL === 0 && this.powerUps.length < 3) {
      this.createPowerUp();
    }
    
    this.frameCount++;
    
    if (this.frameCount % 3 === 0) {
      this.uiManager.updateMinimap(
        this.player.position, 
        this.ai.position, 
        this.player.trail, 
        this.ai.trail,
        CONFIG.ARENA_SIZE
      );
    }
  }
  
  createPowerUp() {
    const geometry = new THREE.SphereGeometry(1.0, 16, 16);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xffff00, 
      emissive: 0xffff00,
      metalness: 0.7,
      roughness: 0.3
    });
    
    const powerUp = new THREE.Mesh(geometry, material);
    const arenaSize = CONFIG.ARENA_SIZE;
    
    const safeZone = arenaSize / 2 - 5;
    powerUp.position.set(
      (Math.random() * 2 - 1) * safeZone,
      1.0,
      (Math.random() * 2 - 1) * safeZone
    );
    
    const animate = () => {
      if (!powerUp || !this.scene.children.includes(powerUp)) return;
      
      powerUp.position.y = 1.0 + Math.sin(Date.now() * 0.002) * 0.3;
      powerUp.rotation.y += 0.01;
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    this.scene.add(powerUp);
    this.powerUps.push(powerUp);
  }
  
  checkPowerUpCollisions() {
    this.powerUps.forEach((powerUp, index) => {
      if (this.player.position.distanceTo(powerUp.position) < 1) {
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
      
      this.renderSystem.updateCamera(
        this.player.position,
        this.player.direction,
        {
          height: CONFIG.CAMERA_HEIGHT,
          distance: CONFIG.CAMERA_DISTANCE,
          lookAhead: CONFIG.LOOK_AHEAD_DISTANCE
        }
      );
    }
    
    this.renderSystem.render();
  }
}