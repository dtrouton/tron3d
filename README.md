# Tron3D

A 3D third-person Tron light cycles game that runs in a web browser. Built with Three.js for 3D graphics rendering.

## Features

- 3D third-person gameplay
- Player vs AI opponent
- Light trails that cause crashes when hit
- Power-up system
- Neon-styled visuals
- Minimap display
- Responsive controls (keyboard and touch)

## Development

### Setup

```bash
# Install dependencies
npm install
```

### Running the game

```bash
# Start development server
npm run dev
```

Then open your browser to http://localhost:3000

### Running tests

```bash
# Run tests
npm test
```

### Linting

```bash
# Run ESLint
npm run lint
```

### Building for production

```bash
# Build for production
npm run build
```

## Game Controls

- **Arrow Left** / **A**: Turn left
- **Arrow Right** / **D**: Turn right
- **Space**: Restart after game over
- On mobile devices, swipe left/right to turn

## Project Structure

- `src/`: Source code
  - `js/`: JavaScript modules
    - `core/`: Core game engine
    - `entities/`: Game entities (player, AI)
    - `systems/`: Game systems (collision, rendering, etc.)
    - `utils/`: Utility functions and configuration
  - `index.html`: Main HTML file
- `tests/`: Test files

## Future Enhancements

- Multiplayer mode
- Custom light cycle designer
- Additional arenas/tracks
- Leaderboard system