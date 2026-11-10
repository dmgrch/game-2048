const gameBoard = document.querySelector(".game-board");
const scoreValue = document.querySelector(".score__value");
const restartButton = document.querySelector(".restart-button");
const undoButton = document.querySelector(".undo-button");
const gameOverOverlay = document.querySelector(".game-over-overlay");
const gameOverScoreValue = document.querySelector(".game-over__score-value");
const gameOverRestartButton = document.querySelector(".game-over__restart");

const leaderboardButton = document.querySelector(".leaderboard-button");
const leaderboardOverlay = document.querySelector(".leaderboard-overlay");
const leaderboardCloseButton = document.querySelector(".leaderboard__close");
const leaderboardBody = document.querySelector(".leaderboard__body");
const leaderboardTableWrapper = document.querySelector(".leaderboard__table-wrapper");
const leaderboardEmpty = document.querySelector(".leaderboard__empty");

const gameOverForm = document.querySelector(".game-over__form");
const gameOverInput = document.querySelector(".game-over__input");
const gameOverSaved = document.querySelector(".game-over__saved");

const BOARD_SIZE = 4;
const GAME_STORAGE_KEY = "game2048";
const LEADERBOARD_STORAGE_KEY = "game2048Leaderboard";
const ANIMATION_DURATION = 180;

let board = [];
let score = 0;
let previousState = null;
let gameOver = false;

let resultSaved = false;
let leaderboardOpen = false;

let touchStartX = 0;
let touchStartY = 0;

let isAnimating = false;

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
        return null;
    }

    const randomIndex = Math.floor(
        Math.random() * emptyCells.length
    );

    const randomCell = emptyCells[randomIndex];

    board[randomCell.row][randomCell.column] =
        getRandomTileValue();

    return randomCell;
}

function addInitialTiles() {
    const tilesCount = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < tilesCount; i++) {
        addRandomTile();
    }
}

function addRandomTiles() {
    const tilesCount = Math.floor(Math.random() * 2) + 1;
    const newTiles = [];

    for (let i = 0; i < tilesCount; i++) {
        const newTile = addRandomTile();

        if (newTile) {
            newTiles.push(newTile);
        }
    }

    return newTiles;
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
    const values = [];

    for (let index = 0; index < line.length; index++) {
        if (line[index] !== 0) {
            values.push({
                value: line[index],
                sourceIndex: index
            });
        }
    }

    const mergedLine = [];
    const moves = [];

    let scoreGain = 0;
    let index = 0;
    let targetIndex = 0;

    while (index < values.length) {
        if (
            index + 1 < values.length &&
            values[index].value === values[index + 1].value
        ) {
            const mergedValue = values[index].value * 2;

            mergedLine.push(mergedValue);
            scoreGain += mergedValue;

            moves.push({
                fromIndex: values[index].sourceIndex,
                toIndex: targetIndex,
                merged: true
            });

            moves.push({
                fromIndex: values[index + 1].sourceIndex,
                toIndex: targetIndex,
                merged: true
            });

            index += 2;
        } else {
            mergedLine.push(values[index].value);

            moves.push({
                fromIndex: values[index].sourceIndex,
                toIndex: targetIndex,
                merged: false
            });

            index += 1;
        }

        targetIndex += 1;
    }

    while (mergedLine.length < BOARD_SIZE) {
        mergedLine.push(0);
    }

    return {
        line: mergedLine,
        scoreGain: scoreGain,
        moves: moves
    };
}

function moveLeft(sourceBoard) {
    const newBoard = [];
    const moves = [];

    let scoreGain = 0;

    for (let row = 0; row < BOARD_SIZE; row++) {
        const result = processLine(sourceBoard[row]);

        newBoard.push(result.line);
        scoreGain += result.scoreGain;

        result.moves.forEach((tileMove) => {
            moves.push({
                fromRow: row,
                fromColumn: tileMove.fromIndex,
                toRow: row,
                toColumn: tileMove.toIndex,
                merged: tileMove.merged
            });
        });
    }

    return {
        board: newBoard,
        scoreGain: scoreGain,
        moves: moves
    };
}

function moveRight(sourceBoard) {
    const newBoard = [];
    const moves = [];

    let scoreGain = 0;

    for (let row = 0; row < BOARD_SIZE; row++) {
        const reversedRow = [...sourceBoard[row]].reverse();

        const result = processLine(reversedRow);

        newBoard.push([...result.line].reverse());
        scoreGain += result.scoreGain;

        result.moves.forEach((tileMove) => {
            moves.push({
                fromRow: row,
                fromColumn: BOARD_SIZE - 1 - tileMove.fromIndex,
                toRow: row,
                toColumn: BOARD_SIZE - 1 - tileMove.toIndex,
                merged: tileMove.merged
            });
        });
    }

    return {
        board: newBoard,
        scoreGain: scoreGain,
        moves: moves
    };
}

