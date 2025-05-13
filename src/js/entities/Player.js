import * as THREE from 'three';
import { Entity } from './Entity.js';
import { CONFIG } from '../utils/Config.js';

export class Player extends Entity {
  constructor(scene, position) {
    super(scene, position, CONFIG.PLAYER_COLOR);
    this.baseSpeed = CONFIG.PLAYER_BASE_SPEED;
    this.speed = this.baseSpeed;
  }
  
  turnLeft() {
    this.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
    this.snapToGrid();
  }
  
  turnRight() {
    this.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
    this.snapToGrid();
  }
  
  applySpeedBoost() {
    this.speed = this.baseSpeed * CONFIG.SPEED_BOOST_MULTIPLIER;
    
    // Visual indication of speed boost
    if (this.mesh && this.mesh.material) {
      const originalColor = this.mesh.material.color.clone();
      const originalEmissive = this.mesh.material.emissive.clone();
      
      // Make player glow when boosted
      this.mesh.material.emissive.set(0x00ffff);
      this.mesh.material.color.set(0x00ffff);
      
      setTimeout(() => {
        this.speed = this.baseSpeed;
        // Restore original colors
        if (this.mesh && this.mesh.material) {
          this.mesh.material.color.copy(originalColor);
          this.mesh.material.emissive.copy(originalEmissive);
        }
      }, CONFIG.POWER_UP_DURATION);
    } else {
      setTimeout(() => {
        this.speed = this.baseSpeed;
      }, CONFIG.POWER_UP_DURATION);
    }
  }
  
  reset(position) {
    super.reset(position);
    this.speed = this.baseSpeed;
  }
}