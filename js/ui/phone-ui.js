export class PhoneUI {
  constructor(onInput) {
    this.onInput = onInput;
    this.state = { up: false, down: false, left: false, right: false, a: false, b: false };
    this.init();
  }

  init() {
    // Prevent iOS double-tap/pinch zooming on the entire controller
    document.getElementById('controller-view').addEventListener('touchstart', (e) => {
      if (e.target.tagName !== 'BUTTON') e.preventDefault();
    }, { passive: false });

    const bind = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;

      const press = (e) => {
        e.preventDefault();
        this.state[key] = true;
        el.classList.add('active');
        this.emit();
      };

      const release = (e) => {
        e.preventDefault();
        this.state[key] = false;
        el.classList.remove('active');
        this.emit();
      };

      el.addEventListener('touchstart', press, { passive: false });
      el.addEventListener('touchend', release, { passive: false });
      el.addEventListener('mousedown', press);
      el.addEventListener('mouseup', release);
      el.addEventListener('mouseleave', release);
    };

    bind('btn-up', 'up'); bind('btn-down', 'down');
    bind('btn-left', 'left'); bind('btn-right', 'right');
    bind('btn-a', 'a'); bind('btn-b', 'b');
  }

  emit() { this.onInput(this.state); }
}
