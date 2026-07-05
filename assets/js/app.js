/**
 * APEX PERFORMANCE - Interactive Scroll-Driven Telemetry Player
 * Optimized multi-frame buffer pipeline rendering matching frame indices perfectly.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Sequence Mapping Configuration
  const startFrame = 1;
  const endFrame = 200;
  const frameCount = endFrame - startFrame + 1; // 124 frames total
  const frameDir = './assets/media/video frames/';
  const framePrefix = 'ezgif-frame-';
  const frameExt = '.jpg';

  const getFrameUrl = (index) => {
    const frameNum = index + startFrame - 1;
    const paddedIndex = frameNum.toString().padStart(3, '0');
    return `${frameDir}${framePrefix}${paddedIndex}${frameExt}`;
  };

  // State Pipeline Variables
  const images = [];
  let loadedCount = 0;
  let targetFrameIndex = 0;
  let interpolatedFrameIndex = 0;
  const lerpFactor = 0.15; // Tight dynamic lock for frame synchronization

  // DOM Selection Hooks
  const preloader = document.getElementById('preloader');
  const percentText = document.querySelector('.loader-percentage');
  const canvas = document.getElementById('frame-canvas');
  const ctx = canvas.getContext('2d');
  const scrollTrack = document.querySelector('.scroll-track');
  const navbar = document.querySelector('.navbar');
  const stickyContainer = document.getElementById('sticky-container');

  // Interactive Frame Interval Triggers (0.00 to 1.00 Progress Maps)
  const captions = [
    { el: document.getElementById('caption-1'), start: 0.10, end: 0.32 },
    { el: document.getElementById('caption-2'), start: 0.40, end: 0.62 },
    { el: document.getElementById('caption-3'), start: 0.70, end: 0.85 }
  ];

  function resizeCanvas() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    renderFrame(Math.round(interpolatedFrameIndex));
  }

  // Cover Scaling Function for Aspect Correct Rendering (Fixed calculations)
  function drawImageProp(ctx, img, x, y, w, h, offsetX = 0.5, offsetY = 0.5) {
    if (arguments.length < 2) return;
    offsetX = Math.min(Math.max(offsetX, 0), 1);
    offsetY = Math.min(Math.max(offsetY, 0), 1);

    const iw = img.width;
    const ih = img.height;
    const r = Math.min(w / iw, h / ih);

    let nw = iw * r;
    let nh = ih * r;
    let ar = 1;

    if (nw < w) ar = w / nw;
    if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh;

    nw *= ar;
    nh *= ar;

    const cw = iw / (nw / w);
    const ch = ih / (nh / h);

    const cx = (iw - cw) * offsetX;
    const cy = (ih - ch) * offsetY;

    const sx = Math.max(0, cx);
    const sy = Math.max(0, cy);
    const sw = Math.min(iw, cw);
    const sh = Math.min(ih, ch);

    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function renderFrame(frameIndex) {
    const img = images[frameIndex];
    if (img && img.complete) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawImageProp(ctx, img, 0, 0, canvas.width, canvas.height);
    }
  }

  function getScrollProgress() {
    const rect = scrollTrack.getBoundingClientRect();
    const startOffset = window.innerHeight * 0.5;
    const scrollHeight = rect.height - window.innerHeight;

    const totalDistance = scrollHeight + startOffset;
    const currentDistance = startOffset - rect.top;

    if (totalDistance <= 0) return 0;
    const progress = currentDistance / totalDistance;
    return Math.min(Math.max(progress, 0), 1);
  }

  function handleNavbarScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  function updateCaptions(progress) {
    captions.forEach(cap => {
      if (progress >= cap.start && progress <= cap.end) {
        cap.el.classList.add('active');
      } else {
        cap.el.classList.remove('active');
      }
    });
  }

  // Frame Interpolation Render Tick Loop
  function tick() {
    const delta = targetFrameIndex - interpolatedFrameIndex;

    if (Math.abs(delta) > 0.01) {
      interpolatedFrameIndex += delta * lerpFactor;
    } else {
      interpolatedFrameIndex = targetFrameIndex;
    }

    const activeFrame = Math.min(frameCount - 1, Math.max(0, Math.round(interpolatedFrameIndex)));
    renderFrame(activeFrame);

    const activeProgress = interpolatedFrameIndex / (frameCount - 1);
    const rawProgress = getScrollProgress();

    // Fix: Sticky container ko shuru me hi load pe visible rkhenge taki 1st frame background dikhe
    if (window.scrollY === 0) {
      if (stickyContainer) {
        stickyContainer.style.opacity = '1';
        stickyContainer.style.pointerEvents = 'none';
      }
    } else if (rawProgress <= 0) {
      if (stickyContainer) {
        stickyContainer.style.opacity = '0';
        stickyContainer.style.pointerEvents = 'none';
      }
    } else {
      if (stickyContainer) {
        stickyContainer.style.opacity = '1';
        stickyContainer.style.pointerEvents = 'auto';
      }
    }

    // Dynamic Zoom Blur Matrix down to Specification Break
    if (activeProgress > 0.8) {
      const blurFactor = (activeProgress - 0.8) / 0.2;
      const blurPx = blurFactor * 20;
      const scaleVal = 1 + (blurFactor * 0.03);
      canvas.style.filter = `blur(${blurPx}px)`;
      canvas.style.transform = `scale(${scaleVal})`;
    } else {
      canvas.style.filter = 'none';
      canvas.style.transform = 'scale(1)';
    }

    updateCaptions(activeProgress);
    requestAnimationFrame(tick);
  }

  // Handlers
  window.addEventListener('scroll', () => {
    const progress = getScrollProgress();
    targetFrameIndex = progress * (frameCount - 1);
    handleNavbarScroll();
  });

  window.addEventListener('resize', resizeCanvas);

  // Modern Drawer Navigation Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenuBtn.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenuBtn.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
  }

  // Preloading System Execution
  function preloadImages() {
    for (let i = 1; i <= frameCount; i++) {
      const img = new Image();
      img.src = getFrameUrl(i);
      img.onload = () => {
        loadedCount++;
        const percent = Math.floor((loadedCount / frameCount) * 100);
        percentText.textContent = `${percent}%`;

        if (loadedCount === frameCount) {
          onAllLoaded();
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === frameCount) {
          onAllLoaded();
        }
      };
      images.push(img);
    }
  }

  function onAllLoaded() {
    setTimeout(() => {
      if (preloader) preloader.classList.add('fade-out');
      resizeCanvas();
      renderFrame(0); // Force fully render first BMW frame as Hero BG immediately
      requestAnimationFrame(tick);
    }, 500);
  }

  preloadImages();
  handleNavbarScroll();
});