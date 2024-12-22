// Constants
const SCREEN_WIDTH = 600;
const SCREEN_HEIGHT = 400;
const BACKGROUND_COLOUR = "#E6E6FA"; // Lavender
const SNAKE_COLOUR = "#F984EF"; // Light purple
const FOOD_COLOUR = "#00CCCC"; // Dark cyan
const BLOCK_SIZE = 20;
const DIRECTIONS = [
    { x: 0, y: -1 }, // UP
    { x: 0, y: 1 },  // DOWN
    { x: -1, y: 0 }, // LEFT
    { x: 1, y: 0 }   // RIGHT
];

class Snake {
    constructor() {
        this.initializeSnake();
        this.keySequence = "";
        this.color = SNAKE_COLOUR;
        this.score = 1;
        this.scores = [];
        this.gameOver = false;
        this.game_over_sound = new Audio("static/sounds/explode.mp3");
        this.eat_sounds = this.loadEatSounds();
        this.lKeyCount = 0; // Initialize lKeyCount
    }

    initializeSnake() {
        this.length = 1;
        this.positions = [{ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 }];
        this.direction = this.getRandomDirection();
    }

    loadEatSounds() {
        const soundFiles = ['boy.mp3', 'fetch.mp3', 'fluffy.mp3', 'man.mp3', 'stomach.mp3', 'what.mp3', 'unicorn.mp3'];
        return soundFiles.map(file => new Audio("static/sounds/" + file));
    }

    getRandomDirection() {
        return DIRECTIONS[Math.floor(Math.random() * 4)];
    }

    getHeadPosition() {
        return this.positions[0];
    }

    turn(point) {
        if (this.length > 1 && (point.x * -1 === this.direction.x) && (point.y * -1 === this.direction.y)) {
            return;
        }
        this.direction = point;
    }

    move(food) {
        const cur = this.getHeadPosition();
        const newHead = {
            x: (cur.x + this.direction.x * BLOCK_SIZE + SCREEN_WIDTH) % SCREEN_WIDTH,
            y: (cur.y + this.direction.y * BLOCK_SIZE + SCREEN_HEIGHT) % SCREEN_HEIGHT
        };

        if (this.positions.slice(1).some(p => p.x === newHead.x && p.y === newHead.y)) {
            this.reset();
        } else {
            this.positions.unshift(newHead);
            if (this.positions.length > this.length) {
                this.positions.pop();
            }
            if (this.isEatingFood(food)) {
                this.eatFood(food);
            }
        }
    }

    isEatingFood(food) {
        const head = this.getHeadPosition();
        return head.x === food.position.x && head.y === food.position.y;
    }

    eatFood(food) {
        this.length++;
        this.score++;
        this.scores.push(this.score);
        this.playRandomEatSound();
        food.randomizePosition();
    }

    playRandomEatSound() {
        const randomIndex = Math.floor(Math.random() * this.eat_sounds.length);
        this.eat_sounds[randomIndex].play();
    }

    reset() {
        this.initializeSnake();
        this.score = 0;
        this.gameOver = true;
        this.playGameOverSound();
    }

    playGameOverSound() {
        this.game_over_sound.volume = 0.5;
        this.game_over_sound.play();
    }

    resetToOneBubble() {
        this.length = 1;
        this.positions = [this.getHeadPosition()];
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        this.positions.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x + BLOCK_SIZE / 2, p.y + BLOCK_SIZE / 2, BLOCK_SIZE / 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    handleKeys(event) {
        switch (event.key) {
            case "ArrowUp":
                this.turn({ x: 0, y: -1 });
                break;
            case "ArrowDown":
                this.turn({ x: 0, y: 1 });
                break;
            case "ArrowLeft":
                this.turn({ x: -1, y: 0 });
                break;
            case "ArrowRight":
                this.turn({ x: 1, y: 0 });
                break;
        }
    }
}

class Food {
    constructor() {
        this.color = FOOD_COLOUR;
        this.randomizePosition();
    }

