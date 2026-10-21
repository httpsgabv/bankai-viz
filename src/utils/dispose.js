/** Frees GPU resources for every mesh under `root`. */
export function disposeObject(root) {
  root.traverse((object) => {
    object.geometry?.dispose();
    const { material } = object;
    if (Array.isArray(material)) material.forEach((m) => m.dispose());
    else material?.dispose();
    if (object.isInstancedMesh) object.dispose();
  });
}
