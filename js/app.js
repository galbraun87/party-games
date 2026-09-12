import { PhoneUI } from './ui/phone-ui.js';
import { TVDebugPanel } from './ui/tv-debug.js';
import { PeerHost } from './core/peer-host.js';
import { PeerClient } from './core/peer-client.js';

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
  const debugPanel = new TVDebugPanel(document.getElementById('debug-bar'));

  const host = new PeerHost(
    (slot) => debugPanel.setConnected(slot, true),
    (slot) => debugPanel.setConnected(slot, false),
    (slot, inputState) => debugPanel.updateInput(slot, inputState)
  );

  document.getElementById('room-code-display').innerText = host.code;
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
