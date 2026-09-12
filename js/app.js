import { PeerHost } from './core/peer-host.js';
import { PeerClient } from './core/peer-client.js';
import { TVDebugPanel } from './ui/tv-debug.js';
import { FlappyGame } from './game/flappy-game.js'; // Updated to flappy-game.js

let host = null;
let client = null;
let debugPanel = null;
let game = null;

const inputState = {
  up: false, down: false, left: false, right: false, a: false, b: false
};

function switchScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId)?.classList.add('active');
}

// 1. Initialize TV Host Mode
document.getElementById('btn-host-tv')?.addEventListener('click', () => {
  switchScreen('tv-view');

  const canvas = document.getElementById('game-canvas');
  const debugBar = document.getElementById('debug-bar');

  debugPanel = new TVDebugPanel(debugBar);
  game = new FlappyGame(canvas);

  host = new PeerHost(
    (slot, peerId) => {
      debugPanel.setConnected(slot, true);
      game.setPlayerActive(slot, true);
    },
    (slot) => {
      debugPanel.setConnected(slot, false);
      game.setPlayerActive(slot, false);
    },
    (slot, input) => {
      debugPanel.updateInput(slot, input);
      game.handleInput(slot, input);
    },
    (slot, name) => {
      debugPanel.setName(slot, name);
      game.setPlayerActive(slot, true, name);
    },
    (slot, status) => {
      debugPanel.setStatus(slot, status);
    }
  );

  document.getElementById('room-code-display').innerText = host.code;
});

// 2. Initialize Phone Client Mode
document.getElementById('btn-join-phone')?.addEventListener('click', () => {
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
