const opening = document.querySelector('#opening');
const openButton = document.querySelector('#openButton');
const mainContent = document.querySelector('#mainContent');
const heartCanvas = document.querySelector('#heartCanvas');
const heartContext = heartCanvas.getContext('2d');
const heartMessage = document.querySelector('.heart-message');
const soundButton = document.querySelector('#soundButton');
const musicPlayer = document.querySelector('#musicPlayer');
const wishForm = document.querySelector('#wishForm');
const wishButton = document.querySelector('#wishButton');
const wishMessage = document.querySelector('#wishMessage');
const wishCounter = document.querySelector('#wishCounter');
const cake = document.querySelector('#cake');
const blowButton = document.querySelector('#blowButton');
const blowHint = document.querySelector('#blowHint');
const wishResult = document.querySelector('#wishResult');
const canvas = document.querySelector('#sparkles');
const ctx = canvas.getContext('2d');

const loveNotes = [
  'iyi ki varsın', 'canım Havva ablam', 'en güzel kalp', 'hep yanımda', 'birlikte gülmek',
  'çocukluğum', 'sırdaşım', 'güzel anılar', 'seninle güzel', 'çok seviliyorsun',
  'güvenli limanım', 'kahkahamız', 'omuz omuza', 'iyi ki biz', 'hep mutlu ol',
  'ışığın hiç sönmesin', 'güzel yaşların olsun', 'kocaman sarılıyorum', 'kalbimdesin',
  'her zaman', 'nice yaşlara', 'şansım sensin', 'canım ailem', 'eşsizsin',
  'yüzün hep gülsün', 'dileklerin gerçek olsun', 'iyi ki benim ablamsın', 'seni seviyorum'
];

let audioContext;
let soundOn = true;
let particles = [];
let running = false;
let heartItems = [];
let heartStartedAt = 0;
let heartAnimationFrame = 0;
let heartHasStarted = false;
let lastShimmerAt = 0;

const HEART_DURATION = 7600;
const WORD_DURATION = 720;

function heartPoint(angle, scale, centerX, centerY) {
  const x = 16 * Math.sin(angle) ** 3;
  const y = 13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle);
  return [centerX + x * scale, centerY - y * scale];
}

function rowSpans(y, edges) {
  const xs = [];
  edges.forEach(([[x1, y1], [x2, y2]]) => {
    if ((y1 <= y && y < y2) || (y2 <= y && y < y1)) {
      xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
    }
  });
  xs.sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i + 1 < xs.length; i += 2) result.push([xs[i], xs[i + 1]]);
  return result;
}

