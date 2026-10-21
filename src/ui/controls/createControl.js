import { RangeControl } from './RangeControl.js';
import { ColorControl } from './ColorControl.js';

const CONTROL_TYPES = {
  range: RangeControl,
  color: ColorControl,
};

/** Builds the right control for a schema definition. */
export function createControl(definition, value, onChange) {
  const Control = CONTROL_TYPES[definition.type];
  if (!Control) throw new Error(`Unknown control type "${definition.type}"`);
  return new Control(definition, value, onChange);
}
