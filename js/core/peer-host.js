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
            const slot = this.slots.findIndex(s => s === null);
            if (slot === -1) {
                conn.close(); // Room is full
                return;
            }

            this.slots[slot] = conn;

            conn.on('open', () => {
                conn.send({ type: 'WELCOME', slot });
                if (this.onConnect) this.onConnect(slot, conn.peer);
            });

            conn.on('data', (data) => {
                if (this.onInput) this.onInput(slot, data);
            });

            const cleanup = () => this.handleDisconnect(slot);
            conn.on('close', cleanup);
            conn.on('error', cleanup);
        });
    }

    handleDisconnect(slot) {
        if (this.slots[slot]) {
            this.slots[slot] = null;
            if (this.onDisconnect) this.onDisconnect(slot);
        }
    }
}
