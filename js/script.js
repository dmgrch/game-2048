const gameBoard = document.querySelector(".game-board");
const scoreValue = document.querySelector(".score__value");

const BOARD_SIZE = 4;

let board = [];
let score = 0;

function createEmptyBoard() {
    return Array.from({ length: BOARD_SIZE }, () => {
        return Array(BOARD_SIZE).fill(0);
    });
}

function createBoardCells() {
    gameBoard.replaceChildren();

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let column = 0; column < BOARD_SIZE; column++) {
            const cell = document.createElement("div");

            cell.className = "game-cell";
            cell.dataset.row = row;
            cell.dataset.column = column;

            gameBoard.append(cell);
        }
    }
}

function getEmptyCells() {
    const emptyCells = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let column = 0; column < BOARD_SIZE; column++) {
            if (board[row][column] === 0) {
                emptyCells.push({
                    row: row,
                    column: column
                });
            }
        }
    }

    return emptyCells;
}

function getRandomTileValue() {
    return Math.random() < 0.9 ? 2 : 4;
}

function addRandomTile() {
    const emptyCells = getEmptyCells();

    if (emptyCells.length === 0) {
        return;
    }

    const randomIndex = Math.floor(
        Math.random() * emptyCells.length
    );

    const randomCell = emptyCells[randomIndex];

    board[randomCell.row][randomCell.column] =
        getRandomTileValue();
}

function addInitialTiles() {
    const tilesCount = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < tilesCount; i++) {
        addRandomTile();
    }
}

function createTile(value) {
    const tile = document.createElement("div");

    tile.className = "tile";
    tile.textContent = value;

    if (value <= 2048) {
        tile.classList.add(`tile--${value}`);
    } else {
        tile.classList.add("tile--large");
    }

    return tile;
}

function renderBoard() {
    const cells = gameBoard.querySelectorAll(".game-cell");

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let column = 0; column < BOARD_SIZE; column++) {
            const index = row * BOARD_SIZE + column;
            const cell = cells[index];
            const value = board[row][column];

            cell.replaceChildren();

            if (value !== 0) {
                const tile = createTile(value);

                cell.append(tile);
            }
        }
    }

    scoreValue.textContent = score;
}

function startGame() {
    board = createEmptyBoard();
    score = 0;

    createBoardCells();
    addInitialTiles();
    renderBoard();
}

startGame();