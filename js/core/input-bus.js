export class InputBus {
  constructor(maxPlayers = 8) {
    this.maxPlayers = maxPlayers;
    this.keys = ['up', 'down', 'left', 'right', 'a', 'b'];
    this.rawBuffer = Array.from({ length: maxPlayers }, () => this.emptyState());
    this.current = Array.from({ length: maxPlayers }, () => this.emptyState());
    this.previous = Array.from({ length: maxPlayers }, () => this.emptyState());
    this.initKeyboardFallback();
  }

  emptyState() { return { up: false, down: false, left: false, right: false, a: false, b: false }; }

  receiveInput(slot, state) {
    if (slot >= 0 && slot < this.maxPlayers) {
      this.rawBuffer[slot] = { ...this.emptyState(), ...state };
    }
  }

  tick() {
    for (let i = 0; i < this.maxPlayers; i++) {
      this.previous[i] = { ...this.current[i] };
      this.current[i] = { ...this.rawBuffer[i] };
    }
  }

  isDown(slot, key) { return !!(this.current[slot] && this.current[slot][key]); }
  justPressed(slot, key) { return !!(this.current[slot]?.[key] && !this.previous[slot]?.[key]); }
  justReleased(slot, key) { return !!(!this.current[slot]?.[key] && this.previous[slot]?.[key]); }

  initKeyboardFallback() {
    const keyMap = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyZ: 'b', KeyX: 'a', Space: 'a' };
    window.addEventListener('keydown', (e) => { const btn = keyMap[e.code]; if (btn) this.rawBuffer[0][btn] = true; });
    window.addEventListener('keyup', (e) => { const btn = keyMap[e.code]; if (btn) this.rawBuffer[0][btn] = false; });
  }
}
