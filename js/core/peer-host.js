const PREFIX = 'tvparty-';
const MAX_PLAYERS = 8;
const STAGE1_TIMEOUT = 12000; // 12s -> Player grayed out (Inactive)
const STAGE2_TIMEOUT = 42000; // 42s total (12s + 30s grace) -> Hard kick

export class PeerHost {
  constructor(onConnect, onDisconnect, onInput, onNameChange, onStatusChange) {
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
    this.onInput = onInput;
    this.onNameChange = onNameChange;
    this.onStatusChange = onStatusChange; // Optional callback for UI status updates

    this.slots = new Array(MAX_PLAYERS).fill(null);
    this.deviceIds = new Array(MAX_PLAYERS).fill(null);
    this.lastSeen = new Array(MAX_PLAYERS).fill(0);
    this.playerStates = new Array(MAX_PLAYERS).fill('disconnected'); // 'connected' | 'inactive' | 'disconnected'
    
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    this.code = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    this.peer = null;
    
    this.init();
    this.startHeartbeatMonitor();
  }

  init() {
    this.peer = new window.Peer(`${PREFIX}${this.code}`);
    this.peer.on('connection', (conn) => {
      conn.on('data', (data) => {
        let currentSlot = this.slots.indexOf(conn);

        if (data && data.type === 'JOIN') {
          // If the same device is connecting again, kick the old stale connection
          const existingSlot = this.deviceIds.indexOf(data.deviceId);
          if (existingSlot !== -1) {
            this.purgeSlot(existingSlot);
          }

          // Assign first available slot
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
          
          // Re-activate if player was previously marked inactive
          if (this.playerStates[currentSlot] === 'inactive') {
            this.playerStates[currentSlot] = 'connected';
            if (this.onStatusChange) this.onStatusChange(currentSlot, 'connected');
          }

          if (data && data.type === 'LEAVE') {
            // Explicit user exit (tab closed)
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

          // Stage 2: Hard Eviction (> 42s total)
          if (silentTime > STAGE2_TIMEOUT) {
            this.purgeSlot(i);
          } 
          // Stage 1: Gray out player (> 12s)
          else if (silentTime > STAGE1_TIMEOUT) {
            if (this.playerStates[i] !== 'inactive') {
              this.playerStates[i] = 'inactive';
              if (this.onStatusChange) this.onStatusChange(i, 'inactive');
            }
          } 
          else {
            if (conn.open) conn.send({ type: 'PING' });
          }
        }
      }
    }, 1000);
  }
}
