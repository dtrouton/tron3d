import * as THREE from 'three';

export class Entity {
  constructor(scene, position, color) {
    this.scene = scene;
    this.position = new THREE.Vector3().copy(position);
    this.direction = new THREE.Vector3(1, 0, 0);
    this.trail = [];
    this.speed = 0.1;
    this.color = color;
    this.mesh = null;
    this.trailMaterial = null;
    
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
    const prevPosition = this.position.clone();
    this.position.add(this.direction.clone().multiplyScalar(this.speed));
    
    // Update mesh position
    this.mesh.position.copy(this.position);
    
    // Add trail segment
    if (this.scene && this.position.distanceTo(prevPosition) > 0.01) {
      this.addTrailSegment(prevPosition);
    }
  }
  
  addTrailSegment(position) {
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const segment = new THREE.Mesh(geometry, this.trailMaterial);
    segment.position.copy(position);
    this.scene.add(segment);
    this.trail.push(segment);
    
    // Limit trail length
    const maxTrailLength = 500;
    if (this.trail.length > maxTrailLength) {
      const oldestSegment = this.trail.shift();
      this.scene.remove(oldestSegment);
    }
  }
  
  reset(position) {
    // Clear trail
    this.trail.forEach(segment => this.scene.remove(segment));
    this.trail = [];
    
    // Reset position
    this.position.copy(position);
    this.mesh.position.copy(this.position);
    
    // Reset direction
    this.direction.set(1, 0, 0);
    this.mesh.rotation.y = Math.atan2(this.direction.x, this.direction.z);
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