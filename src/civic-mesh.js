import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import civicMeshCss from './civic-mesh.css?inline';

const THEME_STYLE_ID = 'civic-mesh-theme-styles';
const STYLE_ID = 'civic-mesh-runtime-styles';
const AMBIENT_ID = 'civic-mesh-ambient';
const PROGRESS_ID = 'civic-mesh-progress';
const PUBLIC_BASE = import.meta.env.BASE_URL || '/';
const MODEL_ROOT = `${PUBLIC_BASE.endsWith('/') ? PUBLIC_BASE : `${PUBLIC_BASE}/`}models/kenney-city/`;
const FRAME_INTERVAL = 1000 / 24;

const SCENE_PRESETS = {
  default: {
    camera: [8.6, 7.2, 10.5],
    lookAt: [0, 0.5, 0],
    worldPosition: [0, -1.15, 0],
    worldRotation: -0.22,
    worldScale: 1,
    parallax: 0.17,
  },
  'operations-hub': {
    camera: [9.4, 6.4, 9.2],
    lookAt: [0, 0.62, 0],
    worldPosition: [0.15, -1.08, 0],
    worldRotation: -0.48,
    worldScale: 1.03,
    parallax: 0.13,
  },
  'civic-district': {
    camera: [7.7, 8.2, 11.7],
    lookAt: [0, 0.35, 0],
    worldPosition: [0, -1.2, 0],
    worldRotation: 0.16,
    worldScale: 0.94,
    parallax: 0.2,
  },
  'civic-beacon': {
    camera: [7.1, 5.8, 9.5],
    lookAt: [0, 0.78, 0],
    worldPosition: [-0.08, -1.14, 0],
    worldRotation: -0.72,
    worldScale: 1.08,
    parallax: 0.11,
  },
};

const MODEL_FILES = {
  road: 'road-straight-lightposts.glb',
  intersection: 'road-intersection.glb',
  corner: 'road-corner.glb',
  fountain: 'pavement-fountain.glb',
  trees: 'grass-trees-tall.glb',
  buildingA: 'building-small-a.glb',
  buildingB: 'building-small-b.glb',
  buildingC: 'building-small-c.glb',
  buildingD: 'building-small-d.glb',
  garage: 'building-garage.glb',
};

const injectedStyles = `
  html { --civic-scroll: 0; }
  body.civic-mesh { --civic-pointer-x: 50vw; --civic-pointer-y: 40vh; }

  .civic-mesh-ambient {
    position: fixed;
    inset: -16vmax;
    z-index: 38;
    pointer-events: none;
    overflow: hidden;
    opacity: .2;
    mix-blend-mode: screen;
    transform: translateZ(0);
    contain: strict;
  }
  .civic-mesh-ambient::before,
  .civic-mesh-ambient::after {
    content: '';
    position: absolute;
    width: 46vmax;
    aspect-ratio: 1;
    border-radius: 999px;
    filter: blur(72px);
    will-change: transform;
  }
  .civic-mesh-ambient::before {
    left: calc(var(--civic-pointer-x) - 30vmax);
    top: calc(var(--civic-pointer-y) - 30vmax);
    background: radial-gradient(circle, rgba(255, 226, 218, .5) 0 8%, rgba(255, 42, 78, .32) 30%, transparent 70%);
    animation: civic-mesh-light-a 18s ease-in-out infinite alternate;
  }
  .civic-mesh-ambient::after {
    right: 2vmax;
    bottom: 0;
    background: radial-gradient(circle, rgba(160, 200, 255, .34), rgba(101, 73, 255, .17) 36%, transparent 70%);
    animation: civic-mesh-light-b 24s ease-in-out infinite alternate;
  }
  .civic-mesh-progress {
    position: fixed;
    z-index: 10000;
    top: 0;
    left: 0;
    width: 100%;
    height: 3px;
    pointer-events: none;
    transform: scaleX(var(--civic-scroll));
    transform-origin: 0 50%;
    background: linear-gradient(90deg, #ff2e4f, #ff7389 54%, #fff7f2);
    box-shadow: 0 0 18px rgba(255, 46, 79, .78), 0 2px 20px rgba(255, 255, 255, .2);
    will-change: transform;
  }
  [data-civic-mesh-scene] {
    position: relative;
    isolation: isolate;
    min-height: 360px;
    overflow: hidden;
  }
  [data-civic-mesh-scene] canvas.civic-mesh-canvas {
    position: absolute;
    inset: 0;
    z-index: 0;
    width: 100%;
    height: 100%;
    display: block;
    pointer-events: none;
    opacity: 0;
    transform: scale(1.025);
    transition: opacity .9s ease, transform 1.2s cubic-bezier(.2,.8,.2,1);
  }
  [data-civic-mesh-scene][data-mesh-status='ready'] canvas.civic-mesh-canvas,
  [data-civic-mesh-scene][data-mesh-status='foundation'] canvas.civic-mesh-canvas {
    opacity: 1;
    transform: scale(1);
  }
  [data-civic-mesh-scene] > :not(canvas) { position: relative; z-index: 1; }
  .civic-mesh-nav-open { overflow: hidden; }

  @keyframes civic-mesh-light-a {
    0% { transform: translate3d(-7vmax, -3vmax, 0) scale(.86) rotate(-8deg); }
    100% { transform: translate3d(22vmax, 18vmax, 0) scale(1.12) rotate(16deg); }
  }
  @keyframes civic-mesh-light-b {
    0% { transform: translate3d(6vmax, 8vmax, 0) scale(.92); }
    100% { transform: translate3d(-26vmax, -18vmax, 0) scale(1.18); }
  }
  @media (prefers-reduced-motion: reduce) {
    .civic-mesh-ambient::before,
    .civic-mesh-ambient::after { animation: none !important; }
    [data-civic-mesh-scene] canvas.civic-mesh-canvas { transition-duration: .01ms; }
  }
`;

