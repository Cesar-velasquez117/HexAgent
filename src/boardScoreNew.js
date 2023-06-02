const Graph = require("node-dijkstra");
const transpose = require("./transposeHex");
const crypto = require("crypto");

let cache = {};

function boardScore(board, player) {
    let path0 = boardPath(board);
    let score = 0;
  
    if (!path0) {
      score = -999999999; //(board.length * board.length);
    } else {
      if (path0.length === 2) {
        score = 999999999; //(board.length * board.length);
      } else {
        let path1 = boardPath(transpose(board));
        if (!path1) {
          score = 999999999; //(board.length * board.length)
        } else {
          score = path1.length - path0.length;
        }
      }
    }
  
    let victoryPaths = findVictoryPaths(board, player);
    score += victoryPaths.length;
  
    const blockedCount = countBlockedCells(board, player);
    score -= blockedCount;

    let blockingMoveScore = calculateBlockingMoveScore(board, player);
    score += blockingMoveScore;
  
    if (blockedCount === 0) {
      if (board.flat().filter((cell) => cell === player).length < 3) {
        score += 999999999;
      }
    }
  
    let mobilityScore = calculateMobility(board, player);
    score += mobilityScore;
  
    // Priorizar caminos con menos bloqueos
    score -= calculateBlockingScore(board, player);
  
    return player === "1" ? score : -score;
  }

  function calculateBlockingMoveScore(board, player) {
    const size = board.length;
    let blockingMoveScore = 0;
  
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (board[i][j] === 0) {
          // Crear una copia temporal del tablero
          const tempBoard = [...board.map((row) => [...row])];
          tempBoard[i][j] = player;
  
          // Verificar si el camino del oponente se bloquea
          const opponentPath = boardPath(tempBoard);
          if (!opponentPath) {
            blockingMoveScore++;
          }
        }
      }
    }
  
    return blockingMoveScore;
  }

  function calculateBlockingScore(board, player) {
    const size = board.length;
    let blockingScore = 0;
  
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (board[i][j] === player) {
          let key = i * size + j;
          let neighbors = getNeighborhood(key, player, board);
          neighbors = removeIfAny(board, neighbors, i, j);
          blockingScore += neighbors.length;
        }
      }
    }
  
    return blockingScore;
  }

function calculateMobility(board, player) {
  let size = board.length;
  let playerCount = 0;
  let playerMoves = 0;

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (board[i][j] === player) {
        playerCount++;
        let key = i * size + j;
        let neighbors = getNeighborhood(key, player, board);
        neighbors = removeIfAny(board, neighbors, i, j);
        playerMoves += neighbors.length;
      }
    }
  }

  return playerCount === 0 ? 0 : playerMoves / playerCount;
}

function boardPath(board) {
  let player = "1";
  let size = board.length;

  const route = new Graph();

  let neighborsT = {};
  let neighborsX = {};
  cache = {};
  // Build the graph out of the hex board
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      let key = i * size + j;
      if (board[i][j] === 0 || board[i][j] === player) {
        let list = getNeighborhood(key, player, board);
        // Cache this result
        //cache[key] = list;
        list = removeIfAny(board, list, i, j);

        //if (key === 5) console.log(list)

        let neighbors = {};
        let sideX = false;
        let sideT = false;
        list.forEach((x) => {
          switch (x) {
            case -1:
              neighbors[player + "X"] = 1;
              neighborsX[key + ""] = 1;
              sideX = sideX || board[i][j] === player;
              break;
            case -2:
              neighbors[player + "T"] = 1;
              neighborsT[key + ""] = 1;
              sideT = sideT || board[i][j] === player;
              break;
            default:
              neighbors[x + ""] = 1;
          }
        });
        // This case occurs when the game has finished
        if (sideT && sideX) {
          neighborsX[player + "T"] = 1;
          neighborsT[player + "X"] = 1;
        }
        route.addNode(key + "", neighbors);
      }
    }
  }

  route.addNode(player + "T", neighborsT);
  route.addNode(player + "X", neighborsX);

  //console.log(route)

  return route.path(player + "T", player + "X");
}

function findVictoryPaths(board, player) {
  let size = board.length;
  let paths = [];

  for (let i = 0; i < size; i++) {
    if (player === "1") {
      if (board[i][0] === player && hasPathToRight(board, i, 0)) {
        let path = getPathToRight(board, i, 0);
        paths.push(path);
      }
    } else {
      if (board[0][i] === player && hasPathToBottom(board, 0, i)) {
        let path = getPathToBottom(board, 0, i);
        paths.push(path);
      }
    }
  }

  return paths;
}

const countBlockedCells = (board, player) => {
  const blockedCells = [];
  const visited = new Set();

  // Buscar los caminos de victoria del jugador actual
  const victoryPaths = findVictoryPaths(board, player);

  // Obtener las celdas bloqueadas en cada camino de victoria
  for (const path of victoryPaths) {
    const blockedPath = getBlockedCells(path, board, visited);
    blockedCells.push(...blockedPath);
  }

  // Contar la cantidad de celdas bloqueadas
  return blockedCells.length;
};

const getBlockedCells = (path, board, visited) => {
  const blockedCells = [];

  for (const cell of path) {
    const neighbors = getNeighborhood(cell, board);

    // Verificar si algún vecino bloquea el paso
    if (hasBlockingNeighbor(neighbors, visited)) {
      blockedCells.push(cell);
    }

    visited.add(cell);
  }

  return blockedCells;
};

