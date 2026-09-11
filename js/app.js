// Global error catcher to alert issue directly on screen
window.addEventListener('error', (e) => {
  alert(`JS Error: ${e.message} at ${e.filename}:${e.lineno}`);
});

let PhoneUI, TVDebugPanel;

// Dynamic imports to prevent silent script crashes
try {
  const phoneModule = await import('./ui/phone-ui.js');
  PhoneUI = phoneModule.PhoneUI;
  
  const tvModule = await import('./ui/tv-debug.js');
  TVDebugPanel = tvModule.TVDebugPanel;
} catch (err) {
  alert(`Import Failed: ${err.message}`);
}

const menuView = document.getElementById('menu-view');
const tvView = document.getElementById('tv-view');
const controllerView = document.getElementById('controller-view');

const showScreen = (target) => {
  [menuView, tvView, controllerView].forEach(el => el.classList.remove('active'));
  target.classList.add('active');
};

// 1. Host Mode Setup (TV)
document.getElementById('btn-host-tv').addEventListener('click', () => {
  showScreen(tvView);
  document.getElementById('room-code-display').innerText = '1234';
  
  if (TVDebugPanel) {
    const debugPanel = new TVDebugPanel(document.getElementById('debug-bar'));
    debugPanel.setConnected(0, true);
    debugPanel.setConnected(1, true);
  }
});

// 2. Join Mode Setup (Phone)
document.getElementById('btn-join-phone').addEventListener('click', () => {
  showScreen(controllerView);
  
  if (PhoneUI) {
    new PhoneUI((inputState) => {
      console.log('Controller Input Changed:', inputState);
    });
  }
});
