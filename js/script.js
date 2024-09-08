const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;


// Carrega as imagens da nave do jogador e dos inimigos
const shipImage = new Image();
shipImage.src = 'imgs/player.png';

const enemyImages = [];
for (let i = 1; i <= 10; i++) {
    const img = new Image();
    img.src = `imgs/enemy${i}.png`;
    enemyImages.push(img);
}

// Carrega as imagens de explosão
const explosionImages = [];
for (let i = 1; i <= 10; i++) {
    const img = new Image();
    img.src = `imgs/explosion${i}.png`;
    explosionImages.push(img);
}

let ship = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 60,
    width: 40,
    height: 40,
    speed: 5,
    movingLeft: false,
    movingRight: false,
    movingUp: false,
    movingDown: false,
    angle: 0,
    health: 100 // Vida inicial do jogador
};
// Função para desenhar estrelas
function drawStar(x, y, radius, points, inset) {
    ctx.beginPath();
    ctx.save();
    ctx.translate(x, y);
    ctx.moveTo(0, 0 - radius);
    for (let i = 0; i < points; i++) {
        ctx.rotate(Math.PI / points);
        ctx.lineTo(0, 0 - (radius * inset));
        ctx.rotate(Math.PI / points);
        ctx.lineTo(0, 0 - radius);
    }
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.restore();
}

// Função para gerar estrelas aleatórias
// Função para gerar estrelas aleatórias
function createStars(count) {
    const stars = [];
    for (let i = 0; i < count; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 2 + 1;
        const speed = Math.random() * 0.5 + 0.1; // Velocidade aleatória para a estrela
        stars.push({ x, y, radius, speed });
    }
    return stars;
}


// Array de estrelas
const stars = createStars(200);


function updateStars() {
    stars.forEach(star => {
        star.y += star.speed; // Move a estrela para baixo

        // Reposiciona a estrela quando ela sai da tela
        if (star.y > canvas.height) {
            star.y = -star.radius; // Move a estrela de volta para o topo
            star.x = Math.random() * canvas.width; // Reposiciona horizontalmente
        }
    });
}

// Função para desenhar todas as estrelas
function drawStars() {
    stars.forEach(star => {
        drawStar(star.x, star.y, star.radius, 5, 0.5);
    });
}


function drawHealthBar() {
    const barWidth = 100;
    const barHeight = 20;
    const x = 10;
    const y = canvas.height - 30;

    // Fundo da barra
    ctx.fillStyle = 'gray';
    ctx.fillRect(x, y, barWidth, barHeight);

    // Barra de vida
    ctx.fillStyle = 'green';
    ctx.fillRect(x, y, (ship.health / 100) * barWidth, barHeight);

    // Texto da barra de vida
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText(`HP: ${ship.health}`, x + 2, y + 15);
}

let bullets = [];
let superBullets = [];
let enemies = [];
let explosions = [];
let score = 0;
let level = 1;
let gameOver = false;
let enemySpeed = 2;
let gameStarted = false;
let countdown = 3;

const shootSound = new Audio('sounds/shot.mp3');
const explosionSound = new Audio('sounds/explosion.ogg');
const gameOverSound = new Audio('sounds/gameover.mp3');
const superBulletSound = new Audio('sounds/supershot.mp3'); // Certifique-se de ter esse arquivo


explosionSound.addEventListener('canplaythrough', () => {
    console.log('Arquivo de áudio carregado e pronto para ser reproduzido.');
});
explosionSound.addEventListener('error', (e) => {
    console.error('Erro ao carregar o áudio:', e);
});



function playShootSound() {
    shootSound.play();
}

function playExplosionSound() {
    explosionSound.play();
}


function playSuperBulletSound() {
    superBulletSound.play();
}

let enemiesDestroyed = 0;
let superShotAvailable = false;
const enemiesNeededForSuperShot = 3;

