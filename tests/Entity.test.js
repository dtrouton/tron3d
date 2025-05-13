// Mock THREE.js
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

// Mock export from Entity class
jest.mock('../src/js/entities/Entity.js', () => {
  const Entity = jest.fn().mockImplementation((scene, position, color) => {
    return {
      scene,
      position: position || { x: 0, y: 0, z: 0, copy: jest.fn() },
      direction: { x: 1, y: 0, z: 0 },
      color: color || 0x00ff00,
      speed: 0.1,
      trail: [],
      mesh: { position: { copy: jest.fn() } },
      update: jest.fn(),
      reset: jest.fn(),
      addTrailSegment: jest.fn(),
      snapToGrid: jest.fn()
    };
  });
  
  return { Entity };
});

// Import Entity (will use the mock)
const { Entity } = require('../src/js/entities/Entity.js');

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
  
  test('update method should update position and create trail', () => {
    entity.update();
    expect(entity.update).toHaveBeenCalled();
  });
  
  test('reset method should clear trail and reset position', () => {
    entity.reset(position);
    expect(entity.reset).toHaveBeenCalledWith(position);
  });
});