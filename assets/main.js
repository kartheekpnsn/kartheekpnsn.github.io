import { createExperiment, samplePoints, stepExperiment } from './kmeans.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const motion = document.querySelector('#motion-toggle');
let paused = reduced.matches;
motion.hidden = false;
function updateMotion() {
  document.body.classList.toggle('motion-paused', paused || reduced.matches);
  motion.textContent = reduced.matches ? 'Reduced motion' : paused ? 'Resume motion' : 'Pause motion';
  motion.disabled = reduced.matches;
  motion.setAttribute('aria-pressed', String(paused || reduced.matches));
  document.dispatchEvent(new CustomEvent('portfolio-motion', { detail: { paused: paused || reduced.matches } }));
}
motion.addEventListener('click', () => { paused = !paused; updateMotion(); });
reduced.addEventListener('change', () => { paused = reduced.matches; updateMotion(); });
updateMotion();

const descriptions = [
  'Start with source material. Our synthetic notebook says: “The observatory opens after sunset.” No personal documents are used.',
  'Split source material into small, traceable passages. Keep the sentence about opening hours together with its source.',
  'Represent passages as numerical vectors so related meanings sit near each other. These are illustrated here, not calculated by an embedding API.',
  'For “When can I visit?”, find passages about visiting hours. A real system can combine keyword and vector search, then re-rank results.',
  'Place relevant passages and their source references beside the question. Good context gives a model evidence, rather than a reason to guess.',
  'An illustrative grounded answer: “After sunset, according to the observatory notebook.” A production system should cite its evidence and acknowledge uncertainty.',
];
const stageButtons = [...document.querySelectorAll('[data-stage]')];
for (const button of stageButtons) {
  button.addEventListener('click', () => {
    stageButtons.forEach((stage) => stage.setAttribute('aria-pressed', String(stage === button)));
    const index = Number(button.dataset.stage);
    document.querySelector('#stage-label').textContent = `${String(index + 1).padStart(2, '0')} / ${['DOCUMENTS', 'CHUNKS', 'EMBEDDINGS', 'RETRIEVAL', 'CONTEXT', 'RESPONSE'][index]}`;
    document.querySelector('#stage-description').textContent = descriptions[index];
  });
}

const canvas = document.querySelector('#cluster-plot');
const context = canvas.getContext('2d');
const status = document.querySelector('#cluster-status');
const controls = document.querySelector('#cluster-controls');
const run = document.querySelector('#cluster-run');
const count = document.querySelector('#cluster-count');
const palette = ['#78e3d2', '#e6b575', '#b6a2ee', '#86b9ed'];
let state = createExperiment(samplePoints(), Number(count.value));
let timer = null;
let offscreen = false;