shipImage.onload = function () {
    let imagesLoaded = 0;
    enemyImages.concat(explosionImages).forEach(image => {
        image.onload = () => {
            imagesLoaded++;
            if (imagesLoaded === enemyImages.length + explosionImages.length) {
                startGame();
            }
        };
    });
};

shipImage.onerror = function () {
    console.error('Erro ao carregar a imagem da nave. Verifique o caminho da imagem.');
};

enemyImages.forEach(image => {
    image.onerror = function () {
        console.error('Erro ao carregar a imagem dos inimigos. Verifique o caminho das imagens.');
    };
});

function drawShip() {
    ctx.save();
    ctx.translate(ship.x + ship.width / 2, ship.y + ship.height / 2);
    ctx.rotate(ship.angle);
    ctx.drawImage(shipImage, -ship.width / 2, -ship.height / 2, ship.width, ship.height);
    ctx.restore();
}

function drawBullets() {
    ctx.fillStyle = 'red';
    bullets.forEach((bullet) => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        bullet.y -= bullet.speed;
    });
    bullets = bullets.filter(bullet => bullet.y > 0);
}

function drawSuperBullets() {
    ctx.fillStyle = 'blue';
    superBullets.forEach((bullet) => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        bullet.y -= bullet.speed;
    });
    superBullets = superBullets.filter(bullet => bullet.y > 0);
}

function drawEnemies() {
    enemies.forEach((enemy) => {
        if (!enemy.exploding) {
            const img = enemyImages[enemy.imageIndex];
            ctx.drawImage(img, enemy.x, enemy.y, enemy.width, enemy.height);
        } else {
            if (enemy.explosionFrame < explosionImages.length) {
                const explosionImg = explosionImages[enemy.explosionFrame];

                // Aumenta o tamanho da explosão conforme o frame
                const explosionSize = enemy.width + enemy.explosionFrame * 10; // Aumenta o tamanho da explosão
                const xOffset = (explosionSize - enemy.width) / 2;
                const yOffset = (explosionSize - enemy.height) / 2;

                ctx.drawImage(
                    explosionImg,
                    enemy.x - xOffset,
                    enemy.y - yOffset,
                    explosionSize,
                    explosionSize
                );

                enemy.explosionFrame++;
            } else {
                enemies = enemies.filter(e => e !== enemy); // Remove o inimigo após a explosão
            }
        }
        enemy.y += enemy.speed;
    });
    enemies = enemies.filter(enemy => enemy.y < canvas.height);
}

