import * as THREE from 'three';
import { Entity } from './Entity.js';
import { CONFIG } from '../utils/Config.js';

export class AI extends Entity {
  constructor(scene, position, player, collisionSystem) {
    super(scene, position, CONFIG.AI_COLOR);
    this.baseSpeed = CONFIG.BASE_AI_SPEED;
    this.speed = this.baseSpeed;
    this.defaultDirection = new THREE.Vector3(-1, 0, 0); // Initial direction
    this.direction.copy(this.defaultDirection);
    
    // Store references to player and collision system
    this.player = player;
    this.collisionSystem = collisionSystem;
    
    // AI behavior settings
    this.lastDirectionChange = 0;
    this.directionChangeFrequency = 30; // Frames between decision reconsideration
    this.lookAheadDistance = 10; // How far ahead to look for obstacles
    this.aggressiveness = 0.3; // 0-1 scale, higher values make AI try to cut off player
    this.caution = 0.7; // 0-1 scale, higher values make AI more careful
    this.targetingWeight = 0.6; // How much to weight targeting the player vs. open space
    this.frameCount = 0;
    this.personalityType = Math.floor(Math.random() * 3); // 0: cautious, 1: balanced, 2: aggressive
    this.adjustPersonality();
    
    // Use different tactics and behaviors
    this.tactics = {
      current: 'explore', // Start with exploration
      options: ['explore', 'chase', 'cutoff', 'survive'],
      changeTime: 0,
      minDuration: 300 // Minimum frames to use a tactic before considering a change
    };
  }
  
  adjustPersonality() {
    // Apply personality traits based on type
    switch (this.personalityType) {
    case 0: // Cautious
      this.aggressiveness = 0.2;
      this.caution = 0.9;
      this.targetingWeight = 0.3;
      this.directionChangeFrequency = 20;
      this.lookAheadDistance = 15;
      break;
    case 1: // Balanced
      this.aggressiveness = 0.5;
      this.caution = 0.5;
      this.targetingWeight = 0.5;
      this.directionChangeFrequency = 30;
      this.lookAheadDistance = 10;
      break;
    case 2: // Aggressive
      this.aggressiveness = 0.8;
      this.caution = 0.3;
      this.targetingWeight = 0.7;
      this.directionChangeFrequency = 15;
      this.lookAheadDistance = 8;
      break;
    }
  }
  
  update() {
    this.frameCount++;
    
    // Only reconsider direction periodically or when about to hit something
    const shouldMakeDecision = 
      this.frameCount % this.directionChangeFrequency === 0 || 
      this.isImmediateCollisionLikely();
    
    // Update tactics periodically
    if (this.frameCount - this.tactics.changeTime > this.tactics.minDuration) {
      this.updateTactics();
    }
    
    if (shouldMakeDecision) {
      this.makeDecision();
    }
    
    super.update();
  }
  
  updateTactics() {
    // Determine the appropriate tactic based on the game state
    const distanceToPlayer = this.position.distanceTo(this.player.position);
    const spaceAvailable = this.evaluateAvailableSpace();
    const playerCloseToWall = this.isPlayerNearWall();
    
    // Randomly select a new tactic with weighted probabilities based on the game state
    let weights = {
      explore: 0.4,
      chase: 0.3,
      cutoff: 0.2,
      survive: 0.1
    };
    
    // Adjust weights based on game state
    if (distanceToPlayer < 20) {
      // When close to player, consider chasing or cutting off
      weights.chase += 0.2;
      weights.cutoff += 0.3;
      weights.explore -= 0.3;
    }
    
    if (spaceAvailable < 0.3) {
      // When in tight spaces, prioritize survival
      weights.survive += 0.4;
      weights.cutoff -= 0.2;
    }
    
    if (playerCloseToWall) {
      // When player is near a wall, try to cut them off
      weights.cutoff += 0.3;
    }
    
    // Convert weights to probabilities
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    let probabilities = {};
    let cumulativeProbability = 0;
    
    for (const [tactic, weight] of Object.entries(weights)) {
      probabilities[tactic] = weight / totalWeight;
      cumulativeProbability += probabilities[tactic];
      probabilities[tactic] = cumulativeProbability;
    }
    
    // Select a tactic based on the probabilities
    const rand = Math.random();
    for (const [tactic, probability] of Object.entries(probabilities)) {
      if (rand <= probability) {
        this.tactics.current = tactic;
        this.tactics.changeTime = this.frameCount;
        break;
      }
    }
  }
  
