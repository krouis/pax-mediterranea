import { z } from 'zod';
import type {
  FactionId,
  ScenarioObjective,
  Terrain,
  Territory,
  UnitType,
} from '../game/engine/types';

export const terrainRules: Record<Terrain, { defense: number; nameKey: string }> = {
  plains: { defense: 0, nameKey: 'content:terrain.plains' },
  hills: { defense: 1, nameKey: 'content:terrain.hills' },
  mountains: { defense: 2, nameKey: 'content:terrain.mountains' },
  city: { defense: 1, nameKey: 'content:terrain.city' },
  port: { defense: 1, nameKey: 'content:terrain.port' },
  sea: { defense: 0, nameKey: 'content:terrain.sea' },
  sacred: { defense: 1, nameKey: 'content:terrain.sacred' },
};

export const unitRules: Record<UnitType, { cost: number; attack: number; defense: number }> = {
  infantry: { cost: 2, attack: 2, defense: 2 },
  cavalry: { cost: 3, attack: 3, defense: 1 },
  fleet: { cost: 4, attack: 3, defense: 2 },
};

export const factions: Record<
  FactionId,
  { nameKey: string; icon: string; passiveKey: string; cards: string[]; patrons: string[] }
> = {
  carthage: {
    nameKey: 'content:factions.carthage.name',
    icon: '◇',
    passiveKey: 'content:factions.carthage.passive',
    cards: ['hannibal-barca', 'war-elephants', 'merchant-fleet'],
    patrons: ['baal-hammon', 'tanit'],
  },
  rome: {
    nameKey: 'content:factions.rome.name',
    icon: '⬡',
    passiveKey: 'content:factions.rome.passive',
    cards: ['scipio-africanus', 'roman-veterans', 'roman-roads'],
    patrons: ['jupiter', 'juno'],
  },
};

export const cards: Record<string, { nameKey: string; descriptionKey: string }> = {
  'hannibal-barca': {
    nameKey: 'content:cards.hannibal-barca.name',
    descriptionKey: 'content:cards.hannibal-barca.description',
  },
  'war-elephants': {
    nameKey: 'content:cards.war-elephants.name',
    descriptionKey: 'content:cards.war-elephants.description',
  },
  'merchant-fleet': {
    nameKey: 'content:cards.merchant-fleet.name',
    descriptionKey: 'content:cards.merchant-fleet.description',
  },
  'scipio-africanus': {
    nameKey: 'content:cards.scipio-africanus.name',
    descriptionKey: 'content:cards.scipio-africanus.description',
  },
  'roman-veterans': {
    nameKey: 'content:cards.roman-veterans.name',
    descriptionKey: 'content:cards.roman-veterans.description',
  },
  'roman-roads': {
    nameKey: 'content:cards.roman-roads.name',
    descriptionKey: 'content:cards.roman-roads.description',
  },
};

export const patrons: Record<
  string,
  { nameKey: string; faction: FactionId; descriptionKey: string; favorKey: string }
> = {
  'baal-hammon': {
    nameKey: 'content:patrons.baal-hammon.name',
    faction: 'carthage',
    descriptionKey: 'content:patrons.baal-hammon.description',
    favorKey: 'content:patrons.baal-hammon.favor',
  },
  tanit: {
    nameKey: 'content:patrons.tanit.name',
    faction: 'carthage',
    descriptionKey: 'content:patrons.tanit.description',
    favorKey: 'content:patrons.tanit.favor',
  },
  jupiter: {
    nameKey: 'content:patrons.jupiter.name',
    faction: 'rome',
    descriptionKey: 'content:patrons.jupiter.description',
    favorKey: 'content:patrons.jupiter.favor',
  },
  juno: {
    nameKey: 'content:patrons.juno.name',
    faction: 'rome',
    descriptionKey: 'content:patrons.juno.description',
    favorKey: 'content:patrons.juno.favor',
  },
};