function injectGlobalEnhancements() {
  document.body.classList.add('civic-mesh');

  if (!document.getElementById(THEME_STYLE_ID)) {
    const theme = document.createElement('style');
    theme.id = THEME_STYLE_ID;
    theme.textContent = civicMeshCss;
    document.head.append(theme);
  }

  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = injectedStyles;
    document.head.append(style);
  }

  if (!document.getElementById(AMBIENT_ID)) {
    const ambient = document.createElement('div');
    ambient.id = AMBIENT_ID;
    ambient.className = 'civic-mesh-ambient';
    ambient.setAttribute('aria-hidden', 'true');
    document.body.append(ambient);
  }

  if (!document.getElementById(PROGRESS_ID)) {
    const progress = document.createElement('div');
    progress.id = PROGRESS_ID;
    progress.className = 'civic-mesh-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.append(progress);
  }
}

function initPointerLight() {
  if (!document.getElementById(AMBIENT_ID)) return () => {};
  const finePointerQuery = matchMedia('(pointer: fine)');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let listening = false;
  let x = innerWidth * 0.5;
  let y = innerHeight * 0.4;

  const flush = () => {
    document.body.style.setProperty('--civic-pointer-x', `${x}px`);
    document.body.style.setProperty('--civic-pointer-y', `${y}px`);
    frame = 0;
  };
  const onPointerMove = (event) => {
    x = event.clientX;
    y = event.clientY;
    if (!frame) frame = requestAnimationFrame(flush);
  };
  const sync = () => {
    const shouldListen = finePointerQuery.matches && !reducedMotionQuery.matches;
    if (shouldListen === listening) return;
    listening = shouldListen;
    if (listening) addEventListener('pointermove', onPointerMove, { passive: true });
    else removeEventListener('pointermove', onPointerMove);
  };

  finePointerQuery.addEventListener?.('change', sync);
  reducedMotionQuery.addEventListener?.('change', sync);
  sync();
  return () => {
    removeEventListener('pointermove', onPointerMove);
    finePointerQuery.removeEventListener?.('change', sync);
    reducedMotionQuery.removeEventListener?.('change', sync);
    if (frame) cancelAnimationFrame(frame);
  };
}
function initScrollProgress() {
  let frame = 0;
  const update = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const progress = Math.min(1, Math.max(0, scrollY / max));
    document.documentElement.style.setProperty('--civic-scroll', progress.toFixed(4));
    frame = 0;
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  update();
  return () => {
    removeEventListener('scroll', onScroll);
    removeEventListener('resize', onScroll);
    if (frame) cancelAnimationFrame(frame);
  };
}

