/**
 * Zero-dependency Web Audio API Sound Synthesizer Suite
 * Provides crisp, modern micro-acoustic cues for gameplay events.
 */

let audioCtx = null;
let isMuted = localStorage.getItem("stealth_sound_muted") === "true";

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Global User Interaction Audio Unblocker (Handles mobile Safari/Chrome Autoplay Policies)
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  };

  const unlockEvents = ["click", "touchstart", "touchend", "pointerdown", "keydown"];
  const handleUnlock = () => {
    unlockAudio();
    for (const evt of unlockEvents) {
      window.removeEventListener(evt, handleUnlock);
    }
  };
  for (const evt of unlockEvents) {
    window.addEventListener(evt, handleUnlock, { passive: true });
  }
}

export function isSoundMuted() {
  return isMuted;
}

export function toggleSoundMute() {
  isMuted = !isMuted;
  localStorage.setItem("stealth_sound_muted", isMuted ? "true" : "false");
  return isMuted;
}

/**
 * Universal sound player
 */
export function playSound(type, options = {}) {
  if (isMuted) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    switch (type) {
      case "message":
      case "chat": {
        // Bubbly chat pop sound (satisfying tactile acoustic pop on each new chat bubble / clue)
        const isSelf = options.isSelf || false;

        if (isSelf) {
          // Outgoing subtle tactile blip
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.frequency.setValueAtTime(620, now);
          osc.frequency.exponentialRampToValueAtTime(940, now + 0.07);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
        } else {
          // Incoming cheerful two-tone bubble chime ("Ploop-Ding!")
          // Tone 1: Low bubble pop
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = "sine";
          osc1.connect(gain1);
          gain1.connect(ctx.destination);

          osc1.frequency.setValueAtTime(480, now);
          osc1.frequency.exponentialRampToValueAtTime(780, now + 0.07);
          gain1.gain.setValueAtTime(0.16, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc1.start(now);
          osc1.stop(now + 0.08);

          // Tone 2: Bright harmonic ding (starts 40ms later)
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = "sine";
          osc2.connect(gain2);
          gain2.connect(ctx.destination);

          const start2 = now + 0.045;
          osc2.frequency.setValueAtTime(880, start2);
          osc2.frequency.exponentialRampToValueAtTime(1240, start2 + 0.09);
          gain2.gain.setValueAtTime(0.18, start2);
          gain2.gain.exponentialRampToValueAtTime(0.001, start2 + 0.11);
          osc2.start(start2);
          osc2.stop(start2 + 0.11);
        }
        break;
      }

      case "turn": {
        // Player's turn: Energetic high-tech ping (D5 -> A5)
        const isMyTurn = options.isMyTurn !== false;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (isMyTurn) {
          osc.frequency.setValueAtTime(587.33, now); // D5
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          osc.start(now);
          osc.stop(now + 0.22);
        } else {
          osc.frequency.setValueAtTime(440, now);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
        }
        break;
      }

      case "vote": {
        // Vote cast: Tactile haptic click with sub-bass punch
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.09);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
        break;
      }

      case "eliminated": {
        // Player eliminated: Cinematic tension drop
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);
        gain.gain.setValueAtTime(0.10, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }

      case "win": {
        // Victory chord: Modern major arpeggio (C5 -> E5 -> G5 -> C6)
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.connect(gain);
          gain.connect(ctx.destination);

          const start = now + i * 0.08;
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.10, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
          osc.start(start);
          osc.stop(start + 0.3);
        });
        break;
      }

      case "defeat": {
        // Defeat: Minor descent
        const notes = [440, 415.3, 392, 349.23];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.connect(gain);
          gain.connect(ctx.destination);

          const start = now + i * 0.1;
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.08, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
          osc.start(start);
          osc.stop(start + 0.25);
        });
        break;
      }

      case "tick": {
        // Low-time countdown tick (<5 seconds)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
        break;
      }

      case "reveal": {
        // Shimmer whoosh on revealing secret word
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }

      case "join": {
        // Member joined lobby pop
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }

      case "emergency": {
        // Emergency Meeting siren: Two-tone urgent alarm pulse
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sawtooth";
          osc.connect(gain);
          gain.connect(ctx.destination);

          const start = now + i * 0.16;
          osc.frequency.setValueAtTime(650, start);
          osc.frequency.linearRampToValueAtTime(880, start + 0.08);
          gain.gain.setValueAtTime(0.12, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);
          osc.start(start);
          osc.stop(start + 0.14);
        }
        break;
      }

      case "kill": {
        // Elimination hit: Heavy punchy thud with dramatic pitch drop
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.28);
        gain.gain.setValueAtTime(0.20, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
        break;
      }

      case "task": {
        // Task completed: Bright satisfying crystal chime ("Ting-Ting!")
        const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.connect(gain);
          gain.connect(ctx.destination);

          const start = now + idx * 0.04;
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.12, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
          osc.start(start);
          osc.stop(start + 0.25);
        });
        break;
      }

      case "sabotage": {
        // Red alert alarm klaxon
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(330, now + 0.12);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        osc.start(now);
        osc.stop(now + 0.24);
        break;
      }

      case "vent": {
        // Metal vent whoosh
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.18);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    // Graceful fallback if Web Audio is blocked or unsupported
    console.warn("Audio synthesis unavailable:", err);
  }
}
