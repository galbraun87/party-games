const PREFIX = 'tvparty-';

export class PeerClient {
  constructor(roomCode, playerName, onConnect, onDisconnect, onError) {
    this.roomCode = roomCode;
    this.playerName = playerName || 'Player';
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
    this.onError = onError;
    this.conn = null;
    this.peer = null;
    this.hasConnected = false;
    this.connect();
  }

  connect() {
    this.peer = new window.Peer();
    this.peer.on('open', () => {
      if (this.conn) return;
      this.conn = this.peer.connect(`${PREFIX}${this.roomCode}`, { reliable: false });

      this.conn.on('open', () => {
        this.conn.send({ type: 'SET_NAME', name: this.playerName });
      });

      this.conn.on('data', (data) => {
        if (data.type === 'WELCOME' && !this.hasConnected) {
          this.hasConnected = true;
          if (this.onConnect) this.onConnect(data.slot);
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
}
