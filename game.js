import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

// Game setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Enhance renderer
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;

// Game state
const arenaSize = 100;
let playerDirection = new THREE.Vector3(1, 0, 0);
let aiDirection = new THREE.Vector3(-1, 0, 0);
const speed = 0.4;
let playerTrail = [];
let aiTrail = [];
const maxTrailLength = 500;
let gameOver = false;
let score = 0;
let gameStarted = false;
let gameTime = 0;
let powerUps = [];
let difficulty = 1;
let baseAiSpeed = 0.1; // Adjust this value as needed
let aiSpeed = baseAiSpeed;
let playerSpeed = 0.1; // Adjust this value as needed
let frameCount = 0;
let animationFrameId;

// Arena setup
const gridHelper = new THREE.GridHelper(arenaSize, arenaSize);
scene.add(gridHelper);

// Add walls
function createWalls() {
    const wallHeight = 1; // Match the height of the bikes
    const wallThickness = 0.5; // Thickness of the wall

    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x0088ff,
        emissive: 0x0044aa,
        metalness: 0.8,
        roughness: 0.2
    });

    // Create four walls
    const walls = [
        // North wall
        { size: [arenaSize, wallHeight, wallThickness], position: [0, wallHeight / 2, arenaSize / 2] },
        // South wall
        { size: [arenaSize, wallHeight, wallThickness], position: [0, wallHeight / 2, -arenaSize / 2] },
        // East wall
        { size: [wallThickness, wallHeight, arenaSize], position: [arenaSize / 2, wallHeight / 2, 0] },
        // West wall
        { size: [wallThickness, wallHeight, arenaSize], position: [-arenaSize / 2, wallHeight / 2, 0] }
    ];

    walls.forEach(wall => {
        const wallGeometry = new THREE.BoxGeometry(...wall.size);
        const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
        wallMesh.position.set(...wall.position);
        scene.add(wallMesh);
    });

    // Add a floor (optional, but can improve visual reference)
    const floorGeometry = new THREE.PlaneGeometry(arenaSize, arenaSize);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x001a33,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Add ceiling glow (optional, for atmosphere)
    const ceilingLight = new THREE.RectAreaLight(0x0088ff, 1, arenaSize, arenaSize);
    ceilingLight.position.set(0, 10, 0);
    ceilingLight.rotation.x = Math.PI;
    scene.add(ceilingLight);
}

createWalls();

// Light cycle setup
const cycleGeometry = new THREE.BoxGeometry(2, 1, 4);
const playerMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x00ff00,
    emissive: 0x008800,
    metalness: 0.8,
    roughness: 0.2
});
const aiMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff0000,
    emissive: 0x880000,
    metalness: 0.8,
    roughness: 0.2
});
const playerCycle = new THREE.Mesh(cycleGeometry, playerMaterial);
const aiCycle = new THREE.Mesh(cycleGeometry, aiMaterial);

playerCycle.position.set(arenaSize / 4, 0.5, arenaSize / 4);
aiCycle.position.set(-arenaSize / 4, 0.5, -arenaSize / 4);

// Set initial orientation for player's bike
playerCycle.rotation.y = Math.atan2(playerDirection.x, playerDirection.z);

scene.add(playerCycle);
scene.add(aiCycle);

// Light trail setup
const trailGeometry = new THREE.BoxGeometry(0.5, 1, 0.5); // Doubled the height to 1
const playerTrailMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x00ff00, 
    emissive: 0x008800,
    transparent: true, 
    opacity: 0.7 
});
const aiTrailMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff0000, 
    emissive: 0x880000,
    transparent: true, 
    opacity: 0.7 
});

// Controls
document.addEventListener('keydown', (event) => {
    if (gameOver) return;
    switch(event.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            turnLeft();
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            turnRight();
            break;
    }
});

function turnLeft() {
    playerDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
    snapToGrid(playerCycle, playerDirection);
}

function turnRight() {
    playerDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
    snapToGrid(playerCycle, playerDirection);
}

function snapToGrid(cycle, direction) {
    cycle.position.x = Math.round(cycle.position.x);
    cycle.position.z = Math.round(cycle.position.z);
    cycle.rotation.y = Math.atan2(direction.x, direction.z);
}

