const distance = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

export function samplePoints() {
  let seed = 42;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  return [[.25, .33], [.73, .3], [.52, .75]].flatMap(([x, y]) =>
    Array.from({ length: 20 }, () => ({
      x: x + (random() + random() - 1) * .2,
      y: y + (random() + random() - 1) * .2,
    })));
}

export function createExperiment(points, k) {
  if (!Number.isInteger(k) || k < 2 || k > 4) throw new Error('Choose between 2 and 4 clusters.');
  if (!Array.isArray(points) || points.some((p) => !p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1)) {
    throw new Error('Points must have finite x/y coordinates between 0 and 1.');
  }
  if (new Set(points.map((p) => `${p.x},${p.y}`)).size < k) throw new Error(`At least ${k} distinct points are needed.`);
  const centroids = [{ ...points[0] }];
  while (centroids.length < k) {
    const farthest = points.reduce((best, point) =>
      Math.min(...centroids.map((c) => distance(c, point))) >
      Math.min(...centroids.map((c) => distance(c, best))) ? point : best);
    centroids.push({ ...farthest });
  }
  return { points: points.map((p) => ({ ...p })), centroids, assignments: points.map(() => -1), iteration: 0, error: null, converged: false };
}

export function stepExperiment(state) {
  if (state.converged) return state;
  const { points, centroids } = state;
  const assignments = points.map((p) => centroids.reduce((best, c, i) => distance(p, c) < distance(p, centroids[best]) ? i : best, 0));
  const counts = centroids.map((_, i) => assignments.filter((a) => a === i).length);
  for (let empty = 0; empty < counts.length; empty++) {
    if (counts[empty] !== 0) continue;
    let donor = -1;
    for (let i = 0; i < points.length; i++) {
      if (counts[assignments[i]] > 1 && (donor === -1 ||
          distance(points[i], centroids[assignments[i]]) > distance(points[donor], centroids[assignments[donor]]))) donor = i;
    }
    if (donor === -1) throw new Error('Cannot recover an empty cluster. Reset the experiment.');
    counts[assignments[donor]]--;
    assignments[donor] = empty;
    counts[empty]++;
  }
  const next = centroids.map((_, cluster) => {
    const members = points.filter((__, i) => assignments[i] === cluster);
    return { x: members.reduce((sum, p) => sum + p.x, 0) / members.length, y: members.reduce((sum, p) => sum + p.y, 0) / members.length };
  });
  return {
    ...state, centroids: next, assignments, iteration: state.iteration + 1,
    error: points.reduce((sum, p, i) => sum + distance(p, next[assignments[i]]), 0),
    converged: assignments.every((a, i) => a === state.assignments[i]) && next.every((c, i) => distance(c, centroids[i]) < 1e-12),
  };
}
