import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const vertexShader = /* glsl */`
  varying vec3 vWorld;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const groundFragment = /* glsl */`
  uniform float uTime;
  varying vec3 vWorld;
  varying vec2 vUv;

  float gridLine(float value, float width) {
    float line = abs(fract(value - .5) - .5) / fwidth(value);
    return 1.0 - min(line / width, 1.0);
  }

  void main() {
    float major = max(gridLine(vWorld.x * .08, 1.25), gridLine(vWorld.z * .08, 1.25));
    float minor = max(gridLine(vWorld.x * .32, .55), gridLine(vWorld.z * .32, .55));
    float sweep = smoothstep(.93, 1.0, sin(length(vWorld.xz) * .32 - uTime * 1.7) * .5 + .5);
    float fade = 1.0 - smoothstep(4.0, 45.0, length(vWorld.xz));
    vec3 base = vec3(.006, .009, .027);
    vec3 red = vec3(1.0, .025, .16);
    vec3 blue = vec3(.04, .42, 1.0);
    vec3 color = base + red * major * .22 + blue * minor * .08 + red * sweep * .16;
    gl_FragColor = vec4(color, (.22 + major * .28 + minor * .08 + sweep * .18) * fade);
  }
`;

const skyFragment = /* glsl */`
  uniform float uTime;
  uniform vec2 uPointer;
  varying vec3 vWorld;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  void main() {
    vec2 uv = vUv;
    float wave = sin((uv.x * 3.0 + uv.y * 2.0 + uTime * .035) * 3.14159);
    float leakA = .18 / (length(uv - vec2(.78 + uPointer.x * .035, .48 + uPointer.y * .03)) + .2);
    float leakB = .12 / (length(uv - vec2(.22 - uPointer.x * .02, .72)) + .18);
    float stars = step(.9984, hash(floor(uv * vec2(900.0,500.0))));
    vec3 color = mix(vec3(.004,.006,.02), vec3(.025,.014,.07), uv.y + wave * .04);
    color += vec3(.82,.01,.12) * leakA * .26;
    color += vec3(.03,.25,.85) * leakB * .3;
    color += stars * vec3(.6,.75,1.0);
    gl_FragColor = vec4(color, 1.0);
  }