const rawTerritories: Territory[] = [
  {
    id: 'iberia',
    nameKey: 'content:territories.iberia',
    terrain: 'hills',
    position: { x: 9, y: 43 },
    connections: ['balearics'],
    ownerId: 'p1',
  },
  {
    id: 'balearics',
    nameKey: 'content:territories.balearics',
    terrain: 'sea',
    position: { x: 24, y: 48 },
    connections: ['iberia', 'carthage', 'sardinia'],
  },
  {
    id: 'carthage',
    nameKey: 'content:territories.carthage',
    terrain: 'port',
    position: { x: 39, y: 73 },
    connections: ['balearics', 'sardinia', 'sicily', 'numidia'],
    ownerId: 'p1',
    capital: true,
    major: true,
  },
  {
    id: 'numidia',
    nameKey: 'content:territories.numidia',
    terrain: 'plains',
    position: { x: 26, y: 78 },
    connections: ['carthage'],
    ownerId: 'p1',
  },
  {
    id: 'sardinia',
    nameKey: 'content:territories.sardinia',
    terrain: 'hills',
    position: { x: 43, y: 43 },
    connections: ['balearics', 'carthage', 'corsica', 'sicily'],
  },
  {
    id: 'corsica',
    nameKey: 'content:territories.corsica',
    terrain: 'mountains',
    position: { x: 46, y: 29 },
    connections: ['sardinia', 'latium'],
  },
  {
    id: 'sicily',
    nameKey: 'content:territories.sicily',
    terrain: 'city',
    position: { x: 55, y: 61 },
    connections: ['carthage', 'sardinia', 'magna-graecia'],
    major: true,
  },
  {
    id: 'latium',
    nameKey: 'content:territories.latium',
    terrain: 'city',
    position: { x: 59, y: 29 },
    connections: ['corsica', 'campania'],
    ownerId: 'p2',
    capital: true,
    major: true,
  },
  {
    id: 'campania',
    nameKey: 'content:territories.campania',
    terrain: 'plains',
    position: { x: 63, y: 42 },
    connections: ['latium', 'magna-graecia'],
    ownerId: 'p2',
  },
  {
    id: 'magna-graecia',
    nameKey: 'content:territories.magna-graecia',
    terrain: 'port',
    position: { x: 67, y: 55 },
    connections: ['campania', 'sicily', 'epirus'],
    ownerId: 'p2',
  },
  {
    id: 'epirus',
    nameKey: 'content:territories.epirus',
    terrain: 'mountains',
    position: { x: 76, y: 48 },
    connections: ['magna-graecia', 'hellas'],
  },
  {
    id: 'hellas',
    nameKey: 'content:territories.hellas',
    terrain: 'sacred',
    position: { x: 84, y: 57 },
    connections: ['epirus'],
  },
];

const territorySchema: z.ZodType<Territory> = z.object({
  id: z.string().min(1),
  nameKey: z.string().min(1),
  terrain: z.enum(['plains', 'hills', 'mountains', 'city', 'port', 'sea', 'sacred']),
  position: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }),
  connections: z.array(z.string()),
  ownerId: z.string().optional(),
  capital: z.boolean().optional(),
  major: z.boolean().optional(),
});

export const quickMap = z.array(territorySchema).parse(rawTerritories);

export const scenarios: Array<{
  id: string;
  titleKey: string;
  introKey: string;
  objectiveKey: string;
  historicalNoteKey: string;
  objective: ScenarioObjective;
}> = [
  {
    id: 'sicilian-question',
    titleKey: 'campaigns:sicilian-question.title',
    introKey: 'campaigns:sicilian-question.intro',
    objectiveKey: 'campaigns:sicilian-question.objective',
    historicalNoteKey: 'campaigns:sicilian-question.historicalNote',
    objective: { type: 'controlAtTurn', territoryId: 'sicily', turn: 6, factionId: 'carthage' },
  },
];