// Trail creation
function createTrailSegment(position, material) {
    const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5); // Larger trail segments
    const segment = new THREE.Mesh(geometry, material);
    segment.position.copy(position);
    scene.add(segment);
    return segment;
}

// AI movement
function moveAI() {
    // Simple AI: try to avoid walls and trails
    const possibleDirections = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, -1)
    ];

    let bestDirection = aiDirection.clone();
    let maxDistance = 0;

    possibleDirections.forEach(direction => {
        const newPosition = aiCycle.position.clone().add(direction.multiplyScalar(2)); // Look 2 units ahead
        if (!checkWallCollision(newPosition) && !checkCollision(newPosition, playerTrail) && !checkCollision(newPosition, aiTrail)) {
            const distanceToWall = distanceToNearestWall(newPosition);
            if (distanceToWall > maxDistance) {
                maxDistance = distanceToWall;
                bestDirection = direction;
            }
        }
    });

    aiDirection.copy(bestDirection);
    aiCycle.position.add(aiDirection.clone().multiplyScalar(aiSpeed));
}

function distanceToNearestWall(position) {
    const halfArena = arenaSize / 2;
    return Math.min(
        Math.abs(halfArena - position.x),
        Math.abs(-halfArena - position.x),
        Math.abs(halfArena - position.z),
        Math.abs(-halfArena - position.z)
    );
}

function checkWallCollision(position) {
    const margin = 1; // Add a safety margin
    const halfArenaSize = arenaSize / 2 - margin;
    return Math.abs(position.x) > halfArenaSize || Math.abs(position.z) > halfArenaSize;
}

// Collision detection
function checkCollision(position, trail) {
    for (let i = 0; i < trail.length - IGNORE_RECENT_SEGMENTS; i++) {
        const segment = trail[i];
        if (position.distanceTo(segment.position) < 0.75) { // Increased threshold
            return true;
        }
    }
    return false;
}

function endGame(message) {
    gameOver = true;
    gameStarted = false;

    // Show game over message
    const gameOverScreen = document.getElementById('gameOverScreen');
    const winnerText = document.getElementById('winnerText');
    winnerText.textContent = message;
    gameOverScreen.style.display = 'flex';

    // Show start screen after a delay
    setTimeout(() => {
        gameOverScreen.style.display = 'none';
        document.getElementById('startScreen').style.display = 'flex';
    }, 3000);

    // Stop the animation loop
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
}

// Add explosion effect
function createExplosion(position) {
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

    scene.add(particles);

    // Animate explosion
    function animateExplosion() {
        const positions = particles.geometry.attributes.position.array;

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] += (Math.random() - 0.5) * 0.3;
            positions[i * 3 + 1] += (Math.random() - 0.5) * 0.3;
            positions[i * 3 + 2] += (Math.random() - 0.5) * 0.3;
        }

        particles.geometry.attributes.position.needsUpdate = true;

        if (!gameOver) {
            scene.remove(particles);
        } else {
            requestAnimationFrame(animateExplosion);
        }
    }

    animateExplosion();
}

// Add this new function to reset the game
function resetGame() {
    // Reset positions
    playerCycle.position.set(arenaSize / 4, 0.5, arenaSize / 4);
    aiCycle.position.set(-arenaSize / 4, 0.5, -arenaSize / 4);

    // Reset directions
    playerDirection.set(1, 0, 0);
    aiDirection.set(-1, 0, 0);

    // Reset orientations
    playerCycle.rotation.y = Math.atan2(playerDirection.x, playerDirection.z);
    aiCycle.rotation.y = Math.atan2(aiDirection.x, aiDirection.z);

    // Clear trails
    playerTrail.forEach(segment => scene.remove(segment));
    aiTrail.forEach(segment => scene.remove(segment));
    playerTrail = [];
    aiTrail = [];

    // Reset colors with new materials
    playerCycle.material = new THREE.MeshStandardMaterial({ 
        color: 0x00ff00,
        emissive: 0x008800,
        metalness: 0.8,
        roughness: 0.2
    });
    aiCycle.material = new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        emissive: 0x880000,
        metalness: 0.8,
        roughness: 0.2
    });

    // Hide game over screen
    document.getElementById('gameOverScreen').style.display = 'none';

    // Reset game state
    gameOver = false;
    score = 0;
    const scoreDisplay = document.getElementById('scoreDisplay');
    if (scoreDisplay) {
        scoreDisplay.textContent = 'Score: 0';
    }

    gameStarted = false;
    gameTime = 0;

    // Delay game start
    setTimeout(startGame, 1000);  // Start game after 1 second
}

