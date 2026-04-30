(function() {
    console.log("Maze Game Engine v3.2 - Absolute Stability");

    const pathW = 25, wallW = 10, ballR = 6, maxV = 1.3;
    let gameActive = false, startTime = 0, prevTime = 0;
    let mouseStartX = 0, mouseStartY = 0;
    let accX = 0, accY = 0;
    let ball = { x: 0, y: 0, vx: 0, vy: 0 };
    
    let modal, canvas, ctx, joystickHead, timer, note, winScreen, finalTimeEl, gameLayout;

    const walls = [
        // Outer Border
        { c: 0, r: 0, h: true, l: 10 }, { c: 0, r: 0, v: true, l: 10 },
        { c: 0, r: 10, h: true, l: 10 }, { c: 10, r: 0, v: true, l: 10 },
        // PIERO
        { c: 1, r: 1, v: true, l: 2 }, { c: 2, r: 1, v: true, l: 1 }, { c: 1, r: 1, h: true, l: 1 }, { c: 1, r: 2, h: true, l: 1 }, // P
        { c: 3, r: 1, v: true, l: 2 }, // I
        { c: 4, r: 1, v: true, l: 2 }, { c: 4, r: 1, h: true, l: 1 }, { c: 4, r: 2, h: true, l: 1 }, { c: 4, r: 3, h: true, l: 1 }, // E
        { c: 6, r: 1, v: true, l: 2 }, { c: 6, r: 1, h: true, l: 1 }, { c: 7, r: 1, v: true, l: 1 }, { c: 6, r: 2, h: true, l: 1 }, { c: 6, r: 2, d: -45, l: 1.45 }, // R
        { c: 8, r: 1, v: true, l: 2 }, { c: 9, r: 1, v: true, l: 2 }, { c: 8, r: 1, h: true, l: 1 }, { c: 8, r: 3, h: true, l: 1 }, // O
        // GAME
        { c: 1, r: 4, v: true, l: 2 }, { c: 1, r: 4, h: true, l: 1 }, { c: 1, r: 6, h: true, l: 1 }, { c: 2, r: 5, v: true, l: 1 }, // G
        { c: 3, r: 4, v: true, l: 2 }, { c: 4, r: 4, v: true, l: 2 }, { c: 3, r: 4, h: true, l: 1 }, { c: 3, r: 5, h: true, l: 1 }, // A
        { c: 5, r: 4, v: true, l: 2 }, { c: 7, r: 4, v: true, l: 2 }, { c: 5, r: 4, d: -45, l: 1.45 }, { c: 7, r: 4, d: 45, l: 1.45 }, // M
        { c: 8, r: 4, v: true, l: 2 }, { c: 8, r: 4, h: true, l: 1 }, { c: 8, r: 5, h: true, l: 1 }, { c: 8, r: 6, h: true, l: 1 }, // E
        // DEV
        { c: 2, r: 7, v: true, l: 2 }, { c: 2, r: 7, d: -45, l: 1.45 }, { c: 3, r: 8, d: 45, l: 1.45 }, // D
        { c: 4, r: 7, v: true, l: 2 }, { c: 4, r: 7, h: true, l: 1 }, { c: 4, r: 8, h: true, l: 1 }, { c: 4, r: 9, h: true, l: 1 }, // E
        { c: 6, r: 7, v: true, l: 1 }, { c: 8, r: 7, v: true, l: 1 }, { c: 6, r: 8, d: -45, l: 1.5 }, { c: 8, r: 8, d: 45, l: 1.5 } // V
    ];

    function init() {
        modal = document.getElementById("maze-game-modal");
        canvas = document.getElementById("maze");
        if (!canvas) return;
        ctx = canvas.getContext("2d");
        joystickHead = document.getElementById("joystick-head");
        timer = document.getElementById("maze-timer");
        note = document.getElementById("note");
        winScreen = document.getElementById("maze-win-screen");
        finalTimeEl = document.getElementById("final-time");
        gameLayout = document.querySelector(".game-layout");
        
        if (!modal || modal.dataset.v32) return;
        document.getElementById("maze-close-btn").onclick = () => { modal.classList.remove('active'); gameActive = false; };
        
        const startH = (e) => {
            if (winScreen && winScreen.classList.contains('active')) return;
            const t = e.touches ? e.touches[0] : e;
            mouseStartX = t.pageX; mouseStartY = t.pageY;
            gameActive = true; startTime = Date.now();
            if (note) note.style.opacity = 0;
            joystickHead.style.animation = 'none';
            window.requestAnimationFrame(loop);
        };
        joystickHead.addEventListener('mousedown', startH);
        joystickHead.addEventListener('touchstart', startH);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', (e) => handleMove(e.touches ? e.touches[0] : e));
        window.addEventListener('keydown', (e) => { if (e.key === ' ') reset(); });
        modal.dataset.v32 = "true";
    }

    function reset() {
        gameActive = false; accX = 0; accY = 0; ball.vx = 0; ball.vy = 0;
        ball.x = wallW/2 + pathW/2; ball.y = wallW/2 + pathW/2;
        if (timer) timer.innerText = "0.0s";
        if (canvas) canvas.style.transform = "rotateX(0deg) rotateY(0deg)";
        if (joystickHead) { joystickHead.style.left = "50%"; joystickHead.style.top = "50%"; joystickHead.style.transform = "translate(-50%, -50%)"; joystickHead.style.animation = "maze-glow 0.6s infinite alternate"; }
        if (note) { note.innerHTML = "<strong>PIERO GAME DEV</strong><br>Trascina il joystick per giocare!"; note.style.opacity = 1; }
        if (winScreen) winScreen.classList.remove('active');
        if (gameLayout) gameLayout.classList.remove('blur');
        render();
    }

    function handleMove(e) {
        if (!gameActive || !modal.classList.contains('active')) return;
        const t = e.touches ? e.touches[0] : e;
        const dx = Math.max(-25, Math.min(25, t.pageX - mouseStartX));
        const dy = Math.max(-25, Math.min(25, t.pageY - mouseStartY));
        
        if (joystickHead) {
            joystickHead.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        }
        if (canvas) {
            // Corrected X-axis inversion
            const rotX = -dy * 0.6;
            const rotY = dx * 0.6;
            canvas.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
        }
        accX = dx * 0.05; accY = dy * 0.05;
    }

    function loop(time) {
        if (!gameActive || !modal.classList.contains('active')) return;
        const dt = prevTime ? Math.min(1.5, (time - prevTime) / 16) : 1; prevTime = time;
        ball.vx = Math.max(-maxV, Math.min(ball.vx + accX * dt, maxV)) * 0.94;
        ball.vy = Math.max(-maxV, Math.min(ball.vy + accY * dt, maxV)) * 0.94;
        let nx = ball.x + ball.vx * dt, ny = ball.y + ball.vy * dt;

        walls.forEach(w => {
            const wx = w.c * (pathW + wallW), wy = w.r * (pathW + wallW), wl = w.l * (pathW + wallW);
            if (w.h || w.v) {
                const rx = w.h ? wx : wx - wallW/2, ry = w.h ? wy - wallW/2 : wy;
                const rw = w.h ? wl : wallW, rh = w.h ? wallW : wl;
                if (nx + ballR > rx && nx - ballR < rx + rw && ny + ballR > ry && ny - ballR < ry + rh) {
                    if (ball.x + ballR <= rx || ball.x - ballR >= rx + rw) { ball.vx *= -0.4; nx = ball.x; }
                    if (ball.y + ballR <= ry || ball.y - ballR >= ry + rh) { ball.vy *= -0.4; ny = ball.y; }
                }
            } else if (w.d) {
                const d = distDiag(nx, ny, wx, wy, w.d, wl);
                if (d < ballR + 5) { ball.vx *= -0.4; ball.vy *= -0.4; nx = ball.x; ny = ball.y; }
            }
        });
        ball.x = nx; ball.y = ny;
        render();
        const sec = ((Date.now() - startTime) / 1000).toFixed(1);
        if (timer) timer.innerText = sec + "s";
        
        if (Math.sqrt((ball.x - 315)**2 + (ball.y - 300)**2) < 25) {
            gameActive = false;
            if (winScreen) { winScreen.classList.add('active'); if (finalTimeEl) finalTimeEl.innerText = sec + "s"; }
            if (gameLayout) gameLayout.classList.add('blur');
        } else window.requestAnimationFrame(loop);
    }

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath(); ctx.arc(315, 300, 15, 0, Math.PI * 2);
        ctx.setLineDash([5, 5]); ctx.strokeStyle = "#00d2ff"; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = "#333";
        walls.forEach(w => {
            const x = w.c * (pathW + wallW), y = w.r * (pathW + wallW), l = w.l * (pathW + wallW);
            ctx.save(); ctx.translate(x, y);
            if (w.h) ctx.fillRect(0, -wallW/2, l, wallW);
            else if (w.v) ctx.fillRect(-wallW/2, 0, wallW, l);
            else if (w.d) { ctx.rotate(w.d * Math.PI / 180); ctx.fillRect(-wallW/2, 0, wallW, l); }
            ctx.restore();
        });
        ctx.save(); ctx.beginPath(); ctx.arc(ball.x, ball.y, ballR, 0, Math.PI * 2);
        ctx.fillStyle = "#fff"; ctx.shadowBlur = 15; ctx.shadowColor = "#00d2ff"; ctx.fill(); ctx.restore();
    }

    function distDiag(px, py, x1, y1, rot, len) {
        const ang = (90 + rot) * Math.PI / 180;
        const x2 = x1 + Math.cos(ang) * len, y2 = y1 + Math.sin(ang) * len;
        const l2 = (x2-x1)**2 + (y2-y1)**2;
        if (l2 === 0) return Math.sqrt((px-x1)**2 + (py-y1)**2);
        let t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2));
        return Math.sqrt((px - (x1 + t * (x2 - x1)))**2 + (py - (y1 + t * (y2 - y1)))**2);
    }

    window.resetMazeGame = reset;
    window.showMazeGame = () => { init(); modal.classList.add('active'); reset(); };
    document.addEventListener("DOMContentLoaded", init);
})();
