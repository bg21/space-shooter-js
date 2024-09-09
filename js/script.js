const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 960;
canvas.height = 600;

document.getElementById('startGameButton').addEventListener('click', () => {
    startGame();
});


const shootSound = new Audio('sounds/shot.mp3');
const explosionSound = new Audio('sounds/explosion.ogg');
const gameOverSound = new Audio('sounds/gameover.mp3');
const superBulletSound = new Audio('sounds/supershot.mp3');


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
    const barWidth = 180;  // Largura aumentada da barra
    const barHeight = 30;  // Altura aumentada da barra
    const x = 20;  // Espaçamento lateral aumentado
    const y = canvas.height - 50;  // Ajustado para mais espaço vertical
    const borderRadius = 10;  // Raio de arredondamento das bordas

    // Desenhar o fundo da barra
    ctx.fillStyle = '#fff';  // Cor do fundo da barra
    ctx.fillRect(x, y, barWidth, barHeight);

    // Desenhar a borda da barra
    ctx.strokeStyle = '#000';  // Cor da borda
    ctx.lineWidth = 3;  // Largura da borda
    ctx.strokeRect(x, y, barWidth, barHeight);  // Desenha a borda externa da barra

    // Desenhar a parte da vida
    const healthWidth = (ship.health / 100) * barWidth;
    const healthGradient = ctx.createLinearGradient(x, y, x + barWidth, y);
    healthGradient.addColorStop(0, '#0f0');  // Cor inicial do gradiente
    healthGradient.addColorStop(1, '#0a0');  // Cor final do gradiente

    ctx.fillStyle = healthGradient;  // Define o gradiente como cor de preenchimento
    ctx.fillRect(x, y, healthWidth, barHeight);  // Desenha a barra de vida

    // Desenhar a borda da barra de vida
    ctx.strokeStyle = '#0a0';  // Cor da borda da barra de vida
    ctx.lineWidth = 2;  // Largura da borda da barra de vida
    ctx.strokeRect(x, y, healthWidth, barHeight);  // Desenha a borda interna da barra de vida

    // Desenhar o texto da barra de vida
    ctx.fillStyle = '#fff';  // Cor do texto
    ctx.font = '18px Arial';  // Fonte maior para texto
    ctx.textAlign = 'left';  // Alinhamento do texto
    ctx.textBaseline = 'middle';  // Base do texto
    ctx.fillText(`HP: ${ship.health}`, x + 10, y + barHeight / 2);  // Texto da barra de vida
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
            // if (imagesLoaded === enemyImages.length + explosionImages.length) {
            //     startGame();
            // }
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
    bullets.forEach((bullet) => {
        // Ajuste o tamanho da bala para ser mais longa
        const bulletWidth = 6;  // Largura da bala
        const bulletHeight = 20;  // Altura da bala

        // Criar um gradiente linear para a bala mais alongada
        const gradient = ctx.createLinearGradient(bullet.x, bullet.y, bullet.x, bullet.y + bulletHeight);
        gradient.addColorStop(0, 'rgba(255, 69, 0, 1)'); // Vermelho intenso no topo
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0.8)'); // Vermelho mais escuro na parte inferior

        ctx.fillStyle = gradient;
        ctx.fillRect(bullet.x, bullet.y, bulletWidth, bulletHeight); // Desenha a bala como um retângulo mais longo

        bullet.y -= bullet.speed; // Move a bala para cima
    });

    bullets = bullets.filter(bullet => bullet.y > 0); // Remove balas que saíram da tela
}



function drawSuperBullets() {
    superBullets.forEach((bullet) => {
        // Ajustar o tamanho da bala para ser mais longa
        const bulletWidth = 8;  // Largura da bala
        const bulletHeight = 25;  // Altura da bala

        // Criar um gradiente linear amarelo para a bala
        const gradient = ctx.createLinearGradient(bullet.x, bullet.y, bullet.x, bullet.y + bulletHeight);
        gradient.addColorStop(0, 'rgba(255, 255, 0, 1)'); // Amarelo intenso no topo
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0.8)'); // Amarelo mais suave na parte inferior

        ctx.fillStyle = gradient;
        ctx.fillRect(bullet.x, bullet.y, bulletWidth, bulletHeight); // Desenha a bala como um retângulo mais longo

        bullet.y -= bullet.speed; // Move a bala para cima
    });

    superBullets = superBullets.filter(bullet => bullet.y > 0); // Remove balas que saíram da tela
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
    // Configurações de fonte e cor de texto
    ctx.font = '24px Arial';
    ctx.textBaseline = 'middle';

    // Pontuação no canto superior esquerdo
    const scoreX = 20; // Ajustado para mais espaço
    const scoreY = 30;
    const scoreGradient = ctx.createLinearGradient(scoreX, scoreY - 15, scoreX, scoreY + 15);
    scoreGradient.addColorStop(0, '#ffcc00');  // Cor inicial do gradiente
    scoreGradient.addColorStop(1, '#ff9900');  // Cor final do gradiente
    ctx.fillStyle = scoreGradient;
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, scoreX, scoreY);

    // Nível no canto superior direito
    const levelX = canvas.width - 20; // Ajustado para mais espaço
    const levelY = 30;
    const levelGradient = ctx.createLinearGradient(levelX, levelY - 15, levelX, levelY + 15);
    levelGradient.addColorStop(0, '#00ccff');  // Cor inicial do gradiente
    levelGradient.addColorStop(1, '#0099cc');  // Cor final do gradiente
    ctx.fillStyle = levelGradient;
    ctx.textAlign = 'right';
    ctx.fillText(`Level: ${level}`, levelX, levelY);
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


let lastFrameTime = 0;
const fps = 60; // Frames por segundo desejados
const frameTime = 1000 / fps; // Tempo entre frames em milissegundos

function updateGame(timestamp) {
    if (!gameStarted) return;

    const deltaTime = timestamp - lastFrameTime;
    if (deltaTime > frameTime) {
        lastFrameTime = timestamp - (deltaTime % frameTime);

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

        // Movimento do jogador
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


function showGameOverModal() {
    const gameOverModal = document.getElementById('gameOverModal');
    const finalScore = document.getElementById('finalScore');
    finalScore.textContent = score; // Atualiza o texto com a pontuação final
    gameOverModal.style.display = 'flex'; // Mostra a modal com flexbox
    setTimeout(() => {
        gameOverModal.style.opacity = '1';
        gameOverModal.querySelector('.modal-content').style.transform = 'scale(1)';
    }, 100); // Animação de entrada suave
}


function endGame() {
    gameOver = true;
    playGameOverSound();
    showGameOverModal();
}


document.addEventListener('keydown', (event) => {
    if (event.key === 'r') {
        location.reload(); // Reinicia o jogo
    }
});
// Reiniciar o jogo ao clicar no botão
document.getElementById('restartButton').addEventListener('click', () => {
    reloadGame();
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
    gameStarted = true;
    // Esconde a modal
    document.getElementById('mainMenu').classList.add('hidden');
    countdownStart();
    setInterval(createEnemy, 2000);
}




function reloadGame() {
    location.reload();
}
