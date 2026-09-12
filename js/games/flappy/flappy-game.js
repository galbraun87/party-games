import { BaseGame } from '../base-game.js';

export class FlappyGame extends BaseGame {
  init() {
    this.gravity = 0.16;
    this.jumpForce = -4.8;
    this.pipeSpeed = 1.4;
    this.pipeGap = 220;
    this.hitboxRadius = 7;
    this.visualRadius = 14;

    this.pipes = [];
    this.spawnTimer = 0;
    this.score = 0;
    this.gameOver = false;
    this.winnerName = null;
    this.eliminationOrder = [];
    
    // 3 Second Countdown
    this.countdownTimer = 180; // 60 frames * 3 seconds
    this.countdownValue = 3;

    // Load ALL players, connected or not. 
    this.birds = this.playerManager.players.map(p => ({
      slot: p.slot,
      name: p.customData.name || `P${p.slot + 1}`,
      x: 140 + p.slot * 20,
      y: this.canvas.height / 2,
      vy: 0,
      alive: p.connected,
      color: p.color
    }));
  }

  update() {
    // Check for Restart input
    if (this.gameOver) {
      for (let i = 0; i < 8; i++) {
        if (this.inputBus.justPressed(i, 'a')) this.init();
      }
      return;
    }

    // Process Countdown Timer
    if (this.countdownTimer > 0) {
      this.countdownTimer--;
      const secondsLeft = Math.ceil(this.countdownTimer / 60);
      
      if (secondsLeft < this.countdownValue) {
        this.countdownValue = secondsLeft;
        if (secondsLeft > 0) this.audio.tick();
        else this.audio.go();
      }
      if (this.countdownTimer === 179) this.audio.tick(); // First tick
      return; // Skip physics until countdown ends
    }

    // 1. Process Bird Physics & Dynamic Disconnect Logic
    let activeBirdCount = 0;
    let connectedBirdCount = 0;

    this.birds.forEach((bird, i) => {
      const p = this.playerManager.getPlayer(bird.slot);
      
      // If a player disconnects mid-round, eliminate them instantly
      if (!p.connected && bird.alive) {
        this.eliminateBird(bird);
      }

      if (p.connected) connectedBirdCount++;
      
      if (!bird.alive) return;
      activeBirdCount++;

      if (this.inputBus.justPressed(i, 'a') || this.inputBus.justPressed(i, 'up')) {
        bird.vy = this.jumpForce;
        this.audio.jump();
      }

      bird.vy += this.gravity;
      bird.y += bird.vy;

      // Floor & Ceiling
      if (bird.y - this.hitboxRadius <= 0 || bird.y + this.hitboxRadius >= this.canvas.height) {
        this.eliminateBird(bird);
      }
    });

    // 2. Win / Game Over Condition Check
    if (connectedBirdCount > 1 && activeBirdCount <= 1) {
      // Multiplayer: End immediately if 1 or 0 remain
      this.gameOver = true;
      const lastAlive = this.birds.find(b => b.alive && this.playerManager.getPlayer(b.slot).connected);
      this.winnerName = lastAlive ? lastAlive.name : (this.eliminationOrder[this.eliminationOrder.length - 1]?.name || 'Nobody');
      this.audio.hit();
      return;
    } else if (connectedBirdCount <= 1 && activeBirdCount === 0) {
      // Solo Player: End when 0 remain
      this.gameOver = true;
      this.winnerName = 'Nobody';
      this.audio.hit();
      return;
    }

    // 3. Spawn & Update Pipes
    this.spawnTimer++;
    if (this.spawnTimer > 150) {
      const minY = 80;
      const maxY = this.canvas.height - this.pipeGap - 80;
      const topY = Math.floor(Math.random() * (maxY - minY)) + minY;
      this.pipes.push({ x: this.canvas.width, topY, passed: false });
      this.spawnTimer = 0;
    }

    this.pipes.forEach(p => { p.x -= this.pipeSpeed; });
    this.pipes = this.pipes.filter(p => p.x > -70);

    // 4. Pipe Collisions & Scoring
    this.pipes.forEach(p => {
      this.birds.forEach(bird => {
        if (!bird.alive) return;
        if (bird.x + this.hitboxRadius > p.x && bird.x - this.hitboxRadius < p.x + 50) {
          if (bird.y - this.hitboxRadius < p.topY || bird.y + this.hitboxRadius > p.topY + this.pipeGap) {
            this.eliminateBird(bird);
          }
        }
      });
      if (!p.passed && p.x < 140) {
        p.passed = true;
        this.score++;
        this.audio.score();
      }
    });
  }

  eliminateBird(bird) {
    bird.alive = false;
    this.audio.hit();
    this.eliminationOrder.push(bird);
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Pipes
    ctx.fillStyle = '#2ed573';
    this.pipes.forEach(p => {
      ctx.fillRect(p.x, 0, 50, p.topY);
      ctx.fillRect(p.x, p.topY + this.pipeGap, 50, this.canvas.height);
    });

    // Draw Birds (Only if Connected and Alive)
    this.birds.forEach(bird => {
      const p = this.playerManager.getPlayer(bird.slot);
      if (!bird.alive || !p.connected) return;
      
      ctx.beginPath();
      ctx.arc(bird.x, bird.y, this.visualRadius, 0, Math.PI * 2);
      ctx.fillStyle = bird.color;
      ctx.fill();
      
      // Black border for visibility on black bird
      ctx.strokeStyle = bird.color === '#000000' ? '#ffffff' : '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      
      // Black text shadow for visibility
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillText(bird.name, bird.x, bird.y - 20);
      
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    });

    // UI Overlay
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'left';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText(`Score: ${this.score}`, 30, 45);
    ctx.shadowBlur = 0;

    // Countdown Overlay
    if (this.countdownTimer > 0 && !this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 120px sans-serif';
      ctx.textAlign = 'center';
      const text = this.countdownValue > 0 ? this.countdownValue : 'GO!';
      ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2 + 40);
    }

    // Game Over Overlay
    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#f1c40f';
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`🏆 WINNER: ${this.winnerName} 🏆`, this.canvas.width / 2, this.canvas.height / 2 - 30);
      ctx.fillStyle = '#ffffff';
      ctx.font = '22px sans-serif';
      ctx.fillText('Press A on any controller to Restart', this.canvas.width / 2, this.canvas.height / 2 + 30);
      ctx.textAlign = 'left';
    }
  }
}
