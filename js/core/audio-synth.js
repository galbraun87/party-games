export class AudioSynth {
  constructor() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();
  }

  playTone(freq, type, duration, vol) {
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  jump() { this.playTone(400, 'sine', 0.15, 0.05); }
  score() { 
    this.playTone(800, 'square', 0.1, 0.03); 
    setTimeout(() => this.playTone(1200, 'square', 0.1, 0.03), 100); 
  }
  hit() { this.playTone(150, 'sawtooth', 0.3, 0.1); }
  tick() { this.playTone(440, 'sine', 0.1, 0.05); }
  go() { this.playTone(880, 'sine', 0.3, 0.1); }
}