// Add event listener for space bar to restart the game
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && gameOver) {
        resetGame();
    }
});

const TRAIL_FREQUENCY = 3; // Add a trail segment every 3 frames

function update() {
    if (gameOver || !gameStarted) return;

    gameTime++;

    const prevPlayerPos = playerCycle.position.clone();
    const prevAIPos = aiCycle.position.clone();

    playerCycle.position.add(playerDirection.clone().multiplyScalar(playerSpeed));
    moveAI();

    if (gameTime % TRAIL_FREQUENCY === 0) {
        playerTrail.push(createTrailSegment(prevPlayerPos, playerTrailMaterial));
        aiTrail.push(createTrailSegment(prevAIPos, aiTrailMaterial));
    }

    console.log(`After movement: Player pos: ${playerCycle.position.toArray()}, AI pos: ${aiCycle.position.toArray()}`);
    console.log(`Player trail length: ${playerTrail.length}, AI trail length: ${aiTrail.length}`);

    if (playerTrail.length > maxTrailLength) {
        const oldestSegment = playerTrail.shift();
        scene.remove(oldestSegment);
    }
    if (aiTrail.length > maxTrailLength) {
        const oldestSegment = aiTrail.shift();
        scene.remove(oldestSegment);
    }

    checkCollisions();
    updateScore();
}

const IGNORE_RECENT_SEGMENTS = 5; // Adjust this value as needed

function checkCollisions() {
    if (checkCollision(playerCycle.position, aiTrail) || 
        checkCollision(playerCycle.position, playerTrail.slice(0, -IGNORE_RECENT_SEGMENTS))) {
        console.log("Player collision detected");
        endGame("Game Over: Player crashed!");
        return;
    }
    if (checkCollision(aiCycle.position, playerTrail) || 
        checkCollision(aiCycle.position, aiTrail.slice(0, -IGNORE_RECENT_SEGMENTS))) {
        console.log("AI collision detected");
        endGame("You Win: AI crashed!");
        return;
    }

    if (checkWallCollision(playerCycle.position)) {
        console.log("Player wall collision detected");
        endGame("Game Over: Player crashed into wall!");
        return;
    }
    if (checkWallCollision(aiCycle.position)) {
        console.log("AI wall collision detected");
        endGame("You Win: AI crashed into wall!");
        return;
    }
}

function updateScore() {
    score++;
    const scoreDisplay = document.getElementById('scoreDisplay');
    if (scoreDisplay) {
        scoreDisplay.textContent = `Score: ${score}`;
    }
}

function createPowerUp() {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00 });
    const powerUp = new THREE.Mesh(geometry, material);
    
    powerUp.position.set(
        Math.random() * arenaSize - arenaSize / 2,
        0.5,
        Math.random() * arenaSize - arenaSize / 2
    );
    
    scene.add(powerUp);
    powerUps.push(powerUp);
}

function checkPowerUpCollision() {
    powerUps.forEach((powerUp, index) => {
        if (playerCycle.position.distanceTo(powerUp.position) < 1) {
            // Apply power-up effect (e.g., speed boost)
            playerSpeed *= 1.5;
            setTimeout(() => playerSpeed /= 1.5, 5000); // Reset after 5 seconds
            
            scene.remove(powerUp);
            powerUps.splice(index, 1);
        }
    });
}

function increaseDifficulty() {
    difficulty += 0.1;
    aiSpeed = baseAiSpeed * difficulty;
}

