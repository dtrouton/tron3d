import * as THREE from 'three';
import { CONFIG } from '../utils/Config.js';

export class Entity {
  constructor(scene, position, color) {
    this.scene = scene;
    this.position = new THREE.Vector3().copy(position);
    this.direction = new THREE.Vector3(1, 0, 0);
    this.trail = [];
    this.speed = CONFIG.PLAYER_BASE_SPEED; // Use config value
    this.color = color;
    this.mesh = null;
    this.trailMaterial = null;
    this.framesSinceLastTrail = 0;
    
    this.init();
  }
  
  init() {
    const geometry = new THREE.BoxGeometry(2, 1, 4);
    const material = new THREE.MeshStandardMaterial({ 
      color: this.color,
      emissive: new THREE.Color(this.color).multiplyScalar(0.5),
      metalness: 0.8,
      roughness: 0.2
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
    this.trailMaterial = new THREE.MeshStandardMaterial({ 
      color: this.color, 
      emissive: new THREE.Color(this.color).multiplyScalar(0.5),
      transparent: true, 
      opacity: 0.7 
    });
  }
  
  update() {
    const prevPosition = this.position.clone();
    this.position.add(this.direction.clone().multiplyScalar(this.speed));
    this.mesh.position.copy(this.position);
    
    const movedDistance = this.position.distanceTo(prevPosition);
    this.framesSinceLastTrail++;
    
    let desiredSpacing = CONFIG.TRAIL_SPACING;
    const speedKeys = Object.keys(CONFIG.TRAIL_DENSITY_AT_SPEED).map(Number);
    
    let closestSpeedKey = speedKeys[0];
    let minDiff = Math.abs(this.speed - closestSpeedKey);
    
    for (const speedKey of speedKeys) {
      const diff = Math.abs(this.speed - speedKey);
      if (diff < minDiff) {
        minDiff = diff;
        closestSpeedKey = speedKey;
      }
    }
    
    desiredSpacing = CONFIG.TRAIL_DENSITY_AT_SPEED[closestSpeedKey];
    
    
    const timeBasedCreation = this.framesSinceLastTrail >= CONFIG.TRAIL_FREQUENCY;
    const distanceBasedCreation = movedDistance >= desiredSpacing;
    
    const distanceSinceLastTrail = this.trail.length > 0 ? 
      this.position.distanceTo(this.trail[this.trail.length - 1].position) : 
      CONFIG.TRAIL_MAX_GAP + 1;
    
    const forcedCreation = distanceSinceLastTrail > CONFIG.TRAIL_MAX_GAP;
    
    if ((timeBasedCreation || distanceBasedCreation || forcedCreation) && this.scene && movedDistance > 0.01) {
      this.addTrailSegment(prevPosition);
      this.framesSinceLastTrail = 0;
      
      if (movedDistance > desiredSpacing * 1.5) {
        const segmentCount = Math.ceil(movedDistance / desiredSpacing);
        
        if (segmentCount > 1) {
          for (let i = 1; i < segmentCount; i++) {
            const ratio = i / segmentCount;
            const intermediatePos = new THREE.Vector3().lerpVectors(
              prevPosition, 
              this.position, 
              ratio
            );
            this.addTrailSegment(intermediatePos);
          }
        }
      }
    }
  }
  
  addTrailSegment(position) {
    const segmentSize = CONFIG.TRAIL_SEGMENT_SIZE;
    const trailHeight = CONFIG.TRAIL_HEIGHT;
    
    const geometry = new THREE.BoxGeometry(segmentSize, trailHeight, segmentSize);
    const segment = new THREE.Mesh(geometry, this.trailMaterial.clone());
    
    segment.position.copy(position);
    segment.position.y = trailHeight / 2;
    
    const speedRatio = this.speed / CONFIG.PLAYER_BASE_SPEED;
    
    if (speedRatio > 1.0) {
      const baseColor = new THREE.Color(this.color);
      const emissiveIntensity = Math.min(0.8, 0.3 + (speedRatio - 1) * 0.5);
      
      segment.material.emissive = baseColor.clone().multiplyScalar(emissiveIntensity);
      
      if (speedRatio > 1.2) {
        const streakLength = segmentSize * speedRatio;
        const streakGeometry = new THREE.BoxGeometry(
          streakLength, 
          trailHeight * 0.6, 
          segmentSize * 0.6
        );
        
        const streakMaterial = new THREE.MeshStandardMaterial({
          color: this.color,
          emissive: baseColor.clone().multiplyScalar(emissiveIntensity * 1.2),
          transparent: true,
          opacity: 0.4
        });
        
        const streak = new THREE.Mesh(streakGeometry, streakMaterial);
        
        const directionBack = this.direction.clone().negate();
        const streakOffset = directionBack.clone().multiplyScalar(streakLength / 2);
        
        streak.position.copy(position);
        streak.position.add(streakOffset);
        streak.position.y = trailHeight / 2;
        
        streak.lookAt(position.clone().add(directionBack));
        this.scene.add(streak);
        
        const fadeOutStreak = () => {
          if (!streak || !this.scene.children.includes(streak)) return;
          
          streak.material.opacity -= 0.03;
          
          if (streak.material.opacity <= 0) {
            this.scene.remove(streak);
            if (streak.geometry) streak.geometry.dispose();
            if (streak.material) streak.material.dispose();
          } else {
            requestAnimationFrame(fadeOutStreak);
          }
        };
        
        requestAnimationFrame(fadeOutStreak);
      }
    }
    
    this.scene.add(segment);
    this.trail.push(segment);
    
    if (this.trail.length > CONFIG.MAX_TRAIL_LENGTH) {
      const oldestSegment = this.trail.shift();
      if (oldestSegment && this.scene) {
        this.scene.remove(oldestSegment);
        if (oldestSegment.geometry) {
          oldestSegment.geometry.dispose();
        }
        if (oldestSegment.material) {
          oldestSegment.material.dispose();
        }
      }
    }
  }
  
  reset(position) {
    this.trail.forEach(segment => {
      if (segment && this.scene) {
        this.scene.remove(segment);
        if (segment.geometry) {
          segment.geometry.dispose();
        }
        if (segment.material) {
          segment.material.dispose();
        }
      }
    });
    this.trail = [];
    
    this.position.copy(position);
    this.mesh.position.copy(this.position);
    
    this.direction.set(1, 0, 0);
    this.mesh.rotation.y = Math.atan2(this.direction.x, this.direction.z);
    
    this.framesSinceLastTrail = 0;
  }
  
  getPosition() {
    return this.position.clone();
  }
  
  getDirection() {
    return this.direction.clone();
  }
  
  snapToGrid() {
    this.position.x = Math.round(this.position.x);
    this.position.z = Math.round(this.position.z);
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = Math.atan2(this.direction.x, this.direction.z);
  }
}