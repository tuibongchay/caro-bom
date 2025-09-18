let audioContext: AudioContext | null = null;

export const initAudio = () => {
    if (!audioContext && typeof window !== 'undefined') {
        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser");
        }
    }
};

const playSound = (type: OscillatorType, frequency: number, duration: number, volume: number = 0.1) => {
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
};

export const playMoveSound = () => {
    playSound('sine', 440, 0.1);
};

export const playExplosionSound = () => {
    playSound('sawtooth', 120, 0.4, 0.2);
    setTimeout(() => playSound('triangle', 60, 0.3, 0.15), 50);
};
