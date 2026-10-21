const PARALYSED = 0.6;

/**
 * A web of nerve nodes linked to their nearest neighbours, with signal pulses
 * travelling along the links. Nodes exposed to poison become paralysed: they stop
 * relaying signals until they slowly recover.
 */
export class NeuralNetwork {
  potency = 0.05;
  recovery = 0.04;
  pulseSpeed = 3;

  constructor({ count, min, max, neighbors = 3, pulses = 260 }) {
    this.count = count;
    this.nodes = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      for (let axis = 0; axis < 3; axis++) {
        this.nodes[i * 3 + axis] = min[axis] + Math.random() * (max[axis] - min[axis]);
      }
    }
    this.paralysis = new Float32Array(count);
    this.flash = new Float32Array(count);
    this.#linkNeighbors(neighbors);
    this.#createPulses(pulses);
  }

  get paralysedShare() {
    let sum = 0;
    for (let i = 0; i < this.count; i++) sum += this.paralysis[i];
    return sum / this.count;
  }

  /** @param exposure (x, y, z) => amount of poison at that point */
  update(dt, exposure) {
    const { nodes, paralysis, flash } = this;
    for (let i = 0; i < this.count; i++) {
      const k = i * 3;
      const dose = exposure(nodes[k], nodes[k + 1], nodes[k + 2]);
      const value = paralysis[i] + (dose * this.potency - this.recovery) * dt;
      paralysis[i] = Math.min(1, Math.max(0, value));
      flash[i] = Math.max(0, flash[i] - dt * 3);
    }
    this.#updatePulses(dt);
  }

  /** Instantly paralyses nodes inside a sphere (a direct cut). */
  paralyseSphere(center, radius, amount = 1) {
    for (let i = 0; i < this.count; i++) {
      const k = i * 3;
      const dx = this.nodes[k] - center.x;
      const dy = this.nodes[k + 1] - center.y;
      const dz = this.nodes[k + 2] - center.z;
      const falloff = 1 - Math.sqrt(dx * dx + dy * dy + dz * dz) / radius;
      if (falloff > 0) this.paralysis[i] = Math.min(1, this.paralysis[i] + amount * falloff);
    }
  }

  heal() {
    this.paralysis.fill(0);
  }

  #linkNeighbors(neighbors) {
    const { count, nodes } = this;
    const links = new Set();
    const edges = [];
    const distanceSq = (a, b) => {
      const dx = nodes[a * 3] - nodes[b * 3];
      const dy = nodes[a * 3 + 1] - nodes[b * 3 + 1];
      const dz = nodes[a * 3 + 2] - nodes[b * 3 + 2];
      return dx * dx + dy * dy + dz * dz;
    };

    for (let a = 0; a < count; a++) {
      const nearest = [];
      for (let b = 0; b < count; b++) {
        if (b !== a) nearest.push([distanceSq(a, b), b]);
      }
      nearest.sort((x, y) => x[0] - y[0]);
      for (const [, b] of nearest.slice(0, neighbors)) {
        const key = a < b ? a * count + b : b * count + a;
        if (links.has(key)) continue;
        links.add(key);
        edges.push(a, b);
      }
    }

    this.edges = Uint32Array.from(edges);
    this.edgeCount = edges.length / 2;
    this.edgeLength = Float32Array.from({ length: this.edgeCount }, (_, e) =>
      Math.sqrt(distanceSq(this.edges[e * 2], this.edges[e * 2 + 1])),
    );
    this.adjacency = Array.from({ length: count }, () => []);
    for (let e = 0; e < this.edgeCount; e++) {
      this.adjacency[this.edges[e * 2]].push(e);
      this.adjacency[this.edges[e * 2 + 1]].push(e);
    }
  }

  #createPulses(count) {
    this.pulseCount = count;
    this.pulseEdge = new Uint32Array(count);
    this.pulseFrom = new Uint32Array(count);
    this.pulseT = new Float32Array(count);
    this.pulseSpeedFactor = Float32Array.from({ length: count }, () => 0.6 + Math.random() * 0.8);
    this.pulsePositions = new Float32Array(count * 3);
    this.pulseIntensity = new Float32Array(count);
    for (let p = 0; p < count; p++) this.#respawnPulse(p, true);
  }

  #respawnPulse(p, anywhere = false) {
    for (let attempt = 0; attempt < 12; attempt++) {
      const node = Math.floor(Math.random() * this.count);
      if (!anywhere && this.paralysis[node] > 0.3) continue;
      const options = this.adjacency[node];
      if (!options.length) continue;
      this.pulseEdge[p] = options[Math.floor(Math.random() * options.length)];
      this.pulseFrom[p] = node;
      this.pulseT[p] = anywhere ? Math.random() : 0;
      return;
    }
    this.pulseT[p] = 0;
  }

  #updatePulses(dt) {
    const { edges, nodes, paralysis } = this;
    for (let p = 0; p < this.pulseCount; p++) {
      let e = this.pulseEdge[p];
      let from = this.pulseFrom[p];
      let to = edges[e * 2] === from ? edges[e * 2 + 1] : edges[e * 2];

      this.pulseT[p] += (this.pulseSpeed * this.pulseSpeedFactor[p] * dt) / this.edgeLength[e];
      if (this.pulseT[p] >= 1) {
        if (paralysis[to] > PARALYSED) {
          // The signal is blocked: it dies here and a new one starts elsewhere.
          this.#respawnPulse(p);
        } else {
          this.flash[to] = 1;
          const options = this.adjacency[to];
          const next = options[Math.floor(Math.random() * options.length)];
          this.pulseEdge[p] = next;
          this.pulseFrom[p] = to;
          this.pulseT[p] = 0;
        }
        e = this.pulseEdge[p];
        from = this.pulseFrom[p];
        to = edges[e * 2] === from ? edges[e * 2 + 1] : edges[e * 2];
      }

      const t = this.pulseT[p];
      const a = from * 3;
      const b = to * 3;
      const k = p * 3;
      this.pulsePositions[k] = nodes[a] + (nodes[b] - nodes[a]) * t;
      this.pulsePositions[k + 1] = nodes[a + 1] + (nodes[b + 1] - nodes[a + 1]) * t;
      this.pulsePositions[k + 2] = nodes[a + 2] + (nodes[b + 2] - nodes[a + 2]) * t;
      this.pulseIntensity[p] = 1 - Math.max(paralysis[from], paralysis[to]);
    }
  }
}
