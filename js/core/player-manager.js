const PLAYER_COLORS = [
  '#ff4757', '#2ed573', '#1e90ff', '#ffa502',
  '#9b59b6', '#e84393', '#00d2d3', '#ff6b81'
];

export class PlayerManager {
  constructor(maxPlayers = 8) {
    this.maxPlayers = maxPlayers;
    this.players = Array.from({ length: maxPlayers }, (_, i) => ({
      slot: i,
      peerId: null,
      connected: false,
      color: PLAYER_COLORS[i],
      score: 0,
      isAlive: true,
      customData: {}
    }));
  }

  connectPlayer(slot, peerId) {
    if (slot < 0 || slot >= this.maxPlayers) return null;
    const player = this.players[slot];
    player.peerId = peerId;
    player.connected = true;
    player.score = 0;
    player.isAlive = true;
    player.customData = {};
    return player;
  }

  disconnectPlayer(slot) {
    if (slot < 0 || slot >= this.maxPlayers) return;
    const player = this.players[slot];
    player.connected = false;
    player.peerId = null;
    player.isAlive = false;
  }

  getPlayer(slot) {
    return this.players[slot] || null;
  }

  getConnectedPlayers() {
    return this.players.filter(p => p.connected);
  }

  resetAllScores() {
    this.players.forEach(p => { p.score = 0; p.isAlive = true; p.customData = {}; });
  }

  setCustomData(slot, key, value) {
    if (this.players[slot]) {
      this.players[slot].customData[key] = value;
    }
  }
}
