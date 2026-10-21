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

## Benihime

- **Shikai — "Okiro, Benihime"**: Urahara's cane sword aims at the cursor in a washi-paper room of drifting ink. Tap for *Nake, Benihime* — a crimson crescent that tears through and stains the ink. Hold for *Chikasumi no Tate* — a honeycomb blood-mist shield that shatters when released.
- **Bankai — "Kannonbiraki Benihime Aratame"**: Benihime restructures what she touches. The cursor is her needle, trailing a crimson thread and parting the voxel sculpture. Tap to re-form it (sphere, ring, camellia, helix, cube frame) in a wave from the touch point. Hold to cut it in two (*Kirisaki*); release to sew it back with crimson stitches.

Pick a zanpakutō from the title in the top-left (or press `Z`). Scroll moves the cursor's 3D target nearer or farther. Shortcuts: `1`/`2` switch release, `Z` next zanpakutō, `Space` replay, `H` hide UI, `C` config panel.

## Structure

```
src/
  app/            App wiring + global scene settings
  engine/         Stage (renderer/scene/fog), CameraRig, Pointer (mouse → 3D), Loop
  sim/            CPU simulations: particle swarm + lifecycle, density grid,
                  nerve network, segment chain (snake bodies), voxel sculpture,
                  crescent blasts, aim controller
    forces/       Seek, Swirl, Flow (turbulence), Bounds, Constant — composable per release
    targets/      Where particles want to go: Trail (ribbon), Orbit (storm), Anchor (reform)
  render/
    petals/       Instanced petal geometry, shaders, mesh
    blades/       Blade profile/geometry, dissolve shader, Katana, BladeRows, Trident, Shikomizue
    creatures/    Jizō head, Konjiki creature, Benihime figure
    energy/       Crescent blasts, hex shield, needle & thread, stitches
    motes/        Ink motes
    voxels/       Instanced voxel sculpture
    gas/          Point-sprite poison gas
    neural/       Nerve web lines, nodes and pulses
    environment/  Fog-blended floor with soft shadow
  effects/        Simulation + rendering glue: PetalStorm, PoisonCloud, NeuralWeb, MoteField
  zanpakuto/
    Release.js    Base class for any release
    registry.js   List of zanpakutō
    senbonzakura/ Descriptor, shikai, bankai, param schemas
    ashisogiJizo/ Descriptor, shikai, bankai, ToxicField, param schemas
    benihime/     Descriptor, shikai, bankai, param schemas
  ui/             HUD, release switch, banner, schema-driven control panel
  utils/          Math, Sequence (timelines), ParamSource (tweakable params), etc.
```

## Adding a zanpakutō

1. Create `src/zanpakuto/<name>/` with an `index.js` descriptor (same shape as `senbonzakura/index.js`, including a `theme`).
2. Implement each release as a subclass of `Release` with a param schema — the config panel is generated from it.
3. Add the descriptor to `src/zanpakuto/registry.js`.
