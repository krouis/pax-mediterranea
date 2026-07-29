import type { PersonaId } from '../types';
import { aggressor } from './aggressor';
import { defender } from './defender';
import { expansionist } from './expansionist';
import { explorer } from './explorer';
import { merchant } from './merchant';
import { navalStrategist } from './naval-strategist';
import { objectiveRusher } from './objective-rusher';
import { opportunist } from './opportunist';
import type { Persona } from './persona';

export const personaRegistry: Record<PersonaId, Persona> = {
  'objective-rusher': objectiveRusher,
  expansionist,
  aggressor,
  defender,
  merchant,
  'naval-strategist': navalStrategist,
  opportunist,
  explorer,
};

export function getPersona(id: PersonaId): Persona {
  const persona = personaRegistry[id];
  if (!persona) throw new Error(`Unknown persona "${id}".`);
  return persona;
}
