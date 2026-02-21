const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game State & Constants ---
const gravity = 0.5;
const friction = 0.8;
let gameLoopId;
let cameraOffsetX = 0;
let cameraOffsetY = 0; // The virtual Y position of the camera's top edge
const CAMERA_SCROLL_MARGIN = 200; // How close to the top edge before scrolling up

// --- Input Handling ---
const keys = {
    ArrowRight: false,
    ArrowLeft: false,
    ArrowUp: false,
    Space: false,
    KeyE: false,
    KeyR: false
};

window.addEventListener('keydown', (e) => {
    if (!isChatting && ['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
    if (e.code === 'KeyR' && !isChatting) {
        resetGame();
        return;
    }
    if (keys.hasOwnProperty(e.code) || keys.hasOwnProperty(e.key)) {
        if (e.code === 'Space') keys.Space = true;
        else if (e.code === 'KeyE') keys.KeyE = true;
        else keys[e.key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code) || keys.hasOwnProperty(e.key)) {
        if (e.code === 'Space') keys.Space = false;
        else if (e.code === 'KeyE') keys.KeyE = false;
        else keys[e.key] = false;
    }
});

// --- Entities & State ---
let isChatting = false;
let currentNPC = null;

// Set true to test: static jump_f1_crouch only (no animation)
const USE_STATIC_CROUCH = false;

// --- Player sprites: ONE resting image, jump sequence, one fallback ---
// Resting (standing still on ground) = this one image only: jump_f1_crouch.png
const restingSprite = new Image();
restingSprite.src = 'assets/jump_f1_crouch.png';

const jumpFrames = [
    new Image(), new Image(), new Image(), new Image(), new Image()
];
jumpFrames[0].src = 'assets/jump_f1_crouch.png';  // crouch (also used in air)
jumpFrames[1].src = 'assets/jump_f2_launch.png';
jumpFrames[2].src = 'assets/jump_f3_peak.png';
jumpFrames[3].src = 'assets/jump_f4_descend.png';
jumpFrames[4].src = 'assets/jump_f5_land.png';

const heroJumpImage = new Image();
heroJumpImage.src = 'assets/hero_turquoise_toad_natural_jump.png'; // fallback when jump frames not loaded

// Sprite Animation Constants
const IDLE_ANIM_SPEED = 20; // Lower is faster
const RUN_ANIM_SPEED = 8;

// Fixed game resolution (used by platforms and player start)
const GAME_WIDTH = 800;
const GAME_HEIGHT = 450;

const player = {
    x: 400,
    y: GAME_HEIGHT - 40 - 32,
    width: 32,
    height: 32,
    speed: 5,
    velX: 0,
    velY: 0,
    jumping: false,
    grounded: false,
    doubleJumpTracker: 0,
    landingTimer: 0,
    facingRight: true,
    hasSoda: false,
    sodaExpiryTime: 0, // Date.now() when soda wears off (1 min)
    keyCount: 0, // Number of Golden Keys held
    coins: 100, // Starting coins; subtract when giving to NPCs
    hasScroll: false,
    color: '#FF0000', // Placeholder red box
    animFrame: 0,
    animTimer: 0
};

// Continuously vertical swamp: lily pad collision kept SHORT so no ghost space (physics = visible pad)
const INITIAL_PLATFORMS = [
    { x: 0, y: GAME_HEIGHT - 40, width: 800, height: 40, lilyPad: 'large' },
    { x: 150, y: 340, width: 180, height: 28, lilyPad: 'large' },
    { x: 450, y: 240, width: 120, height: 24, lilyPad: 'medium' },
    { x: 250, y: 120, width: 150, height: 24, lilyPad: 'large' },
    { x: 50, y: 0, width: 120, height: 24, lilyPad: 'medium' },
    { x: 280, y: -120, width: 180, height: 22, platformType: 'branch' },
    { x: 550, y: -240, width: 120, height: 22, platformType: 'branch' },
    { x: 350, y: -380, width: 120, height: 24, lilyPad: 'medium' },
    { x: 100, y: -500, width: 160, height: 22, platformType: 'branch' },
    { x: 300, y: -640, width: 120, height: 20 },
    { x: 550, y: -780, width: 100, height: 20 },
    { x: 350, y: -940, width: 140, height: 20 },
    { x: 150, y: -1100, width: 120, height: 24, lilyPad: 'medium' },
    { x: 50, y: -1260, width: 100, height: 20 },
    { x: 250, y: -1420, width: 120, height: 20 },
    { x: 450, y: -1580, width: 140, height: 22, platformType: 'branch' },
    { x: 250, y: -1740, width: 120, height: 20 },
    { x: 50, y: -1900, width: 100, height: 20 },
    { x: 300, y: -2060, width: 180, height: 24, lilyPad: 'large' },
    { x: 500, y: -2200, width: 100, height: 20 },
    { x: 200, y: -2340, width: 220, height: 24, lilyPad: 'large' }
];

let platforms = INITIAL_PLATFORMS.map(p => ({ ...p }));

// Items
const ciderImage = new Image();
ciderImage.src = 'assets/item_toad_cider.png';
const keyImage = new Image();
keyImage.src = 'assets/item_key.png';
const sackCoinsImage = new Image();
sackCoinsImage.src = 'assets/item_sack_coins.png';
const glassCaseImage = new Image();
glassCaseImage.src = 'assets/item_glass_case.png';
const scrollImage = new Image();
scrollImage.src = 'assets/item_scroll.png';
const portalImage = new Image();
portalImage.src = 'assets/item_portal.png';

// Dialogue profile photos — same Image() + path as every other asset; we draw them to a canvas so they always show
const dialogueArchivistImg = new Image();
dialogueArchivistImg.src = 'assets/archivist-closeup.png';
const dialogueProtagonistImg = new Image();
dialogueProtagonistImg.src = 'assets/protagonist-closeup.png';

// Swamp theme — vertical game: tiled vertical bg, large/medium lily pads, then tiles
const swampBgVertical = new Image();
swampBgVertical.src = 'assets/swamp_background_vertical.png';
const swampBgImage = new Image();
swampBgImage.src = 'assets/swamp_background.png';
const lilypadLarge = new Image();
lilypadLarge.src = 'assets/lilypad_large.png';
const lilypadMedium = new Image();
lilypadMedium.src = 'assets/lilypad_medium.png';
const platformBranch = new Image();
platformBranch.src = 'assets/platform_branch.png';
const npcArchivistSprite = new Image();
let npcArchivistProcessed = null;
let npcArchivistPortraitDataUrl = null;
npcArchivistSprite.onload = function () {
    const w = npcArchivistSprite.naturalWidth;
    const h = npcArchivistSprite.naturalHeight;
    const full = document.createElement('canvas');
    full.width = w;
    full.height = h;
    const fctx = full.getContext('2d');
    fctx.drawImage(npcArchivistSprite, 0, 0);
    const img = fctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b), avg = (r + g + b) / 3;
        if ((mx > 195 && mn > 195) || (mx - mn < 60 && avg > 150)) d[i + 3] = 0;
    }
    fctx.putImageData(img, 0, 0);
    const size = 64;
    const small = document.createElement('canvas');
    small.width = size;
    small.height = size;
    const sctx = small.getContext('2d');
    sctx.imageSmoothingEnabled = false;
    sctx.drawImage(full, 0, 0, w, h, 0, 0, size, size);
    npcArchivistProcessed = small;
    npcArchivistPortraitDataUrl = small.toDataURL('image/png');
};
npcArchivistSprite.src = 'assets/npc_paranoid_archivist1.png';
const swampPlatformTile = new Image();
swampPlatformTile.src = 'assets/tile_platform_swamp.png';
const swampGroundTile = new Image();
swampGroundTile.src = 'assets/tile_ground_swamp.png';

