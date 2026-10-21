# Zanpakutō — WebGL release visualizer

Minimalist 3D visualizations of Bleach shikai and bankai, built with Three.js (WebGL) and Vite.

```bash
npm install
npm run dev
```

## Senbonzakura

- **Shikai — "Chire, Senbonzakura"**: the katana's blade scatters tip-first into a ribbon of petals that streams after the cursor. Click to burst.
- **Bankai — "Senbonzakura Kageyoshi"**: two rows of giant blades rise from the ground and scatter into a petal storm that orbits the cursor. Hold to gather, release to blast.

Scroll moves the cursor's 3D target nearer or farther. Shortcuts: `1`/`2` switch release, `Space` replay, `H` hide UI, `C` config panel.

## Structure

```
src/
  app/            App wiring + global scene settings
  engine/         Stage (renderer/scene/fog), CameraRig, Pointer (mouse → 3D), Loop
  sim/            CPU petal simulation
    forces/       Seek, Swirl, Flow (turbulence), Bounds — composable per release
    targets/      Where petals want to go: Trail (ribbon), Orbit (storm), Anchor (reform)
  render/
    petals/       Instanced petal geometry, shaders, mesh
    blades/       Blade profile/geometry, dissolve shader, Katana, BladeRows, hilt
    environment/  Fog-blended floor with soft shadow
  effects/        PetalStorm: simulation + rendering glue
  zanpakuto/
    Release.js    Base class for any release
    registry.js   List of zanpakutō
    senbonzakura/ Descriptor, shikai, bankai, param schemas
  ui/             HUD, release switch, banner, schema-driven control panel
  utils/          Math, Sequence (timelines), ParamSource (tweakable params), etc.
```

## Adding a zanpakutō

1. Create `src/zanpakuto/<name>/` with an `index.js` descriptor (same shape as `senbonzakura/index.js`).
2. Implement each release as a subclass of `Release` with a param schema — the config panel is generated from it.
3. Add the descriptor to `src/zanpakuto/registry.js`.
