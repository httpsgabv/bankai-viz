/**
 * Holds a set of tweakable parameters described by a schema:
 * [{ group: 'Name', controls: [{ key, label, type, value, min?, max?, step?, rebuild? }] }]
 * The control panel renders any ParamSource generically.
 */
export class ParamSource {
  constructor(schema) {
    this.schema = schema;
    this.params = Object.fromEntries(this.definitions.map((def) => [def.key, def.value]));
  }

  get definitions() {
    return this.schema.flatMap((group) => group.controls);
  }

  definition(key) {
    return this.definitions.find((def) => def.key === key);
  }

  setParam(key, value) {
    if (this.params[key] === value) return;
    this.params[key] = value;
    this.onParamsChanged([this.definition(key)]);
  }

  resetParams() {
    const changed = this.definitions.filter((def) => this.params[def.key] !== def.value);
    changed.forEach((def) => (this.params[def.key] = def.value));
    if (changed.length) this.onParamsChanged(changed);
  }

  /** Override to react to changes. Receives the definitions that changed. */
  onParamsChanged(_definitions) {}
}