function drawScoreAndLevel() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Level: ${level}`, 10, 60);
}

function detectCollisions() {
    let collisionDetected = false;

    // Verifica colisões entre balas e inimigos
    bullets.forEach((bullet, bIndex) => {
        enemies.forEach((enemy, eIndex) => {
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                console.log("Colisão detectada!");
                enemies.splice(eIndex, 1);
                bullets.splice(bIndex, 1);
                score += 10;
                enemiesDestroyed++;

                // Toca o som de explosão apenas quando o inimigo é destruído por uma bala
                playExplosionSound();

                // Verifica se o jogador ganhou um super tiro
                if (enemiesDestroyed >= enemiesNeededForSuperShot) {
                    superShotAvailable = true;
                    enemiesDestroyed = 0;
                }

                if (score % 100 === 0) {
                    level++;
                    enemySpeed += 1;
                }
            }
        });
    });

    // Verifica colisões entre super balas e inimigos
    superBullets.forEach((bullet, bIndex) => {
        enemies.forEach((enemy, eIndex) => {
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                enemies.splice(eIndex, 1);
                superBullets.splice(bIndex, 1);
                score += 20;

                // Toca o som de explosão apenas quando o inimigo é destruído por uma super bala
                playExplosionSound();
            }
        });
    });

    enemies.forEach((enemy) => {
        if (
            ship.x < enemy.x + enemy.width &&
            ship.x + ship.width > enemy.x &&
            ship.y < enemy.y + enemy.height &&
            ship.y + ship.height > enemy.y
        ) {
            if (!enemy.hit) {
                enemy.hit = true;
                console.log('Colisão detectada!');
                console.log(`Vida antes da colisão: ${ship.health}`);

                if (ship.health > 0) {
                    ship.health -= 20;
                    console.log(`Vida após a colisão: ${ship.health}`);

                    if (ship.health <= 0) {
                        gameOver = true;
                        console.log('Game Over');
                        endGame();
                    }

                    // Inicia a explosão do inimigo
                    enemy.exploding = true;
                    enemy.explosionFrame = 0;

                    // Toca o som de explosão apenas quando o inimigo colide com o jogador
                    playExplosionSound();
                }
            }
        } else {
            enemy.hit = false;
        }
    });
}


function updateGame() {
    if (!gameStarted) return;

    if (gameOver) {
        endGame();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Atualiza e desenha as estrelas
    updateStars();
    drawStars();
    
    // Desenha os outros elementos do jogo
    drawShip();
    drawBullets();
    drawSuperBullets();
    drawEnemies();
    drawScoreAndLevel();
    drawHealthBar();
    detectCollisions();

    if (ship.movingLeft && ship.x > 0) {
        ship.x -= ship.speed;
        ship.angle = Math.PI;
    }
    if (ship.movingRight && ship.x < canvas.width - ship.width) {
        ship.x += ship.speed;
        ship.angle = 0;
    }
    if (ship.movingUp && ship.y > 0) {
        ship.y -= ship.speed;
        ship.angle = -Math.PI / 2;
    }
    if (ship.movingDown && ship.y < canvas.height - ship.height) {
        ship.y += ship.speed;
        ship.angle = Math.PI / 2;
    }

    requestAnimationFrame(updateGame);
}


function createEnemy() {
    let enemyWidth = 30;
    let enemyHeight = 30;

    let enemy = {
        x: Math.random() * (canvas.width - enemyWidth),
        y: -enemyHeight,
        width: enemyWidth,
        height: enemyHeight,
        speed: enemySpeed,
        imageIndex: Math.floor(Math.random() * enemyImages.length),
        hit: false,
        exploding: false,
        explosionFrame: 0
    };
    enemies.push(enemy);
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') ship.movingLeft = true;
    if (event.key === 'ArrowRight') ship.movingRight = true;
    if (event.key === 'ArrowUp') ship.movingUp = true;
    if (event.key === 'ArrowDown') ship.movingDown = true;
    if (event.key === ' ') {
        bullets.push({
            x: ship.x + ship.width / 2 - 2,
            y: ship.y,
            width: 4,
            height: 10,
            speed: 7
        });
        playShootSound(); // Chama o som do tiro normal
    }
    if (event.key === 's' && superShotAvailable) {
        superBullets.push({
            x: ship.x + ship.width / 2 - 5,
            y: ship.y,
            width: 10,
            height: 20,
            speed: 7
        });
        playSuperBulletSound(); // Chama o som do super tiro
        superShotAvailable = false;
    }
});


document.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowLeft') ship.movingLeft = false;
    if (event.key === 'ArrowRight') ship.movingRight = false;
    if (event.key === 'ArrowUp') ship.movingUp = false;
    if (event.key === 'ArrowDown') ship.movingDown = false;
});

function playGameOverSound() {
    gameOverSound.play();
}


function endGame() {
    playGameOverSound(); // Reproduz o som de Game Over

    ctx.fillStyle = 'red';
    ctx.font = '40px Arial';
    ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);

    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Pressione R para reiniciar', canvas.width / 2 - 150, canvas.height / 2 + 40);
}


document.addEventListener('keydown', (event) => {
    if (event.key === 'r') {
        location.reload(); // Reinicia o jogo
    }
});



function countdownStart() {
    let interval = setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '60px Arial';
        ctx.fillText(countdown, canvas.width / 2, canvas.height / 2);
        countdown--;
        if (countdown < 0) {
            clearInterval(interval);
            gameStarted = true;
            updateGame();
        }
    }, 1000);
}

function startGame() {
    countdownStart();
    setInterval(createEnemy, 1000);
}

