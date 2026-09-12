const PREFIX = 'tvparty-';
const MAX_PLAYERS = 8;

export class PeerHost {
  constructor(onConnect, onDisconnect, onInput) {
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
    this.onInput = onInput;
    this.slots = new Array(MAX_PLAYERS).fill(null);
    this.code = Math.floor(1000 + Math.random() * 9000).toString();
    this.peer = null;
    this.init();
  }

  init() {
    this.peer = new window.Peer(`${PREFIX}${this.code}`);

    this.peer.on('connection', (conn) => {
      // Reject duplicate connections from the same remote client ID
      const existingSlot = this.slots.findIndex(s => s && s.peer === conn.peer);
      if (existingSlot !== -1) {
        conn.close();
        return;
      }

      const slot = this.slots.findIndex(s => s === null);
      if (slot === -1) {
        conn.close(); // Room full
        return;
      }

      this.slots[slot] = conn;

      conn.on('open', () => {
        conn.send({ type: 'WELCOME', slot });
        if (this.onConnect) this.onConnect(slot, conn.peer);
      });

      conn.on('data', (data) => {
        const currentSlot = this.slots.indexOf(conn);
        if (currentSlot !== -1 && this.onInput) {
          this.onInput(currentSlot, data);
        }
      });

      const cleanup = () => {
        const currentSlot = this.slots.indexOf(conn);
        if (currentSlot !== -1) {
          this.slots[currentSlot] = null;
          if (this.onDisconnect) this.onDisconnect(currentSlot);
        }
      };

      conn.on('close', cleanup);
      conn.on('error', cleanup);
    });
  }
}