function resolveNav(toggle) {
  const controlledId = toggle.getAttribute('aria-controls');
  const controlled = controlledId ? document.getElementById(controlledId) : null;
  if (controlled) return controlled;

  const shell = toggle.closest('.site-header, .portal-header, header');
  return shell?.querySelector('nav, .portal-nav, [data-nav-panel]') || null;
}

function initMobileNav() {
  const toggles = document.querySelectorAll('[data-nav-toggle], .menu-btn, .portal-menu, .portal-menu-button');
  const cleanups = [];

  toggles.forEach((toggle, index) => {
    if (toggle.dataset.civicMeshNav === 'ready') return;
    const nav = resolveNav(toggle);
    const shell = toggle.closest('.site-header, .portal-header, header') || nav?.parentElement;
    if (!nav || !shell) return;

    const closedLabel = toggle.dataset.closedLabel || toggle.getAttribute('aria-label') || 'Buka menu';
    const openLabel = toggle.dataset.openLabel || 'Tutup menu';
    toggle.dataset.civicMeshNav = 'ready';
    if (!nav.id) nav.id = `civic-navigation-${index + 1}`;
    toggle.setAttribute('aria-controls', nav.id);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', closedLabel);

    const close = (restoreFocus = false) => {
      shell.classList.remove('menu-open', 'is-nav-open');
      document.body.classList.remove('civic-mesh-nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', closedLabel);
      if (restoreFocus) toggle.focus({ preventScroll: true });
    };
    const click = (event) => {
      event.stopImmediatePropagation();
      const open = !shell.classList.contains('is-nav-open');
      shell.classList.toggle('menu-open', open);
      shell.classList.toggle('is-nav-open', open);
      document.body.classList.toggle('civic-mesh-nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? openLabel : closedLabel);
    };
    const escape = (event) => {
      if (event.key === 'Escape' && shell.classList.contains('is-nav-open')) close(true);
    };
    const outside = (event) => {
      if (shell.classList.contains('is-nav-open') && !shell.contains(event.target)) close();
    };
    const linkClick = (event) => {
      if (event.target.closest('a')) close();
    };

    toggle.addEventListener('click', click, { capture: true });
    nav.addEventListener('click', linkClick);
    document.addEventListener('keydown', escape);
    document.addEventListener('click', outside);
    cleanups.push(() => {
      close();
      delete toggle.dataset.civicMeshNav;
      toggle.removeEventListener('click', click, { capture: true });
      nav.removeEventListener('click', linkClick);
      document.removeEventListener('keydown', escape);
      document.removeEventListener('click', outside);
    });
  });

  return () => cleanups.forEach((cleanup) => cleanup());
}
function loadModel(loader, file) {
  return new Promise((resolve, reject) => {
    loader.load(`${MODEL_ROOT}${file}`, (gltf) => resolve(gltf.scene), undefined, reject);
  });
}

function disposeObjectResources(root, { disposeTextures = true } = {}) {
  if (!root) return;
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();

  root.traverse((child) => {
    if (child.geometry) geometries.add(child.geometry);
    const childMaterials = Array.isArray(child.material) ? child.material : [child.material];
    childMaterials.filter(Boolean).forEach((material) => {
      materials.add(material);
      if (!disposeTextures) return;
      Object.values(material).forEach((value) => {
        if (value?.isTexture) textures.add(value);
      });
    });
  });

  textures.forEach((texture) => {
    texture.dispose();
    texture.source?.data?.close?.();
  });
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
}

function createTintedMaterial(original, palette, kind) {
  const material = palette.clone();
  const textureKeys = [
    'map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap',
    'emissiveMap', 'alphaMap', 'lightMap', 'bumpMap',
  ];
  textureKeys.forEach((key) => {
    if (original?.[key]) material[key] = original[key];
  });

  const whiteMix = {
    building: 0.5,
    road: 0.7,
    trees: 0.58,
    fountain: 0.72,
  }[kind] ?? 0.5;
  material.color.copy(palette.color).lerp(new THREE.Color(0xffffff), whiteMix);
  material.name = `${original?.name || kind || 'mesh'}-civic-tint`;
  material.side = original?.side ?? THREE.FrontSide;
  material.alphaTest = original?.alphaTest || 0;
  material.transparent = Boolean(original?.transparent || palette.transparent);
  material.opacity = Math.min(original?.opacity ?? 1, palette.opacity ?? 1);
  material.vertexColors = Boolean(original?.vertexColors);
  material.needsUpdate = true;
  return material;
}

function materialPicker(materials, kind, paletteOffset = 0) {
  return (index, name = '') => {
    const key = name.toLowerCase();
    if (kind === 'trees' || /leaf|tree|crown|green/.test(key)) return materials.green;
    if (kind === 'fountain') return materials.ivory;
    if (kind === 'road') return materials.metal;
    return [materials.red, materials.ivory, materials.metal][(index + paletteOffset) % 3];
  };
}

function fitModel(source, maxSize, pickMaterial, kind) {
  const clone = source.clone(true);
  let meshIndex = 0;
  clone.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = false;
    child.receiveShadow = true;
    const originals = Array.isArray(child.material) ? child.material : [child.material];
    const tinted = originals.map((original, materialIndex) => createTintedMaterial(
      original,
      pickMaterial(meshIndex + materialIndex, child.name),
      kind,
    ));
    child.material = Array.isArray(child.material) ? tinted : tinted[0];
    meshIndex += Math.max(1, originals.length);
  });

  clone.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(clone);
  const size = bounds.getSize(new THREE.Vector3());
  const scale = maxSize / Math.max(size.x, size.z, 0.001);
  clone.scale.setScalar(scale);
  clone.updateMatrixWorld(true);

  const fittedBounds = new THREE.Box3().setFromObject(clone);
  const center = fittedBounds.getCenter(new THREE.Vector3());
  clone.position.x -= center.x;
  clone.position.y -= fittedBounds.min.y;
  clone.position.z -= center.z;

  const pivot = new THREE.Group();
  pivot.add(clone);
  return pivot;
}

