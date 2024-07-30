// Get the canvas element and its context to draw on
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d'); // '2d' context is used for drawing 2D graphics

// DOM end game elements
const scoreDisplay = document.getElementById("score");
const lastWindow = document.querySelector(".windowscore");
const informationDerr = document.getElementById("info");

lastWindow.style.display = "none";

// Set the canvas dimensions (these should match the HTML attributes)
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

// Player setup
const playerWidth = 50; // Width of the player
const playerHeight = 50; // Height of the player
let playerX = canvasWidth / 2 - playerWidth / 2; // Initial X position of the player (centered horizontally)
const playerY = canvasHeight - playerHeight - 10; // Initial Y position of the player (near bottom)
const playerSpeed = 5; // Speed at which the player moves

// Variables to track arrow key presses
let rightPressed = false; // Flag to track if right arrow is pressed
let leftPressed = false; // Flag to track if left arrow is pressed

// Bullet setup
const bullets = []; // Array to hold bullets
const bulletSpeed = 7; // Speed at which bullets move
let canShoot = true;
let shootInterval = 500; // Interval between shots in milliseconds

// Enemy bullet setup
const enemyBullets = [];
const enemyBulletSpeed = 3;

// Enemy setup
const enemies = []; // Array to hold enemies
const enemyWidth = 40; // Width of each enemy
const enemyHeight = 20; // Height of each enemy
const enemyGap = 10; // Gap between enemies
const enemyCols = 10; // Number of columns of enemies
const enemyRows = 3; // Number of rows of enemies
let enemySpeed = 1; // Speed at which enemies move horizontally
let enemyDirection = 1; // Direction of enemy movement (1 for right, -1 for left)
let enemyFallSpeed = 10; // Speed at which enemies move down vertically

// Boss setup for level 3
let boss = null;
const bossWidth = 100;
const bossHeight = 50;
let bossSpeed = 2;
let bossLives = 20;

// Score and lives variables
let score = 0;
let playerLives = 3;

// Variables to track game state
let isGameOver = false;
let currentLevel = 1;

// Function to set player color with linear gradient
function setPlayerColor(gradientColors) {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradientColors.forEach((colorStop, index) => {
        gradient.addColorStop(index / (gradientColors.length - 1), colorStop);
    });
    return gradient;
}

// Default gradient color
let defaultPlayerColor = setPlayerColor(['#004d00', '#009933']); // Dark green to medium green

// Event listeners for skin changes
document.querySelectorAll('.skin').forEach((skin, index) => {
    skin.addEventListener('click', () => {
        const colors = [
            ['#ff9a9e', '#fad0c4'], // Skin 1
            ['#a18cd1', '#fbc2eb'], // Skin 2
            ['#84fab0', '#8fd3f4'], // Skin 3
            ['#fbc2eb', '#a6c1ee'], // Skin 4
            ['#ffecd2', '#fcb69f'], // Skin 5
            ['#a1c4fd', '#c2e9fb'], // Skin 6
            ['#d4fc79', '#96e6a1'], // Skin 7
            ['#fccb90', '#d57eeb'], // Skin 8
            ['#ff6a88', '#ff99ac'], // Skin 9
            ['#ff9a9e', '#fecfef', '#fcb69f', '#ffecd2', '#ffecd2', '#a1c4fd', '#c2e9fb', '#d4fc79', '#96e6a1', '#84fab0', '#8fd3f4', '#a6c0fe', '#f68084', '#fccb90', '#d57eeb'] // Skin 10
        ];
        defaultPlayerColor = setPlayerColor(colors[index]);
    });
});

// Function to draw the player on the canvas
function drawPlayer() {
    ctx.fillStyle = defaultPlayerColor; // Set the player's color to the gradient
    ctx.fillRect(playerX, playerY, playerWidth, playerHeight); // Draw the player as a rectangle
}

// Function to draw a bullet on the canvas
function drawBullet(bullet) {
    ctx.fillStyle = defaultPlayerColor; // Set the bullet's color
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height); // Draw the bullet as a rectangle
}

// Function to draw an enemy bullet on the canvas
function drawEnemyBullet(bullet) {
    ctx.fillStyle = bullet.color || 'red'; // Set the bullet's color to red
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height); // Draw the bullet as a rectangle
}

// Function to check collision between two objects
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// Function to update enemy bullets
function updateEnemyBullets() {
    enemyBullets.forEach((bullet, index) => {
        bullet.y += enemyBulletSpeed;
        if (bullet.y > canvasHeight) {
            enemyBullets.splice(index, 1); // Remove the bullet if it goes off the bottom of the canvas
        } else {
            drawEnemyBullet(bullet); // Draw the bullet if it is still on the canvas
        }
        if (checkCollision(bullet, {x: playerX, y: playerY, width: playerWidth, height: playerHeight})) {
            enemyBullets.splice(index, 1); // Remove the bullet if it collides with the player
            playerLives--;
            checkPlayerLives();
        }
    });
}

