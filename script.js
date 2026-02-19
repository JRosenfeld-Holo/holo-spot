/* ============================================================
   HOLOSPOT — V2 Interactivity
   Particle Field + Custom Cursor + Orchestrated Load
   ============================================================ */

(function () {
  'use strict';

  const LIME = '#bffd11';
  const LIME_RGB = [191, 253, 17];
  const isMobile = window.innerWidth <= 1024;

  // ========================================
  // 0. Loading Orchestration
  // ========================================
  const loader = document.getElementById('loader');
  const loaderFill = document.getElementById('loader-fill');
  let loadProgress = 0;

  function animateLoader() {
    loadProgress += Math.random() * 15 + 5;
    if (loadProgress > 100) loadProgress = 100;
    loaderFill.style.width = loadProgress + '%';

    if (loadProgress < 100) {
      setTimeout(animateLoader, 100 + Math.random() * 200);
    } else {
      setTimeout(() => {
        loader.classList.add('done');
        // Trigger hero reveal after loader finishes
        setTimeout(() => {
          const heroReveal = document.getElementById('hero-reveal');
          if (heroReveal) heroReveal.classList.add('visible');
        }, 200);
      }, 400);
    }
  }

  // Start loading on DOMContentLoaded
  animateLoader();

  // ========================================
  // 1. Custom Cursor (Desktop only)
  // ========================================
  if (!isMobile) {
    const cursor = document.getElementById('cursor');
    const cursorDot = document.getElementById('cursor-dot');
    let cursorX = 0, cursorY = 0;
    let dotX = 0, dotY = 0;

    document.addEventListener('mousemove', (e) => {
      cursorX = e.clientX;
      cursorY = e.clientY;
      // Dot follows instantly
      cursorDot.style.left = cursorX + 'px';
      cursorDot.style.top = cursorY + 'px';
    });

    function animateCursor() {
      // Ring follows with smooth easing
      dotX += (cursorX - dotX) * 0.12;
      dotY += (cursorY - dotY) * 0.12;
      cursor.style.left = dotX + 'px';
      cursor.style.top = dotY + 'px';
      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Hover effects
    const hoverEls = document.querySelectorAll('[data-hover]');
    hoverEls.forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
  }

  // ========================================
  // 2. Canvas Grain Overlay
  // ========================================
  const grainCanvas = document.getElementById('grain-canvas');
  const grainCtx = grainCanvas.getContext('2d');
  let grainFrame = 0;

  function resizeGrain() {
    grainCanvas.width = window.innerWidth;
    grainCanvas.height = window.innerHeight;
  }

  function renderGrain() {
    grainFrame++;
    if (grainFrame % 4 !== 0) {
      requestAnimationFrame(renderGrain);
      return;
    }

    const w = grainCanvas.width;
    const h = grainCanvas.height;
    const imageData = grainCtx.createImageData(w, h);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const v = Math.random() * 255;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }

    grainCtx.putImageData(imageData, 0, 0);
    requestAnimationFrame(renderGrain);
  }

  window.addEventListener('resize', resizeGrain);
  resizeGrain();
  renderGrain();

  // ========================================
  // 3. Hero Particle Field
  // ========================================
  const heroCanvas = document.getElementById('hero-canvas');
  if (heroCanvas) {
    const ctx = heroCanvas.getContext('2d');
    let particles = [];
    let mouseX = 0, mouseY = 0;
    let heroTime = 0;

    function resizeHeroCanvas() {
      const rect = heroCanvas.parentElement.getBoundingClientRect();
      heroCanvas.width = rect.width * window.devicePixelRatio;
      heroCanvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      initParticles();
    }

    function initParticles() {
      particles = [];
      const w = heroCanvas.width / window.devicePixelRatio;
      const h = heroCanvas.height / window.devicePixelRatio;
      const count = isMobile ? 60 : 150;

      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 0.5,
          alpha: Math.random() * 0.3 + 0.05,
          pulse: Math.random() * Math.PI * 2,
        });
      }
    }

    heroCanvas.parentElement.addEventListener('mousemove', (e) => {
      const rect = heroCanvas.parentElement.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });

    function drawParticles() {
      const w = heroCanvas.width / window.devicePixelRatio;
      const h = heroCanvas.height / window.devicePixelRatio;
      ctx.clearRect(0, 0, w, h);
      heroTime += 0.005;

      // Draw connecting lines first
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = isMobile ? 80 : 120;

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.08;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${LIME_RGB.join(',')}, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach((p) => {
        // Mouse repulsion (desktop only)
        if (!isMobile) {
          const dx = p.x - mouseX;
          const dy = p.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const force = (150 - dist) / 150 * 0.5;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        // Damping
        p.vx *= 0.98;
        p.vy *= 0.98;

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Wrap
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        // Pulse
        const pulseAlpha = p.alpha + Math.sin(heroTime * 2 + p.pulse) * 0.05;

        ctx.beginPath();
        ctx.fillStyle = `rgba(${LIME_RGB.join(',')}, ${pulseAlpha})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw a subtle grid
      ctx.strokeStyle = `rgba(${LIME_RGB.join(',')}, 0.015)`;
      ctx.lineWidth = 0.5;
      const gridSize = 60;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      requestAnimationFrame(drawParticles);
    }

    window.addEventListener('resize', resizeHeroCanvas);
    resizeHeroCanvas();
    drawParticles();
  }

  // ========================================
  // 4. Signal Wave Canvas
  // ========================================
  const signalCanvas = document.getElementById('signal-canvas');
  if (signalCanvas) {
    const sCtx = signalCanvas.getContext('2d');
    let sTime = 0;

    function resizeSignal() {
      const rect = signalCanvas.parentElement.getBoundingClientRect();
      signalCanvas.width = rect.width * window.devicePixelRatio;
      signalCanvas.height = rect.height * window.devicePixelRatio;
      sCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function drawSignalWaves() {
      const w = signalCanvas.width / window.devicePixelRatio;
      const h = signalCanvas.height / window.devicePixelRatio;
      sCtx.clearRect(0, 0, w, h);

      // Subtle grid background
      sCtx.strokeStyle = `rgba(${LIME_RGB.join(',')}, 0.02)`;
      sCtx.lineWidth = 0.5;
      const gridSize = 30;
      for (let x = 0; x < w; x += gridSize) {
        sCtx.beginPath();
        sCtx.moveTo(x, 0);
        sCtx.lineTo(x, h);
        sCtx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        sCtx.beginPath();
        sCtx.moveTo(0, y);
        sCtx.lineTo(w, y);
        sCtx.stroke();
      }

      const centerY = h / 2;
      const waveCount = 9;

      for (let i = 0; i < waveCount; i++) {
        const amplitude = 10 + i * 10;
        const frequency = 0.002 + i * 0.0008;
        const speed = 0.012 + i * 0.004;
        const alpha = 0.06 + (i / waveCount) * 0.2;

        sCtx.beginPath();
        sCtx.strokeStyle = `rgba(${LIME_RGB.join(',')}, ${alpha})`;
        sCtx.lineWidth = 0.8 + (i * 0.2);

        if (i % 3 === 0) {
          sCtx.setLineDash([6, 8]);
        } else if (i % 3 === 1) {
          sCtx.setLineDash([2, 4]);
        } else {
          sCtx.setLineDash([]);
        }

        for (let x = 0; x <= w; x += 2) {
          const noise = Math.sin(x * 0.015 + sTime * 0.3) * 5;
          const y = centerY + Math.sin(x * frequency + sTime * speed) * amplitude + noise;
          if (x === 0) sCtx.moveTo(x, y);
          else sCtx.lineTo(x, y);
        }
        sCtx.stroke();
        sCtx.setLineDash([]);
      }

      // Halftone dots trail
      const dotSpacing = 10;
      for (let x = 0; x < w; x += dotSpacing) {
        const distFromCenter = Math.abs(x - w / 2) / (w / 2);
        const dotAlpha = (1 - distFromCenter) * 0.1;
        const wave = Math.sin(x * 0.006 + sTime * 0.015) * 30;
        const dotSize = 0.8 + (1 - distFromCenter) * 1.2;

        sCtx.beginPath();
        sCtx.fillStyle = `rgba(${LIME_RGB.join(',')}, ${dotAlpha})`;
        sCtx.arc(x, centerY + wave, dotSize, 0, Math.PI * 2);
        sCtx.fill();
      }

      sTime += 1;
      requestAnimationFrame(drawSignalWaves);
    }

    window.addEventListener('resize', resizeSignal);
    resizeSignal();
    drawSignalWaves();
  }

  // ========================================
  // 5. Scroll-Triggered Reveal Groups
  // ========================================
  const revealGroups = document.querySelectorAll('.reveal-group');

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
  );

  revealGroups.forEach((group) => {
    // Don't auto-observe hero — it's triggered by loader
    if (group.id !== 'hero-reveal') {
      revealObserver.observe(group);
    }
  });

  // ========================================
  // 6. Misregistration Jitter (Hero title)
  // ========================================
  const titleLines = document.querySelectorAll('.hero__title .line');
  let jitterTime = 0;

  function jitter() {
    jitterTime += 0.015;

    titleLines.forEach((el, i) => {
      const ox = Math.sin(jitterTime + i * 2) * 1.2 - 5;
      const oy = Math.cos(jitterTime * 0.6 + i) * 0.8 + 4;
      const op = 0.3 + Math.sin(jitterTime * 0.4 + i) * 0.08;

      el.style.setProperty('--jx', ox + 'px');
      el.style.setProperty('--jy', oy + 'px');
      el.style.setProperty('--jo', op);
    });
    requestAnimationFrame(jitter);
  }

  // Inject jitter CSS
  const jitterCSS = document.createElement('style');
  jitterCSS.textContent = `
    .hero__title .line::before {
      top: var(--jy, 4px) !important;
      left: var(--jx, -5px) !important;
      opacity: var(--jo, 0.35) !important;
    }
  `;
  document.head.appendChild(jitterCSS);
  jitter();

  // ========================================
  // 7. Nav Scroll State
  // ========================================
  const nav = document.getElementById('nav');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });

  // ========================================
  // 8. Hero Parallax
  // ========================================
  const heroContent = document.querySelector('.hero__content');
  const heroCanvasEl = document.getElementById('hero-canvas');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const heroH = window.innerHeight;

    if (scrollY < heroH && heroContent) {
      const factor = scrollY / heroH;
      heroContent.style.transform = `translateY(${factor * 50}px)`;
      heroContent.style.opacity = 1 - factor * 0.7;
    }
    if (scrollY < heroH && heroCanvasEl) {
      heroCanvasEl.style.opacity = 1 - (scrollY / heroH) * 0.6;
    }
  }, { passive: true });

  // ========================================
  // 9. CTA Button Magnetic Effect (Desktop)
  // ========================================
  const ctaBtn = document.querySelector('.cta__btn');
  if (ctaBtn && !isMobile) {
    ctaBtn.addEventListener('mousemove', (e) => {
      const rect = ctaBtn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      ctaBtn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });

    ctaBtn.addEventListener('mouseleave', () => {
      ctaBtn.style.transform = 'translate(0, 0)';
    });

    // Ripple on click
    ctaBtn.addEventListener('click', function (e) {
      const ripple = document.createElement('span');
      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(10, 13, 18, 0.25);
        transform: scale(0);
        animation: ripple-fx 0.6s ease-out forwards;
        pointer-events: none;
        width: 200px;
        height: 200px;
        left: ${e.offsetX - 100}px;
        top: ${e.offsetY - 100}px;
      `;
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });

    const rippleKF = document.createElement('style');
    rippleKF.textContent = `
      @keyframes ripple-fx {
        to { transform: scale(4); opacity: 0; }
      }
    `;
    document.head.appendChild(rippleKF);
  }

  // ========================================
  // 10. Stat Counter Animation
  // ========================================
  const statVals = document.querySelectorAll('.stat__val');
  const statObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const text = el.textContent.trim();
          const match = text.match(/^(<)?(\d+)(\+)?$/);
          if (match) {
            const prefix = match[1] || '';
            const target = parseInt(match[2]);
            const suffix = match[3] || '';
            let current = 0;
            const duration = 1500;
            const start = performance.now();

            function count(now) {
              const elapsed = now - start;
              const progress = Math.min(elapsed / duration, 1);
              // Ease out
              const eased = 1 - Math.pow(1 - progress, 3);
              current = Math.round(eased * target);
              el.textContent = prefix + current + suffix;
              if (progress < 1) requestAnimationFrame(count);
            }
            requestAnimationFrame(count);
          }
          statObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );

  statVals.forEach(el => statObserver.observe(el));

})();
