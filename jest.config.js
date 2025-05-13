export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  moduleFileExtensions: ['js', 'json', 'jsx'],
  transformIgnorePatterns: [
    '/node_modules/(?!three)'
  ],
  moduleNameMapper: {
    '^three/addons/(.*)$': '<rootDir>/node_modules/three/examples/jsm/$1'
  }
};