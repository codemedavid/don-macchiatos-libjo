/**
 * Synthesised "order ready" chime. Generated with the Web Audio API so no audio
 * asset has to ship or load — the ring must work the instant the status flips.
 */

const NOTE_FREQUENCIES_HZ = [880, 1174.66, 1567.98];
const NOTE_DURATION_SECONDS = 0.28;
const NOTE_GAP_SECONDS = 0.16;
const PEAK_GAIN = 0.25;
const SILENT_GAIN = 0.0001;
const REPEAT_COUNT = 2;
const REPEAT_GAP_SECONDS = 0.55;

type AudioContextFactory = () => AudioContext | null;

export interface ChimePlayer {
  /** Create/resume the context from a user gesture so autoplay policies allow later rings. */
  prime: () => void;
  /** Play the chime. Returns false when audio is unavailable rather than throwing. */
  play: () => boolean;
}

const defaultFactory: AudioContextFactory = () => {
  if (typeof window === 'undefined') return null;

  const AudioContextCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextCtor) return null;

  return new AudioContextCtor();
};

export const createChimePlayer = (
  createContext: AudioContextFactory = defaultFactory
): ChimePlayer => {
  let context: AudioContext | null = null;
  let isUnavailable = false;

  const getContext = (): AudioContext | null => {
    if (isUnavailable) return null;
    if (context) return context;

    try {
      context = createContext();
    } catch {
      context = null;
    }

    if (!context) {
      isUnavailable = true;
    }

    return context;
  };

  const scheduleNote = (
    ctx: AudioContext,
    frequencyHz: number,
    startAt: number
  ) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequencyHz, startAt);

    gain.gain.setValueAtTime(PEAK_GAIN, startAt);
    gain.gain.exponentialRampToValueAtTime(
      SILENT_GAIN,
      startAt + NOTE_DURATION_SECONDS
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(startAt);
    oscillator.stop(startAt + NOTE_DURATION_SECONDS);
  };

  const prime = () => {
    const ctx = getContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {
        /* Autoplay still blocked — the visual "ready" state remains the fallback. */
      });
    }
  };

  const play = (): boolean => {
    const ctx = getContext();
    if (!ctx) return false;

    prime();

    try {
      for (let repeat = 0; repeat < REPEAT_COUNT; repeat += 1) {
        const repeatOffset = repeat * REPEAT_GAP_SECONDS;

        NOTE_FREQUENCIES_HZ.forEach((frequencyHz, noteIndex) => {
          const startAt =
            ctx.currentTime + repeatOffset + noteIndex * NOTE_GAP_SECONDS;
          scheduleNote(ctx, frequencyHz, startAt);
        });
      }
      return true;
    } catch {
      return false;
    }
  };

  return { prime, play };
};

export const readyChime: ChimePlayer = createChimePlayer();
