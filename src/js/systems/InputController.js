export class InputController {
  constructor() {
    this.keyListeners = [];
    this.touchStartX = 0;
    this.touchStartY = 0;
    
    this.setupKeyboardListeners();
    this.setupTouchListeners();
  }
  
  setupKeyboardListeners() {
    document.addEventListener('keydown', (event) => {
      this.keyListeners.forEach(listener => listener(event.key));
    });
  }
  
  setupTouchListeners() {
    // For mobile devices
    document.addEventListener('touchstart', (event) => {
      this.touchStartX = event.touches[0].clientX;
      this.touchStartY = event.touches[0].clientY;
    });
    
    document.addEventListener('touchend', (event) => {
      const touchEndX = event.changedTouches[0].clientX;
      const touchEndY = event.changedTouches[0].clientY;
      
      const deltaX = touchEndX - this.touchStartX;
      const deltaY = touchEndY - this.touchStartY;
      
      // Determine swipe direction if it's a significant movement
      if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          if (deltaX > 0) {
            this.keyListeners.forEach(listener => listener('ArrowRight'));
          } else {
            this.keyListeners.forEach(listener => listener('ArrowLeft'));
          }
        }
      }
    });
  }
  
  addKeyListener(callback) {
    this.keyListeners.push(callback);
  }
  
  removeKeyListener(callback) {
    const index = this.keyListeners.indexOf(callback);
    if (index !== -1) {
      this.keyListeners.splice(index, 1);
    }
  }
}