// Function to check and update player lives
function checkPlayerLives() {
    if (playerLives == 2) {
        document.querySelector('.heart1 i').style.color ='gray';
    }
    if (playerLives == 1) {
        document.querySelector('.heart2 i').style.color ='gray';
    }
    /*const hearts = ['.heart1', '.heart2', '.heart3'];
    hearts.forEach((selector, index) => {
        document.querySelector(selector).style.color = index < playerLives ? 'red' : 'gray';
    });*/
    if (playerLives <= 0) {
        document.querySelector('.heart3 i').style.color ='gray';
        gameOver();
    }
}

// Function to draw an enemy on the canvas
function drawEnemy(enemy) {
    ctx.fillStyle = enemy.color; // Set the enemy's color
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height); // Draw the enemy as a rectangle
}

// Function to draw the boss on the canvas
function drawBoss() {
    if (boss) {
        ctx.fillStyle = 'purple'; // Set the boss's color
        ctx.fillRect(boss.x, boss.y, boss.width, boss.height); // Draw the boss as a rectangle
    }
}

// Function to create enemies in a grid pattern
function createEnemies(level) {
    enemies.length = 0; // Clear existing enemies
    const enemyCount = level === 1 ? 30 : 60;
    const rows = Math.ceil(enemyCount / enemyCols);
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < enemyCols; col++) {
            if (enemies.length >= enemyCount) break;
            let enemyX = col * (enemyWidth + enemyGap);
            let enemyY = row * (enemyHeight + enemyGap);
            let type = Math.random() < 0.4 ? 'anormal' : 'normal'; // 40% chance to be 'anormal'
            let color = type === 'anormal' ? 'white' : 'gray';
            enemies.push({ x: enemyX, y: enemyY, width: enemyWidth, height: enemyHeight, type, color });
        }
    }
}

// Function to create a boss for level 3
function createBoss() {
    boss = {
        x: canvasWidth / 2 - bossWidth / 2,
        y: 50,
        width: bossWidth,
        height: bossHeight,
        direction: 1, // 1 for right, -1 for left
        //shootPattern: 'spread' , // Initialize with a shooting pattern
        shootInterval: 500, // Time between shots in milliseconds
        lastShotTime: Date.now() // Track the last time the boss shot
    };
}

function shootStraight(boss) {
    const straightBullet = {
        x: boss.x + boss.width / 2 - 2.5,
        y: boss.y + boss.height,
        width: 5,
        height: 10,
        color: 'purple'
    };
    enemyBullets.push(straightBullet);
}

function shootSpread(boss) {
    const spreadAngle = Math.PI / 4; // 45 degrees
    for (let i = -2; i <= 2; i++) {
        const angle = spreadAngle * i;
        enemyBullets.push({
            x: boss.x + boss.width / 2 - 2.5,
            y: boss.y + boss.height,
            width: 5,
            height: 10,
            velocityX: Math.sin(angle) * 3,
            velocityY: Math.cos(angle) * 3,
            color: 'purple'
        });
    }
}

function shootBurst(boss) {
    for (let i = 0; i < 5; i++) {
        enemyBullets.push({
            x: boss.x + boss.width / 2 - 2.5,
            y: boss.y + boss.height,
            width: 5,
            height: 10,
            velocityX: Math.random() * 4 - 2,
            velocityY: Math.random() * 4,
            color: 'purple'
        });
    }
}

function shootWave(boss) {
    const waveSpeed = 5;
    for (let i = 0; i < 5; i++) {
        enemyBullets.push({
            x: boss.x + boss.width / 2 - 2.5,
            y: boss.y + boss.height,
            width: 5,
            height: 10,
            velocityX: waveSpeed * Math.sin(i * Math.PI / 5),
            velocityY: waveSpeed,
            color: 'purple'
        });
    }
}

// Array of shooting patterns
const shootingPatterns = [shootStraight, shootSpread, shootBurst, shootWave];

// Function to randomly choose a shooting pattern and execute it
function bossShoot(boss) {
    const now = Date.now();
    if (now - boss.lastShotTime >= boss.shootInterval) {
        boss.lastShotTime = now;
        // Randomly choose a shooting pattern
        const randomPattern = shootingPatterns[Math.floor(Math.random() * shootingPatterns.length)];
        randomPattern(boss);
    }
}


// Function to draw all enemies on the canvas
function drawEnemies() {
    enemies.forEach(drawEnemy); // Draw each enemy in the array
}

// Function to handle game over
function gameOver(playerWins = false) {
    isGameOver = true;
    lastWindow.style.display = "block";
    scoreDisplay.textContent = score;
    informationDerr.textContent = playerWins ? "Congratulations! You have won the game!" : "Game Over! You lost.";
}

