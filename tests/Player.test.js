// Mock THREE.js
jest.mock('three', () => {
  return {
    Vector3: jest.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
      x,
      y,
      z,
      clone: jest.fn().mockReturnThis(),
      copy: jest.fn().mockReturnThis(),
      applyAxisAngle: jest.fn(),
      set: jest.fn()
    }))
  };
});

// Mock the Entity class
jest.mock('../src/js/entities/Entity', () => {
  return {
    Entity: jest.fn().mockImplementation(() => ({
      snapToGrid: jest.fn(),
      reset: jest.fn(),
      position: { x: 0, y: 0, z: 0 },
      direction: { 
        x: 1, 
        y: 0, 
        z: 0,
        applyAxisAngle: jest.fn()
      }
    }))
  };
});

// Import Player class
const { Player } = require('../src/js/entities/Player');

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
    
    // Direction should be rotated
    expect(player.direction.applyAxisAngle).toHaveBeenCalled();
    
    // Should snap to grid
    expect(player.snapToGrid).toHaveBeenCalled();
  });
  
  test('turnRight should apply rotation and snap to grid', () => {
    player.turnRight();
    
    // Direction should be rotated
    expect(player.direction.applyAxisAngle).toHaveBeenCalled();
    
    // Should snap to grid
    expect(player.snapToGrid).toHaveBeenCalled();
  });
  
  test('applySpeedBoost should increase speed temporarily', () => {
    player.applySpeedBoost();
    
    // Speed should be increased
    expect(player.speed).toBe(player.baseSpeed * 1.5);
    
    // After 5 seconds, speed should be back to normal
    jest.advanceTimersByTime(5000);
    expect(player.speed).toBe(player.baseSpeed);
  });
  
  test('reset should call parent reset and reset speed', () => {
    const newPosition = { x: 5, y: 0.5, z: 5 };
    
    // Boost speed before reset
    player.speed = player.baseSpeed * 2;
    
    player.reset(newPosition);
    
    // Should call parent reset
    expect(player.reset).toHaveBeenCalledWith(newPosition);
    
    // Speed should be reset to base speed
    expect(player.speed).toBe(player.baseSpeed);
  });
});