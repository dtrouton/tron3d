import * as THREE from 'three';

export class RenderSystem {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
  }
  
  render() {
    this.renderer.render(this.scene, this.camera);
  }
  
  updateCamera(playerPosition, playerDirection) {
    // Position camera behind player
    const cameraOffset = new THREE.Vector3(
      -playerDirection.x * 5, // Distance behind
      3,                      // Height
      -playerDirection.z * 5  // Distance behind
    );
    
    this.camera.position.copy(playerPosition).add(cameraOffset);
    
    // Look ahead of player
    const lookAtPoint = playerPosition.clone().add(
      playerDirection.clone().multiplyScalar(10)
    );
    
    this.camera.lookAt(lookAtPoint);
  }
  
  createExplosion(position) {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = position.x + (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 10;
      
      colors[i * 3] = Math.random();
      colors[i * 3 + 1] = Math.random();
      colors[i * 3 + 2] = Math.random();
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({ size: 0.1, vertexColors: true });
    const particles = new THREE.Points(geometry, material);
    
    this.scene.add(particles);
    
    // Animate explosion
    const animateExplosion = () => {
      const positions = particles.geometry.attributes.position.array;
      
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += (Math.random() - 0.5) * 0.3;
        positions[i * 3 + 1] += (Math.random() - 0.5) * 0.3;
        positions[i * 3 + 2] += (Math.random() - 0.5) * 0.3;
      }
      
      particles.geometry.attributes.position.needsUpdate = true;
      
      if (particles.userData.frameCount > 60) {
        this.scene.remove(particles);
      } else {
        particles.userData.frameCount++;
        requestAnimationFrame(animateExplosion);
      }
    };
    
    particles.userData = { frameCount: 0 };
    animateExplosion();
  }
}