function moveUp(sourceBoard) {
    const newBoard = createEmptyBoard();
    const moves = [];

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

        result.moves.forEach((tileMove) => {
            moves.push({
                fromRow: tileMove.fromIndex,
                fromColumn: column,
                toRow: tileMove.toIndex,
                toColumn: column,
                merged: tileMove.merged
            });
        });

        scoreGain += result.scoreGain;
    }

    return {
        board: newBoard,
        scoreGain: scoreGain,
        moves: moves
    };
}

function moveDown(sourceBoard) {
    const newBoard = createEmptyBoard();
    const moves = [];

    let scoreGain = 0;

    for (let column = 0; column < BOARD_SIZE; column++) {
        const columnValues = [];

        for (let row = BOARD_SIZE - 1; row >= 0; row--) {
            columnValues.push(sourceBoard[row][column]);
        }

        const result = processLine(columnValues);
        const finalColumn = [...result.line].reverse();

        for (let row = 0; row < BOARD_SIZE; row++) {
            newBoard[row][column] = finalColumn[row];
        }

        result.moves.forEach((tileMove) => {
            moves.push({
                fromRow: BOARD_SIZE - 1 - tileMove.fromIndex,
                fromColumn: column,
                toRow: BOARD_SIZE - 1 - tileMove.toIndex,
                toColumn: column,
                merged: tileMove.merged
            });
        });

        scoreGain += result.scoreGain;
    }

    return {
        board: newBoard,
        scoreGain: scoreGain,
        moves: moves
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

function hasAvailableMoves() {
    if (getEmptyCells().length > 0) {
        return true;
    }

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let column = 0; column < BOARD_SIZE; column++) {
            const currentValue = board[row][column];

            if (
                column + 1 < BOARD_SIZE &&
                currentValue === board[row][column + 1]
            ) {
                return true;
            }

            if (
                row + 1 < BOARD_SIZE &&
                currentValue === board[row + 1][column]
            ) {
                return true;
            }
        }
    }

    return false;
}

function finishGame() {
    gameOver = true;
    previousState = null;

    undoButton.disabled = true;

    gameOverScoreValue.textContent = score;

    updateGameOverContent();

    gameOverOverlay.classList.add("game-over-overlay--open");
}

function closeGameOver() {
    gameOverOverlay.classList.remove("game-over-overlay--open");
}

function animateTileMovement(moves) {
    const cells = gameBoard.querySelectorAll(".game-cell");
    const animations = [];

    moves.forEach((tileMove) => {
        if (
            tileMove.fromRow === tileMove.toRow &&
            tileMove.fromColumn === tileMove.toColumn
        ) {
            return;
        }

        const sourceIndex =
            tileMove.fromRow * BOARD_SIZE +
            tileMove.fromColumn;

        const targetIndex =
            tileMove.toRow * BOARD_SIZE +
            tileMove.toColumn;

        const sourceCell = cells[sourceIndex];
        const targetCell = cells[targetIndex];

        const tile = sourceCell.querySelector(".tile");

        if (!tile) {
            return;
        }

        const sourceRect = sourceCell.getBoundingClientRect();
        const targetRect = targetCell.getBoundingClientRect();

        animations.push({
            tile: tile,
            x: targetRect.left - sourceRect.left,
            y: targetRect.top - sourceRect.top
        });
    });

    if (animations.length === 0) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        requestAnimationFrame(() => {
            animations.forEach((animation) => {
                animation.tile.classList.add("tile--moving");

                animation.tile.style.transform =
                    `translate(${animation.x}px, ${animation.y}px)`;
            });

            setTimeout(resolve, ANIMATION_DURATION);
        });
    });
}

function getMergedCells(moves) {
    const mergedCells = [];
    const addedCells = new Set();

    moves.forEach((tileMove) => {
        if (!tileMove.merged) {
            return;
        }

        const key =
            `${tileMove.toRow}-${tileMove.toColumn}`;

        if (addedCells.has(key)) {
            return;
        }

        addedCells.add(key);

        mergedCells.push({
            row: tileMove.toRow,
            column: tileMove.toColumn
        });
    });

    return mergedCells;
}

function animateRenderedTiles(newTiles, mergedCells) {
    const cells = gameBoard.querySelectorAll(".game-cell");

    newTiles.forEach((position) => {
        const index =
            position.row * BOARD_SIZE +
            position.column;

        const tile = cells[index].querySelector(".tile");

        if (tile) {
            tile.classList.add("tile--new");
        }
    });

    mergedCells.forEach((position) => {
        const index =
            position.row * BOARD_SIZE +
            position.column;

        const tile = cells[index].querySelector(".tile");

        if (tile) {
            tile.classList.add("tile--merged");
        }
    });
}

async function move(direction) {
    if (gameOver || leaderboardOpen || isAnimating) {
        return false;
    }

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
        if (!hasAvailableMoves()) {
            finishGame();
            saveGame();
        }

        return false;
    }

    previousState = {
        board: cloneBoard(board),
        score: score
    };

    isAnimating = true;

    const mergedCells = getMergedCells(result.moves);

    await animateTileMovement(result.moves);

    board = result.board;
    score += result.scoreGain;

    const newTiles = addRandomTiles();

    renderBoard();
    animateRenderedTiles(newTiles, mergedCells);

    undoButton.disabled = false;

    if (!hasAvailableMoves()) {
        finishGame();
    }

    saveGame();

    isAnimating = false;

    return true;
}

