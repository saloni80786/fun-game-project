// 🎀 Global State
const views = {
    main: document.getElementById('main-menu'),
    tictactoe: document.getElementById('tictactoe-view'),
    snake: document.getElementById('snake-view'),
    memory: document.getElementById('memory-view')
};

// Theme Management
const themeToggle = document.getElementById('theme-toggle');
let isDark = false;
themeToggle.addEventListener('click', () => {
    isDark = !isDark;
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
    playSound('click');
});

// Sound Management
const musicToggle = document.getElementById('music-toggle');
let isMuted = false;
// Using Audio API synth for simple retro cute sounds instead of requiring external assets
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let bgOscillator = null;

function playSound(type) {
    if (isMuted) return;
    try {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        switch (type) {
            case 'click':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.1);
                break;
            case 'win':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
                oscillator.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.1); // C#5
                oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.2); // E5
                oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.3); // A5
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.6);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.6);
                break;
            case 'pop':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.1);
                break;
            case 'gameover':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.5);
                break;
        }
    } catch (e) { console.log('Audio error:', e); }
}

musicToggle.addEventListener('click', () => {
    isMuted = !isMuted;
    musicToggle.textContent = isMuted ? '🔇' : '🎶';
    if(audioCtx.state === 'suspended') audioCtx.resume();
});

// View Navigation
function openGame(game) {
    if (audioCtx.state === 'suspended' && !isMuted) audioCtx.resume();
    playSound('click');
    Object.values(views).forEach(v => {
        v.classList.remove('active-view');
        v.classList.add('hidden');
    });
    views[game].classList.remove('hidden');
    views[game].classList.add('active-view');

    // Initialize game specific logic
    if(game === 'tictactoe') initTicTacToe();
    if(game === 'snake') { snakeGameLoop && cancelAnimationFrame(snakeGameLoop); startSnake(); }
    if(game === 'memory') initMemoryGame();
}

function goBack() {
    playSound('click');
    Object.values(views).forEach(v => {
        v.classList.remove('active-view');
        v.classList.add('hidden');
    });
    views.main.classList.remove('hidden');
    views.main.classList.add('active-view');
    
    // Stop snake game loop if active
    if(snakeGameLoop) {
        cancelAnimationFrame(snakeGameLoop);
        snakeGameLoop = null;
    }
    // Stop memory timer
    clearInterval(memoryTimerInterval);
}

// Confetti Effect
function shootConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = [];
    const colors = ['#ffb6c1', '#add8e6', '#ffc0cb', '#ffd700', '#dda0dd'];

    for(let i = 0; i < 100; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            xv: (Math.random() - 0.5) * (Math.random() * 20),
            yv: (Math.random() - 1) * (Math.random() * 20) - 5,
            size: Math.random() * 10 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            rot: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 10
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let activeParticles = false;
        particles.forEach(p => {
            p.x += p.xv;
            p.y += p.yv;
            p.yv += 0.5; // gravity
            p.rot += p.rotSpeed;
            
            if(p.y < canvas.height) activeParticles = true;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
            ctx.restore();
        });

        if(activeParticles) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0,0, canvas.width, canvas.height);
        }
    }
    animate();
}

/* =========================================================
   💖 TIC TAC TOE 💖
========================================================= */
let tttBoard = ['', '', '', '', '', '', '', '', ''];
const tttPlayer1 = '💖';
const tttPlayer2 = '⭐';
let tttCurrentPlayer = tttPlayer1;
let tttGameActive = false;
const tttWinningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

function initTicTacToe() {
    generateTicTacToeBoard();
    resetTicTacToe();
}

function generateTicTacToeBoard() {
    const boardEl = document.getElementById('ttt-board');
    boardEl.innerHTML = '';
    for(let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.setAttribute('data-index', i);
        cell.addEventListener('click', handleTicTacToeClick);
        boardEl.appendChild(cell);
    }
}

function handleTicTacToeClick(e) {
    if (!tttGameActive) return;
    const index = e.target.getAttribute('data-index');
    if (tttBoard[index] !== '') return;

    playSound('pop');
    tttBoard[index] = tttCurrentPlayer;
    e.target.textContent = tttCurrentPlayer;

    checkTicTacToeWin();
}