function createMaterials() {
  return {
    red: new THREE.MeshPhysicalMaterial({
      color: 0xc91335,
      emissive: 0x3b020e,
      emissiveIntensity: 0.32,
      metalness: 0.48,
      roughness: 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.16,
    }),
    ivory: new THREE.MeshPhysicalMaterial({
      color: 0xf5eee7,
      emissive: 0x221a18,
      emissiveIntensity: 0.12,
      metalness: 0.16,
      roughness: 0.3,
      clearcoat: 0.75,
      clearcoatRoughness: 0.24,
    }),
    metal: new THREE.MeshPhysicalMaterial({
      color: 0x182238,
      emissive: 0x020712,
      emissiveIntensity: 0.28,
      metalness: 0.8,
      roughness: 0.26,
      clearcoat: 0.55,
      clearcoatRoughness: 0.2,
    }),
    green: new THREE.MeshPhysicalMaterial({
      color: 0x4f8f74,
      emissive: 0x071d19,
      emissiveIntensity: 0.22,
      metalness: 0.15,
      roughness: 0.48,
      clearcoat: 0.35,
    }),
    water: new THREE.MeshPhysicalMaterial({
      color: 0x9ed8ec,
      emissive: 0x15394b,
      emissiveIntensity: 0.5,
      metalness: 0.08,
      roughness: 0.12,
      transparent: true,
      opacity: 0.78,
    }),
  };
}

function addModel(world, source, options, materials) {
  if (!source) return null;
  const {
    size,
    position,
    rotation = 0,
    kind = 'building',
    scale = 1,
    paletteOffset = 0,
  } = options;
  const pivot = fitModel(
    source,
    size,
    materialPicker(materials, kind, paletteOffset),
    kind,
  );
  pivot.position.set(...position);
  pivot.rotation.y = rotation;
  pivot.scale.setScalar(scale);
  world.add(pivot);
  return pivot;
}

