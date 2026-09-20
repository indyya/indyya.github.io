/* Fine RGB phosphor stripes and moving scan lines simulate CRT glass.
   CSS supplies the soft glass glow without blurring those pixels. */
(async () => {
  // Easy settings: stronger phosphors = more visible RGB stripes.
  const PHOSPHOR_STRENGTH = 0.28;
  const WIDTH = 960;
  const HEIGHT = 540;
  const NOISE_STRENGTH = 1;
  const screen = document.querySelector('.tv__screen');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let app;
  try {
    if (!window.PIXI) return; // The CSS blue screen remains if the CDN fails.
    app = new PIXI.Application();
    await app.init({ width: WIDTH, height: HEIGHT, backgroundAlpha: 0,
      antialias: false, resolution: 1, autoStart: false });

    const source = document.createElement('canvas');
    source.width = WIDTH;
    source.height = HEIGHT;
    const context = source.getContext('2d');
    const pixels = context.createImageData(WIDTH, HEIGHT);
    const texture = PIXI.Texture.from(source);
    texture.source.scaleMode = 'nearest';
    const picture = new PIXI.Sprite(texture);
    // Keep narrow RGB stripes sharp instead of grouping them into square blocks.
    app.stage.addChild(picture);

    function draw() {
      // A slow, faint brightness band moves down the glass (no flashing).
      const time = reducedMotion.matches ? 0 : performance.now() / 1000;
      for (let y = 0; y < HEIGHT; y++) {
        const scanline = y % 3 === 2 ? 0.88 : 1;
        const sweep = 1 + 0.025 * Math.sin(y / HEIGHT * Math.PI * 2 - time * 0.7);
        for (let x = 0; x < WIDTH; x++) {
          const i = (y * WIDTH + x) * 4;
          const phosphor = x % 3; // Repeating red, green, blue vertical stripes.
          const noise = reducedMotion.matches ? 0 : (Math.random() - 0.5) * NOISE_STRENGTH;
          const blue = [66, 100, 207];
          for (let channel = 0; channel < 3; channel++) {
            const stripe = channel === phosphor
              ? 1 + PHOSPHOR_STRENGTH
              : 1 - PHOSPHOR_STRENGTH / 2;
            pixels.data[i + channel] = blue[channel] * stripe * scanline * sweep + noise;
          }
          pixels.data[i + 3] = 255;
        }
      }
      context.putImageData(pixels, 0, 0);
      texture.source.update();
      app.renderer.render(app.stage);
    }
    draw();
    // Stretch the phosphor texture to fill the curved screen.
    Object.assign(app.canvas.style, { display: "block", width: "100%", height: "100%" });
    screen.appendChild(app.canvas);

    let timer;
    let animation;
    function syncMotion() {
      clearInterval(timer);
      animation?.kill();
      if (window.gsap) gsap.set(screen, { scaleX: 1, scaleY: 1, opacity: 1 });
      if (reducedMotion.matches || document.hidden) { draw(); return; }
      timer = setInterval(draw, 80);
      if (window.gsap) {
        animation = gsap.to(screen, { opacity: 0.97, duration: 2.4, repeat: -1,
            yoyo: true, ease: 'sine.inOut' });
      }
    }
    syncMotion();
    reducedMotion.addEventListener('change', syncMotion);
    document.addEventListener('visibilitychange', syncMotion);
  } catch (error) {
    console.warn('TV effects unavailable; using the CSS screen.', error);
    if (app?.renderer) app.destroy(true);
  }
})();