function checkTicTacToeWin() {
    let roundWon = false;
    let winningCells = [];
    for (let i = 0; i < tttWinningConditions.length; i++) {
        const [a, b, c] = tttWinningConditions[i];
        if (tttBoard[a] && tttBoard[a] === tttBoard[b] && tttBoard[a] === tttBoard[c]) {
            roundWon = true;
            winningCells = [a, b, c];
            break;
        }
    }

    const statusEl = document.getElementById('ttt-status');
    if (roundWon) {
        statusEl.textContent = `Player ${tttCurrentPlayer === tttPlayer1 ? '1' : '2'} Wins! 🎉`;
        tttGameActive = false;
        playSound('win');
        shootConfetti();
        const cells = document.querySelectorAll('#ttt-board .cell');
        winningCells.forEach(idx => cells[idx].classList.add('glow-win'));
        return;
    }

    if (!tttBoard.includes('')) {
        statusEl.textContent = "It's a Draw! 🎀";
        tttGameActive = false;
        return;
    }

    tttCurrentPlayer = tttCurrentPlayer === tttPlayer1 ? tttPlayer2 : tttPlayer1;
    statusEl.textContent = `Player ${tttCurrentPlayer === tttPlayer1 ? "1's Turn (💖)" : "2's Turn (⭐)"}`;
}

function resetTicTacToe() {
    tttBoard = ['', '', '', '', '', '', '', '', ''];
    tttCurrentPlayer = tttPlayer1;
    tttGameActive = true;
    document.getElementById('ttt-status').textContent = "Player 1's Turn (💖)";
    const cells = document.querySelectorAll('#ttt-board .cell');
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('glow-win');
    });
}

/* =========================================================
   🐍 SNAKE GAME 🐍
========================================================= */
const snakeCanvas = document.getElementById('snake-game-canvas');
const snakeCtx = snakeCanvas.getContext('2d');
const snakeGridSize = 20;
let snake = [];
let snakeDx = snakeGridSize;
let snakeDy = 0;
let snakeFood = { x: 0, y: 0 };
let snakeScore = 0;
let snakeHighScore = localStorage.getItem('miniGames_snakeHighScore') || 0;
let snakeGameLoop = null;
let snakeFrameCount = 0;
let isSnakeAlive = false;

document.getElementById('snake-highscore').textContent = snakeHighScore;

document.addEventListener('keydown', (e) => {
    if(!isSnakeAlive) return;
    if(e.key === 'ArrowUp' && snakeDy === 0) { snakeDx = 0; snakeDy = -snakeGridSize; }
    else if(e.key === 'ArrowDown' && snakeDy === 0) { snakeDx = 0; snakeDy = snakeGridSize; }
    else if(e.key === 'ArrowLeft' && snakeDx === 0) { snakeDx = -snakeGridSize; snakeDy = 0; }
    else if(e.key === 'ArrowRight' && snakeDx === 0) { snakeDx = snakeGridSize; snakeDy = 0; }
});

function spawnSnakeFood() {
    snakeFood.x = Math.floor(Math.random() * (snakeCanvas.width / snakeGridSize)) * snakeGridSize;
    snakeFood.y = Math.floor(Math.random() * (snakeCanvas.height / snakeGridSize)) * snakeGridSize;
}

function startSnake() {
    if(snakeGameLoop) cancelAnimationFrame(snakeGameLoop);
    snake = [
        {x: 160, y: 160},
        {x: 140, y: 160},
        {x: 120, y: 160}
    ];
    snakeDx = snakeGridSize;
    snakeDy = 0;
    snakeScore = 0;
    document.getElementById('snake-score').textContent = snakeScore;
    isSnakeAlive = true;
    spawnSnakeFood();
    requestAnimationFrame(snakeLoop);
}

