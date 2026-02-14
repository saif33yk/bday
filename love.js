// Canvas setup
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Tree configuration
const treeConfig = {
    startX: canvas.width / 2,
    startY: canvas.height - 100,
    len: 120,
    angle: -Math.PI / 2,
    branchWidth: 25,
    color: '#ffb6c1'
};

let particles = [];
let hearts = [];
let animationId;
let treeGrown = false;

// Heart particle class
class HeartParticle {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.size = Math.random() * 8 + 4;
        this.color = `hsl(${Math.random() * 60 + 300}, 100%, ${Math.random() * 30 + 50}%)`;
        this.speed = Math.random() * 2 + 1;
        this.angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.life = 1;
        this.decay = Math.random() * 0.01 + 0.005;
    }

    update() {
        // Move towards target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 5) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        } else {
            // Float around when reached target
            this.x += Math.sin(Date.now() * 0.001 + this.angle) * 0.5;
            this.y += Math.cos(Date.now() * 0.001 + this.angle) * 0.5;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        
        // Draw heart shape
        ctx.beginPath();
        const s = this.size;
        ctx.moveTo(0, -s * 0.3);
        ctx.bezierCurveTo(-s * 0.5, -s * 0.8, -s, -s * 0.3, -s, 0);
        ctx.bezierCurveTo(-s, s * 0.6, 0, s * 0.9, 0, s);
        ctx.bezierCurveTo(0, s * 0.9, s, s * 0.6, s, 0);
        ctx.bezierCurveTo(s, -s * 0.3, s * 0.5, -s * 0.8, 0, -s * 0.3);
        ctx.fill();
        
        ctx.restore();
    }
}

// Recursive tree drawing
function drawBranch(x, y, len, angle, width, depth) {
    if (depth === 0) {
        // Store endpoint for heart particles
        const endX = x + Math.cos(angle) * len;
        const endY = y + Math.sin(angle) * len;
        
        // Create heart particles at branch ends
        for (let i = 0; i < 3; i++) {
            const offsetX = (Math.random() - 0.5) * 100;
            const offsetY = (Math.random() - 0.5) * 100;
            hearts.push(new HeartParticle(
                canvas.width / 2,
                canvas.height,
                endX + offsetX,
                endY + offsetY
            ));
        }
        return;
    }

    const endX = x + Math.cos(angle) * len;
    const endY = y + Math.sin(angle) * len;

    // Draw branch
    ctx.strokeStyle = `rgb(${255 - depth * 10}, ${182 - depth * 5}, ${193 - depth * 5})`;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Recursive calls for sub-branches
    const newLen = len * 0.75;
    const newWidth = width * 0.7;
    
    // Left branch
    drawBranch(endX, endY, newLen, angle - 0.3, newWidth, depth - 1);
    // Right branch
    drawBranch(endX, endY, newLen, angle + 0.3, newWidth, depth - 1);
    
    // Occasionally add a middle branch for fullness
    if (depth > 3 && Math.random() > 0.7) {
        drawBranch(endX, endY, newLen * 0.8, angle + (Math.random() - 0.5) * 0.2, newWidth, depth - 1);
    }
}

// Animated tree growth
let growthProgress = 0;
function animateTree() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (growthProgress < 10) {
        growthProgress += 0.1;
        const currentDepth = Math.floor(growthProgress);
        
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height - 50);
        drawBranchAnimated(0, 0, 120, -Math.PI / 2, 25, currentDepth, growthProgress - currentDepth);
        ctx.restore();
        
        animationId = requestAnimationFrame(animateTree);
    } else {
        treeGrown = true;
        // Start heart animation
        animateHearts();
        // Show text
        showText();
    }
}

function drawBranchAnimated(x, y, len, angle, width, depth, partial) {
    if (depth <= 0) return;
    
    const actualLen = len * (partial > 0 ? partial : 1);
    const endX = x + Math.cos(angle) * actualLen;
    const endY = y + Math.sin(angle) * actualLen;

    ctx.strokeStyle = `rgb(${255 - depth * 8}, ${182 - depth * 4}, ${193 - depth * 4})`;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    if (partial >= 1) {
        const newLen = len * 0.75;
        const newWidth = width * 0.7;
        drawBranchAnimated(endX, endY, newLen, angle - 0.3, newWidth, depth - 1, 1);
        drawBranchAnimated(endX, endY, newLen, angle + 0.3, newWidth, depth - 1, 1);
    }
}

function animateHearts() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw tree structure (static after growth)
    if (treeGrown) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height - 50);
        drawBranch(0, 0, 120, -Math.PI / 2, 25, 10);
        ctx.restore();
    }
    
    // Update and draw heart particles
    hearts.forEach((heart, index) => {
        heart.update();
        heart.draw();
    });
    
    // Add more hearts over time
    if (hearts.length < 300 && Math.random() > 0.9) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 200;
        const targetX = canvas.width / 2 + Math.cos(angle) * radius;
        const targetY = canvas.height / 2 + Math.sin(angle) * radius - 100;
        
        hearts.push(new HeartParticle(
            canvas.width / 2 + (Math.random() - 0.5) * 50,
            canvas.height,
            targetX,
            targetY
        ));
    }
    
    animationId = requestAnimationFrame(animateHearts);
}

// Typewriter text effect
function showText() {
    const container = document.getElementById('text-container');
    container.classList.add('show');
    
    const lines = container.querySelectorAll('.say');
    lines.forEach((line, index) => {
        line.style.animationDelay = `${index * 1.5}s`;
    });
}

// Start animation on click
function startAnimation() {
    document.getElementById('click-me').classList.add('hidden');
    
    // Play audio
    const audio = document.getElementById('myAudio');
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Audio autoplay blocked'));
    
    // Start tree animation
    animateTree();
}

// Handle resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Auto-start after delay if not clicked
setTimeout(() => {
    if (!treeGrown) {
        startAnimation();
    }
}, 5000);
