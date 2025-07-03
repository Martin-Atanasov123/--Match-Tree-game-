
// Game State Management
class GameState {
    constructor() {
        this.score = 0;
        this.level = 1;
        this.lives = 5;
        this.stars = 0;
        this.board = [];
        this.isPlaying = false;
        this.educationalMode = false;
        this.selectedBlocks = [];
        this.isAnimating = false;
        this.sessionStartTime = null;
        this.colors = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange', 'cyan'];
        this.blockEmojis = {
            red: '🔴',
            blue: '🔵', 
            green: '🟢',
            yellow: '🟡',
            purple: '🟣',
            pink: '🩷',
            orange: '🟠',
            cyan: '🔷'
        };
        this.mascotPhrases = {
            start: ['Let\'s play!', 'Ready to match!', 'Fun time!'],
            good: ['Great job!', 'Awesome!', 'Super!', 'Wow!'],
            excellent: ['Amazing!', 'Fantastic!', 'Incredible!', 'Perfect!'],
            gameOver: ['Good try!', 'Play again?', 'Nice effort!']
        };
    }

    reset() {
        this.score = 0;
        this.level = 1;
        this.lives = 5;
        this.stars = 0;
        this.selectedBlocks = [];
        this.isAnimating = false;
        this.generateBoard();
    }

    generateBoard() {
        this.board = [];
        for (let i = 0; i < 8; i++) {
            this.board[i] = [];
            for (let j = 0; j < 8; j++) {
                this.board[i][j] = this.colors[Math.floor(Math.random() * this.colors.length)];
            }
        }
    }

    findAdjacentBlocks(row, col, color) {
        const visited = new Set();
        const result = [];
        const queue = [{row, col}];

        while (queue.length > 0) {
            const {row: r, col: c} = queue.shift();
            const key = `${r}-${c}`;

            if (visited.has(key)) continue;
            if (r < 0 || r >= 8 || c < 0 || c >= 8) continue;
            if (!this.board[r] || this.board[r][c] !== color) continue;

            visited.add(key);
            result.push({row: r, col: c});

            queue.push(
                {row: r - 1, col: c},
                {row: r + 1, col: c},
                {row: r, col: c - 1},
                {row: r, col: c + 1}
            );
        }

        return result;
    }

    clearBlocks(blocks) {
        blocks.forEach(({row, col}) => {
            this.board[row][col] = null;
        });

        // Calculate score
        const basePoints = blocks.length * 10;
        const multiplier = Math.max(1, blocks.length - 2);
        const points = basePoints * multiplier;
        this.score += points;

        // Educational mode bonus
        if (this.educationalMode && blocks.length >= 5) {
            this.stars++;
            SoundManager.playSound('success');
        }

        // Apply gravity and fill
        this.applyGravity();
        this.fillEmptySpaces();
    }

    applyGravity() {
        for (let col = 0; col < 8; col++) {
            const column = [];
            for (let row = 0; row < 8; row++) {
                if (this.board[row][col] !== null) {
                    column.push(this.board[row][col]);
                }
            }

            for (let row = 0; row < 8; row++) {
                const blockIndex = row - (8 - column.length);
                this.board[row][col] = blockIndex >= 0 ? column[blockIndex] : null;
            }
        }
    }

    fillEmptySpaces() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] === null) {
                    this.board[row][col] = this.colors[Math.floor(Math.random() * this.colors.length)];
                }
            }
        }
    }

    checkLevelComplete() {
        return this.score >= this.level * 1000;
    }
}

// Sound Manager
class SoundManagerClass {
    constructor() {
        this.isMuted = false;
        this.sounds = {};
    }

    playSound(soundName) {
        if (this.isMuted) return;

        const soundEmojis = {
            blockClear: '💥',
            success: '🎉',
            error: '❌',
            powerUp: '✨',
            levelComplete: '🏆',
            click: '🔘',
        };

        console.log(`🔊 Playing sound: ${soundName} ${soundEmojis[soundName] || '🎵'}`);
        
        // Create audio feedback through vibration on mobile
        if ('vibrate' in navigator) {
            switch(soundName) {
                case 'blockClear':
                    navigator.vibrate([50, 30, 50]);
                    break;
                case 'success':
                    navigator.vibrate([100, 50, 100, 50, 100]);
                    break;
                case 'error':
                    navigator.vibrate(200);
                    break;
                default:
                    navigator.vibrate(30);
            }
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        console.log(`🔊 Sound ${this.isMuted ? 'muted' : 'unmuted'}`);
    }
}

// UI Manager
class UIManager {
    constructor(gameState, soundManager) {
        this.gameState = gameState;
        this.soundManager = soundManager;
        this.sessionTimer = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Start screen
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('parentBtn').addEventListener('click', () => {
            this.showParentalDashboard();
        });

        // Game controls
        document.getElementById('learnModeBtn').addEventListener('click', () => {
            this.toggleEducationalMode();
        });

        // Modal controls
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.hideGameOverModal();
            this.startGame();
        });

