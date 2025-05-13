import * as THREE from 'three';

export const CONFIG = {
  // Arena settings
  ARENA_SIZE: 100,
  
  // Player settings
  PLAYER_START_POSITION: new THREE.Vector3(25, 0.5, 25),
  PLAYER_COLOR: 0x00ff00,
  PLAYER_BASE_SPEED: 0.1,
  
  // AI settings
  AI_START_POSITION: new THREE.Vector3(-25, 0.5, -25),
  AI_COLOR: 0xff0000,
  BASE_AI_SPEED: 0.1,
  
  // Trail settings
  MAX_TRAIL_LENGTH: 500,
  TRAIL_FREQUENCY: 3,  // Add a trail segment every N frames
  IGNORE_RECENT_SEGMENTS: 5,  // Ignore this many recent segments for collision
  
  // Game settings
  DIFFICULTY_INCREASE_INTERVAL: 600,  // Frames between difficulty increases
  POWER_UP_SPAWN_INTERVAL: 300,  // Frames between power-up spawns
  POWER_UP_DURATION: 5000,  // Power-up effect duration in ms
  SPEED_BOOST_MULTIPLIER: 1.5,  // How much faster when boosted
  
  // Camera settings
  CAMERA_HEIGHT: 3,
  CAMERA_DISTANCE: 5,
  LOOK_AHEAD_DISTANCE: 10
};