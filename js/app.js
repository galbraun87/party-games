import { PhoneUI } from './ui/phone-ui.js';
import { TVDebugPanel } from './ui/tv-debug.js';
import { PeerHost } from './core/peer-host.js';
import { PeerClient } from './core/peer-client.js';
import { PlayerManager } from './core/player-manager.js';
import { InputBus } from './core/input-bus.js';
import { FlappyGame } from './games/flappy/flappy-game.js';

const menuView = document.getElementById('menu-view');
const tvView = document.getElementById('tv-view');
const controllerView = document.getElementById('controller-view');

const showScreen = (target) => {
  [menuView, tvView, controllerView].forEach(el => el.classList.remove('active'));
  target.classList.add('active');
};

let activePhoneUI = null;
let activeClient = null;

// 1. Host Mode (TV)
document.getElementById('btn-host-tv').addEventListener('click', () => {
  showScreen(tvView);
  
  const canvas = document.getElementById('game-canvas');
  const stage = document.getElementById('game-stage');
  canvas.width = stage.clientWidth || 800;
  canvas.height = stage.clientHeight || 450;

  const debugPanel = new TVDebugPanel(document.getElementById('debug-bar'));
  const playerManager = new PlayerManager(8);
  const inputBus = new InputBus(8);

  const host = new PeerHost(
    (slot, peerId) => {
      playerManager.connectPlayer(slot, peerId);
      debugPanel.setConnected(slot, true);
    },
    (slot) => {
      playerManager.disconnectPlayer(slot);
      debugPanel.setConnected(slot, false);
    },
    (slot, inputState) => {
      inputBus.receiveInput(slot, inputState);
    }
  );

  document.getElementById('room-code-display').innerText = host.code;

  // Initialize game instance
  const game = new FlappyGame(canvas, playerManager, inputBus);
  game.init();

  // Unified 60 FPS update and render loop
  const gameLoop = () => {
    inputBus.tick();
    game.update();
    game.render();

    for (let i = 0; i < 8; i++) {
      debugPanel.updateInput(i, inputBus.current[i]);
    }
    requestAnimationFrame(gameLoop);
  };
  requestAnimationFrame(gameLoop);
});

// 2. Client Mode (Phone)
const joinBtn = document.getElementById('btn-join-phone');

joinBtn.addEventListener('click', () => {
  const code = document.getElementById('room-code-input').value.trim();
  if (!code || code.length !== 4) {
    alert('Please enter a 4-digit room code');
    return;
  }

  joinBtn.disabled = true;

  activeClient = new PeerClient(
    code,
    () => {
      showScreen(controllerView);
      if (!activePhoneUI) {
        activePhoneUI = new PhoneUI((inputState) => {
          if (activeClient) activeClient.sendInput(inputState);
        });
      }
    },
    () => {
      joinBtn.disabled = false;
      alert('Disconnected from TV');
    },
    (err) => {
      joinBtn.disabled = false;
      alert(`Connection error: ${err.type || err}`);
    }
  );
});
