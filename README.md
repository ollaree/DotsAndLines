# Dots & Lines Online

*A minimalist, two-player, turn-based strategy game inspired by the classic "Dots and Boxes" game. This version is built with Node.js, WebSockets, and HTML5 Canvas, featuring a retro, terminal-like aesthetic designed for real-time multiplayer gameplay.*

---

## Description

The objective of the game is to complete more boxes than your opponent by drawing lines between dots on a grid. Players take turns drawing horizontal or vertical lines, and when a player completes a box (all four sides), they score a point and get another turn. The game ends when all possible boxes are completed, and the player with the most boxes wins.

---

## Functionalities

- **Real-Time Multiplayer**: Two players can play from different devices using WebSockets.
- **Game Room System**: Players can create games and share a unique Game ID for others to join.
- **Turn-Based System**: Players take turns drawing lines on the grid.
- **Dynamic Grid Sizes**: Customizable grid sizes from 3x3 to 10x10.
- **Interactive Canvas**: Smooth mouse interaction with line highlighting and click-to-draw functionality.
- **Live Score Tracking**: Real-time score updates showing boxes completed by each player.
- **Box Completion Detection**: Automatic detection when a player completes a box and awards extra turns.
- **Game Over Detection**: Automatic game ending when all boxes are completed.
- **Connection Handling**: Graceful handling of player disconnections with opponent notification.
- **Responsive Design**: Optimized for various screen sizes with full viewport usage.

---

## How It Works

The game consists of two main components: a Node.js server (`server.js`) and a client-side interface (`index.html`).

### Server Architecture (`server.js`):

- **Express Server**: Serves the static HTML file and handles HTTP requests.
- **WebSocket Server**: Manages real-time communication between players.
- **Game State Management**: Maintains in-memory storage of active games with complete game state.
- **Game Logic**: Handles move validation, box completion detection, score calculation, and turn management.

### Game State Structure:

- `horizontalLines` and `verticalLines`: 2D arrays tracking which lines have been drawn and by which player.
- `boxes`: 2D array tracking completed boxes and their owners.
- `scores`: Object tracking the number of boxes each player has completed.
- `currentPlayer`: Tracks whose turn it is.
- `status`: Game status ('waiting', 'active', 'finished').

### Client-Side (`index.html`):

- **Canvas Rendering**: HTML5 Canvas for smooth, responsive game board rendering.
- **Mouse Interaction**: Real-time line highlighting and click-to-draw functionality.
- **WebSocket Communication**: Bidirectional communication with the server for moves and game updates.
- **UI Management**: Dynamic status updates, modals, and game controls.

### Gameplay Flow:

1. **Game Creation**: Player 1 creates a game with a chosen grid size and receives a unique Game ID.
2. **Game Joining**: Player 2 joins using the Game ID.
3. **Turn-Based Play**: Players alternate drawing lines on the grid.
4. **Box Completion**: When a player completes a box, they score a point and get another turn.
5. **Game End**: When all boxes are completed, the player with the most boxes wins.

### Key Algorithms:

- **Box Completion Detection**: Checks adjacent boxes when a line is drawn to determine if any boxes are completed.
- **Turn Management**: Handles turn switching, with players getting extra turns when completing boxes.
- **Game State Synchronization**: Sanitizes and broadcasts game state to both players in real-time.

---

## How to Play

### Setup:
1. Make sure you have Node.js installed on your system.
2. Run `npm install express ws` to install the required dependencies.
3. Start the server by running `node server.js`.
4. Open your browser and navigate to `http://localhost:8080`.

### Gameplay:
1. **Create a Game**: Click "Create New Game" and choose your preferred grid size (3x3 to 10x10).
2. **Share Game ID**: Share the generated Game ID with your opponent.
3. **Join Game**: The second player enters the Game ID and clicks "Join Game".
4. **Take Turns**: Players alternate clicking on the spaces between dots to draw lines.
5. **Complete Boxes**: When you complete a box (all four sides), you score a point and get another turn.
6. **Win the Game**: The player with the most completed boxes when all lines are drawn wins.

### Controls:
- **Mouse Movement**: Hover over potential line positions to see a preview.
- **Click**: Click on a highlighted line position to draw the line.
- **Game Status**: The top bar shows current scores and whose turn it is.

---

## Technical Features

- **Real-Time Communication**: WebSocket-based multiplayer with instant move synchronization.
- **Responsive Canvas**: Dynamically resizes to fit any screen size while maintaining aspect ratio.
- **Clean Game State**: Sanitized data transmission preventing WebSocket serialization issues.
- **Error Handling**: Comprehensive error handling for network issues and invalid moves.
- **Memory Management**: Automatic cleanup of disconnected games and players.
- **Visual Feedback**: Smooth animations, color-coded players, and intuitive UI indicators.

---

## File Structure

```
├── server.js      # Node.js server with WebSocket handling and game logic
├── index.html     # Complete client-side application with UI and game rendering
└── README.md      # This file
```

---

## Dependencies

- **express**: Web server framework
- **ws**: WebSocket library for real-time communication

---

## AI
AI was used to assist throughout all phases of the project, including game logic implementation, WebSocket communication, canvas rendering, and user interface design.
