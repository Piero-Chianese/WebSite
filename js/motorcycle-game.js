class MountainMotoDash {
    constructor() {
        this.canvas = document.getElementById('motoCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.resize();
        
        // Assets
        this.bikeImg = new Image();
        this.bikeImg.src = 'assets/images/yellow_moto.png';
        this.bgImg = new Image();
        this.bgImg.src = 'assets/images/mountain_bg.png';
        this.treeImg = new Image();
        this.treeImg.src = 'assets/images/pine_tree.png';
        
        // Game State
        this.isPlaying = false;
        this.score = 0;
        this.speed = 0;
        this.baseSpeed = 6;
        this.roadOffset = 0;
        this.roadCurvature = 0;
        this.targetCurvature = 0;
        this.horizonCurvature = 0;
        
        // Prompt State
        this.currentPrompt = null;
        this.promptCooldown = 60;
        this.isFrozen = false;
        
        this.trees = [];
        this.inkColor = '#2b3024';
        this.lcdBg = '#9ead86';
        
        this.keys = {};
        this.initInput();
        window.addEventListener('resize', () => this.resize());
        this.loop();
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    initInput() {
        window.addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) this.handlePress(e.code);
            this.keys[e.code] = true;
        });
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        document.getElementById('leftBtn').addEventListener('mousedown', () => this.handlePress('ArrowLeft'));
        document.getElementById('rightBtn').addEventListener('mousedown', () => this.handlePress('ArrowRight'));
        document.getElementById('startBtn').addEventListener('click', () => this.start());
    }

    handlePress(keyCode) {
        if (!this.isPlaying || !this.currentPrompt) return;
        const sidePressed = keyCode === 'ArrowLeft' ? -1 : (keyCode === 'ArrowRight' ? 1 : 0);
        
        if (sidePressed === this.currentPrompt.side) {
            this.score += 50;
            this.targetCurvature = sidePressed * 150;
            this.horizonCurvature = 0;
            this.currentPrompt = null;
            this.isFrozen = false;
            this.speed = this.baseSpeed * 1.8;
            this.promptCooldown = 25 + Math.random() * 25;
            this.baseSpeed += 0.45;
            document.getElementById('scoreDisplay').innerText = this.score.toString().padStart(5, '0');
        } else if (sidePressed !== 0) {
            this.gameOver();
        }
    }

    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.score = 0;
        this.baseSpeed = 8;
        this.speed = this.baseSpeed;
        this.currentPrompt = null;
        this.promptCooldown = 40;
        this.roadCurvature = 0;
        this.targetCurvature = 0;
        this.horizonCurvature = 0;
        this.trees = [];
        this.isFrozen = false;
        document.getElementById('startOverlay').style.display = 'none';
        document.getElementById('gameOverOverlay').style.display = 'none';
        document.getElementById('scoreDisplay').innerText = "00000";
    }

    gameOver() {
        this.isPlaying = false;
        document.getElementById('gameOverOverlay').style.display = 'block';
        document.getElementById('finalScore').innerText = this.score;
    }

    update() {
        if (!this.isPlaying) return;

        this.roadCurvature += (this.targetCurvature - this.roadCurvature) * 0.2;
        this.targetCurvature *= 0.85;

        const horizonY = this.canvas.height * 0.45;

        if (!this.currentPrompt) {
            this.promptCooldown -= 1;
            if (this.promptCooldown <= 0) {
                const side = Math.random() > 0.5 ? 1 : -1;
                const duration = Math.max(5, 130 - (this.baseSpeed * 6.5));
                this.currentPrompt = { side, timer: duration, total: duration };
                this.isFrozen = true;
                this.speed = 0;
                this.horizonCurvature = side * 90;
            }
        } else {
            this.currentPrompt.timer -= 1;
            if (this.currentPrompt.timer <= 0) this.gameOver();
        }

        if (!this.isFrozen) {
            this.speed += (this.baseSpeed - this.speed) * 0.15;
            this.roadOffset = (this.roadOffset + this.speed) % 100;
            
            if (Math.random() < 0.3) {
                const side = Math.random() > 0.5 ? 1 : -1;
                this.trees.push({ y: horizonY, side });
            }
            
            for (let i = this.trees.length - 1; i >= 0; i--) {
                this.trees[i].y += this.speed;
                if (this.trees[i].y > this.canvas.height) this.trees.splice(i, 1);
            }
        }
    }

    draw() {
        const scale = this.canvas.width / 600; // Base scaling factor
        
        // Clear LCD
        this.ctx.fillStyle = this.lcdBg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const centerX = this.canvas.width / 2;
        const horizonY = this.canvas.height * 0.45;
        
        // --- LAYER 1: ROAD ---
        const horizonW = 1;
        const bottomW = this.canvas.width * 0.5; // Scale with width
        this.ctx.strokeStyle = this.inkColor;
        this.ctx.lineWidth = 6 * scale;
        const foregroundX = centerX + this.roadCurvature * 4.5 * scale;
        const distalX = centerX + this.horizonCurvature * 3.8 * scale;
        
        this.ctx.beginPath();
        this.ctx.moveTo(distalX - horizonW, horizonY);
        this.ctx.quadraticCurveTo(foregroundX - horizonW, this.canvas.height * 0.8, centerX - bottomW, this.canvas.height);
        this.ctx.moveTo(distalX + horizonW, horizonY);
        this.ctx.quadraticCurveTo(foregroundX + horizonW, this.canvas.height * 0.8, centerX + bottomW, this.canvas.height);
        this.ctx.stroke();

        // Central Line
        this.ctx.setLineDash([40 * scale, 40 * scale]);
        this.ctx.lineDashOffset = -this.roadOffset * 4 * scale;
        this.ctx.beginPath();
        this.ctx.moveTo(distalX, horizonY);
        this.ctx.quadraticCurveTo(foregroundX, this.canvas.height * 0.8, centerX, this.canvas.height);
        this.ctx.lineWidth = 6 * scale;
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // --- LAYER 2: MOUNTAINS ---
        if (this.bgImg.complete) {
            this.ctx.fillStyle = '#444c38';
            this.ctx.fillRect(0, horizonY - (140 * scale), this.canvas.width, 140 * scale);
            this.ctx.drawImage(this.bgImg, 0, horizonY - (180 * scale), this.canvas.width, 220 * scale);
        }

        // --- LAYER 3: TREES ---
        this.trees.forEach(tree => {
            const progress = (tree.y - horizonY) / (this.canvas.height - horizonY);
            if (progress < 0) return;
            
            const roadXAtY = (this.roadCurvature * progress * 6.5 * scale) + (this.horizonCurvature * (1 - progress) * 4 * scale);
            const roadWidthAtY = horizonW + progress * (bottomW - horizonW);
            
            const x = centerX + roadXAtY + (tree.side * (roadWidthAtY + (10 * scale) + progress * (40 * scale)));
            const size = (35 * scale) + Math.pow(progress, 2.5) * (350 * scale);
            
            if (this.treeImg.complete) {
                this.ctx.drawImage(this.treeImg, x - size/2, tree.y - size, size, size);
            }
        });

        // --- LAYER 4: BIKE ---
        const playerY = this.canvas.height * 0.88;
        const playerX = centerX + (this.roadCurvature * 2.8 * scale);
        this.ctx.save();
        this.ctx.translate(playerX, playerY);
        this.ctx.rotate(this.roadCurvature * 0.04);
        if (this.bikeImg.complete) {
            const w = 230 * scale; const h = 230 * scale;
            this.ctx.drawImage(this.bikeImg, -w/2, -h/2 - (40 * scale), w, h);
        }
        this.ctx.restore();

        // --- LAYER 5: HUD ---
        if (this.currentPrompt) {
            const side = this.currentPrompt.side;
            const hudY = horizonY - (110 * scale);
            const timePercent = this.currentPrompt.timer / this.currentPrompt.total;
            if ((timePercent > 0.4) || (Math.floor(Date.now() / 400) % 2 === 0)) {
                this.ctx.fillStyle = this.inkColor;
                this.ctx.font = `800 ${Math.floor(52 * scale)}px Outfit, sans-serif`;
                this.ctx.textAlign = 'center';
                const arrowText = side === -1 ? '◀ LEAN' : 'LEAN ▶';
                this.ctx.fillText(arrowText, centerX, hudY);
            }
            
            const barWidth = 240 * scale;
            const segments = 10;
            const sW = (barWidth - (segments - 1) * (6 * scale)) / segments;
            for (let i = 0; i < segments; i++) {
                this.ctx.fillStyle = (i / segments) < timePercent ? this.inkColor : 'rgba(43, 48, 36, 0.1)';
                this.ctx.fillRect(centerX - barWidth/2 + i * (sW + (6 * scale)), hudY + (28 * scale), sW, 16 * scale);
            }
        }
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new MountainMotoDash();
});
