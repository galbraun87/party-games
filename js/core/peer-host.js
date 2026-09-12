const PREFIX = 'tvparty-';
const MAX_PLAYERS = 8;

export class PeerHost {
  constructor(onConnect, onDisconnect, onInput, onNameChange) {
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
    this.onInput = onInput;
    this.onNameChange = onNameChange;
    this.slots = new Array(MAX_PLAYERS).fill(null);
    this.code = Math.floor(1000 + Math.random() * 9000).toString();
    this.peer = null;
    this.init();
  }

  init() {
    this.peer = new window.Peer(`${PREFIX}${this.code}`);
    this.peer.on('connection', (conn) => {
      const existingSlot = this.slots.findIndex(s => s && s.peer === conn.peer);
      if (existingSlot !== -1) { conn.close(); return; }

      const slot = this.slots.findIndex(s => s === null);
      if (slot === -1) { conn.close(); return; } // Room full

      this.slots[slot] = conn;

      conn.on('open', () => {
        conn.send({ type: 'WELCOME', slot });
        if (this.onConnect) this.onConnect(slot, conn.peer);
      });

      conn.on('data', (data) => {
        const currentSlot = this.slots.indexOf(conn);
        if (currentSlot !== -1) {
          if (data && data.type === 'SET_NAME') {
            if (this.onNameChange) this.onNameChange(currentSlot, data.name);
          } else if (this.onInput) {
            this.onInput(currentSlot, data);
          }
        }
      });

      const cleanup = () => {
        const currentSlot = this.slots.indexOf(conn);
        if (currentSlot !== -1) {
          this.slots[currentSlot] = null; // Free up slot instantly
          if (this.onDisconnect) this.onDisconnect(currentSlot);
        }
      };

      conn.on('close', cleanup);
      conn.on('error', cleanup);
    });
  }
}
