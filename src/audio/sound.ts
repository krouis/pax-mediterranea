let context: AudioContext | undefined;

export function playTone(kind: 'select' | 'move' | 'coin' | 'turn', enabled: boolean): void {
  if (!enabled || typeof AudioContext === 'undefined') return;
  context ??= new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const frequencies = { select: 440, move: 280, coin: 660, turn: 330 };
  oscillator.frequency.value = frequencies[kind];
  oscillator.type = kind === 'coin' ? 'sine' : 'triangle';
  gain.gain.setValueAtTime(0.05, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.12);
}
