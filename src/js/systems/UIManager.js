export class UIManager {
  constructor() {
    this.scoreDisplay = document.getElementById('scoreDisplay');
    this.gameOverScreen = document.getElementById('gameOverScreen');
    this.winnerText = document.getElementById('winnerText');
    this.startScreen = document.getElementById('startScreen');
    this.minimapCanvas = document.getElementById('minimap');
    this.minimapContext = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;
  }
  
  showStartScreen() {
    if (this.startScreen) {
      this.startScreen.style.display = 'flex';
    }
  }
  
  hideStartScreen() {
    if (this.startScreen) {
      this.startScreen.style.display = 'none';
    }
  }
  
  showScoreDisplay(score) {
    if (this.scoreDisplay) {
      this.scoreDisplay.textContent = `Score: ${score}`;
      this.scoreDisplay.style.display = 'block';
    }
  }
  
  updateScore(score) {
    if (this.scoreDisplay) {
      this.scoreDisplay.textContent = `Score: ${score}`;
    }
  }
  
  showGameOverScreen(message, score) {
    if (this.gameOverScreen && this.winnerText) {
      this.winnerText.textContent = `${message} Final Score: ${score}`;
      this.gameOverScreen.style.display = 'flex';
    }
  }
  
  hideGameOverScreen() {
    if (this.gameOverScreen) {
      this.gameOverScreen.style.display = 'none';
    }
  }
  
  updateMinimap(playerPosition, aiPosition, playerTrail, aiTrail, arenaSize) {
    if (!this.minimapCanvas || !this.minimapContext) return;
    
    const canvas = this.minimapCanvas;
    const ctx = this.minimapContext;
    
    // Clear minimap
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const scale = canvas.width / arenaSize;
    
    // Draw player
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(
      (playerPosition.x + arenaSize / 2) * scale - 2,
      (playerPosition.z + arenaSize / 2) * scale - 2,
      4,
      4
    );
    
    // Draw AI
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(
      (aiPosition.x + arenaSize / 2) * scale - 2,
      (aiPosition.z + arenaSize / 2) * scale - 2,
      4,
      4
    );
    
    // Draw player trail
    ctx.strokeStyle = '#00ff00';
    ctx.beginPath();
    playerTrail.forEach(segment => {
      ctx.lineTo(
        (segment.position.x + arenaSize / 2) * scale,
        (segment.position.z + arenaSize / 2) * scale
      );
    });
    ctx.stroke();
    
    // Draw AI trail
    ctx.strokeStyle = '#ff0000';
    ctx.beginPath();
    aiTrail.forEach(segment => {
      ctx.lineTo(
        (segment.position.x + arenaSize / 2) * scale,
        (segment.position.z + arenaSize / 2) * scale
      );
    });
    ctx.stroke();
  }
}