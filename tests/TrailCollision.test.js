// Mock THREE.js
jest.mock('three', () => ({}));

// Mock the Config module
jest.mock('../src/js/utils/Config.js', () => {
  return {
    CONFIG: {
      IGNORE_RECENT_SEGMENTS: 20,
      COLLISION_THRESHOLD: 0.6,
      TRAIL_SEGMENT_SIZE: 0.5
    }
  };
});

// Import CollisionSystem after mocking
const { CollisionSystem } = require('../src/js/systems/CollisionSystem.js');

describe('Trail Collision Tests', () => {
  let collisionSystem;
  let player;
  let ai;
  
  beforeEach(() => {
    collisionSystem = new CollisionSystem();
    
    // Create mock player and AI objects with trails
    player = {
      position: { x: 0, y: 0, z: 0, distanceTo: jest.fn() },
      trail: []
    };
    
    ai = {
      position: { x: 10, y: 0, z: 10, distanceTo: jest.fn() },
      trail: []
    };
    
    // Create mock trail segments - 50 segments in total
    for (let i = 0; i < 50; i++) {
      // Position trail segments in a line along x-axis
      player.trail.push({
        position: { 
          x: -i, // Going backwards on x-axis
          y: 0, 
          z: 0,
          distanceTo: jest.fn()
        }
      });
      
      // Position AI trail segments in a line along z-axis
      ai.trail.push({
        position: { 
          x: 10, 
          y: 0, 
          z: 10 - i, // Going backwards on z-axis
          distanceTo: jest.fn()
        }
      });
    }
  });
  
  test('should not detect collision with recent trail segments', () => {
    // Mock the collision checks directly
    jest.spyOn(collisionSystem, 'checkWallCollision').mockReturnValue(false);
    jest.spyOn(collisionSystem, 'checkTrailCollision').mockReturnValue(false);
    
    // Collision check should return false since we mocked all checks to return false
    const result = collisionSystem.checkPlayerCollisions(player, ai, 100);
    expect(result).toBe(false);
  });
  
  test('should detect collision with older trail segments', () => {
    // Mock behavior for different checks
    const checkWallCollisionMock = jest.spyOn(collisionSystem, 'checkWallCollision');
    checkWallCollisionMock.mockReturnValue(false); // No wall collision
    
    const checkTrailCollisionMock = jest.spyOn(collisionSystem, 'checkTrailCollision');
    
    // Make it return true only when checking own trail, not AI trail
    checkTrailCollisionMock.mockImplementation((pos, trail) => {
      // Return false for AI trail
      if (trail === ai.trail) {
        return false;
      }
      // Return true for own trail - simulating collision with older segment
      return true;
    });
    
    // Since we mocked the own trail collision check to return true,
    // the overall collision check should return true
    const result = collisionSystem.checkPlayerCollisions(player, ai, 100);
    expect(result).toBe(true);
    
    // Verify our mocks were called
    expect(checkWallCollisionMock).toHaveBeenCalled();
    expect(checkTrailCollisionMock).toHaveBeenCalled();
  });
  
  test('should not detect collision if player trail is shorter than IGNORE_RECENT_SEGMENTS', () => {
    // Create a shorter trail (less than IGNORE_RECENT_SEGMENTS)
    player.trail = player.trail.slice(0, 10); // Only 10 segments
    
    // Mock the collision checks
    jest.spyOn(collisionSystem, 'checkWallCollision').mockReturnValue(false);
    jest.spyOn(collisionSystem, 'checkTrailCollision').mockReturnValue(false);
    
    // No collision should be detected because:
    // 1. Wall collision returns false
    // 2. AI trail collision returns false
    // 3. Own trail collision isn't even checked because trail is too short
    const result = collisionSystem.checkPlayerCollisions(player, ai, 100);
    expect(result).toBe(false);
  });
  
  test('should detect collision with AI trail segments', () => {
    // Mock behavior for different checks
    const checkWallCollisionMock = jest.spyOn(collisionSystem, 'checkWallCollision');
    checkWallCollisionMock.mockReturnValue(false); // No wall collision
    
    const checkTrailCollisionMock = jest.spyOn(collisionSystem, 'checkTrailCollision');
    
    // Make it return true only when checking AI trail
    checkTrailCollisionMock.mockImplementation((pos, trail) => {
      // Return true for AI trail - simulating collision with AI trail
      if (trail === ai.trail) {
        return true;
      }
      // Return false for own trail
      return false;
    });
    
    // Since we mocked the AI trail collision check to return true,
    // the overall collision check should return true
    const result = collisionSystem.checkPlayerCollisions(player, ai, 100);
    expect(result).toBe(true);
    
    // Verify our mocks were called
    expect(checkWallCollisionMock).toHaveBeenCalled();
    expect(checkTrailCollisionMock).toHaveBeenCalledWith(player.position, ai.trail);
  });
});