function undoMove() {
    if (
        !previousState ||
        gameOver ||
        isAnimating
    ) {
        return;
    }

    board = cloneBoard(previousState.board);
    score = previousState.score;

    previousState = null;

    renderBoard();

    undoButton.disabled = true;

    saveGame();
}

function handleKeydown(event) {
    if (event.key === "Escape" && leaderboardOpen) {
        closeLeaderboard();
        return;
    }

    if (leaderboardOpen || gameOver) {
        return;
    }

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
    if (leaderboardOpen || gameOver) {
        return;
    }

    const touch = event.changedTouches[0];

    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}

function handleTouchEnd(event) {
    if (leaderboardOpen || gameOver) {
        return;
    }

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

function updateGameOverContent() {
    if (resultSaved) {
        gameOverForm.classList.add("game-over__form--hidden");
        gameOverSaved.classList.add("game-over__saved--visible");
    } else {
        gameOverForm.classList.remove("game-over__form--hidden");
        gameOverSaved.classList.remove("game-over__saved--visible");
    }
}

function getLeaderboard() {
    return JSON.parse(
        localStorage.getItem(LEADERBOARD_STORAGE_KEY)
    ) || [];
}

function saveLeaderboard(records) {
    localStorage.setItem(
        LEADERBOARD_STORAGE_KEY,
        JSON.stringify(records)
    );
}

function createLeaderboardRow(record) {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    const scoreCell = document.createElement("td");
    const dateCell = document.createElement("td");

    nameCell.textContent = record.name;
    scoreCell.textContent = record.score;
    dateCell.textContent = record.date;

    row.append(nameCell, scoreCell, dateCell);

    return row;
}

function renderLeaderboard() {
    const records = getLeaderboard();

    leaderboardBody.replaceChildren();

    if (records.length === 0) {
        leaderboardTableWrapper.style.display = "none";
        leaderboardEmpty.style.display = "block";

        return;
    }

    leaderboardTableWrapper.style.display = "block";
    leaderboardEmpty.style.display = "none";

    records.forEach((record) => {
        const row = createLeaderboardRow(record);

        leaderboardBody.append(row);
    });
}

function saveResult(name) {
    const records = getLeaderboard();

    const newRecord = {
        name: name,
        score: score,
        date: new Date().toLocaleDateString("ru-RU")
    };

    records.push(newRecord);

    records.sort((firstRecord, secondRecord) => {
        return secondRecord.score - firstRecord.score;
    });

    const topRecords = records.slice(0, 10);

    saveLeaderboard(topRecords);

    resultSaved = true;

    updateGameOverContent();
    renderLeaderboard();
    saveGame();
}

function handleGameOverSubmit(event) {
    event.preventDefault();

    if (resultSaved) {
        return;
    }

    const playerName = gameOverInput.value.trim();

    if (!playerName) {
        return;
    }

    saveResult(playerName);
}

function openLeaderboard() {
    leaderboardOpen = true;

    renderLeaderboard();

    leaderboardOverlay.classList.add(
        "leaderboard-overlay--open"
    );
}

function closeLeaderboard() {
    leaderboardOpen = false;

    leaderboardOverlay.classList.remove(
        "leaderboard-overlay--open"
    );
}

function saveGame() {
    const gameState = {
        board: board,
        score: score,
        previousState: previousState,
        gameOver: gameOver,
        resultSaved: resultSaved
    };

    localStorage.setItem(
        GAME_STORAGE_KEY,
        JSON.stringify(gameState)
    );
}

function loadGame() {
    const savedGame = localStorage.getItem(GAME_STORAGE_KEY);

    if (!savedGame) {
        startGame();
        return;
    }

    const gameState = JSON.parse(savedGame);

    board = gameState.board;
    score = gameState.score;
    previousState = gameState.previousState;
    gameOver = gameState.gameOver;
    resultSaved = gameState.resultSaved || false;

    createBoardCells();
    renderBoard();

    undoButton.disabled = !previousState || gameOver;

    if (gameOver) {
        finishGame();
    } else {
        closeGameOver();
    }
}

function startGame() {
    board = createEmptyBoard();
    score = 0;
    previousState = null;
    gameOver = false;
    resultSaved = false;

    gameOverInput.value = "";

    closeGameOver();
    updateGameOverContent();

    undoButton.disabled = true;

    createBoardCells();
    addInitialTiles();
    renderBoard();

    saveGame();
}

document.addEventListener("keydown", handleKeydown);

gameBoard.addEventListener("touchstart", handleTouchStart);
gameBoard.addEventListener("touchend", handleTouchEnd);

restartButton.addEventListener("click", startGame);
gameOverRestartButton.addEventListener("click", startGame);
undoButton.addEventListener("click", undoMove);

leaderboardButton.addEventListener("click", openLeaderboard);
leaderboardCloseButton.addEventListener("click", closeLeaderboard);

gameOverForm.addEventListener(
    "submit",
    handleGameOverSubmit
);

loadGame();