function hasPathToRight(board, row, col) {
  let size = board.length;

  if (col === size - 1) {
    return true;
  }

  if (board[row][col + 1] === 0) {
    return hasPathToRight(board, row, col + 1);
  }

  return false;
}

function getPathToRight(board, row, col) {
  let size = board.length;
  let path = [[row, col]];

  if (col === size - 1) {
    return path;
  }

  if (board[row][col + 1] === 0) {
    let nextPath = getPathToRight(board, row, col + 1);
    path.push(...nextPath);
  }

  return path;
}

function hasPathToBottom(board, row, col) {
  let size = board.length;

  if (row === size - 1) {
    return true;
  }

  if (board[row + 1][col] === 0) {
    return hasPathToBottom(board, row + 1, col);
  }

  return false;
}

function getPathToBottom(board, row, col) {
  let size = board.length;
  let path = [[row, col]];

  if (row === size - 1) {
    return path;
  }

  if (board[row + 1][col] === 0) {
    let nextPath = getPathToBottom(board, row + 1, col);
    path.push(...nextPath);
  }

  return path;
}

/**
 * Evita que se consideren las casillas donde el enemigo tiene 2 opciones para cerrar el camino
 * @param {*} board
 * @param {*} list
 * @param {*} row
 * @param {*} col
 * @returns
 */
function removeIfAny(board, list, row, col) {
  let size = board.length;
  if (
    row > 0 &&
    col > 0 &&
    row < size - 1 &&
    col < size - 1 &&
    list.length > 0
  ) {
    if (
      board[row - 1][col] === 0 &&
      board[row - 1][col - 1] === "2" &&
      board[row][col + 1] === "2"
    ) {
      let k = list.findIndex((key) => key === (row - 1) * size + col);
      //console.log('x: ' + k + ' ' + ((row - 1) *  size + col));
      //console.log(list);
      if (k >= 0) list.splice(k, 1);
    }
    if (
      board[row][col + 1] === 0 &&
      board[row - 1][col] === "2" &&
      board[row + 1][col + 1] === "2"
    ) {
      let k = list.findIndex((key) => key === row * size + col + 1);
      //console.log('x: ' + k + ' ' + (row *  size + col + 1) );
      //console.log(list);
      if (k >= 0) list.splice(k, 1);
    }
    if (
      board[row + 1][col + 1] === 0 &&
      board[row][col + 1] === "2" &&
      board[row + 1][col] === "2"
    ) {
      let k = list.findIndex((key) => key === (row + 1) * size + col + 1);
      //console.log('x: ' + k + ' ' + ((row + 1) * size + col));
      //console.log(list);
      if (k >= 0) list.splice(k, 1);
    }
    if (
      board[row + 1][col] === 0 &&
      board[row + 1][col + 1] === "2" &&
      board[row + 1][col - 1] === "2"
    ) {
      let k = list.findIndex((key) => key === (row + 1) * size + col);
      //console.log('x: ' + k+ ' ' + ((row + 1) * size + col));
      //console.log(list);
      if (k >= 0) list.splice(k, 1);
    }
    if (
      board[row][col - 1] === 0 &&
      board[row + 1][col] === "2" &&
      board[row - 1][col - 1] === "2"
    ) {
      let k = list.findIndex((key) => key === row * size + col - 1);
      //console.log('x: ' + k + ' ' + (row * size + col - 1));
      //console.log(list);
      if (k >= 0) list.splice(k, 1);
    }
    if (
      board[row - 1][col - 1] === 0 &&
      board[row - 1][col] === "2" &&
      board[row][col - 1] === "2"
    ) {
      let k = list.findIndex((key) => key === (row - 1) * size + col - 1);
      //console.log('x: ' + k + ' ' + ((row - 1) * size + col - 1));
      //console.log(list);
      if (k >= 0) list.splice(k, 1);
    }
  }
  return list;
}

function getNeighborhood(currentHex, player, board) {
  let size = board.length;
  let row = Math.floor(currentHex / size);
  let col = currentHex % size;
  let result = [];
  let currentValue = board[row][col];

  board[row][col] = "x";
  //Check if this value has been precalculated in this turn
  //if (cache[currentHex]) {
  //console.log("From cache")
  //  return cache[currentHex];
  //}

  // Check the six neighbours of the current hex
  pushIfAny(result, board, player, row - 1, col);
  pushIfAny(result, board, player, row - 1, col + 1);
  pushIfAny(result, board, player, row, col + 1);
  pushIfAny(result, board, player, row, col - 1);
  pushIfAny(result, board, player, row + 1, col);
  pushIfAny(result, board, player, row + 1, col - 1);

  // Add the edges if hex is at the border
  if (col === size - 1) {
    result.push(-1);
  } else if (col === 0) {
    result.push(-2);
  }

  board[row][col] = currentValue;

  return result;
}

function pushIfAny(result, board, player, row, col) {
  let size = board.length;
  if (row >= 0 && row < size && col >= 0 && col < size) {
    if (board[row][col] === player || board[row][col] === 0) {
      if (board[row][col] === player) {
        result.push(...getNeighborhood(col + row * size, player, board));
      } else {
        result.push(col + row * size);
      }
    }
  }
}

module.exports = { boardScore, boardPath };