        document.getElementById('backToMenuBtn').addEventListener('click', () => {
            this.hideGameOverModal();
            this.showStartScreen();
        });

        document.getElementById('closeParentalBtn').addEventListener('click', () => {
            this.hideParentalDashboard();
        });

        // Power-up buttons
        document.querySelectorAll('.powerup-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const powerup = e.target.dataset.powerup;
                this.activatePowerUp(powerup);
            });
        });

        // Touch/click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });
    }

    startGame() {
        this.gameState.reset();
        this.gameState.isPlaying = true;
        this.gameState.sessionStartTime = Date.now();
        
        this.showGameScreen();
        this.renderBoard();
        this.updateUI();
        this.updateMascot('start');
        this.startSessionTimer();
        
        this.soundManager.playSound('click');
    }

    showStartScreen() {
        document.getElementById('startScreen').classList.add('active');
        document.getElementById('gameScreen').classList.remove('active');
        this.gameState.isPlaying = false;
        this.stopSessionTimer();
    }

    showGameScreen() {
        document.getElementById('startScreen').classList.remove('active');
        document.getElementById('gameScreen').classList.add('active');
    }

    renderBoard() {
        const boardElement = document.getElementById('gameBoard');
        boardElement.innerHTML = '';

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const block = document.createElement('div');
                block.className = `block ${this.gameState.board[i][j] || 'empty'}`;
                block.dataset.row = i;
                block.dataset.col = j;
                
                if (this.gameState.board[i][j]) {
                    block.textContent = this.gameState.blockEmojis[this.gameState.board[i][j]];
                    block.addEventListener('click', () => this.handleBlockClick(i, j));
                }

                boardElement.appendChild(block);
            }
        }
    }

    handleBlockClick(row, col) {
        if (this.gameState.isAnimating || !this.gameState.board[row][col]) return;

        const color = this.gameState.board[row][col];
        const adjacentBlocks = this.gameState.findAdjacentBlocks(row, col, color);

        if (adjacentBlocks.length < 2) {
            this.soundManager.playSound('error');
            this.updateMascot('error');
            return;
        }

        this.gameState.selectedBlocks = adjacentBlocks;
        this.highlightSelectedBlocks();
        
        setTimeout(() => {
            this.clearSelectedBlocks();
        }, 500);
    }

    highlightSelectedBlocks() {
        this.gameState.selectedBlocks.forEach(({row, col}) => {
            const blockElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (blockElement) {
                blockElement.classList.add('selected');
            }
        });
    }

    clearSelectedBlocks() {
        this.gameState.isAnimating = true;
        this.soundManager.playSound('blockClear');

        // Add animation class
        this.gameState.selectedBlocks.forEach(({row, col}) => {
            const blockElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (blockElement) {
                blockElement.classList.add('animating');
            }
        });

        setTimeout(() => {
            this.gameState.clearBlocks(this.gameState.selectedBlocks);
            this.gameState.selectedBlocks = [];
            this.gameState.isAnimating = false;
            
            this.renderBoard();
            this.updateUI();
            
            if (this.gameState.selectedBlocks.length >= 5) {
                this.updateMascot('excellent');
            } else {
                this.updateMascot('good');
            }

            // Check level completion
            if (this.gameState.checkLevelComplete()) {
                this.levelUp();
            }
        }, 300);
    }

    levelUp() {
        this.gameState.level++;
        this.gameState.stars += 3;
        this.soundManager.playSound('levelComplete');
        this.updateMascot('excellent');
        this.updateUI();
    }

    updateUI() {
        document.getElementById('scoreValue').textContent = this.gameState.score.toLocaleString();
        document.getElementById('levelValue').textContent = this.gameState.level;
        document.getElementById('starsValue').textContent = this.gameState.stars;

        // Update lives
        const livesContainer = document.getElementById('livesContainer');
        livesContainer.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const heart = document.createElement('div');
            heart.className = `life-heart ${i < this.gameState.lives ? 'active' : 'inactive'}`;
            heart.textContent = '❤️';
            livesContainer.appendChild(heart);
        }

        // Update educational tip
        const tip = document.getElementById('educationalTip');
        if (this.gameState.educationalMode) {
            tip.classList.remove('hidden');
        } else {
            tip.classList.add('hidden');
        }
    }

    updateMascot(emotion) {
        const mascot = document.getElementById('mascot');
        const speech = document.getElementById('mascotSpeech');
        
        const phrases = this.gameState.mascotPhrases[emotion] || this.gameState.mascotPhrases.start;
        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
        
        speech.textContent = randomPhrase;
        
        // Animate mascot
        mascot.style.transform = 'scale(1.2)';
        setTimeout(() => {
            mascot.style.transform = 'scale(1)';
        }, 200);
    }

    toggleEducationalMode() {
        this.gameState.educationalMode = !this.gameState.educationalMode;
        const btn = document.getElementById('learnModeBtn');
        
        if (this.gameState.educationalMode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
        
        this.updateUI();
        this.soundManager.playSound('click');
    }

    activatePowerUp(type) {
        this.soundManager.playSound('powerUp');
        
        switch(type) {
            case 'rainbow':
                this.rainbowPowerUp();
                break;
            case 'magnet':
                this.magnetPowerUp();
                break;
            case 'freeze':
                this.freezePowerUp();
                break;
        }
    }

    rainbowPowerUp() {
        // Clear random blocks of all colors
        const blocksToRemove = [];
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (Math.random() < 0.3) {
                    blocksToRemove.push({row: i, col: j});
                }
            }
        }
        
        if (blocksToRemove.length > 0) {
            this.gameState.clearBlocks(blocksToRemove);
            this.renderBoard();
            this.updateUI();
        }
    }

    magnetPowerUp() {
        // Group similar colors together
        const colorCounts = {};
        this.gameState.colors.forEach(color => {
            colorCounts[color] = 0;
        });

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (this.gameState.board[i][j]) {
                    colorCounts[this.gameState.board[i][j]]++;
                }
            }
        }

        // Find the most common color and create a large group
        const mostCommonColor = Object.keys(colorCounts).reduce((a, b) => 
            colorCounts[a] > colorCounts[b] ? a : b
        );

        // Fill a 3x3 area with the most common color
        for (let i = 2; i < 5; i++) {
            for (let j = 2; j < 5; j++) {
                this.gameState.board[i][j] = mostCommonColor;
            }
        }

        this.renderBoard();
    }

    freezePowerUp() {
        // Add special visual effect and prevent new blocks from falling
        document.getElementById('gameBoard').style.filter = 'hue-rotate(180deg)';
        setTimeout(() => {
            document.getElementById('gameBoard').style.filter = 'none';
        }, 2000);
    }

    showGameOverModal() {
        document.getElementById('finalScore').textContent = this.gameState.score.toLocaleString();
        document.getElementById('gameOverModal').classList.remove('hidden');
        this.updateMascot('gameOver');
    }

    hideGameOverModal() {
        document.getElementById('gameOverModal').classList.add('hidden');
    }

    showParentalDashboard() {
        const sessionTime = this.gameState.sessionStartTime ? 
            Math.floor((Date.now() - this.gameState.sessionStartTime) / 1000) : 0;
        
        const minutes = Math.floor(sessionTime / 60);
        const seconds = sessionTime % 60;
        
        document.getElementById('sessionTime').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('totalScore').textContent = this.gameState.score.toLocaleString();
        document.getElementById('totalStars').textContent = this.gameState.stars;
        
        document.getElementById('parentalModal').classList.remove('hidden');
    }

    hideParentalDashboard() {
        document.getElementById('parentalModal').classList.add('hidden');
    }

    startSessionTimer() {
        this.sessionTimer = setInterval(() => {
            // Update session time if needed
        }, 1000);
    }

    stopSessionTimer() {
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
            this.sessionTimer = null;
        }
    }
}

// Initialize Game
const gameState = new GameState();
const SoundManager = new SoundManagerClass();
const uiManager = new UIManager(gameState, SoundManager);

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🧩Match three✨🎮  loaded!');
    
    // Add touch event optimizations
    document.addEventListener('touchstart', function() {}, {passive: true});
    document.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, {passive: false});
    
    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
});

// Handle visibility change to pause/resume
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('🎮 Game paused');
    } else {
        console.log('🎮 Game resumed');
    }
});

// Export for potential future use
window.GameState = GameState;
window.SoundManager = SoundManager;
window.UIManager = UIManager;