function intersectSpans(a, b) {
  const result = [];
  a.forEach(one => b.forEach(two => {
    const lo = Math.max(one[0], two[0]);
    const hi = Math.min(one[1], two[1]);
    if (hi - lo > 28) result.push([lo, hi]);
  }));
  return result;
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function mixColor(from, to, amount) {
  return from.map((value, index) => Math.round(value + (to[index] - value) * amount));
}

function rgba(color, alpha = 1) {
  return `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
}

function buildHeart() {
  cancelAnimationFrame(heartAnimationFrame);
  const bounds = heartCanvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  heartCanvas.width = Math.round(bounds.width * dpr);
  heartCanvas.height = Math.round(bounds.height * dpr);
  heartContext.setTransform(dpr, 0, 0, dpr, 0, 0);

  const random = seededRandom(11);
  const centerX = bounds.width / 2;
  const centerY = bounds.height / 2 + bounds.height * .025;
  const scale = Math.min(bounds.width / 36, bounds.height / 33.5);
  const polygon = Array.from({ length: 720 }, (_, i) => heartPoint(Math.PI * 2 * i / 720, scale, centerX, centerY));
  const edges = polygon.map((point, i) => [point, polygon[(i + 1) % polygon.length]]);
  const ys = polygon.map(point => point[1]);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const fontSizes = innerWidth < 600 ? [5.5, 6, 6.5, 7] : [8, 9, 10, 11];
  const rowHeight = Math.max(...fontSizes) + (innerWidth < 600 ? 4 : 6);
  const gap = innerWidth < 600 ? 3 : 5;
  const placed = [];
  let phraseIndex = 0;

  for (let y = minY + rowHeight / 2; y < maxY - rowHeight / 2; y += rowHeight) {
    const spans = intersectSpans(rowSpans(y - rowHeight / 2, edges), rowSpans(y + rowHeight / 2, edges));
    spans.forEach(([rawLo, rawHi]) => {
      const lo = rawLo + 3;
      const hi = rawHi - 3;
      let cursor = lo + random() * 5;
      const line = [];
      let misses = 0;
      while (misses < 14) {
        const text = loveNotes[phraseIndex++ % loveNotes.length];
        const size = fontSizes[Math.floor(random() * fontSizes.length)];
        heartContext.font = `600 ${size}px "DM Mono", monospace`;
        const width = heartContext.measureText(text).width;
        if (cursor + width <= hi) {
          line.push({ x: cursor + width / 2, text, size, width });
          cursor += width + gap;
          misses = 0;
        } else {
          misses += 1;
        }
      }
      if (!line.length) return;
      if (line.length > 1) {
        const rightSpace = hi - (line[line.length - 1].x + line[line.length - 1].width / 2);
        line.forEach((item, i) => { item.x += rightSpace * i / (line.length - 1); });
      } else {
        line[0].x = (lo + hi) / 2;
      }
      line.forEach((item, i) => {
        const radial = Math.min(1, Math.hypot((item.x - centerX) / (16 * scale), (y - centerY) / (14.5 * scale)));
        const base = mixColor([148, 0, 28], [235, 22, 62], .25 + .75 * radial);
        const color = mixColor(base, [255, 76, 105], random() * .35 + ((i === 0 || i === line.length - 1) ? .3 : 0));
        placed.push({ ...item, y, edge: i === 0 || i === line.length - 1, radial, color, drift: random() * 20 - 10, flashUntil: 0 });
      });
    });
  }

  const edgeItems = placed.filter(item => item.edge).sort((a, b) => {
    const aa = (Math.atan2(a.x - centerX, a.y - centerY) + Math.PI * 2) % (Math.PI * 2);
    const ab = (Math.atan2(b.x - centerX, b.y - centerY) + Math.PI * 2) % (Math.PI * 2);
    return aa - ab;
  });
  const innerItems = placed.filter(item => !item.edge).sort((a, b) => b.radial - a.radial + (random() - .5) * .08);
  heartItems = [...edgeItems, ...innerItems].map((item, index, all) => ({
    ...item,
    appearsAt: (index / all.length) * HEART_DURATION
  }));

  if (heartHasStarted) {
    heartStartedAt = performance.now() - HEART_DURATION - WORD_DURATION;
    drawHeart(performance.now());
  }
}

function formHeart() {
  heartHasStarted = true;
  heartStartedAt = performance.now();
  heartAnimationFrame = requestAnimationFrame(drawHeart);
  setTimeout(() => heartMessage.classList.add('show'), 6900);
}

function drawHeart(now) {
  const width = heartCanvas.clientWidth;
  const height = heartCanvas.clientHeight;
  heartContext.clearRect(0, 0, width, height);
  const elapsed = now - heartStartedAt;

  heartItems.forEach(item => {
    const rawProgress = (elapsed - item.appearsAt) / WORD_DURATION;
    if (rawProgress <= 0) return;
    const progress = Math.min(1, rawProgress);
    const eased = 1 - (1 - progress) ** 3;
    const x = item.x + item.drift * (1 - eased);
    const y = item.y - 34 * (1 - eased);
    const flash = progress > .55 ? Math.sin(Math.PI * Math.min(1, (progress - .55) / .45)) * .75 : 0;
    const shimmer = item.flashUntil > now ? .65 : 0;
    const lit = mixColor(item.color, [255, 218, 224], Math.max(flash, shimmer));

    heartContext.save();
    heartContext.textAlign = 'center';
    heartContext.textBaseline = 'middle';
    heartContext.font = `600 ${item.size}px "DM Mono", monospace`;
    heartContext.globalAlpha = Math.min(1, eased * 1.15);
    heartContext.shadowColor = rgba(item.color, .55);
    heartContext.shadowBlur = item.edge ? 8 : 4;
    heartContext.fillStyle = rgba(lit);
    heartContext.fillText(item.text, x, y);
    heartContext.restore();
  });

  const finished = elapsed > HEART_DURATION + WORD_DURATION;
  if (finished && now - lastShimmerAt > 140 && heartItems.length) {
    const item = heartItems[Math.floor(Math.random() * heartItems.length)];
    item.flashUntil = now + 260;
    lastShimmerAt = now;
  }
  heartAnimationFrame = requestAnimationFrame(drawHeart);
}

function fitCanvas() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function addBurst(x = innerWidth / 2, y = innerHeight / 2, amount = 70) {
  const colors = ['#f47b96', '#ffd5dc', '#fff3d6', '#d53355'];
  for (let i = 0; i < amount; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 6;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      gravity: .045 + Math.random() * .06,
      drag: .986,
      life: 1,
      decay: .007 + Math.random() * .012,
      size: 2 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI
    });
  }
  if (!running) animateParticles();
}

function animateParticles() {
  running = true;
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  particles = particles.filter(p => p.life > 0);
  particles.forEach(p => {
    p.vx *= p.drag;
    p.vy = p.vy * p.drag + p.gravity;
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    p.rotation += .05;
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    ctx.restore();
  });
  if (particles.length) requestAnimationFrame(animateParticles);
  else { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
}

function playTone(frequency, delay = 0, duration = 1.6, volume = .025) {
  if (!soundOn || !audioContext) return;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime + delay;
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + .08);
  gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
  osc.connect(gain).connect(audioContext.destination);
  osc.start(now);
  osc.stop(now + duration);
}

function sendMusicCommand(command) {
  musicPlayer?.contentWindow?.postMessage(JSON.stringify({
    event: 'command',
    func: command,
    args: []
  }), '*');
}

function playMusic() {
  sendMusicCommand('playVideo');
  setTimeout(() => sendMusicCommand('playVideo'), 500);
}

function toggleSound() {
  soundOn = !soundOn;
  soundButton.classList.toggle('muted', !soundOn);
  soundButton.setAttribute('aria-pressed', String(soundOn));
  soundButton.setAttribute('aria-label', soundOn ? 'Sesi kapat' : 'Sesi aç');
  soundButton.querySelector('.sound-label').textContent = soundOn ? 'müzik açık' : 'müzik kapalı';
  if (soundOn) playMusic();
  else sendMusicCommand('pauseVideo');
}

function openGift() {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  playMusic();
  opening.classList.add('is-gone');
  mainContent.classList.add('is-visible');
  mainContent.setAttribute('aria-hidden', 'false');
  document.body.classList.remove('locked');
  addBurst(innerWidth / 2, innerHeight * .55, 95);
  setTimeout(formHeart, 500);
  setTimeout(() => opening.remove(), 1200);
}

async function makeWish(event) {
  event.preventDefault();
  const message = wishMessage.value.trim();

  if (message.length < 3) {
    wishResult.textContent = 'Dileğini birkaç kelimeyle yazar mısın?';
    wishResult.classList.add('show', 'error');
    return;
  }

  wishButton.disabled = true;
  wishButton.querySelector('span').textContent = 'Paylaşım hazırlanıyor…';
  wishResult.classList.remove('show', 'error');

  try {
    const shareText = `Samet, doğum günü dileğim:\n\n${message}`;
    let copied = false;

    if (navigator.share) {
      await navigator.share({ title: 'Havva’nın dileği', text: shareText });
    } else {
      await navigator.clipboard.writeText(shareText);
      copied = true;
    }

    wishResult.textContent = copied
      ? 'Dileğin kopyalandı. Şimdi Samet’e mesaj olarak gönderebilirsin. ✨'
      : 'Dileğin paylaşım için hazırlandı. Kalbinde tuttuğun her şey gerçek olsun. ✨';
    wishResult.classList.add('show');
    wishButton.querySelector('span').textContent = copied ? 'Dilek kopyalandı' : 'Dilek paylaşıldı';
    wishMessage.disabled = true;
    addBurst(innerWidth / 2, innerHeight * .5, 160);
    playTone(523.25, 0, 1.4, .035);
    playTone(659.25, .12, 1.4, .03);
    playTone(783.99, .24, 2.2, .025);
  } catch (error) {
    const cancelled = error && error.name === 'AbortError';
    wishResult.textContent = cancelled
      ? 'Paylaşım iptal edildi; istersen tekrar deneyebilirsin.'
      : 'Paylaşım açılamadı. Lütfen tekrar dene.';
    wishResult.classList.add('show', 'error');
    wishButton.disabled = false;
    wishButton.querySelector('span').textContent = 'Tekrar dene';
  }
}

function blowCandles() {
  cake.classList.add('blown');
  blowButton.disabled = true;
  blowButton.setAttribute('aria-hidden', 'true');
  blowButton.classList.add('is-gone');
  blowHint.classList.add('is-gone');
  wishForm.classList.remove('is-waiting');
  wishForm.setAttribute('aria-hidden', 'false');
  addBurst(innerWidth / 2, Math.min(innerHeight * .62, cake.getBoundingClientRect().top + 55), 120);
  playTone(523.25, 0, 1.1, .025);
  playTone(659.25, .12, 1.4, .02);
  setTimeout(() => {
    blowButton.hidden = true;
    blowHint.hidden = true;
  }, 450);
  setTimeout(() => wishMessage.focus({ preventScroll: true }), 650);
}

function updateWishCounter() {
  wishCounter.textContent = `${wishMessage.value.length} / 500`;
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: .14 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
openButton.addEventListener('click', openGift);
soundButton.addEventListener('click', toggleSound);
blowButton.addEventListener('click', blowCandles);
wishForm.addEventListener('submit', makeWish);
wishMessage.addEventListener('input', updateWishCounter);
let resizeTimer;
addEventListener('resize', () => {
  fitCanvas();
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(buildHeart, 120);
});

fitCanvas();
buildHeart();
if (document.fonts?.ready) document.fonts.ready.then(buildHeart);
