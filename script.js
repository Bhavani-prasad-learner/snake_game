//-----------------------------------------------------
// ELEMENTS
//-----------------------------------------------------
const board = document.querySelector('.board');
const startBtn = document.querySelector('.start-btn');
const restartBtn = document.querySelector('.restart-btn');

const modal = document.querySelector('.modal');
const gameOverModal = document.querySelector('.game-over');
const startGameModal = document.querySelector('.start-game');

const scoreElement = document.getElementById("score");
const highscoreElement = document.getElementById("high-score");
const timeElement = document.getElementById("time");

//-----------------------------------------------------
// CONFIG
//-----------------------------------------------------
const blockheight = 30;
const blockwidth = 30;

const rows = Math.floor(board.clientHeight / blockheight);
const cols = Math.floor(board.clientWidth / blockwidth);

const blocks = [];

let intervalid = null;
let timeintervalid = null;

// touch helpers
let startX = 0;
let startY = 0;
let endX = 0;
let endY = 0;


//-----------------------------------------------------
// GAME STATE
//-----------------------------------------------------
// head is first element in array
let snake = [
    { row: 4, col: 4 }, // head
    { row: 4, col: 5 }  // body to the right of head
];

let food = {
    row: Math.floor(Math.random() * rows),
    col: Math.floor(Math.random() * cols)
};

// IMPORTANT: direction must not point into the first body segment.
// Since body is at col:5 and head at col:4, the safe initial direction is "left"
let direction = "left";

let score = 0;
let highscore = Number(localStorage.getItem("highscore")) || 0;
let minutes = 0;
let seconds = 0;

highscoreElement.innerText = highscore;
timeElement.innerText = "00:00";

//-----------------------------------------------------
// BUILD BOARD
//-----------------------------------------------------
for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
        const block = document.createElement('div');
        block.classList.add('block');
        board.appendChild(block);

        blocks[`${row}-${col}`] = block;
    }
}

//-----------------------------------------------------
// INPUT HANDLER (keyboard)
//-----------------------------------------------------
addEventListener("keydown", (event) => {
    if (event.key === 'ArrowLeft' && direction !== 'right') direction = 'left';
    else if (event.key === 'ArrowRight' && direction !== 'left') direction = 'right';
    else if (event.key === 'ArrowUp' && direction !== 'down') direction = 'up';
    else if (event.key === 'ArrowDown' && direction !== 'up') direction = 'down';
});

