# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tron3D is a 3D third-person Tron light cycles game that runs in a web browser. It uses Three.js for 3D graphics rendering and is built with HTML, CSS, and JavaScript. The game features a player-controlled light cycle racing against an AI opponent, both leaving light trails behind that cause crashes when hit.

## Code Architecture

### Main Components

1. **Game Setup and Initialization**
   - Scene, camera, and renderer setup
   - Arena creation with walls, floor, and lighting
   - Game state management

2. **Game Objects**
   - Light cycles (player and AI)
   - Light trails
   - Power-ups
   - Walls/arena boundaries

3. **Game Logic**
   - Player controls and movement
   - AI opponent movement and pathfinding
   - Collision detection
   - Trail management
   - Power-up effects
   - Score tracking

4. **Rendering**
   - Main animation loop
   - Camera following the player
   - Minimap displaying the arena

5. **User Interface**
   - Start screen
   - Game over screen
   - Score display

## Development Commands

### Running the Game

To run the game locally, you can use a simple HTTP server:

```bash
# Using Python's built-in HTTP server
python -m http.server

# Or using Node.js's http-server (if installed)
npx http-server
```

Then open a web browser and navigate to `http://localhost:8000` (or the port shown in the console).

### Key Files

- `index.html` - The main HTML file that loads the game
- `game.js` - The main JavaScript file containing the game logic
- `tron3d.html` - An alternate version of the game (less developed)

## Future Development Considerations

As outlined in `plan.txt`, future enhancements could include:

- Multiplayer mode
- Custom light cycle designer
- Additional arenas/tracks
- Leaderboard system