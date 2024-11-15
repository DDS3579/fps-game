// Constants
const MAP_SIZE = 100;
const WALL_HEIGHT = 10;
const BULLET_SPEED = 1.5;
const MOVEMENT_SPEED = 0.2;

// Difficulty settings
const DIFFICULTY_SETTINGS = {
    easy: {
        enemySpeed: 0.02,
        spawnInterval: 4000,
        maxEnemies: 8
    },
    medium: {
        enemySpeed: 0.04,
        spawnInterval: 3000,
        maxEnemies: 12
    },
    hard: {
        enemySpeed: 0.06,
        spawnInterval: 2000,
        maxEnemies: 15
    }
};

// Global variables
let scene, camera, renderer;
let player;
let bullets = [];
let enemies = [];
let score = 0;
let health = 100;
let isGameOver = false;
let gameStarted = false;
let currentDifficulty = 'medium';
let enemySpawnInterval;

// Movement flags
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let velocity = new THREE.Vector3();
let targetRotation = new THREE.Vector3();
let cameraRotation = new THREE.Vector3();
let targetCameraRotation = new THREE.Vector3();

// Initialize game when window loads
window.addEventListener('load', () => {
    const difficultySelect = document.getElementById('difficulty-select');
    if (difficultySelect) {
        difficultySelect.style.display = 'flex';
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

// Game initialization
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue

    // Create and setup camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    
    // Add renderer to container
    const container = document.getElementById('game-container');
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Add lighting
    addLighting();

    // Create environment
    createEnvironment();

    // Create player
    createPlayer();

    // Setup controls
    setupControls();

    // Start animation
    animate();
}

// Add lighting to the scene
function addLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
}

// Create game environment
function createEnvironment() {
    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE);
    const groundMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x3a9d23,
        shininess: 10 
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create walls
    createWalls();
}

// Create walls
function createWalls() {
    const wallMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x808080,
        shininess: 30
    });

    const wallConfigs = [
        // North wall
        {
            geometry: new THREE.BoxGeometry(MAP_SIZE, WALL_HEIGHT, 2),
            position: { x: 0, y: WALL_HEIGHT/2, z: -MAP_SIZE/2 }
        },
        // South wall
        {
            geometry: new THREE.BoxGeometry(MAP_SIZE, WALL_HEIGHT, 2),
            position: { x: 0, y: WALL_HEIGHT/2, z: MAP_SIZE/2 }
        },
        // East wall
        {
            geometry: new THREE.BoxGeometry(2, WALL_HEIGHT, MAP_SIZE),
            position: { x: -MAP_SIZE/2, y: WALL_HEIGHT/2, z: 0 }
        },
        // West wall
        {
            geometry: new THREE.BoxGeometry(2, WALL_HEIGHT, MAP_SIZE),
            position: { x: MAP_SIZE/2, y: WALL_HEIGHT/2, z: 0 }
        }
    ];

    wallConfigs.forEach(config => {
        const wall = new THREE.Mesh(config.geometry, wallMaterial);
        wall.position.set(config.position.x, config.position.y, config.position.z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        scene.add(wall);
    });
}

// Create player
function createPlayer() {
    const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
    const playerMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x00ff00,
        shininess: 30 
    });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.y = 1;
    player.castShadow = true;
    player.receiveShadow = true;
    scene.add(player);
}

// Setup game controls
function setupControls() {
    const gameContainer = document.getElementById('game-container');
    
    // Mouse lock controls
    gameContainer.addEventListener('click', () => {
        if (!isGameOver) {
            gameContainer.requestPointerLock();
        }
    });

    // Mouse movement and shooting
    document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === gameContainer) {
            document.addEventListener('mousemove', onMouseMove, false);
            document.addEventListener('click', shoot, false);
        } else {
            document.removeEventListener('mousemove', onMouseMove, false);
            document.removeEventListener('click', shoot, false);
        }
    });

    // Keyboard controls
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
}

// Mouse movement handler
function onMouseMove(event) {
    if (document.pointerLockElement === document.getElementById('game-container')) {
        const sensitivity = 0.002;
        
        // Horizontal rotation (looking left/right)
        targetRotation.y -= event.movementX * sensitivity;
        
        // Vertical rotation (looking up/down)
        targetCameraRotation.x -= event.movementY * sensitivity;
        
        // Limit the up/down rotation
        targetCameraRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, targetCameraRotation.x));
    }
}

// Keyboard controls
function onKeyDown(event) {
    switch(event.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyD': moveLeft = true; break;
        case 'KeyA': moveRight = true; break;
    }
}

function onKeyUp(event) {
    switch(event.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyD': moveLeft = false; break;
        case 'KeyA': moveRight = false; break;
    }
}

