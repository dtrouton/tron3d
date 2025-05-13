import * as THREE from 'three';
import { Entity } from './Entity.js';

export class Player extends Entity {
  constructor(scene, position) {
    super(scene, position, 0x00ff00);
    this.baseSpeed = 0.1;
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
    this.speed = this.baseSpeed * 1.5;
    setTimeout(() => {
      this.speed = this.baseSpeed;
    }, 5000); // 5 second boost
  }
  
  reset(position) {
    super.reset(position);
    this.speed = this.baseSpeed;
  }
}