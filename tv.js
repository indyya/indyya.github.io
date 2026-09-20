/* PixiJS PixelateFilter groups faint blue noise into visible pixel blocks.
   CSS supplies the soft glass glow without blurring those pixels. */
(async () => {
  // Easy settings: larger pixels = chunkier texture; more noise = stronger static.
  const PIXEL_SIZE = 2;
  const NOISE_STRENGTH = 4;
  const screen = document.querySelector('.tv__screen');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let app;
  try {
    if (!window.PIXI) return; // The CSS blue screen remains if the CDN fails.
    app = new PIXI.Application();
    await app.init({ width: 320, height: 180, backgroundAlpha: 0,
      antialias: false, resolution: 1, autoStart: false });

    const source = document.createElement('canvas');
    source.width = 320;
    source.height = 180;
    const context = source.getContext('2d');
    const pixels = context.createImageData(320, 180);
    const texture = PIXI.Texture.from(source);
    texture.source.scaleMode = 'nearest';
    const picture = new PIXI.Sprite(texture);
    // The CDN exposes the filters as PIXI.filters. Version 6 works with PixiJS 8.
    if (PIXI.filters?.PixelateFilter) {
      picture.filters = [new PIXI.filters.PixelateFilter(PIXEL_SIZE)];
    }
    app.stage.addChild(picture);

    function draw() {
      for (let i = 0; i < pixels.data.length; i += 4) {
        const noise = Math.floor(Math.random() * (NOISE_STRENGTH * 2 + 1)) - NOISE_STRENGTH;
        pixels.data[i] = 66 + noise;
        pixels.data[i + 1] = 100 + noise;
        pixels.data[i + 2] = 207 + noise;
        pixels.data[i + 3] = 255;
      }
      context.putImageData(pixels, 0, 0);
      texture.source.update();
      app.renderer.render(app.stage);
    }
    draw();
    screen.appendChild(app.canvas);

    let timer;
    let animation;
    function syncMotion() {
      clearInterval(timer);
      animation?.kill();
      if (window.gsap) gsap.set(screen, { scaleX: 1, scaleY: 1, opacity: 1 });
      if (reducedMotion.matches || document.hidden) return;
      timer = setInterval(draw, 125);
      if (window.gsap) {
        animation = gsap.timeline()
          .fromTo(screen, { scaleX: 0.06, scaleY: 0.008, opacity: 0.4 },
            { scaleX: 1, scaleY: 0.008, opacity: 1, duration: 0.3, ease: 'power2.out' })
          .to(screen, { scaleY: 1, duration: 0.65, ease: 'power2.out' })
          .to(screen, { opacity: 0.97, duration: 2.4, repeat: -1,
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

