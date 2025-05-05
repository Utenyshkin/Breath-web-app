// autoConfetti.js
(function () {
    const CONFIG = {
        gravity: 10,
        particle_count: 75,
        particle_size: 1,
        explosion_power: 25,
        fade: false
    };

    let CTX, canvas;
    const bursts = [];

    class Vector {
        constructor(x = 0, y = 0) {
            this.x = x;
            this.y = y;
        }
    }

    class Particle {
        constructor(position) {
            this.size = new Vector((16 * Math.random() + 4) * CONFIG.particle_size, (4 * Math.random() + 4) * CONFIG.particle_size);
            this.position = new Vector(position.x - this.size.x / 2, position.y - this.size.y / 2);
            this.velocity = generateVelocity();
            this.rotation = 360 * Math.random();
            this.rotation_speed = 10 * (Math.random() - 0.5);
            this.hue = 360 * Math.random();
            this.opacity = 100;
            this.lifetime = Math.random() + 0.25;
        }

        update(dt) {
            this.velocity.y += CONFIG.gravity * (this.size.y / (10 * CONFIG.particle_size)) * dt;
            this.velocity.x += 25 * (Math.random() - 0.5) * dt;
            this.velocity.y *= 0.98;
            this.velocity.x *= 0.98;
            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;
            this.rotation += this.rotation_speed;
            if (CONFIG.fade) this.opacity -= this.lifetime;
        }

        isOutOfBounds() {
            return this.position.y - 2 * this.size.x > 2 * window.innerHeight;
        }

        draw() {
            if (!CTX) return;
            CTX.save();
            CTX.beginPath();
            CTX.translate(this.position.x + this.size.x / 2, this.position.y + this.size.y / 2);
            CTX.rotate(this.rotation * Math.PI / 180);
            CTX.rect(-this.size.x / 2, -this.size.y / 2, this.size.x, this.size.y);
            CTX.fillStyle = `hsla(${this.hue}, 90%, 65%, ${this.opacity}%)`;
            CTX.fill();
            CTX.restore();
        }
    }

    class Burst {
        constructor(position) {
            this.particles = [];
            for (let i = 0; i < CONFIG.particle_count; i++) {
                this.particles.push(new Particle(position));
            }
        }

        update(dt) {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update(dt);
                if (this.particles[i].isOutOfBounds()) {
                    this.particles.splice(i, 1);
                }
            }
        }

        draw() {
            this.particles.forEach(p => p.draw());
        }
    }

    function generateVelocity() {
        let x = Math.random() - 0.5;
        let y = Math.random() - 0.7;
        const n = Math.sqrt(x * x + y * y);
        x /= n;
        y /= n;
        return new Vector(x * (Math.random() * CONFIG.explosion_power), y * (Math.random() * CONFIG.explosion_power));
    }

    function clearCanvas() {
        if (CTX) {
            CTX.clearRect(0, 0, 2 * window.innerWidth, 2 * window.innerHeight);
        }
    }

    function updateFrame() {
        const now = performance.now();
        const dt = (now - lastTime) / 1000;
        lastTime = now;

        clearCanvas();
        bursts.forEach(b => b.update(dt));
        bursts.forEach(b => b.draw());

        requestAnimationFrame(updateFrame);
    }

    function initCanvas() {
        if (!CTX) {
            canvas = document.createElement("canvas");
            CTX = canvas.getContext("2d");
            canvas.width = 2 * window.innerWidth;
            canvas.height = 2 * window.innerHeight;
            canvas.style.position = "absolute";
            canvas.style.top = "0";
            canvas.style.left = "0";
            canvas.style.width = "100%";
            canvas.style.height = "100%";
            canvas.style.pointerEvents = "none";
            canvas.style.zIndex = "1"; // ПОЗАДИ UI, включая кнопку
            document.body.appendChild(canvas);

            window.addEventListener("resize", () => {
                canvas.width = 2 * window.innerWidth;
                canvas.height = 2 * window.innerHeight;
            });
        }
    }

    let lastTime = performance.now();
    initCanvas();
    requestAnimationFrame(updateFrame);

    // 🧨 Публичная функция: конфетти за кнопкой
    window.launchConfettiBehindElement = function (elem) {
        if (!elem) return;
        const rect = elem.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) * 2;
        const y = (rect.top + rect.height / 2) * 2;
        bursts.push(new Burst(new Vector(x, y)));
    };
})();
