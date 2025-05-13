// Mock for THREE.js

const createThreeMock = () => {
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
    })),
    PerspectiveCamera: jest.fn(),
    WebGLRenderer: jest.fn().mockImplementation(() => ({
      setSize: jest.fn(),
      setPixelRatio: jest.fn(),
      render: jest.fn()
    })),
    GridHelper: jest.fn(),
    PlaneGeometry: jest.fn(),
    PointsMaterial: jest.fn(),
    Points: jest.fn(),
    BufferGeometry: jest.fn().mockImplementation(() => ({
      setAttribute: jest.fn()
    })),
    BufferAttribute: jest.fn(),
    AmbientLight: jest.fn(),
    DirectionalLight: jest.fn(),
    PointLight: jest.fn(),
    RectAreaLight: jest.fn(),
    SphereGeometry: jest.fn()
  };
};

// Export the mock for use in tests
export const threeMock = createThreeMock();