`;

export class CivicWorld {
  constructor(canvas) {
    this.canvas = canvas;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.pointer = new THREE.Vector2();
    this.smoothPointer = new THREE.Vector2();
    this.scroll = 0;
    this.targetScroll = 0;
    this.clock = new THREE.Clock();
    this.lastFrame = 0;
    this.cameraLookY = 2.8;
    this.shardDummy = new THREE.Object3D();
    this.mixers = [];
    this.pulses = [];
    this.disposed = false;
    this.scenePhase = 'city';
    this.phaseTargets = {
      city: { x: 0, y: 7.5, z: 25, lookY: 2.8, spin: 0 },
      network: { x: 10, y: 10, z: 28, lookY: 3.4, spin: .55 },
      core: { x: -9, y: 8.2, z: 22, lookY: 4.2, spin: 1.1 },
      orbit: { x: 3, y: 16, z: 31, lookY: 1.5, spin: 1.7 },
      finale: { x: 0, y: 5, z: 19, lookY: 5, spin: 2.4 }
    };
    this.init();
  }

  init() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x070714, 0.016);
    this.camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, .1, 300);
    this.camera.position.set(0, 7.5, 25);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 760 ? 1 : 1.18));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = .92;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), innerWidth < 760 ? .48 : .72, .58, .3);
    this.composer.addPass(this.bloom);

    this.world = new THREE.Group();
    this.scene.add(this.world);
    this.cityRoot = new THREE.Group();
    this.cityRoot.position.set(7.5, -3.8, -3);
    this.world.add(this.cityRoot);

    this.skyUniforms = { uTime: { value: 0 }, uPointer: { value: this.smoothPointer } };
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(120, 32, 20),
      new THREE.ShaderMaterial({ vertexShader, fragmentShader: skyFragment, uniforms: this.skyUniforms, side: THREE.BackSide, depthWrite: false })
    );
    this.scene.add(sky);

    this.groundUniforms = { uTime: { value: 0 } };
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(110, 110, 1, 1),
      new THREE.ShaderMaterial({ vertexShader, fragmentShader: groundFragment, uniforms: this.groundUniforms, transparent: true, side: THREE.DoubleSide, depthWrite: false })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -4.3;
    this.world.add(ground);

    this.addLights();
    this.addMonoliths();
    this.addOrbitalNetwork();
    this.addTrafficStreams();
    this.loadCity();

    this.onPointerMove = event => {
      this.pointer.set((event.clientX / innerWidth) * 2 - 1, -(event.clientY / innerHeight) * 2 + 1);
    };
    this.onScroll = () => { this.targetScroll = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight); };
    this.onResize = () => this.resize();
    addEventListener('pointermove', this.onPointerMove, { passive: true });
    addEventListener('scroll', this.onScroll, { passive: true });
    addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this.clock.getDelta(); });

    this.animate();
  }

  addLights() {
    this.scene.add(new THREE.HemisphereLight(0x809dff, 0x170008, 1.5));
    const key = new THREE.DirectionalLight(0xffffff, 2.5);
    key.position.set(-8, 18, 12);
    this.scene.add(key);
    const red = new THREE.PointLight(0xff1748, 70, 42, 1.6);
    red.position.set(10, 3, 5);
    this.world.add(red);
    const blue = new THREE.PointLight(0x278cff, 55, 35, 1.8);
    blue.position.set(-11, 7, 1);
    this.world.add(blue);
  }

  addMonoliths() {
    const geometry = new THREE.BoxGeometry(1, 1, 1, 2, 8, 2);
    const colors = [0xff214b, 0x1f8cff, 0x8c4cff, 0xd7ff3f];
    this.monoliths = new THREE.Group();
    for (let i = 0; i < 18; i++) {
      const height = 1.5 + Math.random() * 8;
      const material = new THREE.MeshPhysicalMaterial({
        color: colors[i % colors.length],
        emissive: colors[i % colors.length],
        emissiveIntensity: .08 + Math.random() * .2,
        metalness: .7,
        roughness: .14,
        transmission: i % 4 === 2 ? .25 : 0,
        transparent: true,
        opacity: .72
      });
      const mesh = new THREE.Mesh(geometry, material);
      const angle = (i / 18) * Math.PI * 2;
      const radius = 13 + Math.sin(i * 2.1) * 5;
      mesh.scale.set(.65 + Math.random() * 1.4, height, .65 + Math.random() * 1.4);
      mesh.position.set(Math.cos(angle) * radius, -4.2 + height / 2, Math.sin(angle) * radius);
      mesh.rotation.y = angle + Math.random();
      mesh.userData.baseY = mesh.position.y;
      mesh.userData.phase = Math.random() * Math.PI * 2;
      this.monoliths.add(mesh);
    }
    this.world.add(this.monoliths);
  }

  addOrbitalNetwork() {
    this.orbits = new THREE.Group();
    const colors = [0xff3158, 0x6da9ff, 0xffffff, 0x9665ff];
    for (let i = 0; i < 7; i++) {
      const curve = new THREE.EllipseCurve(0, 0, 11 + i * 1.25, 6.5 + i * .7, 0, Math.PI * 2);
      const points = curve.getPoints(160).map(p => new THREE.Vector3(p.x, 0, p.y));
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: colors[i % colors.length], transparent: true, opacity: .12 + (i % 3) * .05 });
      const line = new THREE.LineLoop(geo, material);
      line.rotation.set(Math.random() * .9, Math.random() * Math.PI, Math.random() * .7);
      line.userData.speed = (i % 2 ? 1 : -1) * (.05 + i * .008);
      this.orbits.add(line);
    }
    this.orbits.position.set(0, 5, 0);
    this.world.add(this.orbits);

    const shardGeo = new THREE.SphereGeometry(.11, 12, 8);
    const shardMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .9, depthWrite: false });
    this.shards = new THREE.InstancedMesh(shardGeo, shardMat, 96);
    this.shardData = [];
    const temp = this.shardDummy;
    for (let i = 0; i < 96; i++) {
      const radius = 8 + Math.random() * 26;
      const theta = Math.random() * Math.PI * 2;
      const y = -2 + Math.random() * 18;
      this.shardData.push({ radius, theta, y, speed: .03 + Math.random() * .12, scale: .38 + Math.random() * 1.35 });
      temp.position.set(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
      temp.scale.setScalar(this.shardData[i].scale);
      temp.updateMatrix();
      this.shards.setMatrixAt(i, temp.matrix);
      this.shards.setColorAt(i, new THREE.Color(i % 7 === 0 ? 0xff3158 : i % 11 === 0 ? 0x7ce8ff : 0x98acd3));
    }
    this.shards.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.world.add(this.shards);
  }

  addTrafficStreams() {
    this.streams = new THREE.Group();
    const materialA = new THREE.MeshBasicMaterial({ color: 0xff1748, transparent: true, opacity: .72 });
    const materialB = new THREE.MeshBasicMaterial({ color: 0x40bfff, transparent: true, opacity: .45 });
    for (let i = 0; i < 24; i++) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(.035, .035, 3 + Math.random() * 5), i % 3 ? materialA : materialB);
      beam.position.set(-24 + Math.random() * 48, -3.7 + Math.random() * .4, -20 + Math.random() * 40);
      beam.rotation.y = i % 2 ? 0 : Math.PI / 2;
      beam.userData.speed = .6 + Math.random() * 1.8;
      beam.userData.axis = i % 2 ? 'z' : 'x';
      this.streams.add(beam);
    }
    this.world.add(this.streams);
  }

  loadCity() {
    this.canvas.dataset.modelStatus = 'loading';
    const loader = new GLTFLoader();
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('/draco/');
    this.dracoLoader.setDecoderConfig({ type: 'wasm' });
    loader.setDRACOLoader(this.dracoLoader);
    loader.load('/models/LittlestTokyo.glb', gltf => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const fit = 18 / Math.max(size.x, size.z);
      model.scale.setScalar(fit);
      model.position.sub(center.multiplyScalar(fit));
      model.position.y -= 2.2;
      model.rotation.y = -.35;
      model.traverse(child => {
        if (!child.isMesh) return;
        child.castShadow = false;
        child.receiveShadow = false;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(material => {
          if (!material) return;
          material.roughness = Math.min(material.roughness ?? .65, .68);
          material.metalness = Math.max(material.metalness ?? 0, .08);
          if ('emissive' in material) {
            material.emissive = material.color?.clone()?.multiplyScalar(.18) ?? new THREE.Color(0x110006);
            material.emissiveIntensity = .65;
          }
        });
      });
      this.cityRoot.add(model);
      this.canvas.dataset.modelStatus = 'loaded';
      if (gltf.animations.length) {
        const mixer = new THREE.AnimationMixer(model);
        gltf.animations.forEach(clip => mixer.clipAction(clip).play());
        this.mixers.push(mixer);
      }
      window.dispatchEvent(new CustomEvent('civic-world-ready'));
    }, undefined, error => {
      this.canvas.dataset.modelStatus = 'error';
      console.error('City model failed to load', error);
      window.dispatchEvent(new CustomEvent('civic-world-ready'));
    });
  }

  setPhase(phase) {
    if (this.phaseTargets[phase]) this.scenePhase = phase;
  }

  pulse(color = '#ff3158') {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1, 1.06, 64),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .9, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set((Math.random() - .5) * 8, -3.6, (Math.random() - .5) * 8);
    ring.userData.life = 0;
    this.world.add(ring);
    this.pulses.push(ring);
  }

  update(delta, elapsed) {
    const pointerEase = 1 - Math.exp(-4.8 * delta);
    const scrollEase = 1 - Math.exp(-3.6 * delta);
    const cameraEase = 1 - Math.exp(-3.2 * delta);
    const rotationEase = 1 - Math.exp(-2.5 * delta);
    this.smoothPointer.lerp(this.pointer, pointerEase);
    this.scroll += (this.targetScroll - this.scroll) * scrollEase;
    const phase = this.phaseTargets[this.scenePhase];
    const parallaxX = this.smoothPointer.x * (innerWidth < 760 ? .45 : 1.8);
    const parallaxY = this.smoothPointer.y * (innerWidth < 760 ? .25 : .8);
    this.camera.position.x += (phase.x + parallaxX - this.camera.position.x) * cameraEase;
    this.camera.position.y += (phase.y + parallaxY - this.camera.position.y) * cameraEase;
    this.camera.position.z += (phase.z - this.camera.position.z) * cameraEase;
    this.cameraLookY += (phase.lookY - this.cameraLookY) * cameraEase;
    this.camera.lookAt(0, this.cameraLookY, 0);
    this.world.rotation.y += (phase.spin + this.scroll * .24 + this.smoothPointer.x * .045 - this.world.rotation.y) * rotationEase;
    this.world.rotation.x += (this.smoothPointer.y * .014 - this.world.rotation.x) * rotationEase;
    this.cityRoot.rotation.y = Math.sin(elapsed * .07) * .04;
    this.monoliths.children.forEach((mesh, index) => {
      mesh.position.y = mesh.userData.baseY + Math.sin(elapsed * .55 + mesh.userData.phase) * .18;
      mesh.material.emissiveIntensity = .1 + (Math.sin(elapsed * .8 + index) + 1) * .09;
    });
    this.orbits.children.forEach(line => line.rotation.z += line.userData.speed * delta);
    const temp = this.shardDummy;
    this.shardData.forEach((item, index) => {
      item.theta += item.speed * delta;
      temp.position.set(Math.cos(item.theta) * item.radius, item.y + Math.sin(elapsed * item.speed * 5 + index) * .4, Math.sin(item.theta) * item.radius);
      temp.rotation.set(item.theta, item.theta * .5, 0);
      temp.scale.setScalar(item.scale);
      temp.updateMatrix();
      this.shards.setMatrixAt(index, temp.matrix);
    });
    this.shards.instanceMatrix.needsUpdate = true;
    this.streams.children.forEach(beam => {
      beam.position[beam.userData.axis] += beam.userData.speed * delta;
      if (beam.position[beam.userData.axis] > 24) beam.position[beam.userData.axis] = -24;
    });
    this.pulses = this.pulses.filter(ring => {
      ring.userData.life += delta;
      ring.scale.setScalar(1 + ring.userData.life * 9);
      ring.material.opacity = 1 - ring.userData.life / 2;
      if (ring.userData.life > 2) { this.world.remove(ring); ring.geometry.dispose(); ring.material.dispose(); return false; }
      return true;
    });
    this.mixers.forEach(mixer => mixer.update(delta));
    this.skyUniforms.uTime.value = elapsed;
    this.groundUniforms.uTime.value = elapsed;
  }

  animate = (time = 0) => {
    if (this.disposed) return;
    requestAnimationFrame(this.animate);
    if (document.hidden) return;
    const targetFps = this.reducedMotion ? 18 : innerWidth < 760 ? 30 : 60;
    const minInterval = 1000 / targetFps;
    if (time - this.lastFrame < minInterval - 1) return;
    this.lastFrame = time;
    const delta = Math.min(this.clock.getDelta(), .05);
    const elapsed = this.clock.elapsedTime;
    this.update(delta, elapsed);
    this.composer.render();
  };

  resize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 760 ? 1 : 1.18));
    this.renderer.setSize(innerWidth, innerHeight);
    this.composer.setSize(innerWidth, innerHeight);
    this.bloom.strength = innerWidth < 760 ? .48 : .72;
  }
}
