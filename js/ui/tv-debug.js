const PLAYER_COLORS = [
      'var(--p1-color)', 'var(--p2-color)', 'var(--p3-color)', 'var(--p4-color)',
        'var(--p5-color)', 'var(--p6-color)', 'var(--p7-color)', 'var(--p8-color)'
        ];

        export class TVDebugPanel {
          constructor(containerEl) {
              this.container = containerEl;
                  this.slots = [];
                      this.renderSlots();
                        }

                          renderSlots() {
                              this.container.innerHTML = '';
                                  for (let i = 0; i < 8; i++) {
                                        const card = document.createElement('div');
                                              card.className = 'player-card';
                                                    card.style.setProperty('--p-color', PLAYER_COLORS[i]);
                                                          card.innerHTML = `
                                                                  <span>P${i + 1}</span>
                                                                          <div class="mini-pad">
                                                                                    <div class="mini-dpad d-up" id="p${i}-up"></div>
                                                                                              <div class="mini-dpad d-down" id="p${i}-down"></div>
                                                                                                        <div class="mini-dpad d-left" id="p${i}-left"></div>
                                                                                                                  <div class="mini-dpad d-right" id="p${i}-right"></div>
                                                                                                                            <div class="mini-btn" id="p${i}-a"></div>
                                                                                                                                      <div class="mini-btn" id="p${i}-b"></div>
                                                                                                                                              </div>
                                                                                                                                                    `;
                                                                                                                                                          this.container.appendChild(card);
                                                                                                                                                                this.slots.push(card);
                                                                                                                                                                    }
                                                                                                                                                                      }

                                                                                                                                                                        setConnected(playerIndex, isConnected) {
                                                                                                                                                                            if (this.slots[playerIndex]) {
                                                                                                                                                                                  this.slots[playerIndex].classList.toggle('connected', isConnected);
                                                                                                                                                                                      }
                                                                                                                                                                                        }

                                                                                                                                                                                          updateInput(playerIndex, state) {
                                                                                                                                                                                              if (!state) return;
                                                                                                                                                                                                  const keys = ['up', 'down', 'left', 'right', 'a', 'b'];
                                                                                                                                                                                                      keys.forEach((key) => {
                                                                                                                                                                                                            const el = document.getElementById(`p${playerIndex}-${key}`);
                                                                                                                                                                                                                  if (el) el.classList.toggle('active', !!state[key]);
                                                                                                                                                                                                                      });
                                                                                                                                                                                                                        }
                                                                                                                                                                                                                        }
                                                                                                                                                                                                                        
]