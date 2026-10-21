/**
 * Shapes a voxel sculpture can be restructured into. Each `contains(x, y, z)` tests a point
 * in normalised space [-1, 1]³.
 */
export const VOXEL_FORMS = [
  { name: 'Sphere', contains: (x, y, z) => x * x + y * y + z * z <= 1 },
  {
    name: 'Ring',
    contains: (x, y, z) => {
      const q = Math.hypot(x, y) - 0.7;
      return q * q + z * z <= 0.26 * 0.26;
    },
  },
  {
    // Benihime's crimson camellia ornament: five rounded petals.
    name: 'Camellia',
    contains: (x, y, z) => {
      const r = Math.hypot(x, y);
      const petals = 0.32 + 0.66 * Math.abs(Math.cos(2.5 * Math.atan2(y, x)));
      return r <= petals && Math.abs(z) <= 0.24 * (1 - r * 0.55);
    },
  },
  {
    name: 'Helix',
    contains: (x, y, z) => {
      for (const strand of [0, Math.PI]) {
        const angle = y * Math.PI * 1.4 + strand;
        const dx = x - 0.5 * Math.cos(angle);
        const dz = z - 0.5 * Math.sin(angle);
        if (dx * dx + dz * dz <= 0.2 * 0.2) return true;
      }
      return false;
    },
  },
  {
    name: 'Cube frame',
    contains: (x, y, z) => {
      const outer = Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) <= 0.78;
      const onEdges = [x, y, z].filter((c) => Math.abs(c) >= 0.58).length >= 2;
      return outer && onEdges;
    },
  },
];

function latticePoints(form, spacing) {
  const points = [];
  for (let x = -1; x <= 1; x += spacing) {
    for (let y = -1; y <= 1; y += spacing) {
      for (let z = -1; z <= 1; z += spacing) {
        if (form.contains(x, y, z)) points.push(x, y, z);
      }
    }
  }
  return points;
}

/**
 * Fills a form with `count` voxels on a regular lattice (the densest spacing that still
 * yields at least `count` cells, then a random subset). Points are sorted bottom-to-top
 * so morphs between forms stay coherent.
 * @returns {{ points: Float32Array, spacing: number }} normalised coordinates
 */
export function sampleForm(form, count) {
  let low = 0.02;
  let high = 1;
  for (let i = 0; i < 14; i++) {
    const mid = (low + high) / 2;
    if (latticePoints(form, mid).length >= count) low = mid;
    else high = mid;
  }
  const lattice = latticePoints(form, low);
  const cells = [];
  for (let i = 0; i < lattice.length; i += 3) cells.push([lattice[i], lattice[i + 1], lattice[i + 2]]);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  const chosen = cells.slice(0, count).sort((a, b) => a[1] - b[1]);
  while (chosen.length < count) chosen.push(chosen[chosen.length % Math.max(1, chosen.length)] ?? [0, 0, 0]);
  return { points: Float32Array.from(chosen.flat()), spacing: low };
}
