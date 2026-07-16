import * as THREE from 'three';

export class CivicEmblem {
  constructor(canvas) {
    this.canvas = canvas;
    this.visible = true;
    this.pointer = new THREE.Vector2();
    this.pointerTarget = new THREE.Vector2();
    this.lastFrame = 0;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, .1, 30);
    this.camera.position.set(0, 0, 5.2);

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    const crystal = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.15, 3),
      new THREE.MeshPhysicalMaterial({
        color: 0xff3158,
        emissive: 0x5d001a,
        emissiveIntensity: .7,
        metalness: .24,
        roughness: .12,
        transmission: .32,
        thickness: 1.4,
        clearcoat: 1,
        clearcoatRoughness: .08,
        iridescence: 1,
        iridescenceIOR: 1.3,
        iridescenceThicknessRange: [120, 420]
      })
    );
    crystal.scale.y = 1.18;
    this.group.add(crystal);

    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.42, 1),
      new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: .16 })
    );
    this.group.add(wire);

    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xff8ca0, transparent: true, opacity: .34 });
    this.rings = [0, 1, 2].map(index => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.62 + index * .18, .008, 6, 96), ringMaterial.clone());
      ring.rotation.set(index * .7 + .4, index * .95, index * .35);
      this.group.add(ring);
      return ring;
    });

    this.scene.add(new THREE.HemisphereLight(0xe8f0ff, 0x21000b, 2.4));
    const key = new THREE.DirectionalLight(0xffffff, 4.2);
    key.position.set(-3, 4, 5);
    this.scene.add(key);
    const rim = new THREE.PointLight(0xff204c, 18, 12);
    rim.position.set(3, -1, 3);
    this.scene.add(rim);
    const cyan = new THREE.PointLight(0x58dfff, 8, 10);
    cyan.position.set(-3, 1, 2);
    this.scene.add(cyan);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.intersectionObserver = new IntersectionObserver(([entry]) => { this.visible = entry.isIntersecting; }, { threshold: .02 });
    this.intersectionObserver.observe(canvas);
    canvas.closest('.finale__signal')?.addEventListener('pointermove', event => {
      const rect = canvas.getBoundingClientRect();
      this.pointerTarget.set((event.clientX - rect.left) / rect.width - .5, (event.clientY - rect.top) / rect.height - .5);
    }, { passive: true });
    canvas.closest('.finale__signal')?.addEventListener('pointerleave', () => this.pointerTarget.set(0, 0));

    this.resize();
    this.animate();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const size = Math.max(1, Math.floor(Math.min(rect.width, rect.height)));
    this.renderer.setSize(size, size, false);
    this.camera.aspect = 1;
    this.camera.updateProjectionMatrix();
  }

  animate = time => {
    this.frame = requestAnimationFrame(this.animate);
    if (!this.visible || time - this.lastFrame < 32) return;
    const delta = Math.min((time - this.lastFrame) / 1000 || .016, .05);
    this.lastFrame = time;
    this.pointer.lerp(this.pointerTarget, 1 - Math.exp(-4 * delta));
    this.group.rotation.y += delta * .38;
    this.group.rotation.x += (this.pointer.y * .34 - this.group.rotation.x) * (1 - Math.exp(-3 * delta));
    this.group.rotation.z += (this.pointer.x * .24 - this.group.rotation.z) * (1 - Math.exp(-3 * delta));
    this.rings.forEach((ring, index) => {
      ring.rotation.x += delta * (.1 + index * .035);
      ring.rotation.z += delta * (index % 2 ? -.14 : .12);
    });
    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    this.renderer.dispose();
  }
}