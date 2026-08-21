import { describe, it, expect, vi } from 'vitest';
import { createChimePlayer } from './chime';

interface FakeNode {
  connect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}

const buildFakeContext = (state: AudioContextState = 'running') => {
  const oscillators: FakeNode[] = [];

  const createOscillator = vi.fn(() => {
    const node = {
      type: 'sine',
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    oscillators.push(node);
    return node;
  });

  const createGain = vi.fn(() => ({
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  }));

  const context = {
    state,
    currentTime: 0,
    destination: {},
    createOscillator,
    createGain,
    resume: vi.fn(() => Promise.resolve()),
  };

  return { context, oscillators };
};

describe('createChimePlayer', () => {
  it('plays a multi-note chime through the audio context', () => {
    const { context, oscillators } = buildFakeContext();
    const player = createChimePlayer(() => context as unknown as AudioContext);

    const didPlay = player.play();

    expect(didPlay).toBe(true);
    expect(oscillators.length).toBeGreaterThan(1);
    oscillators.forEach((oscillator) => {
      expect(oscillator.start).toHaveBeenCalled();
      expect(oscillator.stop).toHaveBeenCalled();
    });
  });

  it('reuses a single audio context across calls', () => {
    const { context } = buildFakeContext();
    const factory = vi.fn(() => context as unknown as AudioContext);
    const player = createChimePlayer(factory);

    player.prime();
    player.play();
    player.play();

    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('resumes a suspended context so autoplay policies do not mute the ring', () => {
    const { context } = buildFakeContext('suspended');
    const player = createChimePlayer(() => context as unknown as AudioContext);

    player.prime();

    expect(context.resume).toHaveBeenCalled();
  });

  it('reports failure instead of throwing when audio is unavailable', () => {
    const player = createChimePlayer(() => null);

    expect(() => player.prime()).not.toThrow();
    expect(player.play()).toBe(false);
  });

  it('reports failure instead of throwing when the context errors mid-play', () => {
    const player = createChimePlayer(
      () =>
        ({
          state: 'running',
          currentTime: 0,
          destination: {},
          createOscillator: () => {
            throw new Error('audio hardware unavailable');
          },
          createGain: () => ({}),
          resume: () => Promise.resolve(),
        }) as unknown as AudioContext
    );

    expect(player.play()).toBe(false);
  });
});
