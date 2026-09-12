const PREFIX = 'tvparty-';

export class PeerClient {
  constructor(roomCode, playerName, onConnect, onDisconnect, onError) {
    this.roomCode = roomCode.toUpperCase();
    this.playerName = playerName || 'Player';
    this.deviceId = this.getOrCreateDeviceId();
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
    this.onError = onError;
    this.conn = null;
    this.peer = null;
    this.hasConnected = false;
    
    this.initUnloadListeners();
    this.initVisibilityListener();
    this.connect();
  }

  getOrCreateDeviceId() {
    let id = localStorage.getItem('tvparty_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem('tvparty_device_id', id);
    }
    return id;
  }

  connect() {
    this.peer = new window.Peer();
    this.peer.on('open', () => {
      if (this.conn) return;
      this.conn = this.peer.connect(`${PREFIX}${this.roomCode}`, { reliable: false });

      this.conn.on('open', () => {
        this.conn.send({ 
          type: 'JOIN', 
          name: this.playerName, 
          deviceId: this.deviceId 
        });
      });

      this.conn.on('data', (data) => {
        if (data.type === 'WELCOME' && !this.hasConnected) {
          this.hasConnected = true;
          if (this.onConnect) this.onConnect(data.slot);
        } else if (data.type === 'PING') {
          this.sendKeepAlive();
        }
      });

      this.conn.on('close', () => { if (this.onDisconnect) this.onDisconnect(); });
      this.conn.on('error', (err) => { if (this.onError) this.onError(err); });
    });
    this.peer.on('error', (err) => { if (this.onError) this.onError(err); });
  }

  sendInput(inputState) {
    if (this.conn && this.conn.open) this.conn.send(inputState);
  }

  sendKeepAlive() {
    if (this.conn && this.conn.open) this.conn.send({ type: 'PONG' });
  }

  disconnect() {
    if (this.conn && this.conn.open) {
      try { this.conn.send({ type: 'LEAVE' }); } catch (e) {}
      try { this.conn.close(); } catch (e) {}
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
    }
  }

  initUnloadListeners() {
    const handleUnload = () => this.disconnect();
    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('beforeunload', handleUnload);
  }

  initVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.sendKeepAlive();
      }
    });
  }
}