async function populateCity(world, materials, isCancelled, onReady) {
  const loader = new GLTFLoader();
  const entries = Object.entries(MODEL_FILES);
  const results = await Promise.allSettled(entries.map(async ([name, file]) => [name, await loadModel(loader, file)]));
  const loadedEntries = results
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);
  const models = Object.fromEntries(loadedEntries);

  if (isCancelled()) {
    loadedEntries.forEach(([, source]) => disposeObjectResources(source));
    return { cancelled: true, loaded: 0, failed: results.length - loadedEntries.length };
  }

  let placed = 0;
  const place = (name, options) => {
    const model = addModel(world, models[name], options, materials);
    if (model) placed += 1;
    return model;
  };

  const roadTiles = [
    ['intersection', [0, 0.04, 0], 0],
    ['road', [0, 0.04, -2.25], 0],
    ['road', [0, 0.04, 2.25], 0],
    ['road', [-2.25, 0.04, 0], Math.PI / 2],
    ['road', [2.25, 0.04, 0], Math.PI / 2],
    ['corner', [-2.25, 0.04, -2.25], 0],
    ['corner', [2.25, 0.04, -2.25], -Math.PI / 2],
    ['corner', [2.25, 0.04, 2.25], Math.PI],
    ['corner', [-2.25, 0.04, 2.25], Math.PI / 2],
  ];
  roadTiles.forEach(([name, position, rotation]) => {
    place(name, { size: 2.08, position, rotation, kind: 'road' });
  });

  const buildings = [
    ['buildingC', [-3.45, 0.08, -2.6], 0, 1.55],
    ['buildingA', [3.45, 0.08, -2.65], -Math.PI / 2, 1.35],
    ['buildingD', [-3.35, 0.08, 2.7], Math.PI / 2, 1.48],
    ['buildingB', [3.4, 0.08, 2.7], Math.PI, 1.45],
    ['garage', [-3.5, 0.08, 0.2], Math.PI / 2, 1.32],
    ['buildingA', [3.55, 0.08, 0.05], -Math.PI / 2, 1.16],
  ];
  buildings.forEach(([name, position, rotation, scale], index) => {
    place(name, { size: 1.48, position, rotation, scale, paletteOffset: index });
  });

  place('fountain', {
    size: 1.22,
    position: [0, 0.1, 1.55],
    rotation: Math.PI / 4,
    kind: 'fountain',
  });
  place('trees', {
    size: 1.22,
    position: [0, 0.08, -1.55],
    rotation: -0.28,
    kind: 'trees',
  });
  place('trees', {
    size: 0.82,
    position: [-1.55, 0.08, 1.6],
    rotation: 0.65,
    kind: 'trees',
  });
  place('trees', {
    size: 0.78,
    position: [1.58, 0.08, -1.55],
    rotation: -0.8,
    kind: 'trees',
  });

  const summary = {
    cancelled: false,
    loaded: loadedEntries.length,
    failed: results.length - loadedEntries.length,
    placed,
  };
  onReady(summary);
  return summary;
}
function addSceneFoundation(scene, world, materials) {
  const ground = new THREE.Mesh(
    new THREE.CylinderGeometry(5.65, 6.1, 0.48, 8),
    new THREE.MeshPhysicalMaterial({
      color: 0x080f20,
      emissive: 0x030611,
      emissiveIntensity: 0.5,
      metalness: 0.7,
      roughness: 0.28,
      clearcoat: 0.55,
    }),
  );
  ground.position.y = -0.24;
  ground.receiveShadow = true;
  world.add(ground);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(5.2, 0.025, 6, 96),
    new THREE.MeshBasicMaterial({ color: 0xff3151, transparent: true, opacity: 0.7 }),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.02;
  world.add(rim);

  const grid = new THREE.GridHelper(12, 24, 0xff3151, 0x253452);
  grid.position.y = 0.012;
  grid.material.transparent = true;
  grid.material.opacity = 0.18;
  world.add(grid);

  const halo = new THREE.PointLight(0xff2448, 38, 16, 2);
  halo.position.set(-3, 3, 3);
  scene.add(halo);
  const cool = new THREE.PointLight(0x8fc9ff, 24, 15, 2);
  cool.position.set(4, 4, -3);
  scene.add(cool);

  const beacon = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.12, 1),
    materials.ivory,
  );
  beacon.position.set(0, 2.55, 0);
  beacon.userData.isBeacon = true;
  world.add(beacon);
  return beacon;
}

