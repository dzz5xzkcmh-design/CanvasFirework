const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

/*************** Einstellungen ****************/
const PARTICLES_PER_EXPLOSION = 80;

const BASE_RADIUS = 6;
const RADIUS_JITTER = 2;
const TRAIL_ALPHA = 0.25;

const EXPLOSION_MIN_SPEED = 2;
const EXPLOSION_MAX_SPEED = 10;

const GRAVITY = 0.08;
const FRICTION = 0.98;

// Verglühen
const FADE_RATE = 0.96;
const FADE_DELAY = 35; // Frames bevor Verblassen startet (≈ 0.4s bei 60fps)

let particles = [];

/*************** Canvas Setup ****************/
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/*************** Farbe ****************/
function randomFireworkColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 80%, 60%)`;
}

/*************** Partikel ****************/
class ExplosionParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    // Explosion nach außen + leichter Auftrieb
    const angle = Math.random() * Math.PI * 2;
    const speed =
      EXPLOSION_MIN_SPEED +
      Math.random() * (EXPLOSION_MAX_SPEED - EXPLOSION_MIN_SPEED);

    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - Math.random() * 2; // leicht nach oben

    this.color = randomFireworkColor();
    this.alpha = 1;

    this.life = 0;
  }

  update() {
    this.life++;

    // Physik
    this.vy += GRAVITY;
    this.vx *= FRICTION;
    this.vy *= FRICTION;

    this.x += this.vx;
    this.y += this.vy;

    // ERST NACH DEM FALLEN langsam verblassen
    if (this.life > FADE_DELAY) {
      this.alpha *= FADE_RATE;
    }
  }

  draw() {
    if (this.alpha <= 0.02) return;

    const jitter = (Math.random() - 0.5) * RADIUS_JITTER;
    const r = Math.max(1, BASE_RADIUS + jitter);

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }

  isAlive() {
    return this.alpha > 0.02;
  }
}

/*************** Explosion erzeugen **************/
function spawnExplosion(x, y) {
  for (let i = 0; i < PARTICLES_PER_EXPLOSION; i++) {
    particles.push(new ExplosionParticle(x, y));
  }
}

/*************** Klick ****************/
canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;

  const rect = canvas.getBoundingClientRect();
  spawnExplosion(
    e.clientX - rect.left,
    e.clientY - rect.top
  );
});

/*************** Loop ****************/
function animate() {
  ctx.fillStyle = `rgba(0, 0, 0, ${TRAIL_ALPHA})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  particles.forEach(p => {
    p.update();
    p.draw();
  });

  particles = particles.filter(p => p.isAlive());

  requestAnimationFrame(animate);
}

animate();
