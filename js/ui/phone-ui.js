export class PhoneUI {
      constructor(onInputChange) {
          this.onInputChange = onInputChange;
              this.state = { up: false, down: false, left: false, right: false, a: false, b: false };
                  this.initListeners();
                    }

                      initListeners() {
                          const bindBtn = (id, key) => {
                                const el = document.getElementById(id);
                                      if (!el) return;

                                            const setVal = (val) => {
                                                    if (this.state[key] !== val) {
                                                              this.state[key] = val;
                                                                        el.classList.toggle('active', val);
                                                                                  if (val && navigator.vibrate) navigator.vibrate(10);
                                                                                            this.onInputChange({ ...this.state });
                                                                                                    }
                                                                                                          };

                                                                                                                el.addEventListener('touchstart', (e) => { e.preventDefault(); setVal(true); });
                                                                                                                      el.addEventListener('touchend', (e) => { e.preventDefault(); setVal(false); });
                                                                                                                            el.addEventListener('mousedown', () => setVal(true));
                                                                                                                                  el.addEventListener('mouseup', () => setVal(false));
                                                                                                                                      };

                                                                                                                                          bindBtn('btn-up', 'up');
                                                                                                                                              bindBtn('btn-down', 'down');
                                                                                                                                                  bindBtn('btn-left', 'left');
                                                                                                                                                      bindBtn('btn-right', 'right');
                                                                                                                                                          bindBtn('btn-a', 'a');
                                                                                                                                                              bindBtn('btn-b', 'b');
                                                                                                                                                                }
                                                                                                                                                                }
                                                                                                                                                                
}