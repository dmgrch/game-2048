const gameBoard = document.querySelector(".game-board");
const scoreValue = document.querySelector(".score__value");

const BOARD_SIZE = 4;

let board = [];
let score = 0;
let touchStartX = 0;
let touchStartY = 0;

const SWIPE_DISTANCE = 40;

function createEmptyBoard() {
    return Array.from({ length: BOARD_SIZE }, () => {
        return Array(BOARD_SIZE).fill(0);
    });
}

function cloneBoard(sourceBoard) {
    return sourceBoard.map((row) => [...row]);
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

function addRandomTiles() {
    const tilesCount = Math.floor(Math.random() * 2) + 1;

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

function processLine(line) {
    const values = line.filter((value) => value !== 0);

    const mergedLine = [];
    let scoreGain = 0;
    let index = 0;

    while (index < values.length) {
        if (
            index + 1 < values.length &&
            values[index] === values[index + 1]
        ) {
            const mergedValue = values[index] * 2;

            mergedLine.push(mergedValue);
            scoreGain += mergedValue;

            index += 2;
        } else {
            mergedLine.push(values[index]);

            index += 1;
        }
    }

    while (mergedLine.length < BOARD_SIZE) {
        mergedLine.push(0);
    }

    return {
        line: mergedLine,
        scoreGain: scoreGain
    };
}

function moveLeft(sourceBoard) {
    const newBoard = [];
    let scoreGain = 0;

    for (let row = 0; row < BOARD_SIZE; row++) {
        const result = processLine(sourceBoard[row]);

        newBoard.push(result.line);
        scoreGain += result.scoreGain;
    }

    return {
        board: newBoard,
        scoreGain: scoreGain
    };
}

function moveRight(sourceBoard) {
    const newBoard = [];
    let scoreGain = 0;

    for (let row = 0; row < BOARD_SIZE; row++) {
        const reversedRow = [...sourceBoard[row]].reverse();

        const result = processLine(reversedRow);

        newBoard.push(result.line.reverse());
        scoreGain += result.scoreGain;
    }

    return {
        board: newBoard,
        scoreGain: scoreGain
    };
}

function moveUp(sourceBoard) {
    const newBoard = createEmptyBoard();
    let scoreGain = 0;

    for (let column = 0; column < BOARD_SIZE; column++) {
        const columnValues = [];

        for (let row = 0; row < BOARD_SIZE; row++) {
            columnValues.push(sourceBoard[row][column]);
        }

        const result = processLine(columnValues);

        for (let row = 0; row < BOARD_SIZE; row++) {
            newBoard[row][column] = result.line[row];
        }

        scoreGain += result.scoreGain;
    }

    return {
        board: newBoard,
        scoreGain: scoreGain
    };
}

function moveDown(sourceBoard) {
    const newBoard = createEmptyBoard();
    let scoreGain = 0;

    for (let column = 0; column < BOARD_SIZE; column++) {
        const columnValues = [];

        for (let row = BOARD_SIZE - 1; row >= 0; row--) {
            columnValues.push(sourceBoard[row][column]);
        }

        const result = processLine(columnValues);

        result.line.reverse();

        for (let row = 0; row < BOARD_SIZE; row++) {
            newBoard[row][column] = result.line[row];
        }

        scoreGain += result.scoreGain;
    }

    return {
        board: newBoard,
        scoreGain: scoreGain
    };
}

function boardsAreEqual(firstBoard, secondBoard) {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let column = 0; column < BOARD_SIZE; column++) {
            if (
                firstBoard[row][column] !==
                secondBoard[row][column]
            ) {
                return false;
            }
        }
    }

    return true;
}

function move(direction) {
    let result;

    if (direction === "left") {
        result = moveLeft(board);
    }

    if (direction === "right") {
        result = moveRight(board);
    }

    if (direction === "up") {
        result = moveUp(board);
    }

    if (direction === "down") {
        result = moveDown(board);
    }

    if (!result) {
        return false;
    }

    if (boardsAreEqual(board, result.board)) {
        return false;
    }

    board = result.board;
    score += result.scoreGain;

    addRandomTiles();
    renderBoard();

    return true;
}

function handleKeydown(event) {
    const directions = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down"
    };

    const direction = directions[event.key];

    if (!direction) {
        return;
    }

    event.preventDefault();

    move(direction);
}

function handleTouchStart(event) {
    const touch = event.changedTouches[0];

    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}

function handleTouchEnd(event) {
    const touch = event.changedTouches[0];

    const differenceX = touch.clientX - touchStartX;
    const differenceY = touch.clientY - touchStartY;

    const absoluteX = Math.abs(differenceX);
    const absoluteY = Math.abs(differenceY);

    if (
        absoluteX < SWIPE_DISTANCE &&
        absoluteY < SWIPE_DISTANCE
    ) {
        return;
    }

    if (absoluteX > absoluteY) {
        if (differenceX > 0) {
            move("right");
        } else {
            move("left");
        }

        return;
    }

    if (differenceY > 0) {
        move("down");
    } else {
        move("up");
    }
}

function startGame() {
    board = createEmptyBoard();
    score = 0;

    createBoardCells();
    addInitialTiles();
    renderBoard();
}

document.addEventListener("keydown", handleKeydown);

gameBoard.addEventListener("touchstart", handleTouchStart);
gameBoard.addEventListener("touchend", handleTouchEnd);

startGame();