const INITIAL_POWERUPS = [
    { x: 309, y: 88, width: 32, height: 32, type: 'soda', collected: false },
    { x: 494, y: 216, width: 24, height: 24, type: 'coin', collected: false, amount: 25 },
    { x: 150, y: -564, width: 24, height: 24, type: 'coin', collected: false, amount: 15 },
    { x: 500, y: -1644, width: 24, height: 24, type: 'coin', collected: false, amount: 20 },
    { x: 284, y: -2372, width: 32, height: 32, type: 'scroll', collected: false, glassCaseLocked: true },
    { x: 284, y: -2372, width: 32, height: 32, type: 'glass_case', collected: false },
    { x: 350, y: -2404, width: 64, height: 64, type: 'portal', collected: false, hidden: true }
];
let powerups = INITIAL_POWERUPS.map(p => ({ ...p }));

// --- API Setup & Global State ---
const GEMINI_API_KEY = "YOUR_API_KEY_HERE"; // The $20 hackathon credit key
let invisiblePlatformRevealed = false;
let levelCleared = false;

// NPC Entity list — Paranoid Archivist (large toad) on first large lily pad (feet on platform top at 340)
const npcs = [
    {
        name: "Paranoid Archivist",
        x: 200,
        y: 280,
        width: 60,
        height: 60,
        color: '#f39c12',
        promptContext: "You are the Paranoid Archivist: a greedy pink toad in a dark hooded cloak, squatting on a lily pad at the bottom of a murky swamp. You hold a Golden Key; the Sacred Scroll is locked in a glass case at the top of the level. CRITICAL: Never mention the key, scroll, or anything you're holding unless the player brings it up first. In greetings and initial responses, stay vague—welcome them, ask what they want, be nervous about strangers. Speak in hushed, croaky, nervous tones. Reference your setting: lily pads, murky water, reeds, the bog—never anything digital or technological. You are greedy: if the player promises you money, gold, compensation, or reward, you will agree and give them the key. You may also give the key if they say something that truly challenges your worldview—then tell them: 'You are right... The path is built on trust.' IMPORTANT: Drop subtle hints in your dialogue about what you care about—things like 'times are lean in the bog', 'a toad has to eat', 'shiny things catch my eye', 'compensation... now that would make one think'—so the player can infer without you spelling it out. Keep responses under 2 sentences.",
        messages: [] // Store conversation history
    }
];

    // Contextual Game Triggers
    const TRIGGER_PHRASES = [
        "the path is built on trust",
        "pay you", "money", "gold", "compensation", "reward you", "coin", "bribe", "riches", "deal", "buy", "purchase", "trade"
    ];
    const triggers = {
        revealPlatform: {
            phrases: TRIGGER_PHRASES,
            action: (playerMessage) => {
                if (!invisiblePlatformRevealed) {
                    invisiblePlatformRevealed = true;
                    // Parse amount offered from message (e.g. "50 gold", "100 coins") and subtract from coins
                    const match = (playerMessage || '').match(/\d+/);
                    const amount = match ? parseInt(match[0], 10) : 0;
                    player.coins -= amount;
                    // Spawn the key right next to the Paranoid Archivist (on their lily pad) so it looks like they hand it over
                    const archivist = npcs[0];
                    const keyX = archivist.x + archivist.width - 8;
                    const keyY = archivist.y + archivist.height - 32; // key sits on platform at archivist's feet
                    powerups.push({ x: keyX, y: keyY, width: 32, height: 32, type: 'key', collected: false });
                    addMessageToChat('system', "The Paranoid Archivist reluctantly hands you the Golden Key!");
                }
            }
        }
    };

