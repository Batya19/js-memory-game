// משתנים קבועים
const difficultyButtons = document.querySelectorAll('#difficulty-buttons button');
const difficultyPopup = document.getElementById('difficulty-popup');
const board = document.getElementById('game-board');
const timerDisplay = document.getElementById('timer');
const winPopup = document.getElementById('win-popup');
const winTimeDisplay = document.getElementById('win-time');
const nextLevelBtn = document.getElementById('next-level-btn');
const homeBtn = document.getElementById('home-btn');
const instructionsBtn = document.getElementById('instructions-btn');
const instructionsPopup = document.getElementById('instructions-popup');
const closeInstructionsBtn = document.getElementById('close-instructions-btn');
const winSound = document.getElementById('win-sound');
const matchSound = document.getElementById('match-sound');
const mismatchSound = document.getElementById('mismatch-sound');
const timerContainer = document.getElementById('timer-container');
const cardBackButton = document.getElementById('card-back-button');
const cardBackPopup = document.getElementById('card-back-popup');
const cardBackImages = document.querySelectorAll('#card-back-options img');
const overlay = document.getElementById('overlay');
const matchedPile = document.getElementById('matched-pile');

//משתני המשחק
const gameState = {
    cardValues: [],
    firstCard: null,
    secondCard: null,
    attempts: 0,
    lockBoard: false,
    matchedPairs: 0,
    instructionsOpen: false,
    currentDifficulty: null,
    hintsRemaining: 3,
    score: 0,
    hasPlayedBefore: false,
    startTime: 0,
    elapsedTime: 0,
    timerInterval: null,
    isTimerRunning: false
};

//ערכי הכרטיסים
const cardValuesSet = {
    easy: ['🌟', '🍭', '🎨', '🦄'],
    medium: ['🌟', '🙊', '🌈', '🦋', '🍿', '🪗'],
    hard: ['🎹', '🌈', '🍭', '🌵', '🎸', '🚀', '🐧', '🧩', '🎨']
};

//גודל הכרטיסים בהתאמה לרמת הקושי
const cardSize = {
    easy: '284px',
    medium: '199px',
    hard: '152px'
};

//פונקצית התחלת המשחק
const startGame = difficulty => {
    difficultyPopup.classList.add('hidden');
    document.getElementById('game-container').classList.remove('hidden');
    cardBackButton.classList.remove('hidden');
    cardBackButton.style.display = 'block';

    gameState.currentDifficulty = difficulty;
    resetGame();
    gameState.cardValues = shuffle([...cardValuesSet[difficulty], ...cardValuesSet[difficulty]]);
    gameState.cardValues.forEach(value => {
        board.appendChild(createCard(value));
    });

    adjustCardSize(difficulty);

    if (!gameState.hasPlayedBefore) {
        showInstructions();
        gameState.hasPlayedBefore = true;
    } else {
        handleTimer('start');
    }
};

//פונקציה להתאמת גודל הכרטיסים בהתאם לרמת הקושי
const adjustCardSize = (difficulty) => {
    const cards = document.querySelectorAll('.card');
    const maxWidth = cardSize[difficulty];
    cards.forEach(card => {
        card.style.maxWidth = maxWidth;
    });
};

//יצירת כרטיס
const createCard = value => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.innerHTML = `
        <div class="card-inner">
            <div class="card-front">${value}</div>
            <div class="card-back"></div>
        </div>`;
    card.addEventListener('click', flipCard);
    return card;
};

//הפיכת כרטיס
const flipCard = function () {
    if (gameState.lockBoard || this === gameState.firstCard) return;
    this.classList.add('flipped');

    if (!gameState.firstCard) {
        gameState.firstCard = this;
    } else {
        gameState.secondCard = this;
        checkForMatch();
    }
};

//בדיקת התאמה
const checkForMatch = () => {
    const isMatch = gameState.firstCard.querySelector('.card-front').textContent ===
        gameState.secondCard.querySelector('.card-front').textContent;
    isMatch ? disableCards() : unflipCards();
    gameState.attempts++;
    updateDisplays();
    if (gameState.matchedPairs === gameState.cardValues.length / 2) {
        setTimeout(showWinPopup, 1500);
    }
};

//טיפול בכרטיסים תואמים
const disableCards = () => {
    matchSound.play();
    gameState.firstCard.removeEventListener('click', flipCard);
    gameState.secondCard.removeEventListener('click', flipCard);

    animateToMatchedPile(gameState.firstCard);
    animateToMatchedPile(gameState.secondCard);

    resetBoard();
    gameState.matchedPairs++;
    updateScore(15);
    updateDisplays();

    if (gameState.matchedPairs === gameState.cardValues.length / 2) {
        handleTimer('pause');
    }
};

