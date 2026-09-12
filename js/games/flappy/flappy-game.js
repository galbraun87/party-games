import { BaseGame } from '../base-game.js';

export class FlappyGame extends BaseGame {
  init() {
    // Easier & floatier party physics
    this.gravity = 0.22;
    this.jumpForce = -5.5;
    this.pipeSpeed = 1.8;
    this.pipeGap = 180; // Wider gap between top and bottom pipes
    this.pipes = [];
    this.spawnTimer = 0;
    this.score = 0;
    this.gameOver = false;

    // Initialize bird physics for all connected players
    this.birds = this.playerManager.players.map(p => ({
      x: 100 + p.slot * 15,
      y: this.canvas.height / 2,
      vy: 0,
      radius: 12,
      alive: p.connected,
      color: p.color
    }));
  }

  update() {
    if (this.gameOver) {
      // Press A on any connected controller to restart
      for (let i = 0; i < 8; i++) {
        if (this.inputBus.justPressed(i, 'a')) this.init();
      }
      return;
    }

    // 1. Process Player Inputs & Bird Physics
    let anyAlive = false;
    this.birds.forEach((bird, i) => {
      if (!bird.alive) return;
      anyAlive = true;

      if (this.inputBus.justPressed(i, 'a') || this.inputBus.justPressed(i, 'up')) {
        bird.vy = this.jumpForce;
      }

      bird.vy += this.gravity;
      bird.y += bird.vy;

      // Floor & Ceiling collisions
      if (bird.y - bird.radius <= 0 || bird.y + bird.radius >= this.canvas.height) {
        bird.alive = false;
      }
    });

    if (!anyAlive) this.gameOver = true;

    // 2. Spawn & Update Pipes (Slower interval)
    this.spawnTimer++;
    if (this.spawnTimer > 130) {
      const minY = 60;
      const maxY = this.canvas.height - this.pipeGap - 60;
      const topY = Math.floor(Math.random() * (maxY - minY)) + minY;
      this.pipes.push({ x: this.canvas.width, topY, passed: false });
      this.spawnTimer = 0;
    }

    this.pipes.forEach(p => { p.x -= this.pipeSpeed; });
    this.pipes = this.pipes.filter(p => p.x > -60);

    // 3. Collision Detection & Scoring
    this.pipes.forEach(p => {
      this.birds.forEach(bird => {
        if (!bird.alive) return;
        if (bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + 50) {
          if (bird.y - bird.radius < p.topY || bird.y + bird.radius > p.topY + this.pipeGap) {
            bird.alive = false;
          }
        }
      });
      if (!p.passed && p.x < 100) {
        p.passed = true;
        this.score++;
      }
    });
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

    // Draw Birds
    this.birds.forEach(bird => {
      if (!bird.alive) return;
      ctx.beginPath();
      ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
      ctx.fillStyle = bird.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw Score & Overlay
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`Score: ${this.score}`, 20, 40);

    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ALL BIRDS CRASHED!', this.canvas.width / 2, this.canvas.height / 2 - 20);
      ctx.font = '20px sans-serif';
      ctx.fillText('Press A on any controller to Restart', this.canvas.width / 2, this.canvas.height / 2 + 20);
      ctx.textAlign = 'left';
    }
  }
}
