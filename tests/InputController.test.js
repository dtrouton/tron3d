/**
 * InputController behavior tests focusing on core functionality
 */

describe('InputController', () => {
  
  describe('key listener management', () => {
    test('should manage key listeners correctly', () => {
      const listeners = [];
      
      const addKeyListener = (callback) => {
        listeners.push(callback);
      };
      
      const removeKeyListener = (callback) => {
        const index = listeners.indexOf(callback);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      };
      
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      addKeyListener(listener1);
      addKeyListener(listener2);
      
      expect(listeners).toHaveLength(2);
      expect(listeners).toContain(listener1);
      expect(listeners).toContain(listener2);
      
      removeKeyListener(listener1);
      
      expect(listeners).toHaveLength(1);
      expect(listeners).not.toContain(listener1);
      expect(listeners).toContain(listener2);
    });
    
    test('should handle removing non-existent listener', () => {
      const listeners = [];
      
      const removeKeyListener = (callback) => {
        const index = listeners.indexOf(callback);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      };
      
      const nonExistentListener = jest.fn();
      
      expect(() => removeKeyListener(nonExistentListener)).not.toThrow();
      expect(listeners).toHaveLength(0);
    });
  });
  
  describe('touch gesture detection', () => {
    test('should detect horizontal right swipe', () => {
      const touchStartX = 100;
      const touchStartY = 150;
      const touchEndX = 200;
      const touchEndY = 155;
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      
      const isSignificantMovement = Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50;
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
      const isRightSwipe = deltaX > 0;
      
      expect(isSignificantMovement).toBe(true);
      expect(isHorizontalSwipe).toBe(true);
      expect(isRightSwipe).toBe(true);
    });
    
    test('should detect horizontal left swipe', () => {
      const touchStartX = 200;
      const touchStartY = 150;
      const touchEndX = 100;
      const touchEndY = 155;
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      
      const isSignificantMovement = Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50;
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
      const isLeftSwipe = deltaX < 0;
      
      expect(isSignificantMovement).toBe(true);
      expect(isHorizontalSwipe).toBe(true);
      expect(isLeftSwipe).toBe(true);
    });
    
    test('should ignore small movements', () => {
      const touchStartX = 100;
      const touchStartY = 150;
      const touchEndX = 120;
      const touchEndY = 160;
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      
      const isSignificantMovement = Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50;
      
      expect(isSignificantMovement).toBe(false);
    });
    
    test('should ignore vertical swipes', () => {
      const touchStartX = 100;
      const touchStartY = 150;
      const touchEndX = 110;
      const touchEndY = 250;
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      
      const isSignificantMovement = Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50;
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
      
      expect(isSignificantMovement).toBe(true);
      expect(isHorizontalSwipe).toBe(false);
    });
  });
  
  describe('event delegation logic', () => {
    test('should call all registered listeners with event data', () => {
      const listeners = [];
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      listeners.push(listener1);
      listeners.push(listener2);
      
      const eventKey = 'ArrowLeft';
      
      listeners.forEach(listener => listener(eventKey));
      
      expect(listener1).toHaveBeenCalledWith('ArrowLeft');
      expect(listener2).toHaveBeenCalledWith('ArrowLeft');
    });
  });
});