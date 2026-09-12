const PREFIX = 'tvparty-';
const MAX_PLAYERS = 8;
const STAGE1_TIMEOUT = 12000;
const STAGE2_TIMEOUT = 42000;

export class PeerHost {
  constructor(onConnect, onDisconnect, onInput, onNameChange, onStatusChange) {
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
    this.onInput = onInput;
    this.onNameChange = onNameChange;
    this.onStatusChange = onStatusChange;

    this.slots = new Array(MAX_PLAYERS).fill(null);
    this.deviceIds = new Array(MAX_PLAYERS).fill(null);
    this.lastSeen = new Array(MAX_PLAYERS).fill(0);
    this.playerStates = new Array(MAX_PLAYERS).fill('disconnected');
    
    // Generate 4-digit code (1000 - 9999)
    this.code = Math.floor(1000 + Math.random() * 9000).toString();
    this.peer = null;
    
    this.init();
    this.startHeartbeatMonitor();
  }

  init() {
    if (typeof window.Peer === 'undefined') {
      console.error('PeerJS CDN failed to load.');
      alert('PeerJS library failed to load. Please check your internet connection.');
      return;
    }

    try {
      this.peer = new window.Peer(`${PREFIX}${this.code}`);
    } catch (e) {
      console.error('Failed to instantiate PeerJS:', e);
      alert('Could not start host peer service.');
      return;
    }

    this.peer.on('connection', (conn) => {
      conn.on('data', (data) => {
        let currentSlot = this.slots.indexOf(conn);

        if (data && data.type === 'JOIN') {
          const existingSlot = this.deviceIds.indexOf(data.deviceId);
          if (existingSlot !== -1) {
            this.purgeSlot(existingSlot);
          }

          const slot = this.slots.findIndex(s => s === null);
          if (slot === -1) { conn.close(); return; }

          this.slots[slot] = conn;
          this.deviceIds[slot] = data.deviceId;
          this.lastSeen[slot] = Date.now();
          this.playerStates[slot] = 'connected';

          conn.send({ type: 'WELCOME', slot });
          if (this.onConnect) this.onConnect(slot, conn.peer);
          if (this.onNameChange) this.onNameChange(slot, data.name);
          return;
        }

        if (currentSlot !== -1) {
          this.lastSeen[currentSlot] = Date.now();
          
          if (this.playerStates[currentSlot] === 'inactive') {
            this.playerStates[currentSlot] = 'connected';
            if (this.onStatusChange) this.onStatusChange(currentSlot, 'connected');
          }

          if (data && data.type === 'LEAVE') {
            this.purgeSlot(currentSlot);
          } else if (data && data.type === 'SET_NAME') {
            if (this.onNameChange) this.onNameChange(currentSlot, data.name);
          } else if (this.onInput) {
            this.onInput(currentSlot, data);
          }
        }
      });

      const cleanup = () => {
        const currentSlot = this.slots.indexOf(conn);
        if (currentSlot !== -1) {
          this.purgeSlot(currentSlot);
        }
      };

      conn.on('close', cleanup);
      conn.on('error', cleanup);
    });

    this.peer.on('error', (err) => {
      console.error('PeerHost network error:', err);
    });
  }

  purgeSlot(slot) {
    if (slot < 0 || slot >= MAX_PLAYERS) return;
    const conn = this.slots[slot];
    if (conn) {
      try { conn.close(); } catch (e) {}
    }
    this.slots[slot] = null;
    this.deviceIds[slot] = null;
    this.lastSeen[slot] = 0;
    this.playerStates[slot] = 'disconnected';
    if (this.onDisconnect) this.onDisconnect(slot);
  }

  startHeartbeatMonitor() {
    setInterval(() => {
      const now = Date.now();
      for (let i = 0; i < MAX_PLAYERS; i++) {
        const conn = this.slots[i];
        if (conn) {
          const silentTime = now - this.lastSeen[i];
          if (silentTime > STAGE2_TIMEOUT) {
            this.purgeSlot(i);
          } else if (silentTime > STAGE1_TIMEOUT) {
            if (this.playerStates[i] !== 'inactive') {
              this.playerStates[i] = 'inactive';
              if (this.onStatusChange) this.onStatusChange(i, 'inactive');
            }
          } else {
            if (conn.open) conn.send({ type: 'PING' });
          }
        }
      }
    }, 1000);
  }
}
