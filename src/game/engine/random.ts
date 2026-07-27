export function nextRandom(state: number): [number, number] {
  let value = state | 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  const next = value >>> 0;
  return [next / 0x1_0000_0000, next];
}
