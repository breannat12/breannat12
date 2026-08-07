/* ============================================================
   CASE STUDY PAGE — the beach behind the glass, plus the bits
   of behaviour a write-up needs: a screens carousel and the
   fade-in on scroll. The wave maths here is the same as the
   home page's, minus the scroll surge and the footprints:
   nothing walks across a page you're reading.
   ============================================================ */
(() => {
'use strict';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* =========================================================
   1. THE SEA
   ========================================================= */
const cv = document.getElementById('sea');
if (cv){
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, shoreX = 0, waterW = 0, clock = 0;

  /* shallow → deep. `f` is how far right of the shoreline the band starts, as a
     fraction of the water's width, so the sea keeps its proportions anywhere. */
  const BANDS = [
    { f:.03, af:.085, k:.0094, sp:.30, ph:4.7, col:'#b9e0d8' },
    { f:.15, af:.080, k:.0077, sp:.24, ph:3.4, col:'#7ac6c1' },
    { f:.33, af:.075, k:.0061, sp:.19, ph:2.2, col:'#3d9dab' },
    { f:.56, af:.070, k:.0046, sp:.15, ph:1.1, col:'#19758d' },
    { f:.82, af:.055, k:.0036, sp:.11, ph:0.0, col:'#0d5266' }
  ];

  const shoreFrac = () => innerWidth <= 820 ? .80 : innerWidth <= 1080 ? .74 : .755;

  function resize(){
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    shoreX = W * shoreFrac();
    waterW = W - shoreX;
    for (const b of BANDS){
      b.off = waterW * b.f;
      b.amp = Math.max(11, Math.min(34, waterW * b.af));
    }
    if (reduce) draw();
  }

  /* how far the swash has run up the beach at height y — a slow travelling
     envelope, so one stretch of shore rushes in while another still drains */
  function swash(y){
    const a = .5 + .5 * Math.sin(y * .0026 - clock * .17 + .8);
    const b = .5 + .5 * Math.sin(y * .0009 + clock * .11 + 2.9);
    return .38 + .62 * (a * .65 + b * .35);
  }

  /* four components at non-harmonic wavelengths, drifting at unrelated
     speeds — the sum never repeats, so the waterline reads as irregular */
  function edge(b, y, extra){
    const s = clock * b.sp, p = b.ph, w = b.amp;
    return shoreX + b.off + extra * swash(y)
      + w * .52 * Math.sin(y * b.k        + s       + p)
      + w * .30 * Math.sin(y * b.k * 1.73 - s * .61 + p * 2.1 + 1.7)
      + w * .34 * Math.sin(y * b.k * 0.47 + s * .37 + p * 0.6 + 3.9)
      + w * .13 * Math.sin(y * b.k * 3.11 - s * .83 + p * 1.3);
  }

  function fillBand(b, extra, color){
    ctx.beginPath();
    ctx.moveTo(W, -4);
    for (let y = -4; y <= H + 4; y += 6) ctx.lineTo(edge(b, y, extra), y);
    ctx.lineTo(W, H + 4);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function draw(){
    /* --- dry sand --- */
    const sand = ctx.createLinearGradient(0, 0, W, H);
    sand.addColorStop(0,   '#f2dfb9');
    sand.addColorStop(.45, '#e8cb9c');
    sand.addColorStop(1,   '#dcb98a');
    ctx.fillStyle = sand;
    ctx.fillRect(0, 0, W, H);

    const lead = BANDS[0];

    /* --- wet sand the water has just left --- */
    ctx.save();
    ctx.globalAlpha = .55;
    fillBand(lead, -88, '#cba473');
    ctx.globalAlpha = .4;
    fillBand(lead, -42, '#bf9564');
    ctx.restore();

    /* --- the water --- */
    for (const b of BANDS) fillBand(b, 0, b.col);

    /* --- foam edge --- */
    ctx.save();
    ctx.beginPath();
    for (let y = -4; y <= H + 4; y += 5){
      const x = edge(lead, y, 0);
      y === -4 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(255,255,255,.92)';
    ctx.lineWidth = 9; ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255,255,255,.85)'; ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.restore();

    /* --- the thin sheet sliding up the sand --- */
    ctx.save();
    ctx.globalAlpha = .3;
    ctx.beginPath();
    ctx.moveTo(0, -4);
    for (let y = -4; y <= H + 4; y += 6) ctx.lineTo(edge(lead, y, -34), y);
    for (let y = H + 4; y >= -4; y -= 6) ctx.lineTo(edge(lead, y, 0), y);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();

    /* --- bubbles riding the foam --- */
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,.72)';
    for (let y = 0; y < H; y += 15){
      const wob = Math.sin(y * .09 + clock * .5) * 13;
      const r = 1 + (Math.sin(y * 2.7) + 1) * 1.6;
      ctx.globalAlpha = (.18 + .42 * (Math.sin(y * .21 + clock * .34) + 1) / 2) * swash(y);
      ctx.beginPath();
      ctx.arc(edge(lead, y, 0) + 7 + wob, y, r, 0, 6.2832);
      ctx.fill();
    }
    ctx.restore();

    /* --- glints on deep water --- */
    ctx.save();
    ctx.globalAlpha = .1;
    ctx.strokeStyle = '#eafcff'; ctx.lineWidth = 1.4;
    const b3 = BANDS[3], gap = Math.max(26, waterW * .1);
    for (let i = 0; i < 4; i++){
      ctx.beginPath();
      for (let y = -4; y <= H + 4; y += 10)
        ctx.lineTo(edge(b3, y, 0) + gap * (i + .5) + Math.sin(y * .02 + i * 2.1 + clock * .2) * 14, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function tick(t){
    clock = t / 1000;
    draw();
    requestAnimationFrame(tick);
  }

  addEventListener('resize', resize);
  resize();
  if (reduce) draw(); else requestAnimationFrame(tick);
}

/* =========================================================
   2. Screens carousels — markup is written by the page, and
      a page may hold several (wireframes, then final screens)
   ========================================================= */
/* the arrow keys drive whichever carousel you last touched */
let activeStep = null;

document.querySelectorAll('.gal').forEach(gal => {
  const stage = gal.querySelector('.stage');
  const track = gal.querySelector('.track');
  const slides = [...gal.querySelectorAll('.slide')];
  const dots = [...gal.querySelectorAll('.dot')];
  const num = gal.querySelector('.count span');
  const cap = gal.querySelector('.galcap');
  if (!track || !slides.length) return;
  let at = 0;

  /* every slide is the same window; a screen taller than it scrolls inside
     its own slide, and says so until you've reached the bottom of it */
  const hint = document.createElement('span');
  hint.className = 'scrollhint';
  hint.textContent = 'Scroll for more';
  stage.appendChild(hint);

  /* How tall a screen may be, relative to its width, before it's shown scrolling
     instead of shrunk. Above this a screen would have to get small enough to be
     unreadable to fit the window — the long marketing pages, and nothing else. */
  const LIMIT = 1.45;

  /* Give each screen the width that makes it fill the window: as tall as the
     frame allows, or as wide as the slide allows, whichever it reaches first.
     Anything past LIMIT settles at the width a LIMIT-proportioned screen would
     take and runs off the bottom, where it can be scrolled. */
  function fit(img){
    if (!img.naturalWidth) return;
    const slide = img.closest('.slide');
    const cs = getComputedStyle(slide);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const roomW = slide.clientWidth - padX;
    const roomH = slide.clientHeight - padY;
    if (roomW <= 0 || roomH <= 0) return;
    const ratio = img.naturalHeight / img.naturalWidth;
    img.style.width = Math.min(roomW, roomH / Math.min(ratio, LIMIT)) + 'px';
  }
  const fitAll = () => gal.querySelectorAll('.slide img').forEach(fit);

  function checkTall(){
    const s = slides[at];
    const more = s.scrollHeight - s.clientHeight - s.scrollTop;
    stage.classList.toggle('tall', more > 24);
  }
  slides.forEach(s => s.addEventListener('scroll', () => { if (slides[at] === s) checkTall(); }, { passive:true }));
  /* screenshots arrive after first paint, and each one changes the answer */
  gal.querySelectorAll('img').forEach(img => img.addEventListener('load', () => { fit(img); checkTall(); }));
  addEventListener('resize', () => { fitAll(); checkTall(); });
  fitAll();

  const go = to => {
    at = (to + slides.length) % slides.length;      /* wraps past either end */
    track.style.transform = `translateX(${-at * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('on', i === at));
    if (num) num.textContent = at + 1;
    /* the caption is the screen's name and, where it has one, what that screen
       is for — both kept on the slide itself, next to the image they describe */
    if (cap){
      const { cap: name, note } = slides[at].dataset;
      cap.textContent = '';
      if (name){
        const b = document.createElement('strong');
        b.textContent = name;
        cap.append(b);
      }
      if (note) cap.append(name ? ` — ${note}` : note);
    }
    slides[at].scrollTop = 0;                       /* each screen opens at its top */
    checkTall();
  };
  const step = d => go(at + d);

  /* ---- the carousel walks itself along until someone takes it over ----
     It only runs while it's on screen and nobody is touching it; any hover,
     focus, tap or nav click hands control over, and letting go starts the
     clock again from the screen you left it on. */
  const DWELL = 5200;
  let timer = null, held = false, onScreen = false;
  const play = () => {
    clearInterval(timer);
    if (reduce || held || !onScreen || slides.length < 2) return;
    timer = setInterval(() => step(1), DWELL);
  };
  const hold = () => { held = true; clearInterval(timer); };
  const release = () => { held = false; play(); };

  gal.addEventListener('pointerenter', () => { activeStep = step; hold(); });
  gal.addEventListener('pointerleave', release);
  gal.addEventListener('focusin',  () => { activeStep = step; hold(); });
  gal.addEventListener('focusout', release);
  /* a touch device has no hover to pause on, so a tap does it instead */
  gal.addEventListener('touchstart', hold, { passive:true });

  new IntersectionObserver(es => {
    onScreen = es[0].isIntersecting;
    play();
  }, { threshold:.25 }).observe(gal);

  /* a manual move resets the dwell, so the next auto-advance isn't half a beat away */
  const drive = fn => { fn(); play(); };
  gal.querySelector('.prev').addEventListener('click', () => drive(() => step(-1)));
  gal.querySelector('.next').addEventListener('click', () => drive(() => step(1)));
  dots.forEach((d, i) => d.addEventListener('click', () => drive(() => go(i))));

  if (!activeStep) activeStep = step;              /* before anything is hovered */
  go(0);
});

addEventListener('keydown', e => {
  if (!activeStep || document.getElementById('lightbox')?.classList.contains('open')) return;
  if (e.key === 'ArrowLeft'){ e.preventDefault(); activeStep(-1); }
  if (e.key === 'ArrowRight'){ e.preventDefault(); activeStep(1); }
});

/* =========================================================
   2b. Full-size view — persona sheets and screens carry more
       detail than they can show at page width
   ========================================================= */
const box = document.getElementById('lightbox');
if (box){
  const full = box.querySelector('img');
  const shut = () => {
    box.classList.remove('open');
    box.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  document.querySelectorAll('.gal .slide img, .personas img').forEach(img => {
    img.addEventListener('click', () => {
      full.src = img.currentSrc || img.src;
      full.alt = img.alt;
      box.classList.add('open');
      box.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  });
  box.addEventListener('click', shut);
  addEventListener('keydown', e => { if (e.key === 'Escape') shut(); });
}

/* =========================================================
   3. Back to the top of the write-up
   ========================================================= */
document.querySelector('.totop')?.addEventListener('click', () => {
  scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
});

/* =========================================================
   4. Reveals
   ========================================================= */
const io = new IntersectionObserver(es => {
  es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('.rev').forEach(el => io.observe(el));
})();
