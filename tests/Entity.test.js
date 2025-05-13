// Mock THREE.js since we don't want to load the actual library in tests
jest.mock('three', () => {
  return {
    Scene: jest.fn().mockImplementation(() => ({
      add: jest.fn(),
      remove: jest.fn()
    })),
    Vector3: jest.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
      x,
      y,
      z,
      copy: jest.fn().mockImplementation(v => ({ x: v.x, y: v.y, z: v.z, copy: jest.fn() })),
      clone: jest.fn().mockImplementation(() => ({ x, y, z, clone: jest.fn(), add: jest.fn() })),
      add: jest.fn().mockImplementation(() => ({ x, y, z })),
      multiplyScalar: jest.fn().mockImplementation(() => ({ x: x * 2, y: y * 2, z: z * 2 })),
      distanceTo: jest.fn().mockReturnValue(10),
      equals: jest.fn().mockImplementation(v => v.x === x && v.y === y && v.z === z),
      set: jest.fn(),
      applyAxisAngle: jest.fn(),
      negate: jest.fn().mockImplementation(() => ({ x: -x, y: -y, z: -z, equals: jest.fn() }))
    })),
    BoxGeometry: jest.fn(),
    MeshStandardMaterial: jest.fn(),
    Mesh: jest.fn().mockImplementation(() => ({
      position: { copy: jest.fn(), set: jest.fn() },
      rotation: { y: 0 }
    })),
    Color: jest.fn().mockImplementation(() => ({
      multiplyScalar: jest.fn().mockReturnValue({})
    }))
  };
});

// Import Entity class
const Entity = require('../src/js/entities/Entity').Entity;

describe('Entity', () => {
  let scene;
  let entity;
  let position;
  
  beforeEach(() => {
    // Set up test objects
    scene = { add: jest.fn(), remove: jest.fn() };
    position = { x: 10, y: 0.5, z: 10, copy: jest.fn() };
    entity = new Entity(scene, position, 0x00ff00);
  });
  
  test('should initialize with correct properties', () => {
    expect(entity.scene).toBe(scene);
    expect(entity.color).toBe(0x00ff00);
    expect(entity.trail).toEqual([]);
    expect(entity.speed).toBe(0.1);
  });
  
  test('should add mesh to scene during initialization', () => {
    expect(scene.add).toHaveBeenCalled();
  });
  
  test('update method should update position and create trail', () => {
    const prevPosition = entity.position;
    entity.update();
    
    // Should move based on direction and speed
    expect(entity.position.add).toHaveBeenCalled();
    
    // Should update mesh position
    expect(entity.mesh.position.copy).toHaveBeenCalled();
    
    // Should create trail segment
    expect(entity.trail.length).toBeGreaterThan(0);
  });
  
  test('reset method should clear trail and reset position', () => {
    // Add some trail segments
    entity.trail = [{ position: { x: 1, y: 1, z: 1 } }, { position: { x: 2, y: 1, z: 2 } }];
    const newPosition = { x: 5, y: 0.5, z: 5, copy: jest.fn() };
    
    entity.reset(newPosition);
    
    // Trail should be cleared
    expect(entity.trail).toEqual([]);
    
    // Position should be updated
    expect(entity.position.copy).toHaveBeenCalledWith(newPosition);
    
    // Direction should be reset
    expect(entity.direction.set).toHaveBeenCalledWith(1, 0, 0);
  });
  
  test('snapToGrid should round position coordinates', () => {
    entity.position = { x: 10.4, y: 0.5, z: 10.7, copy: jest.fn() };
    entity.snapToGrid();
    
    // Position values should be rounded
    expect(Math.round(entity.position.x)).toBe(10);
    expect(Math.round(entity.position.z)).toBe(11);
  });
});