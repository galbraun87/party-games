// Distinct colors mapping CSS exactly
const PLAYER_COLORS = [
  '#ff3333', '#3366ff', '#ffff33', '#ff33ff',
  '#ff9900', '#ffffff', '#9900ff', '#000000'
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
    if (!player.customData.name) player.customData = {};
    return player;
  }

  disconnectPlayer(slot) {
    if (slot < 0 || slot >= this.maxPlayers) return;
    const player = this.players[slot];
    player.connected = false;
    player.peerId = null;
    player.isAlive = false;
  }

  getPlayer(slot) { return this.players[slot] || null; }
  getConnectedPlayers() { return this.players.filter(p => p.connected); }
  setCustomData(slot, key, value) { if (this.players[slot]) this.players[slot].customData[key] = value; }
}
