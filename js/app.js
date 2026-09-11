import { PhoneUI } from './ui/phone-ui.js';
import { TVDebugPanel } from './ui/tv-debug.js';

const menuView = document.getElementById('menu-view');
const tvView = document.getElementById('tv-view');
const controllerView = document.getElementById('controller-view');

const showScreen = (target) => {
  [menuView, tvView, controllerView].forEach(el => el.classList.remove('active'));
    target.classList.add('active');
    };

    // 1. Host Mode Setup (TV Preview)
    document.getElementById('btn-host-tv').addEventListener('click', () => {
      showScreen(tvView);
        document.getElementById('room-code-display').innerText = '1234';
          
            const debugPanel = new TVDebugPanel(document.getElementById('debug-bar'));
              // Simulate active connections for visualization test
                debugPanel.setConnected(0, true);
                  debugPanel.setConnected(1, true);
                  });

                  // 2. Join Mode Setup (Phone Preview)
                  document.getElementById('btn-join-phone').addEventListener('click', () => {
                    showScreen(controllerView);
                      
                        new PhoneUI((inputState) => {
                            console.log('Controller Input Changed:', inputState);
                              });
                              });
                              