function resetGame() {
    if (isChatting) stopConversation();
    player.x = 400;
    player.y = GAME_HEIGHT - 40 - 32;
    player.velX = 0;
    player.velY = 0;
    player.jumping = false;
    player.grounded = false;
    player.doubleJumpTracker = 0;
    player.landingTimer = 0;
    player.hasSoda = false;
    player.sodaExpiryTime = 0;
    player.keyCount = 0;
    player.coins = 100;
    player.hasScroll = false;
    player.animFrame = 0;
    player.animTimer = 0;
    cameraOffsetX = 0;
    cameraOffsetY = 0;
    platforms = INITIAL_PLATFORMS.map(p => ({ ...p }));
    powerups = INITIAL_POWERUPS.map(p => ({ ...p }));
    invisiblePlatformRevealed = false;
    levelCleared = false;
    npcs.forEach(npc => { npc.messages = []; });
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
    keys.ArrowUp = false;
    keys.Space = false;
}

// --- Chat UI Elements ---
const chatOverlay = document.getElementById('chat-overlay');
const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send');
const chatCloseBtn = document.getElementById('chat-close');
const npcNameDisplay = document.getElementById('npc-name');

// --- Core Logic ---

let lastTime = 0;
const FIXED_TIME_STEP = 1000 / 60; // 60 FPS
let accumulator = 0;

