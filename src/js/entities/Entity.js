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
    // Create mesh
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
    
    // Create trail material
    this.trailMaterial = new THREE.MeshStandardMaterial({ 
      color: this.color, 
      emissive: new THREE.Color(this.color).multiplyScalar(0.5),
      transparent: true, 
      opacity: 0.7 
    });
  }
  
  update() {
    // Store previous position before movement
    const prevPosition = this.position.clone();
    
    // Move in current direction with current speed
    this.position.add(this.direction.clone().multiplyScalar(this.speed));
    
    // Update mesh position
    this.mesh.position.copy(this.position);
    
    // Calculate moved distance
    const movedDistance = this.position.distanceTo(prevPosition);
    
    // Trail creation logic with both time and distance considerations
    this.framesSinceLastTrail++;
    
    // Calculate desired trail spacing based on current speed
    let desiredSpacing = CONFIG.TRAIL_SPACING;
    
    // Dynamic trail spacing based on speed
    // Find the closest speed in the CONFIG.TRAIL_DENSITY_AT_SPEED object
    const speedKeys = Object.keys(CONFIG.TRAIL_DENSITY_AT_SPEED).map(Number);
    
    // Find the closest speed key to current speed
    let closestSpeedKey = speedKeys[0];
    let minDiff = Math.abs(this.speed - closestSpeedKey);
    
    for (const speedKey of speedKeys) {
      const diff = Math.abs(this.speed - speedKey);
      if (diff < minDiff) {
        minDiff = diff;
        closestSpeedKey = speedKey;
      }
    }
    
    // Use the trail spacing for the closest speed
    desiredSpacing = CONFIG.TRAIL_DENSITY_AT_SPEED[closestSpeedKey];
    
    // Calculate visual speed factor - this maintains consistent visual density at all speeds
    const visualSpeedFactor = this.speed / CONFIG.PLAYER_BASE_SPEED;
    
    // Create trails based on either time frequency or scaled distance
    const timeBasedCreation = this.framesSinceLastTrail >= CONFIG.TRAIL_FREQUENCY;
    const distanceBasedCreation = movedDistance >= desiredSpacing;
    
    // Distance since last trail segment
    const distanceSinceLastTrail = this.trail.length > 0 ? 
      this.position.distanceTo(this.trail[this.trail.length - 1].position) : 
      CONFIG.TRAIL_MAX_GAP + 1; // Ensure we create a trail on first update
    
    // Force trail creation if we've moved too far without creating a segment
    const forcedCreation = distanceSinceLastTrail > CONFIG.TRAIL_MAX_GAP;
    
    // If any condition is met, we create a trail segment
    if ((timeBasedCreation || distanceBasedCreation || forcedCreation) && this.scene && movedDistance > 0.01) {
      // Only add trail segment if we've moved a significant distance
      this.addTrailSegment(prevPosition);
      this.framesSinceLastTrail = 0;
      
      // For high speeds, fill gaps with intermediate trail segments
      if (movedDistance > desiredSpacing * 1.5) {
        // Adjust segment count based on speed to maintain visual consistency
        // Higher speeds need more intermediate segments to look consistent
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
    // Use the segment size from config
    const segmentSize = CONFIG.TRAIL_SEGMENT_SIZE;
    const trailHeight = CONFIG.TRAIL_HEIGHT;
    
    // Create trail segment with proper dimensions
    const geometry = new THREE.BoxGeometry(segmentSize, trailHeight, segmentSize);
    const segment = new THREE.Mesh(geometry, this.trailMaterial.clone());
    
    // Position the segment slightly above the ground
    segment.position.copy(position);
    segment.position.y = trailHeight / 2; // Center vertically
    
    // Add visual effects based on speed
    const speedRatio = this.speed / CONFIG.PLAYER_BASE_SPEED;
    
    // For higher speeds, make the trail more vibrant and emissive
    if (speedRatio > 1.0) {
      // Create a copy of the color with increased intensity
      const baseColor = new THREE.Color(this.color);
      const emissiveIntensity = Math.min(0.8, 0.3 + (speedRatio - 1) * 0.5);
      
      // Adjust material properties based on speed
      segment.material.emissive = baseColor.clone().multiplyScalar(emissiveIntensity);
      
      // Add speed streaks effect
      if (speedRatio > 1.2) {
        // Create a streak "tail" behind the segment in the opposite direction of movement
        const streakLength = segmentSize * speedRatio;
        const streakGeometry = new THREE.BoxGeometry(
          streakLength, 
          trailHeight * 0.6, 
          segmentSize * 0.6
        );
        
        // Create a material that fades out
        const streakMaterial = new THREE.MeshStandardMaterial({
          color: this.color,
          emissive: baseColor.clone().multiplyScalar(emissiveIntensity * 1.2),
          transparent: true,
          opacity: 0.4
        });
        
        const streak = new THREE.Mesh(streakGeometry, streakMaterial);
        
        // Position the streak behind the segment
        const directionBack = this.direction.clone().negate();
        const streakOffset = directionBack.clone().multiplyScalar(streakLength / 2);
        
        streak.position.copy(position);
        streak.position.add(streakOffset);
        streak.position.y = trailHeight / 2;
        
        // Rotate the streak to align with direction
        streak.lookAt(position.clone().add(directionBack));
        
        this.scene.add(streak);
        
        // Animate the streak to fade out
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
    
    // Limit trail length to improve performance
    if (this.trail.length > CONFIG.MAX_TRAIL_LENGTH) {
      const oldestSegment = this.trail.shift();
      if (oldestSegment && this.scene) {
        this.scene.remove(oldestSegment);
        // Help garbage collection
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
    // Clear trail
    this.trail.forEach(segment => {
      if (segment && this.scene) {
        this.scene.remove(segment);
        // Help garbage collection
        if (segment.geometry) {
          segment.geometry.dispose();
        }
        if (segment.material) {
          segment.material.dispose();
        }
      }
    });
    this.trail = [];
    
    // Reset position
    this.position.copy(position);
    this.mesh.position.copy(this.position);
    
    // Reset direction
    this.direction.set(1, 0, 0);
    this.mesh.rotation.y = Math.atan2(this.direction.x, this.direction.z);
    
    // Reset trail counter
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