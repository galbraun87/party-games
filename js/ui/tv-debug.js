export class TVDebugPanel {
  constructor(containerElement) {
    this.container = containerElement;
    this.init();
  }

  init() {
    this.container.innerHTML = '';
    for (let i = 0; i < 8; i++) {
      const card = document.createElement('div');
      card.className = `player-card p${i + 1}`;
      card.style.setProperty('--p-color', `var(--p${i + 1}-color)`);
      card.innerHTML = `
        <div class="player-label">P${i + 1}</div>
        <div class="mini-controller">
          <div class="mini-dpad-grid">
            <div class="mini-key"></div><div class="mini-key dir key-up"></div><div class="mini-key"></div>
            <div class="mini-key dir key-left"></div><div class="mini-key"></div><div class="mini-key dir key-right"></div>
            <div class="mini-key"></div><div class="mini-key dir key-down"></div><div class="mini-key"></div>
          </div>
          <div class="mini-actions">
            <div class="mini-btn btn-b"></div><div class="mini-btn btn-a"></div>
          </div>
        </div>
      `;
      this.container.appendChild(card);
    }
  }

  setConnected(slot, isConnected, customName = null) {
    const card = this.container.children[slot];
    if (!card) return;
    if (isConnected) {
      card.classList.add('connected');
      card.classList.remove('inactive');
      if (customName) this.setName(slot, customName);
    } else {
      card.classList.remove('connected', 'inactive');
      card.querySelector('.player-label').innerText = `P${slot + 1}`;
    }
  }

  setStatus(slot, status) {
    const card = this.container.children[slot];
    if (!card) return;
    if (status === 'inactive') {
      card.classList.add('inactive');
    } else if (status === 'connected') {
      card.classList.remove('inactive');
    }
  }

  setName(slot, name) {
    const card = this.container.children[slot];
    if (card) card.querySelector('.player-label').innerText = name;
  }

  updateInput(slot, state) {
    const card = this.container.children[slot];
    if (!card) return;
    const toggle = (selector, active) => card.querySelector(selector)?.classList.toggle('active', !!active);
    toggle('.key-up', state.up); toggle('.key-down', state.down);
    toggle('.key-left', state.left); toggle('.key-right', state.right);
    toggle('.btn-a', state.a); toggle('.btn-b', state.b);
  }
}
