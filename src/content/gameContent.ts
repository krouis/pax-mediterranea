import { z } from 'zod';
import type { FactionId, Terrain, Territory, UnitType } from '../game/engine/types';

export const terrainRules: Record<Terrain, { defense: number; label: string }> = {
  plains: { defense: 0, label: 'Plains' },
  hills: { defense: 1, label: 'Hills' },
  mountains: { defense: 2, label: 'Mountains' },
  city: { defense: 1, label: 'City' },
  port: { defense: 1, label: 'Port' },
  sea: { defense: 0, label: 'Sea' },
  sacred: { defense: 1, label: 'Sacred site' },
};

export const unitRules: Record<UnitType, { cost: number; attack: number; defense: number }> = {
  infantry: { cost: 2, attack: 2, defense: 2 },
  cavalry: { cost: 3, attack: 3, defense: 1 },
  fleet: { cost: 4, attack: 3, defense: 2 },
};

export const factions: Record<
  FactionId,
  { name: string; icon: string; passive: string; cards: string[]; patrons: string[] }
> = {
  carthage: {
    name: 'Carthage',
    icon: '◇',
    passive: 'Merchant Republic',
    cards: ['hannibal-barca', 'war-elephants', 'merchant-fleet'],
    patrons: ['baal-hammon', 'tanit'],
  },
  rome: {
    name: 'Roman Republic',
    icon: '⬡',
    passive: 'Citizen Levy',
    cards: ['scipio-africanus', 'roman-veterans', 'roman-roads'],
    patrons: ['jupiter', 'juno'],
  },
};

export const cards: Record<string, { name: string; description: string }> = {
  'hannibal-barca': {
    name: 'Hannibal Barca',
    description: 'One land army gains +1 attack in its next battle this turn.',
  },
  'war-elephants': {
    name: 'War Elephants',
    description: 'One army gains +2 attack on plains for its next battle.',
  },
  'merchant-fleet': {
    name: 'Merchant Fleet',
    description: 'Gain 2 coins.',
  },
  'scipio-africanus': {
    name: 'Scipio Africanus',
    description: 'One Roman army gains +1 attack in its next battle.',
  },
  'roman-veterans': {
    name: 'Roman Veterans',
    description: 'One infantry may act again.',
  },
  'roman-roads': { name: 'Roman Roads', description: 'One land unit may act again.' },
};

export const patrons: Record<
  string,
  { name: string; faction: FactionId; description: string; favor: string }
> = {
  'baal-hammon': {
    name: 'Baal Hammon',
    faction: 'carthage',
    description: 'Prosperity and civic endurance.',
    favor: 'Abundant Stores: selected city produces 2 coins now.',
  },
  tanit: {
    name: 'Tanit',
    faction: 'carthage',
    description: 'Protection and resilience.',
    favor: "Tanit's Protection: selected territory gains defensive resolve.",
  },
  jupiter: {
    name: 'Jupiter',
    faction: 'rome',
    description: 'Authority and confidence.',
    favor: 'Oath of Victory: gain 1 Pax Point.',
  },
  juno: {
    name: 'Juno',
    faction: 'rome',
    description: 'Protection of the community.',
    favor: 'Guardian of the People: gain 2 coins toward recruitment.',
  },
};

const rawTerritories: Territory[] = [
  {
    id: 'iberia',
    name: 'Iberia',
    terrain: 'hills',
    position: { x: 9, y: 43 },
    connections: ['balearics'],
    ownerId: 'p1',
  },
  {
    id: 'balearics',
    name: 'Balearic Isles',
    terrain: 'sea',
    position: { x: 24, y: 48 },
    connections: ['iberia', 'carthage', 'sardinia'],
  },
  {
    id: 'carthage',
    name: 'Carthage',
    terrain: 'port',
    position: { x: 39, y: 73 },
    connections: ['balearics', 'sardinia', 'sicily', 'numidia'],
    ownerId: 'p1',
    capital: true,
    major: true,
  },
  {
    id: 'numidia',
    name: 'Numidia',
    terrain: 'plains',
    position: { x: 26, y: 78 },
    connections: ['carthage'],
    ownerId: 'p1',
  },
  {
    id: 'sardinia',
    name: 'Sardinia',
    terrain: 'hills',
    position: { x: 43, y: 43 },
    connections: ['balearics', 'carthage', 'corsica', 'sicily'],
  },
  {
    id: 'corsica',
    name: 'Corsica',
    terrain: 'mountains',
    position: { x: 46, y: 29 },
    connections: ['sardinia', 'latium'],
  },
  {
    id: 'sicily',
    name: 'Sicily',
    terrain: 'city',
    position: { x: 55, y: 61 },
    connections: ['carthage', 'sardinia', 'magna-graecia'],
    major: true,
  },
  {
    id: 'latium',
    name: 'Rome',
    terrain: 'city',
    position: { x: 59, y: 29 },
    connections: ['corsica', 'campania'],
    ownerId: 'p2',
    capital: true,
    major: true,
  },
  {
    id: 'campania',
    name: 'Campania',
    terrain: 'plains',
    position: { x: 63, y: 42 },
    connections: ['latium', 'magna-graecia'],
    ownerId: 'p2',
  },
  {
    id: 'magna-graecia',
    name: 'Magna Graecia',
    terrain: 'port',
    position: { x: 67, y: 55 },
    connections: ['campania', 'sicily', 'epirus'],
    ownerId: 'p2',
  },
  {
    id: 'epirus',
    name: 'Epirus',
    terrain: 'mountains',
    position: { x: 76, y: 48 },
    connections: ['magna-graecia', 'hellas'],
  },
  {
    id: 'hellas',
    name: 'Hellas',
    terrain: 'sacred',
    position: { x: 84, y: 57 },
    connections: ['epirus'],
  },
];

const territorySchema: z.ZodType<Territory> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  terrain: z.enum(['plains', 'hills', 'mountains', 'city', 'port', 'sea', 'sacred']),
  position: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }),
  connections: z.array(z.string()),
  ownerId: z.string().optional(),
  capital: z.boolean().optional(),
  major: z.boolean().optional(),
});

export const quickMap = z.array(territorySchema).parse(rawTerritories);

export const scenarios = [
  {
    id: 'sicilian-question',
    title: 'The Sicilian Question',
    intro:
      'In the third century BCE, Carthage and Rome competed for influence in Sicily. This scenario simplifies a long and contested struggle.',
    objective: 'Control Sicily at the end of turn 6.',
    historicalNote:
      'Ancient accounts were written from differing perspectives; the motives and sequence of events remain debated.',
  },
];
