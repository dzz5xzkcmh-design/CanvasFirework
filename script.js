const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

/*************** Einstellungen ****************/
const PARTICLES_PER_EXPLOSION = 80;

const BASE_RADIUS = 4;
const RADIUS_JITTER = 2;
const TRAIL_ALPHA = 0.25;

const EXPLOSION_MIN_SPEED = 2;
const EXPLOSION_MAX_SPEED = 7;

const GRAVITY = 0.08;
const FRICTION = 0.98;

// Verglühen
const FADE_RATE = 0.96;
const FADE_DELAY = 25; // Frames bevor Verblassen startet

let particles = [];

// logische Canvas-Größe (in CSS-Pixeln)
let logicalWidth = 0;
let logicalHeight = 0;

/*************** Canvas an Bildschirm + DPI anpassen ****************/
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;

  const newWidth = window.innerWidth;
  const newHeight = window.innerHeight;

  const oldWidth = logicalWidth || newWidth;
  const oldHeight = logicalHeight || newHeight;

  logicalWidth = newWidth;
  logicalHeight = newHeight;

  // CSS-Größe (sichtbar im Browser)
  canvas.style.width = newWidth + 'px';
  canvas.style.height = newHeight + 'px';

  // interne Auflösung (Pixel-Buffer, hochskaliert für Retina)
  canvas.width = newWidth * dpr;
  canvas.height = newHeight * dpr;

  // Koordinatensystem so skalieren, dass 1 Einheit = 1 CSS-Pixel bleibt
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // vorhandene Partikel proportional mitskalieren,
  // damit sie bei einem Resize nicht "springen"
  const scaleX = newWidth / oldWidth;
  const scaleY = newHeight / oldHeight;

  particles.forEach(p => {
    p.x *= scaleX;
    p.y *= scaleY;
  });
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
    this.life = 0; // Frames seit Erzeugung
  }

  update() {
    this.life++;

    // Physik
    this.vy += GRAVITY;
    this.vx *= FRICTION;
    this.vy *= FRICTION;

    this.x += this.vx;
    this.y += this.vy;

    // erst nach kurzer Zeit langsam verblassen
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
  if (e.button !== 0) return; // nur linke Maustaste

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  spawnExplosion(x, y);
});

/*************** Loop ****************/
function animate() {
  // hier mit logischer Breite/Höhe arbeiten (CSS-Pixel)
  ctx.fillStyle = `rgba(0, 0, 0, ${TRAIL_ALPHA})`;
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  particles.forEach(p => {
    p.update();
    p.draw();
  });

  particles = particles.filter(p => p.isAlive());

  requestAnimationFrame(animate);
}

animate();
