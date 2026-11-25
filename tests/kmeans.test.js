import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createExperiment, samplePoints, stepExperiment } from '../assets/kmeans.js';

test('sample clustering converges, preserves input, and never increases error', () => {
  const points = samplePoints();
  const input = structuredClone(points);
  let state = createExperiment(points, 3);
  let previous = Infinity;
  for (let i = 0; i < 100 && !state.converged; i++) {
    state = stepExperiment(state);
    assert.ok(state.error <= previous + 1e-10);
    previous = state.error;
  }
  assert.ok(state.converged);
  assert.deepEqual(points, input);
  assert.deepEqual(state.centroids.map((_, i) => state.assignments.filter((a) => a === i).length).sort(), [20, 20, 20]);
  assert.equal(stepExperiment(state), state);
  const reset = createExperiment(samplePoints(), 3);
  assert.equal(reset.iteration, 0);
  assert.equal(reset.error, null);
});

test('empty clusters are recovered with finite centers, including repeated points', () => {
  const initial = createExperiment([{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: .5, y: .5 }, { x: 1, y: 1 }], 3);
  const next = stepExperiment({ ...initial, centroids: initial.centroids.map(() => ({ x: 0, y: 0 })) });
  assert.deepEqual(new Set(next.assignments), new Set([0, 1, 2]));
  assert.ok(next.centroids.every((c) => Number.isFinite(c.x) && Number.isFinite(c.y)));
  assert.ok(Number.isFinite(next.error));
});

test('invalid cluster counts, insufficient distinct points, and nonfinite coordinates fail clearly', () => {
  assert.throws(() => createExperiment([], 3), /distinct points/);
  assert.throws(() => createExperiment([{ x: 0, y: 0 }, { x: 0, y: 0 }], 2), /distinct points/);
  assert.throws(() => createExperiment(samplePoints(), 1), /between 2 and 4/);
  assert.throws(() => createExperiment([{ x: NaN, y: .4 }], 2), /finite/);
  assert.throws(() => createExperiment([{ x: 2, y: .4 }], 2), /between 0 and 1/);
});
