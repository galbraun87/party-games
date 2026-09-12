const PREFIX = 'tvparty-';

export class PeerClient {
    constructor(roomCode, onConnect, onDisconnect, onError) {
        this.roomCode = roomCode;
        this.onConnect = onConnect;
        this.onDisconnect = onDisconnect;
        this.onError = onError;
        this.conn = null;
        this.peer = null;
        this.playerSlot = null;
        this.connect();
    }

    connect() {
        this.peer = new window.Peer();

        this.peer.on('open', () => {
            this.conn = this.peer.connect(`${PREFIX}${this.roomCode}`, { reliable: false });

            this.conn.on('data', (data) => {
                if (data.type === 'WELCOME') {
                    this.playerSlot = data.slot;
                    if (this.onConnect) this.onConnect(data.slot);
                }
            });

            this.conn.on('close', () => { if (this.onDisconnect) this.onDisconnect(); });
            this.conn.on('error', (err) => { if (this.onError) this.onError(err); });
        });

        this.peer.on('error', (err) => { if (this.onError) this.onError(err); });
    }

    sendInput(inputState) {
        if (this.conn && this.conn.open) {
            this.conn.send(inputState);
        }
    }
}
