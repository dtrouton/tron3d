# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tron3D is a 3D third-person Tron light cycles game that runs in a web browser. It uses Three.js for 3D graphics rendering and is built with HTML, CSS, and JavaScript (ES6 modules). The game features a player-controlled light cycle racing against an AI opponent, both leaving light trails behind that cause crashes when hit.

## Code Architecture

The codebase is organized using a modular, class-based architecture:

### Core
- `GameEngine`: Main game controller that manages the game loop and state
- `Config`: Central configuration settings

### Entities
- `Entity`: Base class for game objects with common properties and methods
- `Player`: Player-controlled light cycle with user input handling
- `AI`: Computer-controlled opponent with decision-making logic

### Systems
- `CollisionSystem`: Handles all collision detection logic
- `RenderSystem`: Manages Three.js rendering and camera positioning
- `InputController`: Processes keyboard and touch inputs
- `UIManager`: Handles UI elements and screen updates

### Utils
- `Config.js`: Contains game constants and settings

## Project Structure
```
tron3d/
├── src/                   # Source code
│   ├── index.html         # Main HTML file
│   ├── js/
│   │   ├── core/          # Core game engine
│   │   ├── entities/      # Game entities
│   │   ├── systems/       # Game systems
│   │   ├── utils/         # Utilities and config
│   │   └── main.js        # Entry point
├── tests/                 # Test files
│   ├── Entity.test.js
│   ├── Player.test.js
│   └── CollisionSystem.test.js
├── .babelrc               # Babel config
├── .eslintrc.json         # ESLint config
├── package.json           # NPM package config
├── README.md              # Project readme
└── CLAUDE.md              # This file
```

## Development Commands

### Dependencies Installation
```bash
npm install
```

### Running the Game
```bash
# Start development server on port 3000
npm run dev
```
Then open a web browser and navigate to `http://localhost:3000`.

### Testing
```bash
# Run all tests
npm test
```

### Linting
```bash
# Run ESLint on source files
npm run lint
```

### Building for Production
```bash
# Build for production
npm run build
```

## Implementation Notes

### Game Loop
The game loop is managed by the `GameEngine` class using `requestAnimationFrame`. The main steps in each frame are:
1. Handle user input
2. Update entity positions
3. Check for collisions
4. Update UI (score, minimap)
5. Render the scene

### Collision Detection
The `CollisionSystem` class handles three types of collisions:
1. Wall collisions (when entities go beyond arena boundaries)
2. Trail collisions (when entities hit light trails)
3. Direct collisions (when entities hit each other)

### AI Behavior
The AI opponent uses a simplified pathfinding algorithm to:
1. Avoid immediate collisions with walls and trails
2. Choose the direction with the longest safe path
3. Adaptively increase difficulty as the game progresses

## Future Development Considerations

As outlined in `plan.txt`, future enhancements could include:

- Multiplayer mode
- Custom light cycle designer
- Additional arenas/tracks
- Leaderboard system
- More sophisticated AI behavior
- Additional power-ups and game mechanics