//הפיכת כרטיסים לא תואמים
const unflipCards = () => {
    gameState.lockBoard = true;
    mismatchSound.play();
    setTimeout(() => {
        gameState.firstCard.classList.remove('flipped');
        gameState.secondCard.classList.remove('flipped');
        resetBoard();
    }, 1500);
};

//איפוס הלוח
const resetBoard = () => {
    gameState.firstCard = null;
    gameState.secondCard = null;
    gameState.lockBoard = false;
};

//הנפשת כרטיסים לערימה המותאמת
const animateToMatchedPile = (card) => {
    setTimeout(() => {
        const rect = card.getBoundingClientRect();
        const pileRect = matchedPile.getBoundingClientRect();

        const clone = card.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.left = `${rect.left}px`;
        clone.style.top = `${rect.top}px`;
        clone.style.transition = 'all 1s ease-in-out';
        clone.style.zIndex = '1000';
        document.body.appendChild(clone);

        setTimeout(() => {
            clone.style.left = `${pileRect.left + 10}px`;
            clone.style.top = `${pileRect.bottom - 130}px`;
            clone.style.transform = 'scale(0.5)';
        }, 50);

        setTimeout(() => {
            document.body.removeChild(clone);
            const miniCard = document.createElement('div');
            miniCard.className = 'mini-card';
            miniCard.textContent = card.querySelector('.card-front').textContent;
            const matchedCards = document.getElementById('matched-cards');
            matchedCards.appendChild(miniCard);

            const cardCount = matchedCards.children.length;
            miniCard.style.bottom = `${(cardCount - 1) * 20}px`;
        }, 1050);

        card.style.visibility = 'hidden';
    }, 500);
};

//הפעלת טיימר
const handleTimer = (action) => {
    switch (action) {
        case 'start':
            if (!gameState.isTimerRunning) {
                gameState.startTime = Date.now() - gameState.elapsedTime;
                gameState.timerInterval = setInterval(updateTimer, 1000);
                gameState.isTimerRunning = true;
            }
            break;
        case 'pause':
            if (gameState.isTimerRunning) {
                clearInterval(gameState.timerInterval);
                gameState.isTimerRunning = false;
                // Store the elapsed time when pausing
                gameState.elapsedTime = Date.now() - gameState.startTime;
            }
            break;
        case 'resume':
            if (!gameState.isTimerRunning) {
                gameState.startTime = Date.now() - gameState.elapsedTime;
                gameState.timerInterval = setInterval(updateTimer, 1000);
                gameState.isTimerRunning = true;
            }
            break;
        case 'reset':
            clearInterval(gameState.timerInterval);
            gameState.elapsedTime = 0;
            gameState.isTimerRunning = false;
            updateTimerDisplay(0);
            break;
        default:
            console.log(); ('Invalid timer action');
    }
};

//עדכון הטיימר
const updateTimer = () => {
    const currentTime = Date.now();
    gameState.elapsedTime = Math.floor((currentTime - gameState.startTime) / 1000);
    updateTimerDisplay(gameState.elapsedTime);
};

//עדכון תצוגת הטיימר
const updateTimerDisplay = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    const displayText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    timerDisplay.textContent = displayText;
    // timerContainer.innerHTML = `⏱️ ${displayText}`;
};

//הצגת פופאפ ניצחון
function showWinPopup() {
    handleTimer('pause');
    winSound.play();

    const winPopupContent = {
        'win-time': timerDisplay.textContent,
        'win-score': gameState.score,
        'win-message': `⏱️ Game Time: ${timerDisplay.textContent}`
    };

    Object.entries(winPopupContent).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });

    displayHighestScore();

    document.getElementById('overlay').classList.remove('hidden');
    document.getElementById('overlay').classList.add('win-overlay');
    document.getElementById('win-popup').classList.remove('hidden');

    showWinConfetti();
    saveScore();
}

//הסתרת פופאפ ניצחון
const hideWinPopup = () => {
    overlay.classList.add('hidden');
    overlay.classList.remove('win-overlay');
    winPopup.classList.add('hidden');
};

//הצגת אפקט קונפטי
const showWinConfetti = () => {
    const options = {
        particleCount: 5000,
        angle: 90,
        spread: 450,
        startVelocity: 80,
        decay: 0.9,
        gravity: 0.1,
        drift: 0,
        ticks: 350,
        x: 0.5,
        y: 0.5,
        colors: ["#ff69b4", "#ff4500", "#1e90ff", "#32cd32", "#ffff00", "#8a2be2"],
    };
    confetti(options);
};

