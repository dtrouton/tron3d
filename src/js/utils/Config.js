import * as THREE from 'three';

export const CONFIG = {
  // Arena settings
  ARENA_SIZE: 100,
  
  // Player settings
  PLAYER_START_POSITION: new THREE.Vector3(25, 0.5, 25),
  PLAYER_COLOR: 0x00ff00,
  PLAYER_BASE_SPEED: 0.3, // Increased base speed for more fluid gameplay
  
  // AI settings
  AI_START_POSITION: new THREE.Vector3(-25, 0.5, -25),
  AI_COLOR: 0xff0000,
  BASE_AI_SPEED: 0.3, // Increased to match player speed
  AI_DIFFICULTY_SCALING: 0.15, // How much to increase AI capabilities per difficulty level
  AI_PERSONALITY_SWITCH_CHANCE: 0.3, // Chance to switch personality mid-game for unpredictability
  AI_POWERUP_AWARENESS: 0.7, // How aware AI is of power-ups (0-1)
  
  // Trail settings
  MAX_TRAIL_LENGTH: 300, // Reduced to improve performance
  TRAIL_FREQUENCY: 1,  // Every frame to create a more continuous trail
  TRAIL_SPACING: 0.5,  // Minimum distance between trail segments (in world units)
  TRAIL_MAX_GAP: 1.0,  // Maximum allowed gap between segments
  TRAIL_DENSITY_AT_SPEED: { // Trail density adjustment based on speed
    0.3: 0.5,  // At base speed, create trails every 0.5 units
    0.45: 0.6, // At boosted speed, adjust spacing slightly
    0.6: 0.8   // At high speeds, allow slightly more spacing
  },
  IGNORE_RECENT_SEGMENTS: 20,  // Ignore recent segments for collision
  TRAIL_SEGMENT_SIZE: 1.0,     // Increased trail size to be more visible
  TRAIL_HEIGHT: 0.8,           // Height of trail segments
  COLLISION_THRESHOLD: 1.2,    // Adjusted collision threshold for larger trail
  
  // Game settings
  DIFFICULTY_INCREASE_INTERVAL: 600,  // Frames between difficulty increases
  POWER_UP_SPAWN_INTERVAL: 300,  // Frames between power-up spawns
  POWER_UP_DURATION: 5000,  // Power-up effect duration in ms
  SPEED_BOOST_MULTIPLIER: 1.5,  // How much faster when boosted
  
  // Camera settings
  CAMERA_HEIGHT: 5,           // Raised camera height for better view
  CAMERA_DISTANCE: 8,         // Increased camera distance
  LOOK_AHEAD_DISTANCE: 15,    // Increased look-ahead distance
  CAMERA_SMOOTHING: 0.1       // Camera smoothing factor (0-1, lower = smoother)
};