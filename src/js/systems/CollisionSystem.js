import { CONFIG } from '../utils/Config.js';

export class CollisionSystem {
  constructor() {
    // Using the config value for IGNORE_RECENT_SEGMENTS
    this.IGNORE_RECENT_SEGMENTS = CONFIG.IGNORE_RECENT_SEGMENTS;
  }
  
  checkPlayerCollisions(player, ai, arenaSize) {
    // Check collision with walls
    if (this.checkWallCollision(player.position, arenaSize)) {
      return true;
    }
    
    // Check collision with AI trail
    if (this.checkTrailCollision(player.position, ai.trail)) {
      return true;
    }
    
    // Check collision with own trail (excluding recent segments)
    // Note: We slice from beginning of array up to (trail length - IGNORE_RECENT_SEGMENTS)
    // This ensures we don't check collision with the most recent segments
    if (player.trail.length > this.IGNORE_RECENT_SEGMENTS) {
      if (this.checkTrailCollision(player.position, player.trail.slice(0, -this.IGNORE_RECENT_SEGMENTS))) {
        return true;
      }
    }
    
    return false;
  }
  
  checkAICollisions(ai, player, arenaSize) {
    // Check collision with walls
    if (this.checkWallCollision(ai.position, arenaSize)) {
      return true;
    }
    
    // Check collision with player trail
    if (this.checkTrailCollision(ai.position, player.trail)) {
      return true;
    }
    
    // Check collision with own trail (excluding recent segments)
    if (ai.trail.length > this.IGNORE_RECENT_SEGMENTS) {
      if (this.checkTrailCollision(ai.position, ai.trail.slice(0, -this.IGNORE_RECENT_SEGMENTS))) {
        return true;
      }
    }
    
    return false;
  }
  
  checkWallCollision(position, arenaSize) {
    const margin = 1; // Safety margin
    const halfArenaSize = arenaSize / 2 - margin;
    
    return (
      Math.abs(position.x) > halfArenaSize || 
      Math.abs(position.z) > halfArenaSize
    );
  }
  
  checkTrailCollision(position, trail) {
    if (!trail || trail.length <= 3) return false; // Ignore if trail is too short
    
    // Use the config collision threshold
    const collisionThreshold = CONFIG.COLLISION_THRESHOLD;
    
    for (let i = 0; i < trail.length; i++) {
      if (position.distanceTo(trail[i].position) < collisionThreshold) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Utility method for AI to check if a potential move would result in collision
   */
  wouldCollideWithWall(position, arenaSize) {
    return this.checkWallCollision(position, arenaSize);
  }
  
  wouldCollideWithTrail(position, trail) {
    return this.checkTrailCollision(position, trail);
  }
}