//-----------------------------------------------------
// TIMER FUNCTION
//-----------------------------------------------------
function startTimer() {
    clearInterval(timeintervalid);

    minutes = 0;
    seconds = 0;
    timeElement.innerText = "00:00";

    timeintervalid = setInterval(() => {
        seconds++;
        if (seconds === 60) {
            minutes++;
            seconds = 0;
        }
        timeElement.innerText =
            `${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }, 1000);
}

//-----------------------------------------------------
// UPDATE GAME LOGIC
//-----------------------------------------------------
function updateGame() {
    // compute new head
    let head = null;
    if (direction === "left") head = { row: snake[0].row, col: snake[0].col - 1 };
    else if (direction === "right") head = { row: snake[0].row, col: snake[0].col + 1 };
    else if (direction === "up") head = { row: snake[0].row - 1, col: snake[0].col };
    else if (direction === "down") head = { row: snake[0].row + 1, col: snake[0].col };

    // WALL COLLISION
    if (head.row < 0 || head.row >= rows || head.col < 0 || head.col >= cols) {
        endGame();
        return;
    }

    // SELF COLLISION
    for (let i = 1; i < snake.length; i++) {
        if (head.row === snake[i].row && head.col === snake[i].col) {
            endGame();
            return;
        }
    }

    // show food
    blocks[`${food.row}-${food.col}`].classList.add('food');

    // clear previous snake visuals
    for (let i = 0; i < snake.length; i++) {
        const segment = snake[i];
        if (i === 0) blocks[`${segment.row}-${segment.col}`].classList.remove("head");
        else blocks[`${segment.row}-${segment.col}`].classList.remove("fill");
    }

    // if eating food, grow: add head and DON'T remove tail
    if (head.row === food.row && head.col === food.col) {
        blocks[`${food.row}-${food.col}`].classList.remove("food");

        // place new food in a free spot (simple random; could loop until empty)
        food = {
            row: Math.floor(Math.random() * rows),
            col: Math.floor(Math.random() * cols)
        };

        // add new head at front and keep tail (effectively grows by 1)
        snake.unshift(head);

        score++;
        scoreElement.innerText = score;

        if (score > highscore) {
            highscore = score;
            highscoreElement.innerText = highscore;
            localStorage.setItem("highscore", highscore.toString());
        }

        return; // done (no pop)
    }

    // normal move: add new head at front and remove tail
    snake.unshift(head);
    snake.pop();
}

//-----------------------------------------------------
// DRAW GAME
//-----------------------------------------------------
function render() {
    updateGame();

    // draw snake
    for (let i = 0; i < snake.length; i++) {
        const segment = snake[i];
        if (blocks[`${segment.row}-${segment.col}`]) {
            if (i === 0) blocks[`${segment.row}-${segment.col}`].classList.add("head");
            else blocks[`${segment.row}-${segment.col}`].classList.add("fill");
        }
    }
}

//-----------------------------------------------------
// END GAME
//-----------------------------------------------------
function endGame() {
    modal.style.display = "flex";
    startGameModal.style.display = "none";
    gameOverModal.style.display = "flex";

    clearInterval(intervalid);
    clearInterval(timeintervalid);
    intervalid = null;
    timeintervalid = null;
}

//-----------------------------------------------------
// START GAME
//-----------------------------------------------------
startBtn.addEventListener("click", () => {
    // guard: prevent multiple starts
    if (intervalid) return;

    modal.style.display = "none";

    startTimer();
    intervalid = setInterval(render, 300);
});

//-----------------------------------------------------
// RESTART GAME
//-----------------------------------------------------
function restartfunction() {
    // clear intervals
    clearInterval(intervalid);
    clearInterval(timeintervalid);
    intervalid = null;
    timeintervalid = null;

    // clear snake visuals safely
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const b = blocks[`${r}-${c}`];
            if (b) b.classList.remove("head", "fill", "food");
        }
    }

    // reset state
    score = 0;
    scoreElement.innerText = score;

    // reset snake so body is to the right of head (same layout as initial)
    snake = [
        { row: 4, col: 4 }, // head
        { row: 4, col: 5 }
    ];

    // make sure direction is safe (away from body)
    direction = "left";

    // new random food
    food = {
        row: Math.floor(Math.random() * rows),
        col: Math.floor(Math.random() * cols)
    };

    modal.style.display = "none";

    startTimer();
    intervalid = setInterval(render, 300);
}

restartBtn.addEventListener("click", restartfunction);

//-----------------------------------------------------
// TOUCH INPUT HANDLER (swipe)
//-----------------------------------------------------
board.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    // seed end so a quick tap doesn't read 0
    endX = startX;
    endY = startY;
}, { passive: true });

board.addEventListener("touchmove", (e) => {
    endX = e.touches[0].clientX;
    endY = e.touches[0].clientY;
}, { passive: true });

board.addEventListener("touchend", () => {
    let diffX = endX - startX;
    let diffY = endY - startY;

    // ignore very small moves
    if (Math.abs(diffX) < SWIPE_THRESHOLD && Math.abs(diffY) < SWIPE_THRESHOLD) return;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (diffX > 0 && direction !== "left") {
            direction = "right";
        } else if (diffX < 0 && direction !== "right") {
            direction = "left";
        }
    } else {
        // Vertical swipe
        if (diffY > 0 && direction !== "up") {
            direction = "down";
        } else if (diffY < 0 && direction !== "down") {
            direction = "up";
        }
    }
}, { passive: true });