// Shooting mechanism
function shoot() {
    if (isGameOver || document.pointerLockElement !== document.getElementById('game-container')) return;

    const bulletGeometry = new THREE.SphereGeometry(0.2);
    const bulletMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 1
    });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

    // Position bullet at player's position
    bullet.position.copy(player.position);
    bullet.position.y += 1.5; // Adjust to match gun height

    // Calculate shooting direction
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
    direction.y = Math.sin(cameraRotation.x);
    direction.normalize();
    
    bullet.direction = direction;
    scene.add(bullet);
    bullets.push(bullet);
}

// Update bullet positions and check collisions
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.position.add(bullet.direction.multiplyScalar(BULLET_SPEED));

        // Check collision with enemies
        for (let enemy of enemies) {
            if (bullet.position.distanceTo(enemy.position) < 1) {
                enemy.health -= 34; // 3 shots to kill
                enemy.healthBar.visible = true;
                scene.remove(bullet);
                bullets.splice(i, 1);

                if (enemy.health <= 0) {
                    removeEnemy(enemy);
                    increaseScore(100);
                }
                break;
            }
        }

        // Remove bullets that have traveled too far
        if (bullet.position.distanceTo(player.position) > 50) {
            scene.remove(bullet);
            bullets.splice(i, 1);
        }
    }
}

// Enemy spawning and management
function spawnEnemy() {
    if (isGameOver || enemies.length >= DIFFICULTY_SETTINGS[currentDifficulty].maxEnemies) return;

    const enemyGeometry = new THREE.BoxGeometry(1, 2, 1);
    const enemyMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);

    // Spawn position
    const angle = Math.random() * Math.PI * 2;
    const distance = 20;
    enemy.position.x = player.position.x + Math.cos(angle) * distance;
    enemy.position.z = player.position.z + Math.sin(angle) * distance;
    enemy.position.y = 1;

    // Add properties
    enemy.health = 100;
    enemy.healthBar = createHealthBar();
    enemy.add(enemy.healthBar);
    enemy.healthBar.position.y = 2.5;
    enemy.healthBar.visible = false;

    scene.add(enemy);
    enemies.push(enemy);
}

// Create health bar for enemies
function createHealthBar() {
    const healthBarWidth = 1;
    const healthBarHeight = 0.1;
    
    const container = new THREE.Group();
    
    // Background (black bar)
    const bgGeometry = new THREE.BoxGeometry(healthBarWidth, healthBarHeight, 0.1);
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const background = new THREE.Mesh(bgGeometry, bgMaterial);
    container.add(background);
    
    // Health indicator (green bar)
    const healthGeometry = new THREE.BoxGeometry(healthBarWidth, healthBarHeight, 0.11);
    const healthMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const healthIndicator = new THREE.Mesh(healthGeometry, healthMaterial);
    container.add(healthIndicator);
    
    container.background = background;
    container.healthIndicator = healthIndicator;
    
    return container;
}

// Main game loop
function animate() {
    requestAnimationFrame(animate);
    
    if (!isGameOver) {
        updateMovement();
        updateBullets();
        updateEnemies();
        updateCamera();
    }
    
    renderer.render(scene, camera);
}

// Update player movement
function updateMovement() {
    // Update player rotation
    player.rotation.y += (targetRotation.y - player.rotation.y) * 0.1;

    // Calculate movement direction
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), player.rotation.y);
    const right = new THREE.Vector3(forward.z, 0, -forward.x);

    // Reset velocity
    velocity.x = 0;
    velocity.z = 0;

    // Apply movement based on keys pressed
    if (moveForward) velocity.add(forward.multiplyScalar(MOVEMENT_SPEED));
    if (moveBackward) velocity.sub(forward.multiplyScalar(MOVEMENT_SPEED));
    if (moveLeft) velocity.sub(right.multiplyScalar(MOVEMENT_SPEED));
    if (moveRight) velocity.add(right.multiplyScalar(MOVEMENT_SPEED));

    // Apply movement with wall collision
    const nextPosition = player.position.clone().add(velocity);
    if (Math.abs(nextPosition.x) < MAP_SIZE/2 - 1 && 
        Math.abs(nextPosition.z) < MAP_SIZE/2 - 1) {
        player.position.copy(nextPosition);
    }
}

// Update camera position and rotation
function updateCamera() {
    cameraRotation.x += (targetCameraRotation.x - cameraRotation.x) * 0.1;
    
    const height = 1.7; // Camera height (eye level)
    camera.position.x = player.position.x;
    camera.position.y = player.position.y + height;
    camera.position.z = player.position.z;
    
    const target = new THREE.Vector3(
        camera.position.x - Math.sin(player.rotation.y) * Math.cos(cameraRotation.x),
        camera.position.y + Math.sin(cameraRotation.x),
        camera.position.z - Math.cos(player.rotation.y) * Math.cos(cameraRotation.x)
    );
    
    camera.lookAt(target);
}