function mountMeshScene(target) {
  if (target.dataset.civicMeshMounted === 'true') return () => {};
  target.dataset.civicMeshMounted = 'true';
  target.dataset.meshStatus = 'loading';
  if (!target.hasAttribute('role')) target.setAttribute('role', 'img');
  if (!target.hasAttribute('aria-label')) {
    target.setAttribute('aria-label', 'Miniatur kota partisipasi publik tiga dimensi');
  }

  const preset = SCENE_PRESETS[target.dataset.scene] || SCENE_PRESETS.default;
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x080d1c, 0.062);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  camera.position.set(...preset.camera);
  camera.lookAt(...preset.lookAt);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: 'low-power',
    });
  } catch (error) {
    target.dataset.meshStatus = 'unavailable';
    console.warn('[civic-mesh] WebGL is unavailable; keeping the static scene fallback.', error);
    const fallbackCleanup = () => {
      target.dataset.civicMeshMounted = 'false';
    };
    fallbackCleanup.resume = () => {};
    return fallbackCleanup;
  }

  renderer.domElement.className = 'civic-mesh-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  target.prepend(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xfff8f3, 0x071024, 2.5));
  const key = new THREE.DirectionalLight(0xffe7de, 3.6);
  key.position.set(6, 10, 8);
  scene.add(key);

  const materials = createMaterials();
  const world = new THREE.Group();
  world.position.set(...preset.worldPosition);
  world.rotation.y = preset.worldRotation;
  world.scale.setScalar(preset.worldScale);
  scene.add(world);
  const beacon = addSceneFoundation(scene, world, materials);

  let disposed = false;
  let visible = !('IntersectionObserver' in window);
  let frame = 0;
  let lastFrame = 0;
  let elapsed = 0;
  let pointerX = 0;
  let pointerY = 0;
  let hasRenderableSize = false;
  let sceneReady = false;

  const renderOnce = () => {
    if (disposed || !hasRenderableSize) return;
    renderer.render(scene, camera);
  };

  const stopLoop = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  };

  const tick = (timestamp) => {
    frame = 0;
    if (disposed || document.hidden || !visible || reducedMotionQuery.matches) return;
    if (timestamp - lastFrame < FRAME_INTERVAL) {
      frame = requestAnimationFrame(tick);
      return;
    }

    const delta = Math.min(Math.max(0, timestamp - lastFrame) / 1000, 0.08);
    lastFrame = timestamp;
    elapsed += Number.isFinite(delta) ? delta : 0;
    const targetRotation = preset.worldRotation + pointerX * preset.parallax;
    world.rotation.y += (targetRotation - world.rotation.y) * 0.055;
    world.rotation.x += ((pointerY * 0.045) - world.rotation.x) * 0.055;
    world.position.y = preset.worldPosition[1] + Math.sin(elapsed * 0.72) * 0.035;
    beacon.rotation.y = elapsed * 0.8;
    beacon.position.y = 2.55 + Math.sin(elapsed * 1.4) * 0.08;
    renderOnce();
    frame = requestAnimationFrame(tick);
  };

  const startLoop = () => {
    if (disposed || frame || document.hidden || !visible || reducedMotionQuery.matches) return;
    lastFrame = performance.now();
    frame = requestAnimationFrame(tick);
  };

  const resize = () => {
    const { width, height } = target.getBoundingClientRect();
    if (!width || !height) return;
    hasRenderableSize = true;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderOnce();
  };

  const onPointerMove = (event) => {
    if (reducedMotionQuery.matches) return;
    const rect = target.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    pointerY = ((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1;
  };
  const onPointerLeave = () => {
    pointerX = 0;
    pointerY = 0;
  };
  const onVisibilityChange = () => {
    if (document.hidden) {
      stopLoop();
      return;
    }
    resize();
    renderOnce();
    startLoop();
  };
  const onMotionChange = () => {
    pointerX = 0;
    pointerY = 0;
    world.rotation.set(0, preset.worldRotation, 0);
    world.position.set(...preset.worldPosition);
    if (reducedMotionQuery.matches) {
      stopLoop();
      renderOnce();
    } else {
      startLoop();
    }
  };
  const onContextLost = (event) => {
    event.preventDefault();
    stopLoop();
    target.dataset.meshStatus = 'unavailable';
  };
  const onContextRestored = () => {
    target.dataset.meshStatus = sceneReady ? 'ready' : 'foundation';
    resize();
    renderOnce();
    startLoop();
  };

  const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
  if (resizeObserver) resizeObserver.observe(target);
  else addEventListener('resize', resize, { passive: true });

  const intersectionObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        resize();
        renderOnce();
        startLoop();
      } else {
        stopLoop();
      }
    }, { rootMargin: '160px', threshold: 0.01 })
    : null;
  intersectionObserver?.observe(target);

  target.addEventListener('pointermove', onPointerMove, { passive: true });
  target.addEventListener('pointerleave', onPointerLeave, { passive: true });
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);
  document.addEventListener('visibilitychange', onVisibilityChange);
  reducedMotionQuery.addEventListener?.('change', onMotionChange);

  resize();
  startLoop();
  populateCity(world, materials, () => disposed, (summary) => {
    if (disposed || summary.cancelled) return;
    sceneReady = summary.placed > 0;
    target.dataset.meshStatus = sceneReady ? 'ready' : 'foundation';
    target.dataset.meshLoaded = String(summary.loaded);
    target.dataset.meshFailed = String(summary.failed);
    renderOnce();
    startLoop();
  }).catch((error) => {
    if (disposed) return;
    target.dataset.meshStatus = 'foundation';
    console.warn('[civic-mesh] Kenney city models could not be composed.', error);
    renderOnce();
  });

  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    stopLoop();
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    if (!resizeObserver) removeEventListener('resize', resize);
    target.removeEventListener('pointermove', onPointerMove);
    target.removeEventListener('pointerleave', onPointerLeave);
    renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
    renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    reducedMotionQuery.removeEventListener?.('change', onMotionChange);
    disposeObjectResources(scene);
    Object.values(materials).forEach((material) => material.dispose());
    renderer.renderLists.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    target.dataset.civicMeshMounted = 'false';
    delete target.dataset.meshStatus;
    delete target.dataset.meshLoaded;
    delete target.dataset.meshFailed;
  };

  cleanup.resume = () => {
    if (disposed) return;
    resize();
    renderOnce();
    startLoop();
  };
  return cleanup;
}
let activeCleanup = null;

