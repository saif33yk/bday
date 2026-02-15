// ==========================================
// CONFIGURATION
// ==========================================
const CONFIG = {
    maxHearts: 150,           // Reduced from 300 for performance
    heartSpawnRate: 2,        // Spawn every N frames
    treeDepth: 9,             // Reduced depth for faster rendering
    branchAngle: 0.5,         // Wider angle for fuller tree
    growthSpeed: 0.15,        // Tree growth speed
    colors: {
        trunk: '#ffb6c1',
        hearts: ['#ff69b4', '#ff1493', '#ff6b6b', '#feca57', '#ff9ff3', '#54a0ff']
    }
};

// ==========================================
// CANVAS SETUP
// ==========================================
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { alpha: false }); // Optimize: no alpha
const treeCanvas = document.getElementById('treeCanvas');
const treeCtx = treeCanvas.getContext('2d');

let width, height, treeX, treeY;

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    treeCanvas.width = width;
    treeCanvas.height = height;
    treeX = width / 2;
    treeY = height - 80;
}
resize();
window.addEventListener('resize', () => {
    resize();
    if (treeGrown) renderTreeToCanvas();
});

// ==========================================
// OBJECT POOLING - Reuse heart objects
// ==========================================
class HeartPool {
    constructor(size) {
        this.pool = [];
        this.active = [];
        for (let i = 0; i < size; i++) {
            this.pool.push(new Heart());
        }
    }
    
    get() {
        const heart = this.pool.pop() || new Heart();
        heart.reset();
        this.active.push(heart);
        return heart;
    }
    
    release(heart) {
        const idx = this.active.indexOf(heart);
        if (idx > -1) {
            this.active.splice(idx, 1);
            this.pool.push(heart);
        }
    }
    
    update() {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const heart = this.active[i];
            heart.update();
            if (heart.isDead()) {
                this.release(heart);
            }
        }
    }
    
    draw(ctx) {
        for (const heart of this.active) {
            heart.draw(ctx);
        }
    }
}

// ==========================================
// HEART CLASS - Optimized
// ==========================================
class Heart {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.vx = 0;
        this.vy = 0;
        this.size = 0;
        this.color = '';
        this.alpha = 1;
        this.phase = 'growing'; // growing, blooming, floating
        this.floatOffset = Math.random() * Math.PI * 2;
    }
    
    reset() {
        // Start at bottom center
        this.x = treeX + (Math.random() - 0.5) * 40;
        this.y = height;
        
        // Target: heart-shaped distribution
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 180;
        // Heart shape math
        const hx = 16 * Math.pow(Math.sin(angle), 3);
        const hy = -(13 * Math.cos(angle) - 5 * Math.cos(2*angle) - 2 * Math.cos(3*angle) - Math.cos(4*angle));
        
        this.targetX = treeX + hx * 12 + (Math.random() - 0.5) * 60;
        this.targetY = treeY - 250 + hy * 12 + (Math.random() - 0.5) * 60;
        
        this.size = Math.random() * 6 + 3;
        this.color = CONFIG.colors.hearts[Math.floor(Math.random() * CONFIG.colors.hearts.length)];
        this.alpha = 0;
        this.phase = 'growing';
        this.floatOffset = Math.random() * Math.PI * 2;
        
        // Initial velocity (upward burst)
        const burstAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
        const burstSpeed = Math.random() * 4 + 2;
        this.vx = Math.cos(burstAngle) * burstSpeed;
        this.vy = Math.sin(burstAngle) * burstSpeed;
    }
    
    update() {
        if (this.phase === 'growing') {
            // Move toward target with easing
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 30) {
                this.phase = 'blooming';
                this.alpha = Math.min(this.alpha + 0.1, 1);
            } else {
                this.vx += dx * 0.001;
                this.vy += dy * 0.001;
                this.vx *= 0.95; // Damping
                this.vy *= 0.95;
                this.x += this.vx;
                this.y += this.vy;
                this.alpha = Math.min(this.alpha + 0.05, 1);
            }
        } else if (this.phase === 'blooming') {
            this.alpha = Math.min(this.alpha + 0.05, 1);
            if (this.alpha >= 1) this.phase = 'floating';
            
            // Gentle float
            this.x += Math.sin(Date.now() * 0.002 + this.floatOffset) * 0.3;
            this.y += Math.cos(Date.now() * 0.0015 + this.floatOffset) * 0.2;
        } else {
            // Floating phase - minimal calculation
            this.x += Math.sin(Date.now() * 0.001 + this.floatOffset) * 0.2;
            this.y += Math.cos(Date.now() * 0.0008 + this.floatOffset) * 0.15;
        }
    }
    
    draw(ctx) {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        
        // Optimized heart drawing - fewer bezier curves
        const s = this.size;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - s * 0.3);
        ctx.bezierCurveTo(
            this.x - s * 0.5, this.y - s * 0.8,
            this.x - s, this.y - s * 0.3,
            this.x - s, this.y
        );
        ctx.bezierCurveTo(
            this.x - s, this.y + s * 0.6,
            this.x, this.y + s * 0.9,
            this.x, this.y + s
        );
        ctx.bezierCurveTo(
            this.x, this.y + s * 0.9,
            this.x + s, this.y + s * 0.6,
            this.x + s, this.y
        );
        ctx.bezierCurveTo(
            this.x + s, this.y - s * 0.3,
            this.x + s * 0.5, this.y - s * 0.8,
            this.x, this.y - s * 0.3
        );
        ctx.fill();
    }
    
    isDead() {
        return this.alpha <= 0;
    }
}

