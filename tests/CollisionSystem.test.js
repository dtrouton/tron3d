// Mock THREE.js
jest.mock('three', () => {
  return {
    Vector3: jest.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
      x,
      y,
      z,
      distanceTo: jest.fn().mockImplementation((other) => {
        // Simple distance calculation for testing
        const dx = x - other.x;
        const dy = y - other.y;
        const dz = z - other.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
      })
    }))
  };
});

// Import CollisionSystem class
const { CollisionSystem } = require('../src/js/systems/CollisionSystem');

describe('CollisionSystem', () => {
  let collisionSystem;
  
  beforeEach(() => {
    collisionSystem = new CollisionSystem();
  });
  
  test('checkWallCollision should detect when position is beyond arena boundary', () => {
    const arenaSize = 100;
    
    // Position within bounds
    const safePosition = { x: 0, y: 0, z: 0 };
    expect(collisionSystem.checkWallCollision(safePosition, arenaSize)).toBe(false);
    
    // Position outside bounds
    const outsidePosition = { x: 60, y: 0, z: 0 };
    expect(collisionSystem.checkWallCollision(outsidePosition, arenaSize)).toBe(true);
  });
  
  test('checkTrailCollision should detect when position is too close to trail', () => {
    // Create a mock trail with some positions
    const trail = [
      { position: { x: 10, y: 0, z: 10 } },
      { position: { x: 11, y: 0, z: 10 } },
      { position: { x: 12, y: 0, z: 10 } },
      { position: { x: 13, y: 0, z: 10 } },
      { position: { x: 14, y: 0, z: 10 } }
    ];
    
    // Position away from trail
    const safePosition = { x: 20, y: 0, z: 20 };
    expect(collisionSystem.checkTrailCollision(safePosition, trail)).toBe(false);
    
    // Position very close to trail
    const collisionPosition = { x: 10, y: 0, z: 10 };
    expect(collisionSystem.checkTrailCollision(collisionPosition, trail)).toBe(true);
  });
  
  test('checkPlayerCollisions should detect collisions with walls and trails', () => {
    const arenaSize = 100;
    
    // Mock player and AI objects
    const player = {
      position: { x: 0, y: 0, z: 0 },
      trail: [
        { position: { x: -5, y: 0, z: 0 } },
        { position: { x: -4, y: 0, z: 0 } },
        { position: { x: -3, y: 0, z: 0 } },
        { position: { x: -2, y: 0, z: 0 } },
        { position: { x: -1, y: 0, z: 0 } }
      ]
    };
    
    const ai = {
      position: { x: 10, y: 0, z: 10 },
      trail: [
        { position: { x: 5, y: 0, z: 5 } },
        { position: { x: 6, y: 0, z: 6 } },
        { position: { x: 7, y: 0, z: 7 } },
        { position: { x: 8, y: 0, z: 8 } },
        { position: { x: 9, y: 0, z: 9 } }
      ]
    };
    
    // No collision
    expect(collisionSystem.checkPlayerCollisions(player, ai, arenaSize)).toBe(false);
    
    // Wall collision
    player.position = { x: 60, y: 0, z: 0 };
    expect(collisionSystem.checkPlayerCollisions(player, ai, arenaSize)).toBe(true);
    
    // Reset position
    player.position = { x: 0, y: 0, z: 0 };
    
    // Collision with AI trail
    player.position = { x: 5, y: 0, z: 5 };
    expect(collisionSystem.checkPlayerCollisions(player, ai, arenaSize)).toBe(true);
  });
});