function stop() {
  clearInterval(timer);
  timer = null;
  run.textContent = 'Run experiment ▶';
}
function draw() {
  if (!context) return;
  const w = 720, h = 340, pad = 24;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = w * ratio; canvas.height = h * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, w, h);
  context.strokeStyle = '#203039'; context.lineWidth = .6;
  for (let i = 0; i <= 10; i++) {
    const x = pad + (w - pad * 2) * i / 10;
    const y = pad + (h - pad * 2) * i / 10;
    context.beginPath(); context.moveTo(x, pad); context.lineTo(x, h - pad); context.stroke();
    context.beginPath(); context.moveTo(pad, y); context.lineTo(w - pad, y); context.stroke();
  }
  const px = (p) => pad + p.x * (w - pad * 2);
  const py = (p) => pad + (1 - p.y) * (h - pad * 2);
  state.points.forEach((p, i) => {
    const cluster = state.assignments[i];
    if (cluster >= 0) {
      context.strokeStyle = `${palette[cluster]}25`;
      context.beginPath(); context.moveTo(px(p), py(p)); context.lineTo(px(state.centroids[cluster]), py(state.centroids[cluster])); context.stroke();
    }
    context.fillStyle = cluster >= 0 ? palette[cluster] : '#a9bdc5';
    context.beginPath(); context.arc(px(p), py(p), 3.8, 0, Math.PI * 2); context.fill();
  });
  state.centroids.forEach((c, i) => {
    context.strokeStyle = palette[i]; context.lineWidth = 2;
    const x = px(c), y = py(c);
    context.beginPath(); context.arc(x, y, 10, 0, Math.PI * 2); context.stroke();
    context.beginPath(); context.moveTo(x - 15, y); context.lineTo(x + 15, y); context.moveTo(x, y - 15); context.lineTo(x, y + 15); context.stroke();
  });
}
function report(prefix = '') {
  const result = state.error === null ? 'Ready to find a pattern.' : `Within-cluster error: ${state.error.toFixed(4)}. ${state.converged ? 'Converged. Add a point or reset to explore again.' : 'Assign points, then move each centroid to its group average.'}`;
  status.textContent = `${prefix}${state.points.length} points · Iteration ${state.iteration} · ${result}`;
  const groups = state.centroids.map((_, i) => state.assignments.filter((a) => a === i).length);
  canvas.setAttribute('aria-label', `Clustering plot with ${state.points.length} points and ${state.centroids.length} centroids. ${state.iteration ? `Cluster sizes: ${groups.join(', ')}.` : 'Points are not assigned yet.'} ${state.converged ? 'Converged.' : ''}`);
}
function step() {
  if (state.iteration >= 100) {
    stop(); report('Iteration limit reached; reset to start again. '); return;
  }
  state = stepExperiment(state);
  draw(); report();
  if (state.converged) stop();
}
function reset(points = samplePoints()) {
  stop();
  try {
    state = createExperiment(points, Number(count.value));
    draw(); report();
  } catch (error) {
    console.error('Clustering input error:', error);
    status.textContent = error.message;
  }
}
function addPoint(point) {
  if (state.points.length >= 200) { stop(); status.textContent = 'The experiment is limited to 200 points. Reset to begin again.'; return; }
  reset([...state.points, point]);
}
if (context) {
  controls.disabled = false;
  draw(); report();
  run.addEventListener('click', () => {
    if (timer) { stop(); report('Paused. '); return; }
    if (state.converged) { report('Already converged. '); return; }
    if (reduced.matches) { step(); return; }
    step();
    if (!state.converged && state.iteration < 100) {
      timer = setInterval(step, 650);
      run.textContent = 'Pause experiment Ⅱ';
    }
  });
  document.querySelector('#cluster-step').addEventListener('click', () => { stop(); step(); });
  document.querySelector('#cluster-reset').addEventListener('click', () => reset());
  document.querySelector('#cluster-add').addEventListener('click', () => {
    const n = state.points.length + 1;
    addPoint({ x: .08 + ((n * .61803398875) % 1) * .84, y: .08 + ((n * .41421356237) % 1) * .84 });
  });
  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    addPoint({
      x: Math.max(0, Math.min(1, (event.clientX - rect.left - 24 * rect.width / 720) / (rect.width * 672 / 720))),
      y: Math.max(0, Math.min(1, 1 - (event.clientY - rect.top - 24 * rect.height / 340) / (rect.height * 292 / 340))),
    });
  });
  count.addEventListener('change', () => reset(state.points));
  reduced.addEventListener('change', () => { stop(); report(reduced.matches ? 'Reduced motion: use Step or Run for a single iteration. ' : ''); });
  if (reduced.matches) report('Reduced motion: use Step or Run for a single iteration. ');
  document.addEventListener('visibilitychange', () => { if (document.hidden && timer) { stop(); report('Paused while the tab is hidden. '); } });
  new IntersectionObserver(([entry]) => {
    offscreen = !entry.isIntersecting;
    if (offscreen && timer) { stop(); report('Paused while the experiment is offscreen. '); }
  }).observe(canvas);
} else {
  console.error('A 2D canvas context is unavailable.');
  status.textContent = 'This browser cannot render the plot. The experiment requires a 2D canvas; the rest of the portfolio is available.';
}

let sceneStarted = false;
async function loadScene() {
  if (sceneStarted || reduced.matches) return;
  sceneStarted = true;
  try {
    const { mountWorkbench } = await import('./workbench.js');
    mountWorkbench(document.querySelector('#scene'), { paused });
  } catch (error) {
    console.error('Workbench rendering unavailable:', error);
    document.querySelector('#scene-status').textContent = 'STATIC VIEW / 3D UNAVAILABLE';
    document.querySelector('#hero-machine').classList.remove('scene-ready');
  }
}
if (reduced.matches) document.querySelector('#scene-status').textContent = 'STATIC VIEW / REDUCED MOTION';
reduced.addEventListener('change', loadScene);
if ('requestIdleCallback' in window) requestIdleCallback(loadScene, { timeout: 1500 });
else setTimeout(loadScene, 100);
