export class FlappyGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.states = { WAITING: 'WAITING', PLAYING: 'PLAYING', GAMEOVER: 'GAMEOVER' };
    this.state = this.states.WAITING;
    this.winner = null;

    this.colors = ['#FF4136', '#0074D9', '#2ECC40', '#FFDC00', '#B10DC9', '#FF851B', '#7FDBFF', '#F012BE'];
    
    this.players = Array.from({ length: 8 }, (_, i) => ({
      slot: i,
      active: false,
      name: `Player ${i + 1}`,
      x: 100 + i * 25,
      y: this.canvas.height / 2,
      vy: 0,
      alive: false,
      score: 0,
      color: this.colors[i]
    }));

    this.prevInputs = Array.from({ length: 8 }, () => ({ up: false, a: false }));
    this.pipes = [];
    this.pipeFrameTimer = 0;
    this.gravity = 0.45;
    this.jumpForce = -8.5;
    this.birdRadius = 16;

    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.clientWidth || 800;
    this.canvas.height = this.canvas.clientHeight || 450;
  }

  setPlayerActive(slot, active, name = null) {
    if (slot < 0 || slot >= 8) return;
    this.players[slot].active = active;
    if (name) this.players[slot].name = name;

    if (active) {
      if (this.state === this.states.WAITING) {
        this.resetPlayer(slot);
      }
    } else {
      this.players[slot].alive = false;
    }
  }

  resetPlayer(slot) {
    const p = this.players[slot];
    p.x = 120 + slot * 25;
    p.y = this.canvas.height / 2;
    p.vy = 0;
    p.alive = p.active;
    p.score = 0;
  }

  resetAllPlayers() {
    for (let i = 0; i < 8; i++) {
      if (this.players[i].active) {
        this.resetPlayer(i);
      }
    }
  }

  handleInput(slot, input) {
    if (slot < 0 || slot >= 8) return;
    const p = this.players[slot];
    if (!p.active) return;

    // Button press transition (edge detection)
    const prev = this.prevInputs[slot];
    const isFlapping = (input.a || input.up) && !(prev.a || prev.up);
    this.prevInputs[slot] = { a: !!input.a, up: !!input.up };

    if (!isFlapping) return;

    if (this.state === this.states.WAITING || this.state === this.states.GAMEOVER) {
      this.startGame();
      p.vy = this.jumpForce;
    } else if (this.state === this.states.PLAYING && p.alive) {
      p.vy = this.jumpForce;
    }
  }

  startGame() {
    this.state = this.states.PLAYING;
    this.winner = null;
    this.pipes = [];
    this.pipeFrameTimer = 0;
    this.resetAllPlayers();
  }

  update() {
    if (this.state === this.states.WAITING) {
      const time = performance.now() * 0.003;
      this.players.forEach((p, i) => {
        if (p.active) {
          p.y = this.canvas.height / 2 + Math.sin(time + i) * 8;
        }
      });
      return;
    }

    if (this.state === this.states.PLAYING) {
      // 1. Pipe Spawning
      this.pipeFrameTimer++;
      if (this.pipeFrameTimer % 110 === 0) {
        const gap = 140;
        const minH = 60;
        const maxH = this.canvas.height - gap - minH - 40;
        const topH = Math.floor(Math.random() * (maxH - minH + 1)) + minH;
        this.pipes.push({
          x: this.canvas.width,
          top: topH,
          bottom: this.canvas.height - topH - gap,
          passed: false
        });
      }

      // 2. Pipe Movement
      for (let i = this.pipes.length - 1; i >= 0; i--) {
        const pipe = this.pipes[i];
        pipe.x -= 3;
        if (pipe.x < -60) {
          this.pipes.splice(i, 1);
        }
      }

      // 3. Player Physics & Collisions
      let activeCount = 0;
      let aliveCount = 0;

      this.players.forEach(p => {
        if (!p.active) return;
        activeCount++;

        if (p.alive) {
          aliveCount++;
          p.vy += this.gravity;
          p.y += p.vy;

          // Ground & Ceiling bounds
          if (p.y + this.birdRadius >= this.canvas.height - 30) {
            p.y = this.canvas.height - 30 - this.birdRadius;
            p.alive = false;
          }
          if (p.y - this.birdRadius <= 0) {
            p.y = this.birdRadius;
            p.vy = 0;
          }

          // Pipe Collision & Score
          this.pipes.forEach(pipe => {
            if (!pipe.passed && pipe.x + 50 < p.x) {
              p.score++;
              pipe.passed = true;
            }

            if (
              p.x + this.birdRadius > pipe.x &&
              p.x - this.birdRadius < pipe.x + 50
            ) {
              if (
                p.y - this.birdRadius < pipe.top ||
                p.y + this.birdRadius > this.canvas.height - pipe.bottom
              ) {
                p.alive = false;
              }
            }
          });
        }
      });

      // 4. Last Player Standing Win Condition
      if (activeCount > 1) {
        if (aliveCount <= 1) {
          const survivor = this.players.find(p => p.active && p.alive);
          this.winner = survivor ? survivor.name : null;
          this.state = this.states.GAMEOVER;
        }
      } else if (activeCount === 1) {
        if (aliveCount === 0) {
          this.state = this.states.GAMEOVER;
        }
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Sky Background
    this.ctx.fillStyle = '#70c5ce';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Pipes
    this.ctx.fillStyle = '#73bf2e';
    this.ctx.strokeStyle = '#538021';
    this.ctx.lineWidth = 3;
    this.pipes.forEach(p => {
      this.ctx.fillRect(p.x, 0, 50, p.top);
      this.ctx.strokeRect(p.x, 0, 50, p.top);
      this.ctx.fillRect(p.x, this.canvas.height - p.bottom, 50, p.bottom);
      this.ctx.strokeRect(p.x, this.canvas.height - p.bottom, 50, p.bottom);
    });

    // Ground
    this.ctx.fillStyle = '#ded895';
    this.ctx.fillRect(0, this.canvas.height - 30, this.canvas.width, 30);
    this.ctx.fillStyle = '#73bf2e';
    this.ctx.fillRect(0, this.canvas.height - 30, this.canvas.width, 8);

    // Players
    this.players.forEach(p => {
      if (!p.active) return;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);

      if (this.state === this.states.PLAYING && p.alive) {
        const angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, p.vy * 0.08));
        this.ctx.rotate(angle);
      }

      // Bird Body
      this.ctx.fillStyle = p.alive ? p.color : '#888888';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.birdRadius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = '#000000';
      this.ctx.stroke();

      // Eye
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.beginPath();
      this.ctx.arc(6, -4, 4, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#000000';
      this.ctx.beginPath();
      this.ctx.arc(7, -4, 2, 0, Math.PI * 2);
      this.ctx.fill();

      // Beak
      this.ctx.fillStyle = '#FFA500';
      this.ctx.beginPath();
      this.ctx.moveTo(10, 0);
      this.ctx.lineTo(18, 4);
      this.ctx.lineTo(10, 8);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.restore();

      // Name & Score Tag
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 3;
      this.ctx.font = 'bold 12px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.strokeText(`${p.name} (${p.score})`, p.x, p.y - 24);
      this.ctx.fillText(`${p.name} (${p.score})`, p.x, p.y - 24);
    });

    // Overlays
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 4;
    this.ctx.textAlign = 'center';

    if (this.state === this.states.WAITING) {
      const activeCount = this.players.filter(p => p.active).length;
      this.ctx.font = 'bold 26px sans-serif';
      if (activeCount === 0) {
        this.ctx.strokeText('WAITING FOR PLAYERS TO JOIN...', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText('WAITING FOR PLAYERS TO JOIN...', this.canvas.width / 2, this.canvas.height / 2);
      } else {
        this.ctx.strokeText('PRESS (A) OR JUMP TO START', this.canvas.width / 2, this.canvas.height / 2 - 20);
        this.ctx.fillText('PRESS (A) OR JUMP TO START', this.canvas.width / 2, this.canvas.height / 2 - 20);
        this.ctx.font = 'bold 18px sans-serif';
        this.ctx.strokeText(`${activeCount} Player(s) Connected`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        this.ctx.fillText(`${activeCount} Player(s) Connected`, this.canvas.width / 2, this.canvas.height / 2 + 20);
      }
    } else if (this.state === this.states.GAMEOVER) {
      this.ctx.font = 'bold 36px sans-serif';
      
      if (this.winner) {
        this.ctx.strokeText(`${this.winner.toUpperCase()} WINS!`, this.canvas.width / 2, this.canvas.height / 2 - 30);
        this.ctx.fillText(`${this.winner.toUpperCase()} WINS!`, this.canvas.width / 2, this.canvas.height / 2 - 30);
      } else {
        this.ctx.strokeText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
      }

      this.ctx.font = 'bold 20px sans-serif';
      this.ctx.strokeText('PRESS (A) TO PLAY AGAIN', this.canvas.width / 2, this.canvas.height / 2 + 20);
      this.ctx.fillText('PRESS (A) TO PLAY AGAIN', this.canvas.width / 2, this.canvas.height / 2 + 20);
    }
  }

  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(this.loop);
  }
}
