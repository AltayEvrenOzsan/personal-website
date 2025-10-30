// Projects data
const PROJECTS_DATA = [
    { name: "WEBWORKING", color: "#a3b18a", x: 0.2, y: 0.5, radius: 0.06, url: "https://edgyneer.itch.io/webworking" },
    { name: "TakeNote", color: "#d4a574", x: 0.5, y: 0.4, radius: 0.06, url: "https://github.com/AltayEvrenOzsan/takenote" },
    { name: "Portfolio", color: "#8b9b7a", x: 0.8, y: 0.5, radius: 0.06, url: "https://altayevrenozsan.dev" },
];

const canvas = document.getElementById('projects-canvas');
if (!canvas) {
    console.error('Canvas not found');
} else {
    const ctx = canvas.getContext('2d');
    
    let balls = [];
    let scale = 1;
    let mouse = { x: 0, y: 0 };
    let dragging = -1;
    let isDarkMode = false;
    
    // Helper: read CSS variable, with fallback
    function cssVar(name, fallback) {
        const v = getComputedStyle(document.documentElement).getPropertyValue(name);
        return (v ? v.trim() : '') || fallback;
    }

    // Helper: convert hex to rgba string with alpha
    function hexToRgba(hex, alpha = 1) {
        if (!hex) return `rgba(0,0,0,${alpha})`;
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const bigint = parseInt(hex, 16);
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Helper: lighten/darken hex color by percent (-100..100)
    function adjustHex(hex, percent) {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const num = parseInt(hex, 16);
        let r = (num >> 16) + Math.round(255 * (percent / 100));
        let g = ((num >> 8) & 0x00FF) + Math.round(255 * (percent / 100));
        let b = (num & 0x0000FF) + Math.round(255 * (percent / 100));
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));
        return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    }

    // Tema kontrolü
    function checkDarkMode() {
        const theme = document.documentElement.getAttribute('data-theme');
        isDarkMode = theme === 'dark';
    }

    // Read colors from CSS variables so they change together with theme
    function getThemeColors() {
        // Use CSS variables defined in style.css
        const textColor = cssVar('--text-color', '#e6f4ea');
        const linkColor = cssVar('--link-color', '#a3b18a');
        const bgColor = cssVar('--bg-color', '#181818');
        const borderColor = cssVar('--border-color', '#222');

        // ball stroke will be a semi-transparent version of border or text
        const ballStroke = hexToRgba(borderColor || textColor, 0.18);
    
        // finish line: accent (link) vs background
        const finishLineColor1 = linkColor || '#a3b18a';
        const finishLineColor2 = bgColor || '#181818';

        return {
            textColor,
            ballStroke,
            finishLineColor1,
            finishLineColor2,
        };
    }

    function setCanvasSize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        scale = Math.max(canvas.width, canvas.height);
    }

    function distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    class ProjectBall {
        constructor(name, color, x, y, radius, url) {
            this.name = name;
            this.color = color;
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.radius_normal = radius;
            this.radius_target = radius;
            this.hspd = 0;
            this.vspd = 0;
            this.fric = 0.94;
            this.mass = radius * radius * 3.14159;
            this.mouse_xoff = 0;
            this.mouse_yoff = 0;
            this.dragged = false;
            this.rspd = 0;
            this.hovered = false;
            this.url = url;
            this.finishLineReached = false;
        }

        step() {
            if (this.dragged) {
                const old_x = this.x;
                const old_y = this.y;
                this.x = mouse.x + this.mouse_xoff;
                this.y = mouse.y + this.mouse_yoff;
                this.hspd = (this.hspd + this.x - old_x) / 2;
                this.vspd = (this.vspd + this.y - old_y) / 2;
            } else {
                this.hspd *= this.fric;
                this.vspd *= this.fric;
                this.x += this.hspd;
                this.y += this.vspd;
            }

            this.mass = this.radius * this.radius * 3.14159;

            // Collision with other balls
            for (let i = 0; i < balls.length; i++) {
                if (balls[i] !== this) {
                    this.collideWithBall(balls[i]);
                }
            }

            // Wall collision
            this.collideWithWalls();

            // Finish line collision
            this.checkFinishLine();

            // Hover effect
            const dist = distance(mouse.x, mouse.y, this.x, this.y);
            this.hovered = dist < this.radius;

            const rfac = this.hovered ? 1.15 : 1.0;
            this.radius_target = this.radius_normal * rfac;

            this.rspd += (this.radius_target - this.radius) * 0.08;
            this.rspd *= 0.7;
            this.radius += this.rspd;

            if (this.radius < 0.001) this.radius = 0.001;
        }

        checkFinishLine() {
            const world_width = canvas.width / scale;
            const finish_line_x = world_width * 0.95;

            if (this.x + this.radius >= finish_line_x && !this.finishLineReached && !this.dragged) {
                this.finishLineReached = true;
                if (this.url) {
                    window.open(this.url, '_blank');
                }
            }

            if (this.x + this.radius < finish_line_x - 0.05) {
                this.finishLineReached = false;
            }
        }

        collideWithBall(other) {
            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const dist = distance(0, 0, dx, dy);
            const min_dist = this.radius + other.radius;

            if (dist < min_dist && dist > 0) {
                const overlap = min_dist - dist;
                const nx = dx / dist;
                const ny = dy / dist;

                const totalMass = this.mass + other.mass;
                const m1 = this.mass / totalMass;
                const m2 = other.mass / totalMass;

                this.x -= overlap * nx * m2;
                this.y -= overlap * ny * m2;
                other.x += overlap * nx * m1;
                other.y += overlap * ny * m1;

                const vdn = this.hspd * nx + this.vspd * ny - (other.hspd * nx + other.vspd * ny);
                if (vdn <= 0) return;

                const restitution = 0.7;
                const impulse = vdn * (1 + restitution) / totalMass;

                this.hspd -= impulse * nx * other.mass;
                this.vspd -= impulse * ny * other.mass;
                other.hspd += impulse * nx * this.mass;
                other.vspd += impulse * ny * this.mass;
            }
        }

        collideWithWalls() {
            const bounce = 0.3;
            const world_width = canvas.width / scale;
            const world_height = canvas.height / scale;
            const finish_line_x = world_width * 0.95;

            if (this.x - this.radius < 0) {
                if (this.hspd < 0) this.hspd *= -bounce;
                this.x = this.radius;
            }
            if (this.x + this.radius > finish_line_x) {
                if (this.hspd > 0) this.hspd *= -bounce;
                this.x = finish_line_x - this.radius;
            }
            if (this.y - this.radius < 0) {
                if (this.vspd < 0) this.vspd *= -bounce;
                this.y = this.radius;
            }
            if (this.y + this.radius > world_height) {
                if (this.vspd > 0) this.vspd *= -bounce;
                this.y = world_height - this.radius;
            }
        }

        draw() {
            const xx = this.x * scale;
            const yy = this.y * scale;
            const rr = this.radius * scale;

            const colors = getThemeColors();

            // Use project color directly without adjustment
            const fillColor = this.color;

            // Draw circle
            ctx.beginPath();
            ctx.arc(xx, yy, rr, 0, Math.PI * 2);
            ctx.fillStyle = fillColor;
            ctx.fill();
            
            // Stroke rengi tema'ya göre
            ctx.strokeStyle = colors.ballStroke;
            ctx.lineWidth = Math.max(1, Math.min(6, rr * 0.06));
            ctx.stroke();

            // Draw text (use CSS text color)
            if (this.radius > 0.03) {
                // font size relative to radius, min 10px
                ctx.font = `${Math.max(10, rr * 0.35)}px 'JetBrains Mono', monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = colors.textColor;
                ctx.fillText(this.name, xx, yy);
            }
        }

        startDrag() {
            this.dragged = true;
            this.mouse_xoff = this.x - mouse.x;
            this.mouse_yoff = this.y - mouse.y;
            dragging = balls.indexOf(this);
        }

        stopDrag() {
            this.dragged = false;
            dragging = -1;
        }
    }

    function drawFinishLine() {
        const world_width = canvas.width / scale;
        const world_height = canvas.height / scale;
        const finish_line_x = world_width * 0.95;
        const finish_line_width = world_width * 0.04;

        const xx = finish_line_x * scale;
        const yy1 = 0;
        const yy2 = world_height * scale;

        const colors = getThemeColors();
        const squareSize = 25;

        // Checkered pattern - use theme accent and background
        const pattern_start_x = finish_line_x - finish_line_width;
        
        for (let y = 0; y < world_height * scale; y += squareSize) {
            for (let x = pattern_start_x * scale; x < finish_line_x * scale; x += squareSize) {
                const isEvenRow = Math.floor(y / squareSize) % 2 === 0;
                const isEvenCol = Math.floor((x - pattern_start_x * scale) / squareSize) % 2 === 0;
                
                ctx.fillStyle = (isEvenRow === isEvenCol) ? colors.finishLineColor1 : colors.finishLineColor2;
                ctx.fillRect(x, y, squareSize, squareSize);
            }
        }

        // Bold finish line edge
        ctx.strokeStyle = colors.finishLineColor1;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(xx, yy1);
        ctx.lineTo(xx, yy2);
        ctx.globalAlpha = 0;  // Make the stroke invisible
        ctx.stroke();
        ctx.globalAlpha = 1;  // Reset alpha

        // "FINISH" yazısı - dikeyine yazılmış
        ctx.save();
        ctx.translate(xx - 60, world_height * scale / 2);
        ctx.rotate(-Math.PI / 2);
        
        ctx.fillStyle = colors.finishLineColor1;
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('FINISH', 0, 0);
        
        ctx.restore();
    }

    function initBalls() {
        balls = [];
        PROJECTS_DATA.forEach(data => {
            const ball = new ProjectBall(
                data.name,
                data.color,
                data.x * (canvas.width / scale),
                data.y * (canvas.height / scale),
                data.radius * (canvas.width / scale),
                data.url
            );
            balls.push(ball);
        });
    }

    function animate() {
        requestAnimationFrame(animate);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        canvas.style.cursor = 'default';

        for (let i = 0; i < balls.length; i++) {
            balls[i].step();
        }

        // Draw finish line
        drawFinishLine();

        for (let i = 0; i < balls.length; i++) {
            balls[i].draw();
            if (balls[i].hovered) {
                canvas.style.cursor = 'grab';
            }
        }
    }

    function getMousePos(event) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = (event.clientX - rect.left) / scale;
        mouse.y = (event.clientY - rect.top) / scale;
    }

    function handleMouseDown(event) {
        getMousePos(event);
        for (let i = balls.length - 1; i >= 0; i--) {
            if (distance(mouse.x, mouse.y, balls[i].x, balls[i].y) < balls[i].radius) {
                balls[i].startDrag();
                canvas.style.cursor = 'grabbing';
                break;
            }
        }
    }

    function handleMouseMove(event) {
        getMousePos(event);
    }

    function handleMouseUp() {
        if (dragging !== -1) {
            balls[dragging].stopDrag();
        }
        canvas.style.cursor = 'default';
    }

    // Initialize
    window.addEventListener('load', () => {
        checkDarkMode();
        setCanvasSize();
        initBalls();
        animate();

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);

        // Touch support
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleMouseDown(e.touches[0]);
        });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            handleMouseMove(e.touches[0]);
        });
        canvas.addEventListener('touchend', handleMouseUp);
    });

    window.addEventListener('resize', () => {
        setCanvasSize();
        initBalls();
    });

    // Listen for theme changes
    const observer = new MutationObserver(() => {
        checkDarkMode();
    });
    observer.observe(document.documentElement, { attributes: true });
}