// Update enemy behavior
function updateEnemies() {
    const playerPos = player.position;
    
    enemies.forEach(enemy => {
        // Update health bar
        if (enemy.healthBar.visible) {
            enemy.healthBar.lookAt(camera.position);
            const healthPercent = enemy.health / 100;
            enemy.healthBar.healthIndicator.scale.x = healthPercent;
            enemy.healthBar.healthIndicator.position.x = (healthPercent - 1) / 2;
            
            // Update color based on health
            const hue = healthPercent * 0.3; // Goes from red (0) to green (0.3)
            enemy.healthBar.healthIndicator.material.color.setHSL(hue, 1, 0.5);
        }

        // Move towards player
        const directionToPlayer = new THREE.Vector3()
            .subVectors(playerPos, enemy.position)
            .normalize();
        
        enemy.position.add(
            directionToPlayer.multiplyScalar(DIFFICULTY_SETTINGS[currentDifficulty].enemySpeed)
        );

        // Check collision with player
        if (enemy.position.distanceTo(playerPos) < 1.5) {
            takeDamage(20);
            removeEnemy(enemy);
        }

        // Make enemies blink as they get closer
        const distanceToPlayer = enemy.position.distanceTo(playerPos);
        if (distanceToPlayer < 10) {
            const blinkIntensity = 1 - (distanceToPlayer / 10);
            enemy.material.emissive.setRGB(blinkIntensity, 0, 0);
        } else {
            enemy.material.emissive.setRGB(0, 0, 0);
        }
    });
}

// Handle player damage
function takeDamage(amount) {
    health -= amount;
    updateHUD();
    
    if (health <= 0) {
        gameOver();
    }
}

// Update HUD display
function updateHUD() {
    document.getElementById('health').textContent = `Health: ${health}`;
    document.getElementById('score').textContent = `Score: ${score}`;
}

// Increase score
function increaseScore(amount) {
    score += amount;
    updateHUD();
}

// Remove enemy from scene
function removeEnemy(enemy) {
    const index = enemies.indexOf(enemy);
    if (index > -1) {
        enemies.splice(index, 1);
        scene.remove(enemy);
    }
}

// Game over handling
function gameOver() {
    isGameOver = true;
    gameStarted = false;
    
    if (enemySpawnInterval) {
        clearInterval(enemySpawnInterval);
    }

    document.exitPointerLock();
    document.body.classList.remove('game-active'); // Hide crosshair
    
    const gameOverScreen = document.getElementById('game-over');
    document.getElementById('final-score').textContent = score;
    gameOverScreen.style.display = 'block';
}

// Restart game
function restartGame() {
    // Hide game over screen
    document.getElementById('game-over').style.display = 'none';
    
    // Create new difficulty select screen since we removed it earlier
    const difficultySelect = document.createElement('div');
    difficultySelect.id = 'difficulty-select';
    difficultySelect.innerHTML = `
        <div class="difficulty-content">
            <h1>3D FPS Game</h1>
            <h2>Select Difficulty</h2>
            <div class="button-container">
                <button onmousedown="setDifficulty('easy')">Easy</button>
                <button onmousedown="setDifficulty('medium')">Medium</button>
                <button onmousedown="setDifficulty('hard')">Hard</button>
            </div>
            <div class="instructions">
                <p>Controls:</p>
                <ul>
                    <li>WASD - Move</li>
                    <li>Mouse - Look around</li>
                    <li>Left Click - Shoot</li>
                    <li>ESC - Release mouse</li>
                </ul>
            </div>
        </div>
    `;
    document.body.appendChild(difficultySelect);
    
    // Reset game state
    score = 0;
    health = 100;
    isGameOver = false;
    gameStarted = false;
    
    // Remove game-active class to hide crosshair
    document.body.classList.remove('game-active');
    
    // Clear existing enemies and bullets
    enemies.forEach(enemy => scene.remove(enemy));
    enemies = [];
    bullets.forEach(bullet => scene.remove(bullet));
    bullets = [];
    
    // Reset player position if it exists
    if (player) {
        player.position.set(0, 1, 0);
        player.rotation.set(0, 0, 0);
    }
    
    // Reset camera rotation
    targetRotation = new THREE.Vector3();
    cameraRotation = new THREE.Vector3();
    targetCameraRotation = new THREE.Vector3();
    
    // Reset movement flags
    moveForward = false;
    moveBackward = false;
    moveLeft = false;
    moveRight = false;
    
    // Update HUD
    updateHUD();
}

// Difficulty selection handler

function setDifficulty(level) {
    if (gameStarted) return;
    
    currentDifficulty = level;
    gameStarted = true;
    
    // Hide difficulty select screen
    document.getElementById('difficulty-select').remove();
    
    // Show crosshair and add game-active class
    document.body.classList.add('game-active');
    
    // Initialize game
    init();
    
    // Start enemy spawning
    if (enemySpawnInterval) clearInterval(enemySpawnInterval);
    enemySpawnInterval = setInterval(spawnEnemy, DIFFICULTY_SETTINGS[currentDifficulty].spawnInterval);
    
    updateHUD();
}

  