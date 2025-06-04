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
    const height = options.height || 3;
    const distance = options.distance || 5;
    const lookAhead = options.lookAhead || 10;
    const smoothFactor = (options.smoothing !== undefined) ? options.smoothing : CONFIG.CAMERA_SMOOTHING;
    
    const adjustedPlayerPosition = playerPosition.clone().add(
      playerDirection.clone().multiplyScalar(0.5)
    );
    
    const cameraOffset = new THREE.Vector3(
      -playerDirection.x * distance,
      height,
      -playerDirection.z * distance
    );
    
    if (!this._prevCameraPos) {
      this._prevCameraPos = new THREE.Vector3();
      this._prevCameraPos.copy(adjustedPlayerPosition).add(cameraOffset);
    }
    
    const targetPosition = new THREE.Vector3();
    targetPosition.copy(adjustedPlayerPosition).add(cameraOffset);
    
    this.camera.position.x += (targetPosition.x - this.camera.position.x) * smoothFactor;
    this.camera.position.y += (targetPosition.y - this.camera.position.y) * smoothFactor;
    this.camera.position.z += (targetPosition.z - this.camera.position.z) * smoothFactor;
    
    const lookAtPoint = adjustedPlayerPosition.clone().add(
      playerDirection.clone().multiplyScalar(lookAhead)
    );
    
    this.camera.lookAt(lookAtPoint);
    this._prevCameraPos.copy(this.camera.position);
  }
  
  createExplosion(position) {
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1 + Math.random() * 2;
      const height = (Math.random() - 0.5) * 2;
      
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      velocities.push({
        x: Math.cos(angle) * radius,
        y: height * radius,
        z: Math.sin(angle) * radius
      });

      const distFromCenter = Math.sqrt(radius * radius + height * height);
      const hue = (1.0 - Math.min(distFromCenter / 3.0, 1.0)) * 0.15;
      
      const color = new THREE.Color().setHSL(hue, 1.0, 0.5 + Math.random() * 0.2);
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({ 
      size: 0.5, 
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    const animateExplosion = () => {
      if (!particles || !this.scene.children.includes(particles)) return;
      
      const positions = particles.geometry.attributes.position.array;
      const elapsedTime = particles.userData.frameCount * 0.016;
      
      for (let i = 0; i < particleCount; i++) {
        const velocity = velocities[i];
        const damping = Math.max(0, 1 - elapsedTime * 0.5);
        
        positions[i * 3] += velocity.x * 0.1 * damping;
        positions[i * 3 + 1] += velocity.y * 0.1 * damping + 0.02;
        positions[i * 3 + 2] += velocity.z * 0.1 * damping;
      }
      
      material.opacity = Math.max(0, 1 - elapsedTime * 0.7);
      particles.geometry.attributes.position.needsUpdate = true;

      if (particles.userData.frameCount > 60 || material.opacity <= 0.01) {
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