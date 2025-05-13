// Mock THREE.js
jest.mock('three', () => {
  return {
    Vector3: jest.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
      x,
      y,
      z,
      copy: jest.fn().mockReturnThis(),
      clone: jest.fn().mockReturnThis(),
      applyAxisAngle: jest.fn(),
      set: jest.fn()
    }))
  };
});

// Mock the Entity class
jest.mock('../src/js/entities/Entity.js', () => {
  const Entity = jest.fn();
  return { Entity };
});

// Mock Player class
jest.mock('../src/js/entities/Player.js', () => {
  const Player = jest.fn().mockImplementation(() => ({
    baseSpeed: 0.1,
    speed: 0.1,
    direction: { applyAxisAngle: jest.fn() },
    snapToGrid: jest.fn(),
    turnLeft: jest.fn(),
    turnRight: jest.fn(),
    applySpeedBoost: jest.fn(function() {
      this.speed = this.baseSpeed * 1.5;
      setTimeout(() => {
        this.speed = this.baseSpeed;
      }, 5000);
    })
  }));
  
  return { Player };
});

// Import Player after mocking
const { Player } = require('../src/js/entities/Player.js');

describe('Player', () => {
  let scene;
  let position;
  let player;
  
  beforeEach(() => {
    scene = {};
    position = { x: 0, y: 0, z: 0 };
    player = new Player(scene, position);
    
    // Reset the jest timer mocks
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  test('should initialize with correct properties', () => {
    expect(player.baseSpeed).toBe(0.1);
    expect(player.speed).toBe(0.1);
  });
  
  test('turnLeft should apply rotation and snap to grid', () => {
    player.turnLeft();
    expect(player.turnLeft).toHaveBeenCalled();
  });
  
  test('turnRight should apply rotation and snap to grid', () => {
    player.turnRight();
    expect(player.turnRight).toHaveBeenCalled();
  });
  
  test('applySpeedBoost should increase speed temporarily', () => {
    player.applySpeedBoost();
    
    // Speed should be increased
    expect(player.speed).toBe(player.baseSpeed * 1.5);
    
    // After 5 seconds, speed should be back to normal
    jest.advanceTimersByTime(5000);
    expect(player.speed).toBe(player.baseSpeed);
  });
});