function updateMinimap() {
    const minimapCanvas = document.getElementById('minimap');
    const minimapCtx = minimapCanvas.getContext('2d');

    minimapCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);

    const scale = minimapCanvas.width / arenaSize;

    // Draw player
    minimapCtx.fillStyle = '#00ff00';
    minimapCtx.fillRect(
        (playerCycle.position.x + arenaSize / 2) * scale - 2,
        (playerCycle.position.z + arenaSize / 2) * scale - 2,
        4,
        4
    );

    // Draw AI
    minimapCtx.fillStyle = '#ff0000';
    minimapCtx.fillRect(
        (aiCycle.position.x + arenaSize / 2) * scale - 2,
        (aiCycle.position.z + arenaSize / 2) * scale - 2,
        4,
        4
    );

    // Draw trails
    minimapCtx.strokeStyle = '#00ff00';
    minimapCtx.beginPath();
    playerTrail.forEach(segment => {
        minimapCtx.lineTo(
            (segment.position.x + arenaSize / 2) * scale,
            (segment.position.z + arenaSize / 2) * scale
        );
    });
    minimapCtx.stroke();

    minimapCtx.strokeStyle = '#ff0000';
    minimapCtx.beginPath();
    aiTrail.forEach(segment => {
        minimapCtx.lineTo(
            (segment.position.x + arenaSize / 2) * scale,
            (segment.position.z + arenaSize / 2) * scale
        );
    });
    minimapCtx.stroke();
}

function animate() {
    animationFrameId = requestAnimationFrame(animate);

    if (gameStarted && !gameOver) {
        update();
        checkPowerUpCollision();

        const cameraOffset = new THREE.Vector3(
            -playerDirection.x * 5,
            3,
            -playerDirection.z * 5
        );
        camera.position.copy(playerCycle.position).add(cameraOffset);
        
        const lookAtPoint = playerCycle.position.clone().add(playerDirection.clone().multiplyScalar(10));
        camera.lookAt(lookAtPoint);

        // Periodically increase difficulty
        if (frameCount % 600 === 0) {
            increaseDifficulty();
        }

        // Periodically create power-ups
        if (frameCount % 300 === 0) {
            createPowerUp();
        }

        frameCount++;
        updateMinimap();
    }

    renderer.render(scene, camera);
}

// Start the game loop
animate();

function startGame() {
    gameStarted = true;
    gameOver = false;
    score = 0;
    difficulty = 1;
    aiSpeed = baseAiSpeed;
    playerSpeed = 0.1;

    // Reset positions
    playerCycle.position.set(5, 0.5, 5);
    aiCycle.position.set(-5, 0.5, -5);

    // Reset directions
    playerDirection.set(1, 0, 0);
    aiDirection.set(-1, 0, 0);

    // Clear trails
    playerTrail.forEach(segment => scene.remove(segment));
    aiTrail.forEach(segment => scene.remove(segment));
    playerTrail = [];
    aiTrail = [];

    // Clear power-ups
    powerUps.forEach(powerUp => scene.remove(powerUp));
    powerUps = [];

    // Hide start screen and show score display
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('scoreDisplay').style.display = 'block';

    // Start the game loop if it's not already running
    if (!animationFrameId) {
        animate();
    }
}

document.getElementById('startButton').addEventListener('click', startGame);

function setupLighting() {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x111111);
    scene.add(ambientLight);

    // Directional light for shadows and depth
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Point lights at each corner for dynamic lighting
    const cornerLights = [
        { position: [arenaSize/2, 5, arenaSize/2], color: 0x0088ff },
        { position: [-arenaSize/2, 5, arenaSize/2], color: 0x0088ff },
        { position: [arenaSize/2, 5, -arenaSize/2], color: 0x0088ff },
        { position: [-arenaSize/2, 5, -arenaSize/2], color: 0x0088ff }
    ];

    cornerLights.forEach(light => {
        const pointLight = new THREE.PointLight(light.color, 0.5, arenaSize);
        pointLight.position.set(...light.position);
        scene.add(pointLight);
    });
}

function init() {
    // ... other initialization code ...
    createWalls();
    setupLighting();
    // ... rest of initialization ...
}
