import * as THREE from 'three';
import { Entity } from './Entity.js';
import { CONFIG } from '../utils/Config.js';

export class AI extends Entity {
  constructor(scene, position) {
    super(scene, position, CONFIG.AI_COLOR);
    this.baseSpeed = CONFIG.BASE_AI_SPEED;
    this.speed = this.baseSpeed;
    this.defaultDirection = new THREE.Vector3(-1, 0, 0); // Initial direction
    this.direction.copy(this.defaultDirection);
  }
  
  update() {
    this.makeDecision();
    super.update();
  }
  
  makeDecision() {
    // Simple AI: try to avoid walls and trails
    const possibleDirections = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, -1)
    ];
    
    // Remove the direction that would be a 180-degree turn
    const oppositeDirection = this.direction.clone().negate();
    possibleDirections.forEach((dir, index) => {
      if (dir.equals(oppositeDirection)) {
        possibleDirections.splice(index, 1);
      }
    });
    
    // Evaluate each direction
    let bestDirection = this.direction.clone();
    let maxDistance = 0;
    
    for (const direction of possibleDirections) {
      const newPosition = this.position.clone().add(direction.clone().multiplyScalar(2));
      
      if (!this.wouldCollide(newPosition)) {
        const distance = this.distanceToNearestObstacle(newPosition);
        if (distance > maxDistance) {
          maxDistance = distance;
          bestDirection = direction;
        }
      }
    }
    
    // Update direction
    this.direction.copy(bestDirection);
  }
  
  // Using a simplified collision check for the decision-making algorithm
  // eslint-disable-next-line no-unused-vars
  wouldCollide(position) {
    // This is a placeholder - actual collision detection
    // will be handled by CollisionSystem
    return false;
  }
  
  // eslint-disable-next-line no-unused-vars
  distanceToNearestObstacle(position) {
    // This is a placeholder - actual implementation
    // would calculate distance to nearest wall or trail
    return Math.random() * 10; // Random for now
  }
  
  setSpeed(speed) {
    this.speed = speed;
  }
  
  reset(position) {
    super.reset(position);
    this.direction.copy(this.defaultDirection);
    this.speed = this.baseSpeed;
  }
}