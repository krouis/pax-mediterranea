import { describe, expect, it } from 'vitest';
import { personaIds } from '../config';
import { getPersona, personaRegistry } from './registry';

describe('persona registry', () => {
  it('has an entry for every declared personaId, with a matching id and a description', () => {
    for (const id of personaIds) {
      const persona = personaRegistry[id];
      expect(persona).toBeDefined();
      expect(persona.id).toBe(id);
      expect(persona.description.length).toBeGreaterThan(10);
    }
  });

  it('getPersona returns the same object as the registry and throws for an unknown id', () => {
    for (const id of personaIds) expect(getPersona(id)).toBe(personaRegistry[id]);
    // @ts-expect-error intentionally invalid
    expect(() => getPersona('not-a-real-persona')).toThrow(/unknown persona/i);
  });

  it('opportunist has no weight overrides (the no-bias baseline)', () => {
    expect(personaRegistry.opportunist.weights).toEqual({});
  });

  it('every other persona overrides at least one weight relative to the baseline', () => {
    for (const id of personaIds) {
      if (id === 'opportunist') continue;
      expect(Object.keys(personaRegistry[id].weights).length).toBeGreaterThan(0);
    }
  });
});
