import * as THREE from 'three';
import { CONFIG } from '../utils/Config.js';

export class RenderSystem {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
  }
  
  render() {
    this.renderer.render(this.scene, this.camera);
  }
  
  updateCamera(playerPosition, playerDirection, options = {}) {
    // Get camera settings from options or use defaults
    const height = options.height || 3;
    const distance = options.distance || 5;
    const lookAhead = options.lookAhead || 10;
    const smoothFactor = (options.smoothing !== undefined) ? options.smoothing : CONFIG.CAMERA_SMOOTHING;
    
    // For faster player movement, we adjust the camera to look slightly ahead
    // This creates a better sense of where the player is going
    const adjustedPlayerPosition = playerPosition.clone().add(
      playerDirection.clone().multiplyScalar(0.5)
    );
    
    // Position camera behind player with improved values
    const cameraOffset = new THREE.Vector3(
      -playerDirection.x * distance, // Distance behind
      height,                        // Height above
      -playerDirection.z * distance  // Distance behind
    );
    
    // Smooth camera movement using damping/interpolation
    // This creates a more fluid camera that doesn't jerk around with the player
    if (!this._prevCameraPos) {
      this._prevCameraPos = new THREE.Vector3();
      this._prevCameraPos.copy(adjustedPlayerPosition).add(cameraOffset);
    }
    
    // Calculate new camera position
    const targetPosition = new THREE.Vector3();
    targetPosition.copy(adjustedPlayerPosition).add(cameraOffset);
    
    // Apply smoothing - interpolate between old and new positions
    // Adjust smoothing based on speed - faster movement = less smoothing
    // This prevents the camera from lagging too far behind at high speeds
    this.camera.position.x += (targetPosition.x - this.camera.position.x) * smoothFactor;
    this.camera.position.y += (targetPosition.y - this.camera.position.y) * smoothFactor;
    this.camera.position.z += (targetPosition.z - this.camera.position.z) * smoothFactor;
    
    // Look ahead of player - further ahead for faster movement
    // This gives better anticipation of turns
    const lookAtPoint = adjustedPlayerPosition.clone().add(
      playerDirection.clone().multiplyScalar(lookAhead)
    );
    
    this.camera.lookAt(lookAtPoint);
    
    // Store current camera position for next frame's interpolation
    this._prevCameraPos.copy(this.camera.position);
  }
  
  createExplosion(position) {
    // Improved explosion with better performance and visuals
    const particleCount = 500; // Reduced for better performance
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = []; // Store particle velocities

    // Set initial particle positions and colors
    for (let i = 0; i < particleCount; i++) {
      // Random position within a sphere
      const angle = Math.random() * Math.PI * 2;
      const radius = 1 + Math.random() * 2;
      const height = (Math.random() - 0.5) * 2;
      
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      // Create velocities for particles (will be applied during animation)
      velocities.push({
        x: Math.cos(angle) * radius,
        y: height * radius,
        z: Math.sin(angle) * radius
      });

      // Colors based on position in explosion (center is more yellow/white, edges are red/orange)
      const distFromCenter = Math.sqrt(radius * radius + height * height);
      const hue = (1.0 - Math.min(distFromCenter / 3.0, 1.0)) * 0.15; // 0.0 to 0.15 (red to yellow)
      
      const color = new THREE.Color().setHSL(hue, 1.0, 0.5 + Math.random() * 0.2);
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Create explosion shader material for better looking particles
    const material = new THREE.PointsMaterial({ 
      size: 0.5, 
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending // Makes particles blend together for a better effect
    });
    
    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    // Animate explosion with physics
    const animateExplosion = () => {
      if (!particles || !this.scene.children.includes(particles)) return;
      
      const positions = particles.geometry.attributes.position.array;
      const elapsedTime = particles.userData.frameCount * 0.016; // Approx. time in seconds
      
      // Update particle positions based on velocities and time
      for (let i = 0; i < particleCount; i++) {
        // Apply velocity with some damping over time
        const velocity = velocities[i];
        const damping = Math.max(0, 1 - elapsedTime * 0.5); // Gradually slow down
        
        positions[i * 3] += velocity.x * 0.1 * damping;
        positions[i * 3 + 1] += velocity.y * 0.1 * damping + 0.02; // Add slight upward force
        positions[i * 3 + 2] += velocity.z * 0.1 * damping;
      }
      
      // Fade out the particles over time
      material.opacity = Math.max(0, 1 - elapsedTime * 0.7);
      
      // Update the geometry
      particles.geometry.attributes.position.needsUpdate = true;

      // Continue animation until faded out
      if (particles.userData.frameCount > 60 || material.opacity <= 0.01) {
        // Clean up resources
        this.scene.remove(particles);
        geometry.dispose();
        material.dispose();
      } else {
        particles.userData.frameCount++;
        requestAnimationFrame(animateExplosion);
      }
    };

    particles.userData = { frameCount: 0 };
    animateExplosion();
  }
}