function drawRoundedRect(ctx, x, y, width, height, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

function snakeLoop() {
    snakeGameLoop = requestAnimationFrame(snakeLoop);
    
    // Control speed (slower is easier/cuter)
    if (++snakeFrameCount < 8) return;
    snakeFrameCount = 0;

    snakeCtx.clearRect(0, 0, snakeCanvas.width, snakeCanvas.height);

    // Basic grid lines
    snakeCtx.strokeStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    for(let i=0; i<snakeCanvas.width; i+=snakeGridSize) {
        snakeCtx.beginPath(); snakeCtx.moveTo(i, 0); snakeCtx.lineTo(i, snakeCanvas.height); snakeCtx.stroke();
        snakeCtx.beginPath(); snakeCtx.moveTo(0, i); snakeCtx.lineTo(snakeCanvas.width, i); snakeCtx.stroke();
    }

    // Move snake
    const head = { x: snake[0].x + snakeDx, y: snake[0].y + snakeDy };
    
    // Wall collision (wrap around can be cute, or game over. Let's do game over)
    if (head.x < 0 || head.x >= snakeCanvas.width || head.y < 0 || head.y >= snakeCanvas.height ||
        snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        
        playSound('gameover');
        isSnakeAlive = false;
        cancelAnimationFrame(snakeGameLoop);
        if(snakeScore > snakeHighScore) {
            snakeHighScore = snakeScore;
            localStorage.setItem('miniGames_snakeHighScore', snakeHighScore);
            document.getElementById('snake-highscore').textContent = snakeHighScore;
            shootConfetti();
        }
        
        // Game Over overlay
        snakeCtx.fillStyle = 'rgba(0,0,0,0.5)';
        snakeCtx.fillRect(0,0,snakeCanvas.width,snakeCanvas.height);
        snakeCtx.fillStyle = '#fff';
        snakeCtx.font = "30px 'Poppins'";
        snakeCtx.textAlign = 'center';
        snakeCtx.fillText("Oops! Try again 💕", snakeCanvas.width/2, snakeCanvas.height/2);
        return;
    }

    snake.unshift(head);

    // Eat food
    if (head.x === snakeFood.x && head.y === snakeFood.y) {
        snakeScore += 10;
        document.getElementById('snake-score').textContent = snakeScore;
        playSound('pop');
        spawnSnakeFood();
    } else {
        snake.pop();
    }

    // Draw Food (Strawberry 🍓)
    snakeCtx.font = "18px Arial";
    snakeCtx.textAlign = "center";
    snakeCtx.textBaseline = "middle";
    snakeCtx.fillText("🍓", snakeFood.x + snakeGridSize/2, snakeFood.y + snakeGridSize/2);

    // Draw Snake
    snake.forEach((segment, index) => {
        const isHead = index === 0;
        // Gradient for head
        drawRoundedRect(snakeCtx, segment.x+1, segment.y+1, snakeGridSize-2, snakeGridSize-2, 5, isHead ? '#ff85a2' : '#ffb6c1');
    });
}

/* =========================================================
   🧠 MEMORY CARD GAME 🧠
========================================================= */
const memoryEmojis = ['🐱', '🌸', '🍓', '🎀', '💖', '🦄', '🌈', '🍦'];
let memoryCards = [];
let memoryFlippedCards = [];
let memoryMatches = 0;
let memoryMoves = 0;
let memoryTimerInterval = null;
let memorySeconds = 0;
let memoryIsLocked = false;

function initMemoryGame() {
    startMemoryGame();
}

function startMemoryGame() {
    clearInterval(memoryTimerInterval);
    memorySeconds = 0;
    memoryMoves = 0;
    memoryMatches = 0;
    memoryFlippedCards = [];
    memoryIsLocked = false;
    document.getElementById('memory-moves').textContent = memoryMoves;
    document.getElementById('memory-time').textContent = memorySeconds;
    
    // Create deck
    memoryCards = [...memoryEmojis, ...memoryEmojis];
    // Shuffle
    memoryCards.sort(() => Math.random() - 0.5);

    const board = document.getElementById('memory-board');
    board.innerHTML = '';
    
    memoryCards.forEach((emoji, index) => {
        const card = document.createElement('div');
        card.classList.add('memory-card');
        card.setAttribute('data-index', index);
        card.setAttribute('data-emoji', emoji);

        const inner = document.createElement('div');
        inner.classList.add('memory-card-inner');

        const front = document.createElement('div');
        front.classList.add('memory-card-front');
        front.textContent = emoji;

        const back = document.createElement('div');
        back.classList.add('memory-card-back');

        inner.appendChild(front);
        inner.appendChild(back);
        card.appendChild(inner);

        card.addEventListener('click', flipMemoryCard);
        board.appendChild(card);
    });

    memoryTimerInterval = setInterval(() => {
        memorySeconds++;
        document.getElementById('memory-time').textContent = memorySeconds;
    }, 1000);
}

function flipMemoryCard() {
    if (memoryIsLocked) return;
    const card = this;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

    playSound('pop');
    card.classList.add('flipped');
    memoryFlippedCards.push(card);

    if (memoryFlippedCards.length === 2) {
        memoryMoves++;
        document.getElementById('memory-moves').textContent = memoryMoves;
        checkForMemoryMatch();
    }
}

function checkForMemoryMatch() {
    memoryIsLocked = true;
    const [card1, card2] = memoryFlippedCards;
    const isMatch = card1.getAttribute('data-emoji') === card2.getAttribute('data-emoji');

    if (isMatch) {
        playSound('win');
        card1.classList.add('matched');
        card2.classList.add('matched');
        memoryMatches++;
        memoryFlippedCards = [];
        memoryIsLocked = false;

        if (memoryMatches === memoryEmojis.length) {
            clearInterval(memoryTimerInterval);
            setTimeout(() => {
                shootConfetti();
                playSound('win');
                alert(`You won! 🎀\nMoves: ${memoryMoves}\nTime: ${memorySeconds}s`);
            }, 500);
        }
    } else {
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            memoryFlippedCards = [];
            memoryIsLocked = false;
        }, 1000);
    }
}