//שמירת ניקוד גבוה
const saveScore = () => {
    const playerName = localStorage.getItem('playerName');
    const timeDisplay = timerDisplay.textContent;
    let totalSeconds;
    if (timeDisplay.includes(':')) {
        const [minutes, seconds] = timeDisplay.split(':').map(Number);
        totalSeconds = minutes * 60 + seconds;
    } else {
        totalSeconds = parseInt(timeDisplay);
    }
    const currentScore = {
        time: timeDisplay,
        timeInSeconds: totalSeconds,
        attempts: gameState.attempts,
        difficulty: gameState.currentDifficulty,
        score: gameState.score
    };

    let players = JSON.parse(localStorage.getItem('players')) || {};
    if (!players[playerName] || currentScore.score > players[playerName].score) {
        players[playerName] = currentScore;
        localStorage.setItem('players', JSON.stringify(players));
    }
};

//הצגת ניקוד גבוה
const displayHighestScore = () => {
    const playerName = localStorage.getItem('playerName');
    const players = JSON.parse(localStorage.getItem('players')) || {};
    const playerScore = players[playerName];

    if (playerScore) {
        let scoreDisplay = document.getElementById('highest-score');
        if (!scoreDisplay) {
            scoreDisplay = document.createElement('div');
            scoreDisplay.id = 'highest-score';
            document.body.appendChild(scoreDisplay);
        }

        scoreDisplay.innerHTML = `
            <h3>Your Highest Score:</h3>
            <p>Time: ${playerScore.time}</p>
            <p>Attempts: ${playerScore.attempts}</p>
            <p>Difficulty: ${playerScore.difficulty}</p>
            <p>Score: ${playerScore.score}</p>
        `;
    }
};

//עדכון הניקוד
const updateScore = (points) => {
    const timeBonus = Math.max(0, 150 - gameState.elapsedTime);
    gameState.score += points + timeBonus;
    updateDisplays();
};

//הצגת רמז
document.getElementById('hint-btn').addEventListener('click',
    showHint = () => {
        if (gameState.hintsRemaining > 0) {
            const unmatchedCards = Array.from(document.querySelectorAll('.card:not(.matched):not(.flipped)'));
            const unmatchedPairs = [];

            for (let i = 0; i < unmatchedCards.length; i++) {
                for (let j = i + 1; j < unmatchedCards.length; j++) {
                    if (unmatchedCards[i].querySelector('.card-front').textContent ===
                        unmatchedCards[j].querySelector('.card-front').textContent) {
                        unmatchedPairs.push([unmatchedCards[i], unmatchedCards[j]]);
                        break;
                    }
                }
            }

            if (unmatchedPairs.length > 0) {
                const randomPair = unmatchedPairs[Math.floor(Math.random() * unmatchedPairs.length)];
                randomPair.forEach(card => {
                    card.classList.add('hint');
                    setTimeout(() => card.classList.remove('hint'), 3000);
                });
                gameState.hintsRemaining--;
                updateDisplays();
            }
        } else {
            alert('No hints remaining!');
        }
    }
);

