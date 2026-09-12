import { PeerHost } from './core/peer-host.js';
import { PeerClient } from './core/peer-client.js';
import { TVDebugPanel } from './ui/tv-debug.js';
import { FlappyGame } from './games/flappy/flappy-game.js';

let host = null;
let client = null;
let debugPanel = null;
let game = null;

const inputState = {
  up: false, down: false, left: false, right: false, a: false, b: false
};

function switchScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
  } else {
    console.error(`Screen ID "${screenId}" not found in DOM.`);
  }
}

// 1. Host Game on TV Button Handler
document.addEventListener('DOMContentLoaded', () => {
  const hostBtn = document.getElementById('btn-host-tv');
  if (!hostBtn) {
    console.error('Host button #btn-host-tv not found in DOM.');
    return;
  }

  hostBtn.addEventListener('click', () => {
    try {
      switchScreen('tv-view');

      const canvas = document.getElementById('game-canvas');
      const debugBar = document.getElementById('debug-bar');

      if (!canvas || !debugBar) {
        throw new Error('TV Canvas or Debug Bar elements are missing from HTML.');
      }

      debugPanel = new TVDebugPanel(debugBar);
      game = new FlappyGame(canvas);

      host = new PeerHost(
        (slot, peerId) => {
          if (debugPanel) debugPanel.setConnected(slot, true);
          if (game) game.setPlayerActive(slot, true);
        },
        (slot) => {
          if (debugPanel) debugPanel.setConnected(slot, false);
          if (game) game.setPlayerActive(slot, false);
        },
        (slot, input) => {
          if (debugPanel) debugPanel.updateInput(slot, input);
          if (game) game.handleInput(slot, input);
        },
        (slot, name) => {
          if (debugPanel) debugPanel.setName(slot, name);
          if (game) game.setPlayerActive(slot, true, name);
        },
        (slot, status) => {
          if (debugPanel) debugPanel.setStatus(slot, status);
        }
      );

      const codeDisplay = document.getElementById('room-code-display');
      if (codeDisplay && host.code) {
        codeDisplay.innerText = host.code;
      }
    } catch (err) {
      console.error('Error starting TV host mode:', err);
      alert(`Could not start TV mode: ${err.message}`);
    }
  });

  // 2. Phone Controller Join Button Handler
  document.getElementById('btn-join-phone')?.addEventListener('click', () => {
    try {
      const name = document.getElementById('player-name-input').value.trim() || 'Player';
      const code = document.getElementById('room-code-input').value.trim().toUpperCase();

      if (!code || code.length !== 4) {
        alert('Please enter a valid 4-digit room code.');
        return;
      }

      switchScreen('controller-view');

      client = new PeerClient(
        code,
        name,
        (slot) => { console.log('Connected to host at slot:', slot); },
        () => { alert('Disconnected from TV host.'); switchScreen('menu-view'); },
        (err) => { console.error('Connection error:', err); }
      );

      bindControllerEvents();
    } catch (err) {
      console.error('Error joining match:', err);
      alert(`Could not join game: ${err.message}`);
    }
  });
});

// 3. Controller Input Event Binding
function bindControllerEvents() {
  const mapKey = (elementId, keyName) => {
    const btn = document.getElementById(elementId);
    if (!btn) return;

    const setKey = (active) => {
      if (inputState[keyName] !== active) {
        inputState[keyName] = active;
        btn.classList.toggle('active', active);
        if (client) client.sendInput(inputState);
      }
    };

    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); setKey(true); });
    btn.addEventListener('pointerup', (e) => { e.preventDefault(); setKey(false); });
    btn.addEventListener('pointerleave', (e) => { e.preventDefault(); setKey(false); });
    btn.addEventListener('pointercancel', (e) => { e.preventDefault(); setKey(false); });
  };

  mapKey('btn-up', 'up');
  mapKey('btn-down', 'down');
  mapKey('btn-left', 'left');
  mapKey('btn-right', 'right');
  mapKey('btn-a', 'a');
  mapKey('btn-b', 'b');

  document.getElementById('btn-fullscreen')?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });
}
