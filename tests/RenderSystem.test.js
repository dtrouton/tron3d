import { RenderSystem } from '../src/js/systems/RenderSystem.js';

jest.mock('three', () => ({
  Vector3: jest.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
    x, y, z,
    copy: jest.fn().mockReturnThis(),
    clone: jest.fn().mockReturnValue({
      x, y, z,
      add: jest.fn().mockReturnThis(),
      multiplyScalar: jest.fn().mockReturnThis(),
      clone: jest.fn().mockReturnThis()
    }),
    add: jest.fn().mockReturnThis(),
    multiplyScalar: jest.fn().mockReturnThis()
  })),
  BufferGeometry: jest.fn().mockImplementation(() => ({
    setAttribute: jest.fn(),
    attributes: {
      position: { needsUpdate: false }
    },
    dispose: jest.fn()
  })),
  BufferAttribute: jest.fn(),
  PointsMaterial: jest.fn().mockImplementation(() => ({
    opacity: 1.0,
    dispose: jest.fn()
  })),
  Points: jest.fn().mockImplementation((geometry, material) => ({
    geometry,
    material,
    userData: {},
    position: { copy: jest.fn() }
  })),
  Color: jest.fn().mockImplementation(() => ({
    setHSL: jest.fn().mockReturnThis(),
    r: 1,
    g: 0,
    b: 0
  })),
  AdditiveBlending: 'AdditiveBlending'
}));

jest.mock('../src/js/utils/Config.js', () => ({
  CONFIG: {
    CAMERA_SMOOTHING: 0.1
  }
}));

describe('RenderSystem', () => {
  let renderSystem;
  let mockScene;
  let mockCamera;
  let mockRenderer;

  beforeEach(() => {
    mockScene = {
      add: jest.fn(),
      remove: jest.fn(),
      children: []
    };

    mockCamera = {
      position: { x: 0, y: 0, z: 0 },
      lookAt: jest.fn()
    };

    mockRenderer = {
      render: jest.fn()
    };

    renderSystem = new RenderSystem(mockScene, mockCamera, mockRenderer);
  });

  describe('initialization', () => {
    test('should initialize with scene, camera, and renderer', () => {
      expect(renderSystem.scene).toBe(mockScene);
      expect(renderSystem.camera).toBe(mockCamera);
      expect(renderSystem.renderer).toBe(mockRenderer);
    });
  });

  describe('render', () => {
    test('should call renderer.render with scene and camera', () => {
      renderSystem.render();
      
      expect(mockRenderer.render).toHaveBeenCalledWith(mockScene, mockCamera);
    });
  });

  describe('camera updates', () => {
    test('should update camera position based on player', () => {
      const playerPosition = { 
        clone: jest.fn().mockReturnValue({ 
          add: jest.fn().mockReturnThis(),
          clone: jest.fn().mockReturnThis()
        }) 
      };
      const playerDirection = { 
        clone: jest.fn().mockReturnValue({ 
          multiplyScalar: jest.fn().mockReturnThis(),
          clone: jest.fn().mockReturnThis()
        }) 
      };
      
      renderSystem.updateCamera(playerPosition, playerDirection);
      
      expect(mockCamera.lookAt).toHaveBeenCalled();
    });

    test('should use provided options for camera settings', () => {
      const playerPosition = { 
        clone: jest.fn().mockReturnValue({ 
          add: jest.fn().mockReturnThis(),
          clone: jest.fn().mockReturnThis()
        }) 
      };
      const playerDirection = { 
        clone: jest.fn().mockReturnValue({ 
          multiplyScalar: jest.fn().mockReturnThis(),
          clone: jest.fn().mockReturnThis()
        }) 
      };
      const options = { height: 10, distance: 15, lookAhead: 20 };
      
      renderSystem.updateCamera(playerPosition, playerDirection, options);
      
      expect(mockCamera.lookAt).toHaveBeenCalled();
    });
  });

  describe('explosion effects', () => {
    test('should create explosion with particles', () => {
      const position = { x: 10, y: 5, z: 15 };
      
      renderSystem.createExplosion(position);
      
      expect(mockScene.add).toHaveBeenCalled();
    });
  });
});