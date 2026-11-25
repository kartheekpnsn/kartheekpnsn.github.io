import * as THREE from 'three';
import { samplePoints } from './kmeans.js';

export function mountWorkbench(container, options) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-6, 6, 5, -5, .1, 100);
  camera.position.set(9, 8, 11); camera.lookAt(0, .6, 0);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x0b1014, 0);
  container.append(renderer.domElement);
  const world = new THREE.Group();
  scene.add(world);
  scene.add(new THREE.AmbientLight(0xb8dfdd, 2.2));
  const key = new THREE.DirectionalLight(0xd8fff5, 3);
  key.position.set(-4, 8, 5); scene.add(key);
  const amberLight = new THREE.PointLight(0xffbd66, 26, 14);
  amberLight.position.set(3, 3, 0); scene.add(amberLight);
  const cyan = 0x78e3d2, amber = 0xe6b575;
  const material = (color, opacity = 1) => new THREE.MeshStandardMaterial({ color, metalness: .35, roughness: .5, transparent: opacity < 1, opacity });
  const solid = (geometry, mat, position, parent = world) => {
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(...position); parent.add(mesh); return mesh;
  };
  const line = (points, color, opacity = 1, parent = world) => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(...p)));
    const object = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
    parent.add(object); return object;
  };
  const plate = solid(new THREE.BoxGeometry(7.5, .2, 5), material(0x14252c), [0, -.55, 0]);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(plate.geometry), new THREE.LineBasicMaterial({ color: cyan, transparent: true, opacity: .35 }));
  edges.position.copy(plate.position); world.add(edges);
  const grid = new THREE.GridHelper(7, 28, 0x32625e, 0x203c41);
  grid.position.y = -.44; grid.scale.z = .66; world.add(grid);
  for (const x of [-3.15, 3.15]) for (const z of [-1.9, 1.9]) {
    solid(new THREE.CylinderGeometry(.13, .1, .7, 16), material(0x243b43), [x, -.98, z]);
    solid(new THREE.CylinderGeometry(.15, .15, .03, 16), material(amber), [x, -.65, z]);
  }
  const ringGroup = new THREE.Group();
  ringGroup.position.set(-1.5, -.28, .4); world.add(ringGroup);
  for (const [radius, opacity] of [[1.65, .4], [1.4, .14], [1.15, .25]]) {
    const ring = solid(new THREE.TorusGeometry(radius, .009, 6, 90), new THREE.MeshBasicMaterial({ color: cyan, transparent: true, opacity }), [0, 0, 0], ringGroup);
    ring.rotation.x = Math.PI / 2;
  }
  const observationGeometry = new THREE.SphereGeometry(.035, 8, 6);
  const observations = samplePoints();
  const colors = [cyan, amber, 0xb6a2ee];
  observations.forEach((p, i) => {
    const group = Math.floor(i / 20);
    const height = .15 + (Math.sin(i * 19.3) + 1) * .5;
    const point = [p.x * 2.7 - 2.85, height, p.y * 2.7 - 1.2];
    solid(observationGeometry, new THREE.MeshBasicMaterial({ color: colors[group] }), point);
    if (i % 3 === 0) line([[point[0], -.4, point[2]], point], colors[group], .17);
  });
  const chart = new THREE.Group();
  chart.position.set(.9, 1, -1.4); chart.rotation.y = -.15; world.add(chart);
  const glass = solid(new THREE.PlaneGeometry(2.6, 2.25), new THREE.MeshBasicMaterial({ color: cyan, transparent: true, opacity: .035, side: THREE.DoubleSide, depthWrite: false }), [0, 0, 0], chart);
  const frame = new THREE.LineSegments(new THREE.EdgesGeometry(glass.geometry), new THREE.LineBasicMaterial({ color: cyan, transparent: true, opacity: .35 }));
  chart.add(frame);
  for (let i = 0; i < 5; i++) line([[-1.2, -.9 + i * .43, .01], [1.2, -.9 + i * .43, .01]], cyan, .1, chart);
  const curve = Array.from({ length: 25 }, (_, i) => {
    const x = i / 24;
    return [x * 2.2 - 1.1, Math.sin(x * 5 - 1) * .5 + x * .6 - .3, .04];
  });
  line(curve, amber, 1, chart);
  const scanner = line([[-1.1, -1, .03], [-1.1, 1, .03]], cyan, .25, chart);
  const network = new THREE.Group(); network.position.set(2.5, .2, 1); world.add(network);
  const layers = [[[-.4, .2, 0], [-.4, .8, 0]], [[.2, .05, -.15], [.2, .65, -.15], [.2, 1.25, -.15]], [[.9, .4, -.3], [.9, 1, -.3]]];
  for (let l = 0; l < layers.length - 1; l++) for (const a of layers[l]) for (const b of layers[l + 1]) line([a, b], cyan, .22, network);
  layers.flat().forEach((p, i) => solid(new THREE.IcosahedronGeometry(.075, 0), new THREE.MeshBasicMaterial({ color: i % 2 ? amber : cyan, wireframe: true }), p, network));
  const routes = [
    [[-.3, -.41, .5], [.5, -.41, .5], [.5, -.41, 1.6], [2.4, -.41, 1.6]],
    [[-1.6, -.41, -1.2], [-1.6, -.41, -1.8], [.8, -.41, -1.8]],
    [[1.8, -.41, -1.8], [2.7, -.41, -1.8], [2.7, -.41, .4]],
  ];
  const packets = routes.map((route, i) => {
    line(route, i % 2 ? amber : cyan, .45);
    return { path: new THREE.CatmullRomCurve3(route.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', .01), mesh: solid(new THREE.SphereGeometry(.045, 8, 6), new THREE.MeshBasicMaterial({ color: i % 2 ? amber : cyan }), route[0]) };
  });
  let visible = true, paused = options.paused, frameId = null, lost = false;
  let pointerX = 0, pointerY = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function resize() {
    const { width, height } = container.getBoundingClientRect();
    const aspect = width / Math.max(height, 1);
    const extent = 4.25;
    camera.left = -extent * aspect; camera.right = extent * aspect;
    camera.top = extent; camera.bottom = -extent; camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    if (!lost) renderer.render(scene, camera);
  }
  function render(time = 0) {
    frameId = null;
    if (lost) return;
    if (!paused && !reduced.matches) {
      world.rotation.y = Math.sin(time * .00012) * .06 + pointerX * .08;
      world.rotation.x = pointerY * .025;
      world.position.y = Math.sin(time * .0006) * .06 - Math.min(scrollY / 2000, .2);
      scanner.position.x = ((time * .00025) % 1) * 2.2;
      packets.forEach(({ mesh, path }, i) => mesh.position.copy(path.getPoint((time * .00012 + i / 3) % 1)));
    }
    renderer.render(scene, camera);
    if (visible && !document.hidden && !paused && !reduced.matches) frameId = requestAnimationFrame(render);
  }
  function sync() {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    if (visible && !document.hidden) render(performance.now());
  }
  container.addEventListener('pointermove', (event) => {
    const rect = container.getBoundingClientRect();
    pointerX = (event.clientX - rect.left) / rect.width - .5;
    pointerY = (event.clientY - rect.top) / rect.height - .5;
  });
  container.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; });
  document.addEventListener('portfolio-motion', (event) => { paused = event.detail.paused; sync(); });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(container);
  new ResizeObserver(resize).observe(container);
  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault(); lost = true;
    if (frameId !== null) cancelAnimationFrame(frameId);
    container.closest('.hero-machine').classList.remove('scene-ready');
    container.hidden = true;
    document.querySelector('#scene-status').textContent = 'STATIC VIEW / 3D CONTEXT LOST';
    console.error('The WebGL context was lost. Showing the static workbench.');
    renderer.dispose();
  });
  resize(); render();
  container.closest('.hero-machine').classList.add('scene-ready');
  document.querySelector('#scene-status').textContent = 'OBSERVATIONS → PATTERNS → POSSIBILITIES';
}