// Function to shoot a bullet
function shootBullet() {
    if (canShoot) {
        const bullet = {
            x: playerX + playerWidth / 2 - 2.5,
            y: playerY,
            width: 5,
            height: 10,
            color: 'yellow'
        };
        bullets.push(bullet);
        canShoot = false;
        setTimeout(() => canShoot = true, shootInterval);
    }
}

// Function to update the game state (movement, drawing, etc.)
function updateGame() {
    if (isGameOver) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Clear the canvas for the next frame
    drawPlayer(); // Draw the player on the canvas
    drawEnemies(); // Draw all enemies on the canvas
    drawBoss(); // Draw the boss if it exists

    // Update bullets
    bullets.forEach((bullet, index) => {
        bullet.y -= bulletSpeed;
        if (bullet.y < 0) {
            bullets.splice(index, 1); // Remove the bullet if it goes off the top of the canvas
        } else {
            drawBullet(bullet); // Draw the bullet if it is still on the canvas
        }
        // Check bullet collision with enemies
        enemies.forEach((enemy, enemyIndex) => {
            if (checkCollision(bullet, enemy)) {
                bullets.splice(index, 1); // Remove the bullet
                enemies.splice(enemyIndex, 1); // Remove the enemy
                score += 10; // Increase the score
            }
        });
        // Check bullet collision with boss
        if (boss && checkCollision(bullet, boss)) {
            bullets.splice(index, 1); // Remove the bullet
            bossLives--; // Decrease boss lives
            if (bossLives <= 0) {
                boss = null; // Remove the boss
                currentLevel++;
                score += 100;
                if (currentLevel > 3) {
                    setTimeout(() => gameOver(true), 800); // Player wins the game // Player wins the game
                } else {
                    createEnemies(currentLevel); // Create new enemies for the next level
                }
            }
            score += 50; // Increase the score
        }
    });

    // Enemy shooting logic
    enemies.forEach(enemy => {
        if (Math.random() < 0.01 && enemy.type === 'anormal') {
            const bullet = {
                x: enemy.x + enemy.width / 2 - 5,
                y: enemy.y + enemy.height,
                width: 5,
                height: 10,
                color: 'red'
            };
            enemyBullets.push(bullet);
        }
        if (checkCollision(enemy, { x: playerX, y: playerY, width: playerWidth, height: playerHeight })) {
            playerLives--;
            checkPlayerLives();
        }
    });

    // Update enemy bullets
    updateEnemyBullets();

    // Move enemies horizontally and check if any need to move down
    let shouldMoveDown = false;
    enemies.forEach(enemy => {
        enemy.x += enemySpeed * enemyDirection;
        if (enemy.x + enemy.width >= canvasWidth || enemy.x <= 0) {
            shouldMoveDown = true;
        }
    });

    if (shouldMoveDown) {
        enemies.forEach(enemy => {
            enemy.y += enemyFallSpeed;
        });
        enemyDirection = -enemyDirection; // Reverse the direction
    }

    // Update boss movement
    if (boss) {
        boss.x += bossSpeed * boss.direction;
        if (boss.x + boss.width > canvasWidth || boss.x < 0) {
            boss.direction *= -1; // Reverse direction if the boss hits the screen edges
        }
        bossShoot(boss); // Call the shooting function for the boss
    }

    // Check if all enemies are destroyed (next level)
    if (enemies.length === 0 && !boss) {
        currentLevel++;
        score += 50;
        enemySpeed += 0.2;
        document.getElementById("level").innerHTML = currentLevel;
        if (currentLevel === 3) {
            createBoss(); // Create a boss for level 3
            document.getElementById("level").innerHTML = currentLevel;
        } else {
            createEnemies(currentLevel); // Create new enemies for next level
        }
    }

    // Handle player movement based on key presses
    if (rightPressed && playerX < canvasWidth - playerWidth) {
        playerX += playerSpeed; // Move player to the right
    } else if (leftPressed && playerX > 0) {
        playerX -= playerSpeed; // Move player to the left
    }

    // Draw the score and lives on the canvas
    ctx.font = "20px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(`Score: ${score}`, 10, 30);

    requestAnimationFrame(updateGame); // Request next frame update
}


// Event listener for keydown events (when a key is pressed)
document.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'd') {
        rightPressed = true;
    } else if (event.key === 'ArrowLeft' || event.key === 'a') {
        leftPressed = true;
    } else if (event.key === ' ') {
        shootBullet();
    }
});

// Event listener for keyup events (when a key is released)
document.addEventListener('keyup', event => {
    if (event.key === 'ArrowRight' || event.key === 'd') {
        rightPressed = false;
    } else if (event.key === 'ArrowLeft' || event.key === 'a') {
        leftPressed = false;
    }
});

// Initialize the game by creating enemies and starting the game loop
createEnemies(currentLevel); // Create initial enemies for level 1
updateGame(); // Start the game loop

//function to load the page gain
function resetGame(){
    window.location.reload();
}