function update() {
    if (levelCleared) return;
    
    // Soda expires after 1 minute
    if (player.hasSoda && player.sodaExpiryTime > 0 && Date.now() > player.sodaExpiryTime) {
        player.hasSoda = false;
        player.sodaExpiryTime = 0;
    }
    // If chatting, freeze game logic
    if (isChatting) return;
    // Update Timers
    if (player.landingTimer > 0) {
        player.landingTimer--;
    }

    // Horizontal Movement
    if (keys.ArrowRight) {
        if (player.velX < player.speed) {
            player.velX++;
        }
        player.facingRight = true;
    }
    if (keys.ArrowLeft) {
        if (player.velX > -player.speed) {
            player.velX--;
        }
        player.facingRight = false;
    }

    player.velX *= friction; // Apply friction

    // Vertical Movement (Jumping & Gravity)
    player.velY += gravity;

    // Handle Jump Input
    if (keys.ArrowUp || keys.Space) {
        // First jump from ground
        if (!player.jumping && player.grounded) {
            player.jumping = true;
            player.grounded = false;
            // 2x jump height if has powerup
            player.velY = player.hasSoda ? -16 : -11; 
            player.doubleJumpTracker = 0; // Reset just in case

            // Prevent immediate triggering of double jump next frame by releasing key requirement
            keys.ArrowUp = false;
            keys.Space = false;
        }
        // Double Jump (if in air, and hasn't double jumped yet)
        else if (player.jumping && !player.grounded && player.doubleJumpTracker < 1) {
            // 2x jump height if has powerup
            player.velY = player.hasSoda ? -14 : -10; 
            player.doubleJumpTracker++;

            keys.ArrowUp = false;
            keys.Space = false;
        }
    }

    // Apply Velocity to Position
    player.x += player.velX;
    player.y += player.velY;

    // Reset grounded state before collision checks
    player.grounded = false;

    // --- Collision Detection (AABB vs Platforms) ---
    for (let i = 0; i < platforms.length; i++) {
        let p = platforms[i];

        // Simple AABB check
        if (player.x < p.x + p.width &&
            player.x + player.width > p.x &&
            player.y < p.y + p.height &&
            player.y + player.height > p.y) {

            // Resolve collision - basic approach (needs refinement for robust wall handling, but works for simple floors)
            // Determine direction of collision
            const playerBottom = player.y + player.height;
            const playerRight = player.x + player.width;
            const playerLeft = player.x;
            const playerTop = player.y;

            const pBottom = p.y + p.height;
            const pRight = p.x + p.width;
            const pLeft = p.x;
            const pTop = p.y;

            // Calculate penetration depths
            const b_collision = pBottom - playerTop;
            const t_collision = playerBottom - pTop;
            const l_collision = playerRight - pLeft;
            const r_collision = pRight - playerLeft;

            // Find the smallest penetration depth to determine collision direction
            if (t_collision < b_collision && t_collision < l_collision && t_collision < r_collision) {
                // Top collision (landing on platform)
                if (player.velY >= 0) { // Only stop if falling
                    player.y = pTop - player.height;
                    player.velY = 0;
                    if (!player.grounded) {
                        player.landingTimer = 10; // Show landing frame for 10 ticks
                    }
                    player.grounded = true;
                    player.jumping = false;
                    player.doubleJumpTracker = 0; // Reset double jump on landing
                }
            }
            // Removed: Bottom, Left, and Right collisions so the Toad can jump smoothly through platforms from underneath!
        }
    }

    // --- Collision Detection (AABB vs Powerups) ---
    for (let i = 0; i < powerups.length; i++) {
        let pu = powerups[i];
        if (!pu.collected && !pu.hidden &&
            player.x < pu.x + pu.width &&
            player.x + player.width > pu.x &&
            player.y < pu.y + pu.height &&
            player.y + player.height > pu.y) {
            
            if (pu.type === 'glass_case') {
                if (player.keyCount >= 1) {
                    player.keyCount--;
                    pu.collected = true;
                    // Reveal the scroll
                    let scrollItem = powerups.find(p => p.type === 'scroll');
                    if (scrollItem) scrollItem.glassCaseLocked = false;
                    addMessageToChat('system', "You unlocked the Glass Case with the Golden Key!");
                } else {
                    if (!pu.lastMessageTime || Date.now() - pu.lastMessageTime > 3000) {
                        addMessageToChat('system', "1 Golden Key required to open this glass case");
                        pu.lastMessageTime = Date.now();
                    }
                    pu.showWarningUntil = Date.now() + 2000;
                }
            } else if (pu.type === 'scroll') {
                if (pu.glassCaseLocked) {
                    // Can't pick it up yet, let player pass through
                } else {
                    pu.collected = true;
                    player.hasScroll = true;
                    addMessageToChat('system', "You obtained the SACRED SCROLL!");
                    // Spawn Portal
                    let portalItem = powerups.find(p => p.type === 'portal');
                    if (portalItem) portalItem.hidden = false;
                }
            } else if (pu.type === 'portal') {
                pu.collected = true;
                levelCleared = true;
                addMessageToChat('system', "You entered the Portal! LEVEL COMPLETE!");
                setTimeout(() => resetGame(), 3000);
            } else {
                pu.collected = true;
                if (pu.type === 'soda') {
                    player.hasSoda = true;
                    player.sodaExpiryTime = Date.now() + 60000; // 1 minute
                    addMessageToChat('system', "You drank the TOAD SODA! Jump power doubled! (1 min)");
                } else if (pu.type === 'key') {
                    player.keyCount = (player.keyCount || 0) + 1;
                    addMessageToChat('system', "You found the Golden Key!");
                } else if (pu.type === 'coin') {
                    player.coins += (pu.amount || 10);
                    addMessageToChat('system', "You found some golden coins!");
                }
            }
        }
    }

    // --- Screen Bounds & Camera Tracking ---
    // Horizontal wrap/bounds (removed to allow infinite horizontal exploration if needed, 
    // or we can keep it. For now let's keep the bounds or remove them so the camera can move left/right).
    // Let's remove the hard horizontal bounds so we can actually use the horizontal camera!
    /* 
    if (player.x >= canvas.width - player.width) {
        player.x = canvas.width - player.width;
    } else if (player.x <= 0) {
        player.x = 0;
    }
    */

    // Bottom bound (prevent falling forever for now, though later could mean death)
    // We'll expand the bottom bound so you can fall further down if you miss a jump!
    if (player.y >= 2000 - player.height) { // Arbitrary low death floor
        player.y = 2000 - player.height;
        if (!player.grounded) {
            player.landingTimer = 10;
        }
        player.grounded = true;
        player.jumping = false;
        player.velY = 0;
        player.doubleJumpTracker = 0;
    }

    // Camera: center on the frog (same as before)
    const targetCameraX = player.x + (player.width / 2) - (canvas.width / 2);
    const targetCameraY = player.y + (player.height / 2) - (canvas.height / 2);
    cameraOffsetX += (targetCameraX - cameraOffsetX) * 0.1;
    cameraOffsetY += (targetCameraY - cameraOffsetY) * 0.1;

    // --- Interaction Logic ---
    if (keys.KeyE) {
        keys.KeyE = false; // Prevent holding

        // Find nearest NPC
        for (let npc of npcs) {
            // Simple distance check (center to center)
            const pCenterX = player.x + player.width / 2;
            const pCenterY = player.y + player.height / 2;
            const nCenterX = npc.x + npc.width / 2;
            const nCenterY = npc.y + npc.height / 2;

            const dist = Math.sqrt(Math.pow(pCenterX - nCenterX, 2) + Math.pow(pCenterY - nCenterY, 2));

            // Interaction range
            if (dist < 60) {
                startConversation(npc);
                break;
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // Fill with swamp green so areas above the single background aren't empty
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. Vertical bog background: scales to cover margins, scrolls vertically and horizontally
    const bgImg = (swampBgVertical.complete && swampBgVertical.naturalWidth > 0)
        ? swampBgVertical
        : (swampBgImage.complete && swampBgImage.naturalWidth > 0) ? swampBgImage : null;
    if (bgImg) {
        const bw = bgImg.naturalWidth;
        const bh = bgImg.naturalHeight;
        // Scale to fit screen, then zoom 20% to give room for horizontal/vertical parallax without green edges
        const scale = Math.max(canvas.width / bw, canvas.height / bh);
        const zoom = 1.2;
        const sw = bw * scale * zoom;
        const sh = bh * scale * zoom;
        
        // Clamp horizontal parallax so we never see green
        const maxParallaxX = (sw - canvas.width) / 2;
        let pxOffset = cameraOffsetX * 0.2;
        if (pxOffset > maxParallaxX) pxOffset = maxParallaxX;
        if (pxOffset < -maxParallaxX) pxOffset = -maxParallaxX;
        const baseX = (canvas.width - sw) / 2 - pxOffset;

        // Vertical parallax
        const maxParallaxY = Math.max(0, sh - canvas.height);
        let pyOffset = cameraOffsetY * 0.3; 
        if (pyOffset > 0) pyOffset = 0; 
        if (pyOffset < -maxParallaxY) pyOffset = -maxParallaxY;
        const screenY = (canvas.height - sh) - pyOffset;
        
        ctx.drawImage(bgImg, baseX, screenY, sw, sh);
    } else {
        ctx.fillStyle = '#2d5a27';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. Platforms: lily pads (large/medium) and swamp tiles
    const TILE_W = 64;
    const usePlatformTile = swampPlatformTile.complete && swampPlatformTile.naturalWidth > 0;
    const useGroundTile = swampGroundTile.complete && swampGroundTile.naturalWidth > 0;
    const useLilyLarge = lilypadLarge.complete && lilypadLarge.naturalWidth > 0;
    const useLilyMedium = lilypadMedium.complete && lilypadMedium.naturalWidth > 0;
    const useBranch = platformBranch.complete && platformBranch.naturalWidth > 0;

    for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];
        const renderX = p.x - cameraOffsetX;
        const renderY = p.y - cameraOffsetY;
        if (renderX + p.width <= 0 || renderX >= canvas.width ||
            renderY + p.height <= 0 || renderY >= canvas.height) continue;

        const px = Math.round(renderX);
        const py = Math.round(renderY);
        const pw = Math.round(p.width);
        const ph = Math.round(p.height);

        // Starting platform (i===0) is always drawn as large lily pad; only use ground tile for non-lily fallback
        const isBranch = p.platformType === 'branch';
        const useLily = (p.lilyPad === 'large' && useLilyLarge) || (p.lilyPad === 'medium' && useLilyMedium);
        const lilyImg = p.lilyPad === 'large' ? lilypadLarge : lilypadMedium;
        const isGround = (i === 0) && !useLily;

        if (isBranch && useBranch) {
            ctx.drawImage(platformBranch, 0, 0, platformBranch.naturalWidth, platformBranch.naturalHeight, px, py, pw, ph);
        } else if (useLily && lilyImg.complete && lilyImg.naturalWidth > 0) {
            ctx.drawImage(lilyImg, 0, 0, lilyImg.naturalWidth, lilyImg.naturalHeight, px, py, pw, ph);
        } else if (isGround && useGroundTile && swampGroundTile.complete && swampGroundTile.naturalWidth > 0) {
            const tw = swampGroundTile.naturalWidth;
            const th = swampGroundTile.naturalHeight;
            for (let tx = 0; tx < pw; tx += TILE_W) {
                const clipW = Math.min(TILE_W, pw - tx);
                ctx.drawImage(swampGroundTile, 0, 0, tw, th, px + tx, py, clipW, ph);
            }
        } else if (!isGround && usePlatformTile && swampPlatformTile.complete && swampPlatformTile.naturalWidth > 0) {
            const tw = swampPlatformTile.naturalWidth;
            const th = swampPlatformTile.naturalHeight;
            for (let tx = 0; tx < pw; tx += TILE_W) {
                const clipW = Math.min(TILE_W, pw - tx);
                ctx.drawImage(swampPlatformTile, 0, 0, tw, th, px + tx, py, clipW, ph);
            }
        } else {
            ctx.fillStyle = p.color || '#654321';
            ctx.fillRect(px, py, pw, ph);
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(px, py + ph - 4, pw, 4);
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(px, py, pw, 2);
        }
    }

    ctx.restore();

    // 3. Powerups
    for (let pu of powerups) {
        if (!pu.collected && !pu.hidden) {
            const renderX = pu.x - cameraOffsetX;
            // Add a little floating bob to items
            const floatOffset = Math.sin(Date.now() / 200) * 4;
            const renderY = pu.y - cameraOffsetY + floatOffset;
            
            if (renderX + pu.width > 0 && renderX < canvas.width &&
                renderY + pu.height > 0 && renderY < canvas.height) {
                
                if (pu.type === 'soda' && ciderImage.complete && ciderImage.naturalHeight !== 0) {
                    // Draw the soda 2x larger (64x64) and perfectly centered over its 32x32 collision box
                    const drawX = renderX - 16;
                    const drawY = renderY - 16;
                    ctx.drawImage(ciderImage, Math.round(drawX), Math.round(drawY), 64, 64);
                } else if (pu.type === 'key' && keyImage.complete && keyImage.naturalHeight !== 0) {
                    ctx.drawImage(keyImage, Math.round(renderX), Math.round(renderY), pu.width, pu.height);
                } else if (pu.type === 'glass_case' && glassCaseImage.complete && glassCaseImage.naturalHeight !== 0) {
                    ctx.drawImage(glassCaseImage, Math.round(renderX), Math.round(renderY), pu.width, pu.height);
                    if (pu.showWarningUntil && Date.now() < pu.showWarningUntil) {
                        ctx.save();
                        ctx.fillStyle = '#ff4444';
                        ctx.strokeStyle = '#000';
                        ctx.lineWidth = 2;
                        ctx.font = 'bold 14px "Courier New", monospace';
                        ctx.textAlign = 'center';
                        ctx.strokeText("1 Key Required", Math.round(renderX + pu.width / 2), Math.round(renderY) - 10);
                        ctx.fillText("1 Key Required", Math.round(renderX + pu.width / 2), Math.round(renderY) - 10);
                        ctx.restore();
                    }
                } else if (pu.type === 'scroll' && scrollImage.complete && scrollImage.naturalHeight !== 0) {
                    ctx.drawImage(scrollImage, Math.round(renderX), Math.round(renderY), pu.width, pu.height);
                } else if (pu.type === 'portal' && portalImage.complete && portalImage.naturalHeight !== 0) {
                    ctx.drawImage(portalImage, Math.round(renderX), Math.round(renderY), pu.width, pu.height);
                } else if (pu.type === 'coin') {
                    if (sackCoinsImage.complete && sackCoinsImage.naturalHeight !== 0) {
                        ctx.drawImage(sackCoinsImage, Math.round(renderX), Math.round(renderY), pu.width, pu.height);
                    } else {
                        ctx.fillStyle = '#ffd700';
                        ctx.beginPath();
                        ctx.arc(Math.round(renderX) + pu.width / 2, Math.round(renderY) + pu.height / 2, pu.width / 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                } else {
                    ctx.fillStyle = '#00FF00';
                    ctx.fillRect(Math.round(renderX), Math.round(renderY), pu.width, pu.height);
                }
            }
        }
    }

    // Draw NPCs (same flush-on-pad offset as main character; archivist faces left so mirror flip)
    const NPC_GROUND_OFFSET_Y = 18;
    for (let npc of npcs) {
        const renderX = npc.x - cameraOffsetX;
        const renderY = npc.y - cameraOffsetY + NPC_GROUND_OFFSET_Y;
        
        if (renderX + npc.width > 0 && renderX < canvas.width &&
            renderY + npc.height > 0 && renderY < canvas.height) {
            const npcImg = npcArchivistProcessed || npcArchivistSprite;
            const nw = npcImg.width || npcImg.naturalWidth || 0;
            const nh = npcImg.height || npcImg.naturalHeight || 0;
            if (npcArchivistSprite.complete && nw > 0 && nh > 0) {
                const prev = ctx.imageSmoothingEnabled;
                ctx.imageSmoothingEnabled = false;
                ctx.save();
                ctx.translate(renderX + npc.width, renderY);
                ctx.scale(-1, 1);
                ctx.drawImage(npcImg, 0, 0, nw, nh, 0, 0, npc.width, npc.height);
                ctx.restore();
                ctx.imageSmoothingEnabled = prev;
            } else {
                ctx.fillStyle = npc.color;
                ctx.fillRect(Math.round(renderX), Math.round(renderY), npc.width, npc.height);
            }
            
            // Draw interaction prompt if close
            const pCenterX = player.x + player.width / 2;
            const pCenterY = player.y + player.height / 2;
            const dist = Math.sqrt(Math.pow(pCenterX - (npc.x + npc.width / 2), 2) + Math.pow(pCenterY - (npc.y + npc.height / 2), 2));
            if (dist < 60 && !isChatting) {
                ctx.fillStyle = '#fff';
                ctx.font = '12px Courier New';
                ctx.fillText("Press E", Math.round(renderX) - 5, Math.round(renderY) - 10);
            }
        }
    }

    // --- Choose sprite: TEST = always static jump_f1_crouch.png; else full animation ---
    let currentSprite;
    let bobbingOffset = 0;
    if (USE_STATIC_CROUCH) {
        currentSprite = restingSprite;
    } else {
        player.animTimer++;
        const isMoving = Math.abs(player.velX) > 0.5;
        if (player.animTimer >= (isMoving ? RUN_ANIM_SPEED : IDLE_ANIM_SPEED)) {
            player.animTimer = 0;
            player.animFrame = (player.animFrame + 1) % 2;
        }
        if (player.grounded && player.animFrame === 1) bobbingOffset = isMoving ? -2 : 1;
        const isResting = player.grounded && player.landingTimer <= 0 && !keys.ArrowUp && !keys.Space;
        if (isResting) currentSprite = restingSprite;
        else if (!player.grounded) {
            if (player.velY < -8) currentSprite = jumpFrames[0];
            else if (player.velY < -3) currentSprite = jumpFrames[1];
            else if (player.velY >= -3 && player.velY <= 3) currentSprite = jumpFrames[2];
            else currentSprite = jumpFrames[3];
        } else if (player.landingTimer > 0) { currentSprite = jumpFrames[4]; bobbingOffset = 2; }
        else { currentSprite = jumpFrames[0]; bobbingOffset = 2; }
        if (!currentSprite.complete || currentSprite.naturalHeight === 0) {
            currentSprite = player.grounded ? restingSprite : heroJumpImage;
        }
    }

    // Draw so toad is flush on the pad (sprite has empty space at bottom)
    const GROUND_OFFSET_Y = 12;
    const renderX = player.x - cameraOffsetX;
    const renderY = player.y - cameraOffsetY + bobbingOffset + (player.grounded ? GROUND_OFFSET_Y : 0);
    if (renderX + player.width > 0 && renderX < canvas.width &&
        renderY + player.height > 0 && renderY < canvas.height) {
        if (currentSprite.complete && currentSprite.naturalHeight !== 0) {
            const sw = currentSprite.naturalWidth;
            const sh = currentSprite.naturalHeight;
            const dw = Math.round(player.width);
            const dh = Math.round(player.height);
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            if (!player.facingRight) {
                ctx.translate(renderX + player.width, renderY);
                ctx.scale(-1, 1);
                ctx.drawImage(currentSprite, 0, 0, sw, sh, 0, 0, dw, dh);
            } else {
                ctx.drawImage(currentSprite, 0, 0, sw, sh, Math.round(renderX), Math.round(renderY), dw, dh);
            }
            ctx.restore();
        } else {
            ctx.fillStyle = player.color;
            ctx.fillRect(Math.round(renderX), Math.round(renderY), Math.round(player.width), Math.round(player.height));
        }
    }

    // --- Blue edge glow when soda is active ---
    if (player.hasSoda) {
        const glowW = 80;
        ctx.globalCompositeOperation = 'lighter';
        
        // Left
        let g = ctx.createLinearGradient(0, 0, glowW, 0);
        g.addColorStop(0, 'rgba(100, 180, 255, 0.5)');
        g.addColorStop(1, 'rgba(100, 180, 255, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, glowW, canvas.height);
        
        // Right
        g = ctx.createLinearGradient(canvas.width, 0, canvas.width - glowW, 0);
        g.addColorStop(0, 'rgba(100, 180, 255, 0.5)');
        g.addColorStop(1, 'rgba(100, 180, 255, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(canvas.width - glowW, 0, glowW, canvas.height);
        
        // Top
        g = ctx.createLinearGradient(0, 0, 0, glowW);
        g.addColorStop(0, 'rgba(100, 180, 255, 0.4)');
        g.addColorStop(1, 'rgba(100, 180, 255, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, glowW);
        
        // Bottom
        g = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - glowW);
        g.addColorStop(0, 'rgba(100, 180, 255, 0.4)');
        g.addColorStop(1, 'rgba(100, 180, 255, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, canvas.height - glowW, canvas.width, glowW);
        
        ctx.globalCompositeOperation = 'source-over';
    }

    // --- HUD: coins (top right) and key indicator ---
    const pad = 8;
    const iconSize = 20;
    const boxH = 28;
    const boxPad = 4;
    const boxGap = 6;
    let hudX = canvas.width - pad;

    function drawHudBox(boxX, boxY, boxW, drawIcon, drawText) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);
        drawIcon(boxX + boxPad, boxY + boxPad, iconSize);
        ctx.fillStyle = '#f5d0a0';
        ctx.font = 'bold 14px sans-serif';
        ctx.textBaseline = 'middle';
        drawText(boxX + boxPad + iconSize + boxGap, boxY + boxH / 2);
        ctx.textBaseline = 'alphabetic';
    }

    if (player.hasScroll && scrollImage.complete && scrollImage.naturalHeight !== 0) {
        const boxW = boxPad * 2 + iconSize; // Just the icon
        const boxX = hudX - boxW;
        drawHudBox(boxX, pad, boxW,
            (x, y, sz) => ctx.drawImage(scrollImage, x, y, sz, sz),
            (tx, ty) => {});
        hudX = boxX - pad;
    }
    
    if (player.hasSoda && ciderImage.complete && ciderImage.naturalHeight !== 0) {
        const timeLeft = Math.max(0, Math.ceil((player.sodaExpiryTime - Date.now()) / 1000));
        const textStr = '⚡' + timeLeft + 's';
        const boxW = boxPad + iconSize + boxGap + 40;
        const boxX = hudX - boxW;
        drawHudBox(boxX, pad, boxW,
            (x, y, sz) => ctx.drawImage(ciderImage, x, y, sz, sz),
            (tx, ty) => ctx.fillText(textStr, tx - 4, ty));
        hudX = boxX - pad;
    }

    if (player.keyCount > 0 && keyImage.complete && keyImage.naturalHeight !== 0) {
        const boxW = boxPad + iconSize + boxGap + 24;
        const boxX = hudX - boxW;
        drawHudBox(boxX, pad, boxW,
            (x, y, sz) => ctx.drawImage(keyImage, x, y, sz, sz),
            (tx, ty) => ctx.fillText('x' + player.keyCount, tx, ty));
        hudX = boxX - pad;
    }
    // Coins: golden coin sack icon + xN
    const coinBoxW = boxPad + iconSize + boxGap + 40;
    const coinBoxX = hudX - coinBoxW;
    drawHudBox(coinBoxX, pad, coinBoxW,
        (x, y, sz) => {
            if (sackCoinsImage.complete && sackCoinsImage.naturalHeight !== 0) {
                ctx.drawImage(sackCoinsImage, x, y, sz, sz);
            } else {
                const cx = x + sz / 2, cy = y + sz / 2, r = sz / 2 - 2;
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#b8860b';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        },
        (tx, ty) => ctx.fillText('x' + player.coins, tx, ty));

    // --- Level text ---
    ctx.fillStyle = '#f5d0a0';
    ctx.font = 'bold 20px "Courier New", sans-serif';
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'left';
    ctx.fillText('LEVEL 1', pad, canvas.height - pad);
    ctx.textBaseline = 'alphabetic';

    if (levelCleared) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 64px "Courier New", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
        ctx.shadowBlur = 20;
        
        ctx.fillText('LEVEL CLEARED', canvas.width / 2, canvas.height / 2);
        
        ctx.shadowBlur = 0;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }
}

// --- Conversation Logic ---
function startConversation(npc) {
    isChatting = true;
    currentNPC = npc;
    if (npcNameDisplay) npcNameDisplay.textContent = npc.name + ":";
    chatOverlay.classList.remove('hidden');
    chatInput.focus();

    // Clear display and load history
    chatHistory.innerHTML = "";
    if (npc.messages.length === 0) {
        addMessageToChat('system', "You approach the " + npc.name + ".");
        const placeholder = document.createElement('div');
        placeholder.classList.add('chat-row', 'chat-msg-system');
        placeholder.innerHTML = '<div class="chat-portrait system">•</div><div class="chat-text">...</div>';
        chatHistory.appendChild(placeholder);
        (async () => {
            try {
                const greeting = await callGeminiAPI(npc);
                npc.messages.push({ role: 'user', content: '(approach)' });
                npc.messages.push({ role: 'model', content: greeting });
                if (placeholder.parentNode) placeholder.remove();
                addMessageToChat('npc', greeting);
            } catch (e) {
                if (placeholder.parentNode) placeholder.remove();
                addMessageToChat('system', (e && e.message) ? e.message : "The NPC remains silent.");
            }
        })();
    } else {
        npc.messages.forEach(msg => {
            // Map 'user' to 'player' and 'model' to 'npc' for display purposes
            const displayRole = msg.role === 'user' ? 'player' : (msg.role === 'model' ? 'npc' : msg.role);
            addMessageToChat(displayRole, msg.content);
        });
    }
}

function stopConversation() {
    isChatting = false;
    currentNPC = null;
    chatOverlay.classList.add('hidden');
    // Important: Reset keys so player doesn't jump immediately after closing chat with Space
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
    keys.ArrowUp = false;
    keys.Space = false;
    keys.KeyE = false;
    // Return focus to game
    canvas.focus();
}

function addMessageToChat(role, message) {
    const row = document.createElement('div');
    row.classList.add('chat-row', `chat-msg-${role}`);

    if (role !== 'system') {
        const portrait = document.createElement('div');
        portrait.classList.add('chat-portrait');
        const srcImg = (role === 'npc' && currentNPC) ? dialogueArchivistImg : dialogueProtagonistImg;
        const c = document.createElement('canvas');
        c.width = 48;
        c.height = 48;
        c.setAttribute('aria-label', (role === 'npc' && currentNPC) ? currentNPC.name : 'You');
        const ctx = c.getContext('2d');
        function draw() {
            if (srcImg.complete && srcImg.naturalWidth > 0) {
                ctx.drawImage(srcImg, 0, 0, srcImg.naturalWidth, srcImg.naturalHeight, 0, 0, 48, 48);
            }
        }
        draw();
        srcImg.addEventListener('load', draw);
        portrait.appendChild(c);
        row.appendChild(portrait);
    }

    const textWrap = document.createElement('div');
    textWrap.classList.add('chat-text');
    let nameLine = '';
    if (role === 'player') nameLine = 'You\n';
    else if (role === 'npc' && currentNPC) nameLine = currentNPC.name + '\n';
    const textNode = document.createTextNode(nameLine + message);
    textWrap.appendChild(textNode);
    row.appendChild(textWrap);

    chatHistory.appendChild(row);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Global Chat Event Listeners
chatCloseBtn.addEventListener('click', stopConversation);
chatSendBtn.addEventListener('click', handleChatSubmit);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleChatSubmit();
});

async function handleChatSubmit() {
    const text = chatInput.value.trim();
    if (!text || !currentNPC) return;

    // 1. Show player message
    addMessageToChat('player', text);
    currentNPC.messages.push({ role: 'user', content: text });
    chatInput.value = "";

    const playerOfferedPayment = triggers.revealPlatform.phrases.some(p => text.toLowerCase().includes(p));

    // 2. Call Gemini API
    addMessageToChat('system', "[Thinking...]");

    try {
        const responseText = await callGeminiAPI(currentNPC);
        chatHistory.removeChild(chatHistory.lastChild); // Remove Thinking
        addMessageToChat('npc', responseText);
        currentNPC.messages.push({ role: 'model', content: responseText });

        // Spawn key only AFTER the frog has agreed in their response (not before)
        if (playerOfferedPayment) {
            triggers.revealPlatform.action(text);
        }
    } catch (e) {
        chatHistory.removeChild(chatHistory.lastChild);
        const msg = (e && e.message) ? e.message : "Connection error. The NPC remains silent.";
        addMessageToChat('system', msg);
        console.error(e);
    }
}

async function callGeminiAPI(npc) {
    if (GEMINI_API_KEY === "YOUR_API_KEY_HERE") {
        return new Promise(resolve => setTimeout(() => resolve("I don't trust you... are you a friend?"), 1000));
    }

    // Same as first GH push: v1beta, gemini-pro, system as first user message in contents
    const history = npc.messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
    }));

    const systemInstruction = {
        role: "user",
        parts: [{ text: "System Instruction: " + npc.promptContext }]
    };

    const requestBody = {
        contents: [systemInstruction, ...history],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    if (!response.ok) {
        const err = data?.error?.message || data?.message || response.statusText;
        throw new Error(err || "API call failed");
    }
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error(data?.promptFeedback?.blockReason || "No response from model");
    }
    return data.candidates[0].content.parts[0].text;
}

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // Cap deltaTime to prevent "spiral of death" if tab is inactive
    accumulator += Math.min(deltaTime, 250);

    // Fixed timestep update for consistent physics
    while (accumulator >= FIXED_TIME_STEP) {
        update();
        accumulator -= FIXED_TIME_STEP;
    }

    // Pass interpolation factor to draw if we want to interpolate rendering later: accumulator / FIXED_TIME_STEP
    draw();
    gameLoopId = requestAnimationFrame(gameLoop);
}

// --- Scale canvas to fit window (keeps fixed 800x450 game resolution) ---
function resizeCanvas() {
    const inner = document.getElementById('canvas-inner');
    if (!inner) return;
    const wrapper = canvas.closest('#canvas-wrapper');
    const w = wrapper ? wrapper.clientWidth : window.innerWidth;
    const h = wrapper ? wrapper.clientHeight : window.innerHeight;
    if (w > 0 && h > 0) {
        const scale = Math.min(w / GAME_WIDTH, h / GAME_HEIGHT);
        inner.style.width = (GAME_WIDTH * scale) + 'px';
        inner.style.height = (GAME_HEIGHT * scale) + 'px';
    }
}
window.addEventListener('load', resizeCanvas);
window.addEventListener('resize', resizeCanvas);

// Start the game loop
requestAnimationFrame(function init() {
    resizeCanvas();
    requestAnimationFrame(gameLoop);
});