export function initCivicMesh() {
  if (!document.body) return () => {};
  if (activeCleanup) return activeCleanup;
  if (document.body.dataset.civicMesh === 'ready') return () => {};
  document.body.dataset.civicMesh = 'ready';
  injectGlobalEnhancements();

  const sceneCleanups = Array.from(document.querySelectorAll('[data-civic-mesh-scene]'), (target) => {
    try {
      return mountMeshScene(target);
    } catch (error) {
      target.dataset.meshStatus = 'unavailable';
      target.dataset.civicMeshMounted = 'false';
      console.warn('[civic-mesh] Scene initialization failed; keeping the static fallback.', error);
      const noop = () => {};
      noop.resume = () => {};
      return noop;
    }
  });
  const cleanups = [
    initPointerLight(),
    initScrollProgress(),
    initMobileNav(),
    ...sceneCleanups,
  ];

  let cleaned = false;
  const resume = () => {
    if (cleaned) return;
    cleanups.forEach((cleanup) => cleanup.resume?.());
    dispatchEvent(new Event('scroll'));
  };
  const onPageHide = (event) => {
    if (!event.persisted) cleanup();
  };
  const onPageShow = (event) => {
    if (event.persisted) resume();
  };
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    removeEventListener('pagehide', onPageHide);
    removeEventListener('pageshow', onPageShow);
    cleanups.forEach((fn) => fn?.());
    document.getElementById(AMBIENT_ID)?.remove();
    document.getElementById(PROGRESS_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
    document.getElementById(THEME_STYLE_ID)?.remove();
    document.body?.classList.remove('civic-mesh-nav-open');
    if (document.body) delete document.body.dataset.civicMesh;
    activeCleanup = null;
  };
  cleanup.resume = resume;
  activeCleanup = cleanup;
  addEventListener('pagehide', onPageHide);
  addEventListener('pageshow', onPageShow);
  return cleanup;
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCivicMesh, { once: true });
} else {
  initCivicMesh();
}

