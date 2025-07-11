
const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// In-memory storage for games
const games = {};

// --- Game Logic Helper Functions ---

function checkNewBoxes(line, game) {
    let boxCompleted = false;
    const { gridSize, horizontalLines, verticalLines, boxes, currentPlayer } = game;

    if (line.type === 'h') {
        // Box above
        if (line.y > 0 && horizontalLines[line.y - 1][line.x] && verticalLines[line.y - 1][line.x] && verticalLines[line.y - 1][line.x + 1]) {
            if (!boxes[line.y - 1][line.x]) {
                boxes[line.y - 1][line.x] = currentPlayer;
                boxCompleted = true;
            }
        }
        // Box below
        if (line.y < gridSize && horizontalLines[line.y + 1][line.x] && verticalLines[line.y][line.x] && verticalLines[line.y][line.x + 1]) {
            if (!boxes[line.y][line.x]) {
                boxes[line.y][line.x] = currentPlayer;
                boxCompleted = true;
            }
        }
    } else { // type 'v'
        // Box left
        if (line.x > 0 && verticalLines[line.y][line.x - 1] && horizontalLines[line.y][line.x - 1] && horizontalLines[line.y + 1][line.x - 1]) {
            if (!boxes[line.y][line.x - 1]) {
                boxes[line.y][line.x - 1] = currentPlayer;
                boxCompleted = true;
            }
        }
        // Box right
        if (line.x < gridSize && verticalLines[line.y][line.x + 1] && horizontalLines[line.y][line.x] && horizontalLines[line.y + 1][line.x]) {
            if (!boxes[line.y][line.x]) {
                boxes[line.y][line.x] = currentPlayer;
                boxCompleted = true;
            }
        }
    }
    return boxCompleted;
}

function updateScores(game) {
    const scores = { 1: 0, 2: 0 };
    for (let y = 0; y < game.gridSize; y++) {
        for (let x = 0; x < game.gridSize; x++) {
            if (game.boxes[y][x]) {
                scores[game.boxes[y][x]]++;
            }
        }
    }
    game.scores = scores;
}

function checkGameOver(game) {
    return game.scores[1] + game.scores[2] === game.gridSize * game.gridSize;
}

// ** NEW: Function to create a clean, sendable version of the game state **
// This is the key fix, inspired by your working 20 Questions server.js
function getSanitizedGameState(game, gameId) {
    if (!game) return null;
    // This new object only contains data safe to send as JSON.
    // It excludes the raw WebSocket objects (player1, player2).
    return {
        gameId: gameId,
        gridSize: game.gridSize,
        horizontalLines: game.horizontalLines,
        verticalLines: game.verticalLines,
        boxes: game.boxes,
        scores: game.scores,
        currentPlayer: game.currentPlayer,
        status: game.status,
        winner: game.winner,
    };
}

function generateGameId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    do {
        result = '';
        for (let i = 0; i < 5; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } while (games[result]);
    return result;
}

wss.on('connection', (ws) => {
    ws.id = Date.now();

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        const { type, payload } = data;

        switch (type) {
            case 'createGame': {
                const gameId = generateGameId();
                const gridSize = Math.max(2, Math.min(10, payload.gridSize || 5));

                games[gameId] = {
                    player1: ws,
                    player2: null,
                    gridSize: gridSize,
                    horizontalLines: Array(gridSize + 1).fill(0).map(() => Array(gridSize).fill(0)),
                    verticalLines: Array(gridSize).fill(0).map(() => Array(gridSize + 1).fill(0)),
                    boxes: Array(gridSize).fill(0).map(() => Array(gridSize).fill(0)),
                    scores: { 1: 0, 2: 0 },
                    currentPlayer: 1,
                    status: 'waiting',
                    winner: null
                };
                ws.gameId = gameId;

                ws.send(JSON.stringify({
                    type: 'gameCreated',
                    payload: getSanitizedGameState(games[gameId], gameId) // Use sanitized state
                }));
                break;
            }

            case 'joinGame': {
                const { gameId } = payload;
                const gameToJoin = games[gameId];

                if (gameToJoin) {
                    if (gameToJoin.player2 && gameToJoin.player2.readyState === 1) {
                        ws.send(JSON.stringify({ type: 'error', payload: { message: 'This game is already full.' } }));
                        return;
                    }

                    gameToJoin.player2 = ws;
                    gameToJoin.status = 'active';
                    ws.gameId = gameId;

                    const message = { type: 'gameUpdate', payload: getSanitizedGameState(gameToJoin, gameId) }; // Use sanitized state
                    if (gameToJoin.player1) gameToJoin.player1.send(JSON.stringify(message));
                    if (gameToJoin.player2) gameToJoin.player2.send(JSON.stringify(message));
                } else {
                    ws.send(JSON.stringify({ type: 'error', payload: { message: 'Game not found.' } }));
                }
                break;
            }

            case 'makeMove': {
                const game = games[ws.gameId];
                if (!game) return;

                const playerNumber = (ws.id === game.player1.id) ? 1 : 2;
                if (playerNumber !== game.currentPlayer) return; // Not this player's turn

                const { line } = payload;
                let boxMade = false;

                if (line.type === 'h' && !game.horizontalLines[line.y][line.x]) {
                    game.horizontalLines[line.y][line.x] = game.currentPlayer;
                    boxMade = checkNewBoxes(line, game);
                } else if (line.type === 'v' && !game.verticalLines[line.y][line.x]) {
                    game.verticalLines[line.y][line.x] = game.currentPlayer;
                    boxMade = checkNewBoxes(line, game);
                } else {
                    return; // Invalid move
                }

                updateScores(game);

                if (checkGameOver(game)) {
                    game.status = 'finished';
                    if (game.scores[1] > game.scores[2]) game.winner = 1;
                    else if (game.scores[2] > game.scores[1]) game.winner = 2;
                    else game.winner = 'draw';
                } else if (!boxMade) {
                    game.currentPlayer = game.currentPlayer === 1 ? 2 : 1;
                }

                const updatedMessage = { type: 'gameUpdate', payload: getSanitizedGameState(game, ws.gameId) }; // Use sanitized state
                if (game.player1) game.player1.send(JSON.stringify(updatedMessage));
                if (game.player2) game.player2.send(JSON.stringify(updatedMessage));

                break;
            }
        }
    });

    ws.on('close', () => {
        const game = games[ws.gameId];
        if (game) {
            const isPlayer1 = game.player1 && game.player1.id === ws.id;
            game.status = 'finished';
            game.winner = isPlayer1 ? 2 : 1; // The other player wins

            const otherPlayer = isPlayer1 ? game.player2 : game.player1;

            if (otherPlayer && otherPlayer.readyState === 1) {
                otherPlayer.send(JSON.stringify({
                    type: 'opponentDisconnected',
                    // Also send final game state so the winner can see the final board
                    payload: { 
                        message: 'Your opponent has disconnected. You win!',
                        gameState: getSanitizedGameState(game, ws.gameId) 
                    }
                }));
            }
            delete games[ws.gameId]; // Clean up the game room
        }
    });
});

server.listen(8080, () => {
    console.log('Server is listening on port 8080.');
});