    randomizePosition() {
        this.position = {
            x: Math.floor(Math.random() * (SCREEN_WIDTH / BLOCK_SIZE)) * BLOCK_SIZE,
            y: Math.floor(Math.random() * (SCREEN_HEIGHT / BLOCK_SIZE)) * BLOCK_SIZE
        };
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        const centerX = this.position.x + BLOCK_SIZE / 2;
        const centerY = this.position.y + BLOCK_SIZE / 2;
        const outerRadius = BLOCK_SIZE / 2;
        const innerRadius = outerRadius * 0.5;

        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = Math.PI * 2 * i / 10 - Math.PI / 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const snake = new Snake();
    const food = new Food();

    let isPaused = false;
    let automateInterval;

    document.addEventListener("keydown", event => snake.handleKeys(event));

    document.getElementById("pauseButton").addEventListener("click", togglePause);
    document.getElementById("robotButton").addEventListener("click", () => automateGame(snake, food));

    function togglePause() {
        isPaused = !isPaused;
        document.getElementById("pauseButton").textContent = isPaused ? "Resume" : "Pause";
    }

    function floodFill(snake, start) {
        const visited = new Set();
        const queue = [start];
        let count = 0;

        while (queue.length) {
            const { x, y } = queue.pop();
            const key = `${x},${y}`;

            if (visited.has(key)) continue;
            visited.add(key);

            if (snake.positions.some(pos => pos.x === x && pos.y === y)) continue;

            count++;

            for (const dir of DIRECTIONS) {
                queue.push({
                    x: (x + dir.x * BLOCK_SIZE + SCREEN_WIDTH) % SCREEN_WIDTH,
                    y: (y + dir.y * BLOCK_SIZE + SCREEN_HEIGHT) % SCREEN_HEIGHT
                });
            }
        }

        return count;
    }

    function findSafeDirection(snake, food) {
        const head = snake.getHeadPosition();
        const foodPos = food.position;

        const moves = DIRECTIONS.map(dir => {
            const nextX = (head.x + dir.x * BLOCK_SIZE + SCREEN_WIDTH) % SCREEN_WIDTH;
            const nextY = (head.y + dir.y * BLOCK_SIZE + SCREEN_HEIGHT) % SCREEN_HEIGHT;
            const reachable = floodFill(snake, { x: nextX, y: nextY });

            return {
                direction: dir,
                distanceToFood: Math.abs(nextX - foodPos.x) + Math.abs(nextY - foodPos.y),
                reachable
            };
        });

        const safeMoves = moves.filter(move => move.reachable > 0);

        if (safeMoves.length === 0) return snake.direction;

        return safeMoves.reduce((best, move) =>
            move.reachable > best.reachable ||
            (move.reachable === best.reachable && move.distanceToFood < best.distanceToFood)
                ? move
                : best
        ).direction;
    }

    function automateGame(snake, food) {
        clearInterval(automateInterval);
        automateInterval = setInterval(() => {
            if (snake.gameOver) {
                clearInterval(automateInterval);
                return;
            }
            if (!isPaused) {
                const direction = findSafeDirection(snake, food);
                snake.turn(direction);
            }
        }, 1000 / 20);
    }

    function updateScoreDisplay(snake) {
        document.getElementById('score').textContent = snake.score;      
        // Display lKeyCount message if lKeyCount > 0
        const lKeyPressMessage = document.getElementById('lKeyPressMessage');
        const ContactMessage = document.getElementById('ContactMessage');
        const ServerMessage = document.getElementById('ServerMessage');
        const lKeyCount = document.getElementById('lKeyCount');
        if (snake.lKeyCount > 0) {
            lKeyPressMessage.style.display = 'block';
            ContactMessage.style.display = 'none';
            ServerMessage.style.display = 'none';
            lKeyCount.textContent = snake.lKeyCount;
        } else {
            lKeyPressMessage.style.display = 'none';
            ContactMessage.style.display = 'block';
            ServerMessage.style.display = 'block';
        }
    }

        function displayFinalScore() {
        scoreWindow.style.display = "block";
        document.getElementById("finalScore").textContent = Math.max(...snake.scores);
        document.body.style.backgroundColor = getRandomPinkShade();
    }

    function getRandomPinkShade() {
        const pinkShades = [
            [255, 182, 193], [255, 192, 203], [255, 228, 225], [255, 105, 180],
            [219, 112, 147], [255, 20, 147], [228, 0, 124], [252, 15, 192],
            [226, 80, 152], [236, 88, 149], [255, 181, 197], [255, 110, 180],
            [236, 193, 204], [255, 160, 122], [254, 183, 165], [255, 153, 153],
            [255, 182, 193], [255, 192, 203], [255, 182, 193], [255, 192, 203]
        ];
        const randomIndex = Math.floor(Math.random() * pinkShades.length);
        const randomPink = pinkShades[randomIndex];
        return `rgb(${randomPink[0]}, ${randomPink[1]}, ${randomPink[2]})`;
    }

    restartButton.addEventListener("click", function () {
        scoreWindow.style.display = "none";
        snake.gameOver = false;
        startGame();
    });


        function gameLoop() {
        setTimeout(() => {
            if (!isPaused) {
                snake.move(food);
                ctx.fillStyle = BACKGROUND_COLOUR;
                ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
                snake.draw(ctx);
                food.draw(ctx);
                updateScoreDisplay(snake);
                if (snake.score == 0) {
                    displayFinalScore();
                    snake.scores = [];
                    snake.score = 1; 
                }
                if (snake.score == 2) {
                    snake.lKeyCount = 0;
                }
            }
            requestAnimationFrame(gameLoop);
        }, 1000 / 20);
    }

    gameLoop();
});