  evaluateAvailableSpace() {
    // Check the surrounding area for available space
    let openDirections = 0;
    const directions = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, -1)
    ];
    
    for (const dir of directions) {
      const testPosition = this.position.clone().add(dir.clone().multiplyScalar(this.lookAheadDistance));
      if (!this.wouldCollide(testPosition, CONFIG.ARENA_SIZE)) {
        openDirections++;
      }
    }
    
    return openDirections / directions.length;
  }
  
  isPlayerNearWall() {
    // Check if the player is near a wall
    const margin = 10;
    const halfArenaSize = CONFIG.ARENA_SIZE / 2 - margin;
    
    return (
      Math.abs(this.player.position.x) > halfArenaSize - margin || 
      Math.abs(this.player.position.z) > halfArenaSize - margin
    );
  }
  
  isImmediateCollisionLikely() {
    // Check if AI is about to hit something in the next few moves
    const nearFuturePosition = this.position.clone().add(
      this.direction.clone().multiplyScalar(this.lookAheadDistance * 0.3)
    );
    
    return this.wouldCollide(nearFuturePosition, CONFIG.ARENA_SIZE);
  }
  
  makeDecision() {
    // Get all possible directions (excluding 180-degree turns)
    const possibleDirections = this.getPossibleDirections();
    
    // If no valid directions, keep current direction and hope for the best
    if (possibleDirections.length === 0) {
      return;
    }
    
    // Score each direction based on current tactic
    const scoredDirections = this.scoreDirections(possibleDirections);
    
    // Choose the best direction
    if (scoredDirections.length > 0) {
      // Sort by score (highest first)
      scoredDirections.sort((a, b) => b.score - a.score);
      
      // Sometimes choose a suboptimal move to be less predictable
      let selectedIndex = 0;
      if (scoredDirections.length > 1 && Math.random() < 0.2) {
        // 20% chance to choose the second-best move
        selectedIndex = 1;
      }
      
      // Update direction
      this.direction.copy(scoredDirections[selectedIndex].direction);
    }
  }
  
  getPossibleDirections() {
    // Define the four possible directions
    const possibleDirections = [
      new THREE.Vector3(1, 0, 0),  // Right
      new THREE.Vector3(-1, 0, 0), // Left
      new THREE.Vector3(0, 0, 1),  // Forward
      new THREE.Vector3(0, 0, -1)  // Backward
    ];
    
    // Remove the direction that would be a 180-degree turn
    const oppositeDirection = this.direction.clone().negate();
    return possibleDirections.filter(dir => !dir.equals(oppositeDirection));
  }
  
  scoreDirections(directions) {
    const scoredDirections = [];
    
    // Choose scoring method based on current tactic
    const scoringMethod = this[`score_${this.tactics.current}`] || this.score_explore;
    
    for (const direction of directions) {
      // Check if this direction would lead to an immediate collision
      const testPosition = this.position.clone().add(
        direction.clone().multiplyScalar(Math.max(2, this.speed * 2))
      );
      
      // Skip directions that lead to immediate collisions
      if (this.wouldCollide(testPosition, CONFIG.ARENA_SIZE)) {
        continue;
      }
      
      // Calculate score based on current tactic
      const score = scoringMethod.call(this, direction);
      
      scoredDirections.push({
        direction: direction,
        score: score
      });
    }
    
    return scoredDirections;
  }
  
  // Scoring methods for different tactics
  
  score_explore(direction) {
    // Prefer directions with more open space
    const openSpaceScore = this.calculateOpenSpace(direction) * (1 - this.caution);
    
    // Avoid walls and trails
    const obstacleScore = this.calculateObstacleDistance(direction) * this.caution;
    
    // Random factor for exploration
    const randomFactor = Math.random() * 0.2;
    
    return openSpaceScore + obstacleScore + randomFactor;
  }
  
  score_chase(direction) {
    // Calculate vector to player
    const vectorToPlayer = this.player.position.clone().sub(this.position);
    
    // Prefer directions that move toward the player
    const dotProduct = direction.dot(vectorToPlayer.normalize());
    const playerDirectionScore = Math.max(0, dotProduct) * this.targetingWeight;
    
    // Still consider open space
    const openSpaceScore = this.calculateOpenSpace(direction) * (1 - this.targetingWeight);
    
    return playerDirectionScore + openSpaceScore;
  }
  
  score_cutoff(direction) {
    // Try to predict player's future position
    const playerPosition = this.player.position.clone();
    const playerDirection = this.player.direction.clone();
    
    // Project where the player will be in the near future
    const projectedPlayerPosition = playerPosition.clone().add(
      playerDirection.multiplyScalar(15)
    );
    
    // Calculate vector to projected player position
    const vectorToProjectedPlayer = projectedPlayerPosition.clone().sub(this.position);
    
    // Prefer directions that intercept the player's projected path
    const dotProduct = direction.dot(vectorToProjectedPlayer.normalize());
    const interceptScore = Math.max(0, dotProduct) * this.aggressiveness;
    
    // Still consider open space and obstacles
    const openSpaceScore = this.calculateOpenSpace(direction) * (1 - this.aggressiveness);
    
    return interceptScore + openSpaceScore;
  }
  
  score_survive(direction) {
    // Purely focus on avoiding obstacles and maximizing available space
    const obstacleScore = this.calculateObstacleDistance(direction) * 0.7;
    const openSpaceScore = this.calculateOpenSpace(direction) * 0.3;
    
    // Slightly prefer moving away from the player to get more space
    const vectorToPlayer = this.player.position.clone().sub(this.position);
    const dotProduct = direction.dot(vectorToPlayer.normalize());
    const avoidPlayerScore = Math.max(0, -dotProduct * 0.2);
    
    return obstacleScore + openSpaceScore + avoidPlayerScore;
  }
  
  calculateOpenSpace(direction) {
    let score = 0;
    
    // Look ahead in multiple steps to find the most open path
    for (let distance = 5; distance <= this.lookAheadDistance; distance += 5) {
      const testPosition = this.position.clone().add(
        direction.clone().multiplyScalar(distance)
      );
      
      // Check if this position would collide
      if (this.wouldCollide(testPosition, CONFIG.ARENA_SIZE)) {
        break;
      }
      
      // Add points for each step we can move without collision
      score += 1;
      
      // Extra points for checking lateral space (how wide the corridor is)
      const rightDir = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 1, 0)).normalize();
      const leftDir = rightDir.clone().negate();
      
      // Check width of available space at this distance
      for (let lateralDist = 1; lateralDist <= 5; lateralDist++) {
        const rightPos = testPosition.clone().add(rightDir.clone().multiplyScalar(lateralDist));
        const leftPos = testPosition.clone().add(leftDir.clone().multiplyScalar(lateralDist));
        
        if (!this.wouldCollide(rightPos, CONFIG.ARENA_SIZE)) {
          score += 0.1;
        }
        
        if (!this.wouldCollide(leftPos, CONFIG.ARENA_SIZE)) {
          score += 0.1;
        }
      }
    }
    
    return score / (this.lookAheadDistance / 2); // Normalize
  }
  
  calculateObstacleDistance(direction) {
    // Calculate distance to the nearest obstacle in this direction
    let distance = 0;
    let maxCheckDistance = this.lookAheadDistance * 2;
    
    for (let step = 1; step <= maxCheckDistance; step++) {
      const testPosition = this.position.clone().add(
        direction.clone().multiplyScalar(step)
      );
      
      if (this.wouldCollide(testPosition, CONFIG.ARENA_SIZE)) {
        distance = step;
        break;
      }
    }
    
    // If no collision found, use max distance
    if (distance === 0) {
      distance = maxCheckDistance;
    }
    
    return distance / maxCheckDistance; // Normalize
  }
  
  wouldCollide(position, arenaSize) {
    // Use the collision system to check for potential collisions
    if (!this.collisionSystem) {
      return false;
    }
    
    // Check for wall collisions
    if (this.collisionSystem.wouldCollideWithWall(position, arenaSize)) {
      return true;
    }
    
    // Check for player trail collisions
    if (this.player && this.player.trail && this.player.trail.length > 0) {
      if (this.collisionSystem.wouldCollideWithTrail(position, this.player.trail)) {
        return true;
      }
    }
    
    // Check for own trail collisions (excluding recent segments)
    if (this.trail && this.trail.length > CONFIG.IGNORE_RECENT_SEGMENTS) {
      if (this.collisionSystem.wouldCollideWithTrail(
        position, 
        this.trail.slice(0, -CONFIG.IGNORE_RECENT_SEGMENTS)
      )) {
        return true;
      }
    }
    
    return false;
  }
  
  // Try to target a power-up if one is nearby and reachable
  targetPowerUp(powerUps) {
    if (!powerUps || powerUps.length === 0) {
      return false;
    }
    
    // Find closest power-up
    let closestPowerUp = null;
    let closestDistance = Infinity;
    
    for (const powerUp of powerUps) {
      const distance = this.position.distanceTo(powerUp.position);
      if (distance < closestDistance && distance < 30) { // Only target powerups within reasonable distance
        closestPowerUp = powerUp;
        closestDistance = distance;
      }
    }
    
    if (closestPowerUp) {
      // Calculate direction to the power-up
      const dirToPowerUp = closestPowerUp.position.clone().sub(this.position).normalize();
      
      // Find the cardinal direction closest to the vector toward the power-up
      const possibleDirections = this.getPossibleDirections();
      let bestDir = null;
      let bestDot = -Infinity;
      
      for (const dir of possibleDirections) {
        const dot = dir.dot(dirToPowerUp);
        if (dot > bestDot) {
          bestDot = dot;
          bestDir = dir;
        }
      }
      
      // Check if this direction is safe
      if (bestDir) {
        const testPosition = this.position.clone().add(bestDir.clone().multiplyScalar(5));
        if (!this.wouldCollide(testPosition, CONFIG.ARENA_SIZE)) {
          this.direction.copy(bestDir);
          return true;
        }
      }
    }
    
    return false;
  }
  
  setSpeed(speed) {
    this.speed = speed;
  }
  
  reset(position) {
    super.reset(position);
    this.direction.copy(this.defaultDirection);
    this.speed = this.baseSpeed;
    this.frameCount = 0;
    this.lastDirectionChange = 0;
    
    // Randomize personality for more varied games
    this.personalityType = Math.floor(Math.random() * 3);
    this.adjustPersonality();
    
    // Reset tactics
    this.tactics.current = 'explore';
    this.tactics.changeTime = 0;
  }
}