export class BaseGame {
  constructor(canvas, playerManager, inputBus, audioSynth) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.playerManager = playerManager;
    this.inputBus = inputBus;
    this.audio = audioSynth;
    this.isRunning = false;
  }

  init() {}
  update(dt) {}
  render() {}
  destroy() {}
}
