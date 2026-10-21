# Zanpakutō — WebGL release visualizer

Minimalist 3D visualizations of Bleach shikai and bankai, built with Three.js (WebGL) and Vite.

```bash
npm install
npm run dev
```

## Senbonzakura

- **Shikai — "Chire, Senbonzakura"**: the katana's blade scatters tip-first into a ribbon of petals that streams after the cursor. Click to burst.
- **Bankai — "Senbonzakura Kageyoshi"**: two rows of giant blades rise from the ground and scatter into a petal storm that orbits the cursor. Hold to gather, release to blast.

## Ashisogi Jizō

- **Shikai — "Kakimushire, Ashisogi Jizō"**: a golden trident with Jizō's haloed face aims at the cursor and jets poison gas. A nerve web fills the space; nerves inside the gas are paralysed and stop carrying signals, then slowly recover. Click to lunge and strike.
- **Bankai — "Konjiki Ashisogi Jizō"**: the giant golden larva bursts from the ground and slithers after the cursor on blade legs. Hold to breathe a poison cloud; its formula slowly mutates colour.

Pick a zanpakutō from the title in the top-left (or press `Z`). Scroll moves the cursor's 3D target nearer or farther. Shortcuts: `1`/`2` switch release, `Z` next zanpakutō, `Space` replay, `H` hide UI, `C` config panel.

## Structure

```
src/
  app/            App wiring + global scene settings
  engine/         Stage (renderer/scene/fog), CameraRig, Pointer (mouse → 3D), Loop
  sim/            CPU simulations: particle swarm + lifecycle, density grid,
                  nerve network, segment chain (snake bodies)
    forces/       Seek, Swirl, Flow (turbulence), Bounds, Constant — composable per release
    targets/      Where particles want to go: Trail (ribbon), Orbit (storm), Anchor (reform)
  render/
    petals/       Instanced petal geometry, shaders, mesh
    blades/       Blade profile/geometry, dissolve shader, Katana, BladeRows, Trident
    creatures/    Jizō head, Konjiki creature
    gas/          Point-sprite poison gas
    neural/       Nerve web lines, nodes and pulses
    environment/  Fog-blended floor with soft shadow
  effects/        Simulation + rendering glue: PetalStorm, PoisonCloud, NeuralWeb
  zanpakuto/
    Release.js    Base class for any release
    registry.js   List of zanpakutō
    senbonzakura/ Descriptor, shikai, bankai, param schemas
    ashisogiJizo/ Descriptor, shikai, bankai, ToxicField, param schemas
  ui/             HUD, release switch, banner, schema-driven control panel
  utils/          Math, Sequence (timelines), ParamSource (tweakable params), etc.
```

## Adding a zanpakutō

1. Create `src/zanpakuto/<name>/` with an `index.js` descriptor (same shape as `senbonzakura/index.js`, including a `theme`).
2. Implement each release as a subclass of `Release` with a param schema — the config panel is generated from it.
3. Add the descriptor to `src/zanpakuto/registry.js`.