//הצגת לוח תוצאות
document.getElementById('show-leaderboard-btn').addEventListener('click', () => {
    const leaderboardBody = document.getElementById('leaderboard-body');
    leaderboardBody.innerHTML = '';

    const players = JSON.parse(localStorage.getItem('players')) || {};
    const sortedPlayers = Object.entries(players).sort((a, b) => b[1].score - a[1].score);

    sortedPlayers.forEach((player, index) => {
        const [name, data] = player;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${name}</td>
            <td>${data.score}</td>
            <td>${data.difficulty}</td>
            <td>${data.time}</td>
            <td>${data.attempts}</td>
        `;
        leaderboardBody.appendChild(row);
    });

    document.getElementById('leaderboard-popup').classList.remove('hidden');
    document.getElementById('overlay').classList.remove('hidden');
});

//סגירת לוח תוצאות
document.getElementById('close-leaderboard-btn').addEventListener('click', () => {
    document.getElementById('leaderboard-popup').classList.add('hidden');
    document.getElementById('overlay').classList.add('hidden');
});

//הצגת הוראות
const showInstructions = () => {
    instructionsPopup.classList.remove('hidden');
    gameState.instructionsOpen = true;
    document.getElementById('overlay').classList.remove('hidden');
    handleTimer('pause');
};

//הצגת פופאפ עזיבה
function showLeaveGamePopup(action) {
    document.getElementById('leave-game-popup').classList.remove('hidden');
    document.getElementById('overlay').classList.remove('hidden');
    document.getElementById('confirm-leave').dataset.action = action;
}

//בחירת גב הכרטיס
cardBackButton.addEventListener('click', () => {
    cardBackPopup.classList.toggle('hidden');
});

//בחירת תמונה לגב הכרטיס
cardBackImages.forEach(img => {
    img.addEventListener('click', () => {
        const selectedImage = img.id + '.jpg';
        document.querySelectorAll('.card-back').forEach(cardBack => {
            cardBack.style.backgroundImage = `url(../images/${selectedImage})`;
        });
        cardBackPopup.classList.add('hidden');
    });
});

//עדכון כל התצוגות
const updateDisplays = () => {
    document.getElementById('attempts').textContent = gameState.attempts;
    document.getElementById('matched-pairs').textContent = gameState.matchedPairs;
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('hints-remaining').textContent = gameState.hintsRemaining;
};

//איפוס משתני המשחק
const resetGameState = () => {
    gameState.attempts = 0;
    gameState.matchedPairs = 0;
    gameState.firstCard = null;
    gameState.secondCard = null;
    gameState.lockBoard = false;
    gameState.hintsRemaining = 3;
    gameState.score = 0;
    gameState.elapsedTime = 0;
};

//איפוס המשחק
const resetGame = () => {
    board.innerHTML = '';
    document.getElementById('matched-cards').innerHTML = '';
    resetGameState();
    updateDisplays();
    handleTimer('reset');
    handleTimer('start');
};

//ערבוב מערך
const shuffle = array => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

//הצגת פופאפ בחירת רמה
const showDifficultyPopup = () => {
    const playerName = localStorage.getItem('playerName');
    document.getElementById('playerName').textContent = playerName;
    difficultyPopup.classList.remove('hidden');
    document.getElementById('game-container').classList.add('hidden');
    document.getElementById('show-leaderboard-btn').classList.remove('hidden');

    document.getElementById('game-board').style.display = 'flex';
    document.getElementById('timer-container').style.display = 'block';
    document.getElementById('hint-container').style.display = 'block';
    document.getElementById('home-button').style.display = 'block';
    document.getElementById('matched-pile').style.display = 'block';

    cardBackButton.style.display = 'none';

    resetGame();
};

//טעינה ראשונית
window.addEventListener('load', () => {
    showDifficultyPopup();
});

//בחירת רמה
difficultyButtons.forEach(button => {
    button.addEventListener('click', () => startGame(button.id));
});

//מעבר לרמה הבאה
nextLevelBtn.addEventListener('click', () => {
    hideWinPopup();
    winSound.pause();
    winSound.currentTime = 0;
    const nextDifficulty = {
        'easy': 'medium',
        'medium': 'hard',
        'hard': null
    }[gameState.currentDifficulty];

    if (nextDifficulty) {
        startGame(nextDifficulty);
    } else {
        alert('You have completed all levels!');
        showDifficultyPopup();
    }
});

//חזרה למסך הבית
homeBtn.addEventListener('click', () => {
    hideWinPopup();
    winSound.pause();
    winSound.currentTime = 0;
    showDifficultyPopup();
});

//הצגת הוראות
instructionsBtn.addEventListener('click', () => {
    handleTimer('pause');
    instructionsPopup.classList.remove('hidden');
    document.getElementById('overlay').classList.remove('hidden');
    gameState.instructionsOpen = true;
});

//סגירת הוראות
closeInstructionsBtn.addEventListener('click', () => {
    document.getElementById('overlay').classList.add('hidden');
    instructionsPopup.classList.add('hidden');
    gameState.instructionsOpen = false;
    if (!gameState.isTimerRunning) {
        handleTimer('start');
    } else {
        handleTimer('resume');
    }
});

//החלפת משתמש
document.getElementById('switchUserBtn').addEventListener('click', () => {
    showLeaveGamePopup('switchUser');
});

//חזרה למסך הבית
document.getElementById('home-button').addEventListener('click', () => {
    showLeaveGamePopup('home');
});

//אישור עזיבה
document.getElementById('confirm-leave').addEventListener('click', (event) => {
    document.getElementById('leave-game-popup').classList.add('hidden');
    document.getElementById('overlay').classList.add('hidden');

    const action = event.target.getAttribute('data-action');
    if (action === 'switchUser') {
        window.location.href = '../index.html';
    } else {
        showDifficultyPopup();
    }
});

//ביטול עזיבה
document.getElementById('cancel-leave').addEventListener('click', () => {
    document.getElementById('leave-game-popup').classList.add('hidden');
    document.getElementById('overlay').classList.add('hidden');
});