// ==========================================
// TREE RENDERING - Pre-render to canvas
// ==========================================
let treeGrown = false;
let treeFrame = 0;

function renderTreeToCanvas() {
    treeCtx.clearRect(0, 0, width, height);
    treeCtx.save();
    treeCtx.translate(treeX, treeY);
    drawBranch(treeCtx, 0, 0, 100, -Math.PI / 2, 20, CONFIG.treeDepth);
    treeCtx.restore();
}

function drawBranch(ctx, x, y, len, angle, width, depth) {
    if (depth === 0) return;
    
    const endX = x + Math.cos(angle) * len;
    const endY = y + Math.sin(angle) * len;
    
    // Gradient color
    const r = 255 - depth * 8;
    const g = 182 - depth * 4;
    const b = 193 - depth * 4;
    ctx.strokeStyle = `rgb(${r},${g},${b})`;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    const newLen = len * 0.75;
    const newWidth = width * 0.7;
    
    drawBranch(ctx, endX, endY, newLen, angle - CONFIG.branchAngle, newWidth, depth - 1);
    drawBranch(ctx, endX, endY, newLen, angle + CONFIG.branchAngle, newWidth, depth - 1);
    
    // Occasional middle branch for fullness
    if (depth > 4 && depth % 2 === 0) {
        drawBranch(ctx, endX, endY, newLen * 0.8, angle + (Math.random() - 0.5) * 0.3, newWidth, depth - 1);
    }
}

// Animated tree growth (initial phase)
function animateTreeGrowth() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    
    treeFrame += CONFIG.growthSpeed;
    const currentDepth = Math.floor(treeFrame);
    
    ctx.save();
    ctx.translate(treeX, treeY);
    drawBranchAnimated(ctx, 0, 0, 100, -Math.PI / 2, 20, Math.min(currentDepth, CONFIG.treeDepth), treeFrame - currentDepth);
    ctx.restore();
    
    if (treeFrame < CONFIG.treeDepth + 2) {
        requestAnimationFrame(animateTreeGrowth);
    } else {
        // Pre-render tree to offscreen canvas
        renderTreeToCanvas();
        treeGrown = true;
        startHeartAnimation();
        showText();
    }
}

function drawBranchAnimated(ctx, x, y, len, angle, width, depth, progress) {
    if (depth <= 0) return;
    
    const actualLen = len * Math.min(progress, 1);
    const endX = x + Math.cos(angle) * actualLen;
    const endY = y + Math.sin(angle) * actualLen;
    
    const r = 255 - depth * 8;
    const g = 182 - depth * 4;
    const b = 193 - depth * 4;
    ctx.strokeStyle = `rgb(${r},${g},${b})`;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    if (progress >= 1) {
        const newLen = len * 0.75;
        const newWidth = width * 0.7;
        drawBranchAnimated(ctx, endX, endY, newLen, angle - CONFIG.branchAngle, newWidth, depth - 1, 1);
        drawBranchAnimated(ctx, endX, endY, newLen, angle + CONFIG.branchAngle, newWidth, depth - 1, 1);
    }
}

// ==========================================
// MAIN ANIMATION LOOP - Optimized
// ==========================================
const heartPool = new HeartPool(CONFIG.maxHearts);
let frameCount = 0;
let lastTime = 0;

function animate(currentTime) {
    // Calculate delta time for smooth animation
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // Clear with solid color (faster than clearRect)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    
    // Draw pre-rendered tree
    if (treeGrown) {
        ctx.drawImage(treeCanvas, 0, 0);
    }
    
    // Spawn new hearts (throttled)
    frameCount++;
    if (treeGrown && frameCount % CONFIG.heartSpawnRate === 0) {
        if (heartPool.active.length < CONFIG.maxHearts) {
            heartPool.get();
        }
    }
    
    // Update and draw hearts
    heartPool.update();
    heartPool.draw(ctx);
    
    // Reset composite operation
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    
    requestAnimationFrame(animate);
}

function startHeartAnimation() {
    // Initial burst of hearts
    for (let i = 0; i < 30; i++) {
        setTimeout(() => heartPool.get(), i * 50);
    }
}

// ==========================================
// UI & STARTUP
// ==========================================
function showText() {
    const container = document.getElementById('text-container');
    container.classList.add('show');
    
    const lines = container.querySelectorAll('.say');
    lines.forEach((line, index) => {
        line.style.animationDelay = `${index * 0.8}s`;
    });
}

function startAnimation() {
    document.getElementById('click-me').classList.add('hidden');
    
    // Play audio
    const audio = document.getElementById('myAudio');
    audio.volume = 0.4;
    audio.play().catch(() => {});
    
    // Start animations
    animateTreeGrowth();
    requestAnimationFrame(animate);
}

// Auto-start
setTimeout(() => {
    if (!treeGrown) startAnimation();
}, 3000);
