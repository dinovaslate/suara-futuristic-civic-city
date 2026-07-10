import * as THREE from 'three';

export function createPolicyMap(host) {
  if (!host || !globalThis.WebGLRenderingContext) {
    host?.classList.add('map-fallback');
    return () => {};
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, host.clientWidth / Math.max(1, host.clientHeight), 0.1, 80);
  camera.position.set(7.4, 8.8, 9.8);
  camera.lookAt(0, 0, 0);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1));
  renderer.setSize(host.clientWidth, host.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  host.prepend(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xf5f1e8, 0x050b17, 2.8));
  const redLight = new THREE.PointLight(0xe3203b, 28, 18);
  redLight.position.set(-2, 5, 4);
  scene.add(redLight);

  const city = new THREE.Group();
  city.rotation.y = -0.35;
  scene.add(city);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(5.4, 5.8, 0.28, 64),
    new THREE.MeshPhysicalMaterial({ color: 0x0e1828, roughness: 0.48, metalness: 0.32, transparent: true, opacity: 0.92 }),
  );
  base.position.y = -0.25;
  city.add(base);

  const grid = new THREE.GridHelper(10, 24, 0xe3203b, 0x536278);
  grid.position.y = -0.08;
  grid.material.transparent = true;
  grid.material.opacity = 0.22;
  city.add(grid);

  const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0xcbd2dc, roughness: 0.36, metalness: 0.2, transparent: true, opacity: 0.84 });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x26344a, roughness: 0.42, metalness: 0.28 });
  const redMaterial = new THREE.MeshStandardMaterial({ color: 0xe3203b, emissive: 0x5a0614, emissiveIntensity: 0.7, roughness: 0.32 });
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const buildings = [];
  for (let x = -4; x <= 4; x += 1) {
    for (let z = -4; z <= 4; z += 1) {
      if (Math.abs(x) < 1.4 && Math.abs(z) < 1.4) continue;
      const seed = Math.abs(x * 31 + z * 17);
      if (seed % 4 === 0) continue;
      const height = 0.3 + (seed % 9) * 0.16;
      buildings.push({ x: x * 0.78 + ((seed % 3) - 1) * 0.08, z: z * 0.72, height, red: seed % 17 === 0, dark: seed % 3 === 0 });
    }
  }
  [buildingMaterial, darkMaterial, redMaterial].forEach((material, materialIndex) => {
    const layer = buildings.filter((item) => (item.red ? 2 : item.dark ? 1 : 0) === materialIndex);
    const mesh = new THREE.InstancedMesh(geometry, material, layer.length);
    const dummy = new THREE.Object3D();
    layer.forEach((building, index) => {
      dummy.position.set(building.x, building.height / 2, building.z);
      dummy.scale.set(0.48, building.height, 0.45);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    city.add(mesh);
  });

  const zone = new THREE.Mesh(
    new THREE.RingGeometry(1.22, 1.68, 64),
    new THREE.MeshBasicMaterial({ color: 0xe3203b, transparent: true, opacity: 0.45, side: THREE.DoubleSide }),
  );
  zone.rotation.x = -Math.PI / 2;
  zone.position.y = 0.02;
  city.add(zone);

  const hub = new THREE.Group();
  const hubCore = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.38, 1.1, 20), redMaterial);
  hubCore.position.y = 0.55;
  hub.add(hubCore);
  for (let index = 0; index < 3; index += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.58 + index * 0.28, 0.014, 6, 54),
      new THREE.MeshBasicMaterial({ color: index === 0 ? 0xffffff : 0xe3203b, transparent: true, opacity: 0.5 - index * 0.1 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.14 + index * 0.12;
    hub.add(ring);
  }
  city.add(hub);

  const nodes = [];
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(index % 4 === 0 ? 0.07 : 0.035, 10, 10),
      new THREE.MeshBasicMaterial({ color: index % 4 === 0 ? 0xffffff : 0xff4058 }),
    );
    node.userData = { angle, radius: 2.2 + (index % 3) * 0.52 };
    city.add(node);
    nodes.push(node);
  }

  let visible = true;
  let last = 0;
  let pointerX = 0;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { rootMargin: '120px' }).observe(host);
  host.addEventListener('pointermove', (event) => {
    const bounds = host.getBoundingClientRect();
    pointerX = ((event.clientX - bounds.left) / Math.max(1, bounds.width) - 0.5) * 0.16;
  }, { passive: true });

  let frameId;
  function animate(stamp = 0) {
    frameId = requestAnimationFrame(animate);
    if (!visible || document.hidden || stamp - last < 40) return;
    last = stamp;
    const time = stamp * 0.001;
    city.rotation.y += (pointerX - city.rotation.y - 0.35) * 0.015;
    if (!reducedMotion) {
      zone.material.opacity = 0.32 + Math.sin(time * 1.5) * 0.12;
      hub.position.y = Math.sin(time * 0.9) * 0.07;
      hub.children.slice(1).forEach((ring, index) => { ring.rotation.z = time * (index % 2 ? -0.25 : 0.25); });
      nodes.forEach((node, index) => {
        const { angle, radius } = node.userData;
        node.position.set(Math.cos(angle + time * 0.08) * radius, 0.25 + Math.sin(time * 1.4 + index) * 0.32, Math.sin(angle + time * 0.08) * radius);
      });
    }
    renderer.render(scene, camera);
  }
  animate();

  function resize() {
    const width = host.clientWidth;
    const height = Math.max(1, host.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', resize);

  return () => {
    cancelAnimationFrame(frameId);
    window.removeEventListener('resize', resize);
    renderer.dispose();
  };
}
