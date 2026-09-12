const PLAYER_COLORS = [
  '#ff3366', '#00e5ff', '#ffd500', '#b700ff',
  '#ff7300', '#00ff66', '#ff00aa', '#3399ff'
];

export class FlappyGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.states = { WAITING: 'WAITING', PLAYING: 'PLAYING', GAMEOVER: 'GAMEOVER' };
    this.state = this.states.WAITING;
    this.winner = null;

    this.gravity = 0.45;
    this.jumpForce = -8.5;
    this.pipeSpeed = 3.2;
    this.pipeSpawnInterval = 110;
    this.pipeGap = 190;

    this.birds = [];
    this.pipes = [];
    this.clouds = [];
    this.frameCount = 0;
    this.groundOffset = 0;

    this.prevInputs = Array.from({ length: 8 }, () => ({ up: false, a: false }));

    this.initBackground();
    this.initPlayers();
    
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  resizeCanvas() {
    this.width = this.canvas.clientWidth || 1280;
    this.height = this.canvas.clientHeight || 720;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  initPlayers() {
    this.birds = Array.from({ length: 8 }, (_, i) => ({
      slot: i,
      x: 180 + i * 25,
      y: this.height / 2,
      vy: 0,
      radius: 18,
      color: PLAYER_COLORS[i],
      name: `P${i + 1}`,
      alive: false,
      active: false,
      wingAngle: 0,
      tilt: 0,
      score: 0
    }));
  }

  initBackground() {
    this.clouds = Array.from({ length: 6 }, () => ({
      x: Math.random() * (this.width || 1280),
      y: 40 + Math.random() * 180,
      scale: 0.6 + Math.random() * 0.8,
      speed: 0.4 + Math.random() * 0.5
    }));
  }

  setPlayerActive(slot, active, name = null) {
    if (slot < 0 || slot >= 8) return;
    const bird = this.birds[slot];
    bird.active = active;
    if (name) bird.name = name;

    if (active) {
      if (this.state === this.states.WAITING) {
        this.resetPlayer(slot);
      }
    } else {
      bird.alive = false;
    }
  }

  resetPlayer(slot) {
    const bird = this.birds[slot];
    bird.x = 180 + slot * 25;
    bird.y = this.height / 2;
    bird.vy = 0;
    bird.alive = bird.active;
    bird.score = 0;
    bird.tilt = 0;
  }

  resetAllPlayers() {
    for (let i = 0; i < 8; i++) {
      if (this.birds[i].active) {
        this.resetPlayer(i);
      }
    }
  }

  handleInput(slot, input) {
    if (slot < 0 || slot >= 8) return;
    const bird = this.birds[slot];
    if (!bird.active) return;

    // Button press transition (edge-detection for clean single jumps)
    const prev = this.prevInputs[slot];
    const isFlapping = (input.a || input.up) && !(prev.a || prev.up);
    this.prevInputs[slot] = { a: !!input.a, up: !!input.up };

    if (!isFlapping) return;

    if (this.state === this.states.WAITING || this.state === this.states.GAMEOVER) {
      this.startGame();
      bird.vy = this.jumpForce;
    } else if (this.state === this.states.PLAYING && bird.alive) {
      bird.vy = this.jumpForce;
    }
  }

  startGame() {
    this.state = this.states.PLAYING;
    this.winner = null;
    this.pipes = [];
    this.frameCount = 0;
    this.resetAllPlayers();
  }

  update() {
    this.frameCount++;
    this.groundOffset = (this.groundOffset + this.pipeSpeed) % 30;

    // 1. Clouds Animation
    this.clouds.forEach(c => {
      c.x -= c.speed;
      if (c.x < -150) c.x = this.width + 100;
    });

    if (this.state === this.states.WAITING) {
      // Bob birds gently while waiting
      const time = performance.now() * 0.003;
      this.birds.forEach((bird, i) => {
        if (bird.active) {
          bird.y = this.height / 2 + Math.sin(time + i) * 10;
          bird.wingAngle = Math.sin(time * 3 + i) * 0.4;
        }
      });
      return;
    }

    if (this.state === this.states.PLAYING) {
      // 2. Spawn Pipes
      if (this.frameCount % this.pipeSpawnInterval === 0) {
        const minCap = 80;
        const maxCap = this.height - 180 - this.pipeGap - minCap;
        const topHeight = minCap + Math.random() * maxCap;
        this.pipes.push({
          x: this.width + 80,
          topHeight: topHeight,
          bottomY: topHeight + this.pipeGap,
          width: 76,
          passed: false
        });
      }

      // 3. Move Pipes
      for (let i = this.pipes.length - 1; i >= 0; i--) {
        const p = this.pipes[i];
        p.x -= this.pipeSpeed;
        if (p.x + p.width < 0) this.pipes.splice(i, 1);
      }

      // 4. Physics & Collisions
      let activeCount = 0;
      let aliveCount = 0;

      this.birds.forEach(bird => {
        if (!bird.active) return;
        activeCount++;

        if (bird.alive) {
          aliveCount++;
          bird.vy += this.gravity;
          bird.y += bird.vy;

          bird.tilt = Math.min(Math.PI / 3, Math.max(-Math.PI / 4, bird.vy * 0.08));
          bird.wingAngle = Math.sin(this.frameCount * 0.25) * 0.6;

          // Ground Collision
          if (bird.y + bird.radius >= this.height - 60) {
            bird.y = this.height - 60 - bird.radius;
            bird.alive = false;
          }

          // Ceiling Collision
          if (bird.y - bird.radius <= 0) {
            bird.y = bird.radius;
            bird.vy = 0;
          }

          // Pipe Collision & Scoring
          this.pipes.forEach(pipe => {
            if (!pipe.passed && pipe.x + pipe.width < bird.x) {
              bird.score++;
              pipe.passed = true;
            }

            if (bird.x + bird.radius > pipe.x && bird.x - bird.radius < pipe.x + pipe.width) {
              if (bird.y - bird.radius < pipe.topHeight || bird.y + bird.radius > pipe.bottomY) {
                bird.alive = false;
              }
            }
          });
        }
      });

      // 5. Last-Player-Standing Win Condition
      if (activeCount > 1) {
        if (aliveCount <= 1) {
          const survivor = this.birds.find(b => b.active && b.alive);
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

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.drawSky();
    this.drawClouds();
    this.drawPipes();
    this.drawGround();
    this.drawBirds();
    this.drawOverlays();
  }

  drawSky() {
    const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    skyGradient.addColorStop(0, '#2b1055');
    skyGradient.addColorStop(0.4, '#7597de');
    skyGradient.addColorStop(0.85, '#b1d4e0');
    skyGradient.addColorStop(1, '#f4d06f');
    this.ctx.fillStyle = skyGradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawClouds() {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    this.clouds.forEach(c => {
      this.ctx.beginPath();
      this.ctx.arc(c.x, c.y, 30 * c.scale, 0, Math.PI * 2);
      this.ctx.arc(c.x + 25 * c.scale, c.y - 10 * c.scale, 35 * c.scale, 0, Math.PI * 2);
      this.ctx.arc(c.x + 55 * c.scale, c.y, 28 * c.scale, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  drawPipes() {
    this.pipes.forEach(p => {
      this.draw3DPipe(p.x, 0, p.width, p.topHeight, true);
      this.draw3DPipe(p.x, p.bottomY, p.width, this.height - 60 - p.bottomY, false);
    });
  }

  draw3DPipe(x, y, width, height, isTop) {
    if (height <= 0) return;

    this.ctx.save();

    const pipeGrad = this.ctx.createLinearGradient(x, 0, x + width, 0);
    pipeGrad.addColorStop(0, '#134e13');
    pipeGrad.addColorStop(0.25, '#2ecc71');
    pipeGrad.addColorStop(0.6, '#27ae60');
    pipeGrad.addColorStop(0.9, '#1e8449');
    pipeGrad.addColorStop(1, '#0e3a0e');

    this.ctx.fillStyle = pipeGrad;
    this.ctx.fillRect(x, y, width, height);

    const capHeight = 28;
    const capExtra = 6;
    const capX = x - capExtra;
    const capWidth = width + capExtra * 2;
    const capY = isTop ? y + height - capHeight : y;

    const capGrad = this.ctx.createLinearGradient(capX, 0, capX + capWidth, 0);
    capGrad.addColorStop(0, '#196f3d');
    capGrad.addColorStop(0.3, '#58d68d');
    capGrad.addColorStop(0.7, '#27ae60');
    capGrad.addColorStop(1, '#114b27');

    this.ctx.fillStyle = capGrad;
    this.ctx.fillRect(capX, capY, capWidth, capHeight);

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    this.ctx.fillRect(capX + 8, capY, 4, capHeight);

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(capX, isTop ? capY : capY + capHeight - 3, capWidth, 3);

    this.ctx.restore();
  }

  drawGround() {
    const groundY = this.height - 60;

    const dirtGrad = this.ctx.createLinearGradient(0, groundY, 0, this.height);
    dirtGrad.addColorStop(0, '#d35400');
    dirtGrad.addColorStop(1, '#6e2c00');
    this.ctx.fillStyle = dirtGrad;
    this.ctx.fillRect(0, groundY, this.width, 60);

    this.ctx.fillStyle = '#2ecc71';
    this.ctx.fillRect(0, groundY, this.width, 14);

    this.ctx.fillStyle = '#27ae60';
    for (let x = -this.groundOffset; x < this.width + 30; x += 30) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, groundY + 14);
      this.ctx.lineTo(x + 12, groundY + 14);
      this.ctx.lineTo(x + 6, groundY + 22);
      this.ctx.fill();
    }
  }

  drawBirds() {
    this.birds.forEach(bird => {
      if (!bird.active) return;

      this.ctx.save();
      this.ctx.translate(bird.x, bird.y);
      this.ctx.rotate(bird.tilt);

      if (!bird.alive) this.ctx.globalAlpha = 0.4;

      // Radial Body
      const bodyGrad = this.ctx.createRadialGradient(-4, -4, 2, 0, 0, bird.radius);
      bodyGrad.addColorStop(0, '#ffffff');
      bodyGrad.addColorStop(0.4, bird.color);
      bodyGrad.addColorStop(1, '#000000');

      this.ctx.fillStyle = bodyGrad;
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, bird.radius * 1.1, bird.radius * 0.9, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = '#000000';
      this.ctx.stroke();

      // Eye
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(6, -6, 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = '#000000';
      this.ctx.beginPath();
      this.ctx.arc(8, -6, 2.5, 0, Math.PI * 2);
      this.ctx.fill();

      // Beak
      this.ctx.fillStyle = '#f39c12';
      this.ctx.beginPath();
      this.ctx.moveTo(8, -2);
      this.ctx.lineTo(18, 2);
      this.ctx.lineTo(6, 6);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();

      // Wing
      this.ctx.save();
      this.ctx.translate(-4, 2);
      this.ctx.rotate(bird.wingAngle);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.ellipse(-2, 0, 9, 5, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();

      this.ctx.restore();

      // Name & Score Tag
      this.ctx.save();
      this.ctx.font = 'bold 14px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 3;
      this.ctx.strokeText(`${bird.name} (${bird.score})`, bird.x, bird.y - bird.radius - 12);
      this.ctx.fillText(`${bird.name} (${bird.score})`, bird.x, bird.y - bird.radius - 12);
      this.ctx.restore();
    });
  }

  drawOverlays() {
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 5;
    this.ctx.textAlign = 'center';

    if (this.state === this.states.WAITING) {
      const activeCount = this.birds.filter(b => b.active).length;
      this.ctx.font = 'bold 36px sans-serif';
      if (activeCount === 0) {
        this.ctx.strokeText('WAITING FOR PLAYERS TO JOIN...', this.width / 2, this.height / 2);
        this.ctx.fillText('WAITING FOR PLAYERS TO JOIN...', this.width / 2, this.height / 2);
      } else {
        this.ctx.strokeText('PRESS (A) OR JUMP TO START', this.width / 2, this.height / 2 - 20);
        this.ctx.fillText('PRESS (A) OR JUMP TO START', this.width / 2, this.height / 2 - 20);
        this.ctx.font = 'bold 22px sans-serif';
        this.ctx.strokeText(`${activeCount} Player(s) Ready`, this.width / 2, this.height / 2 + 25);
        this.ctx.fillText(`${activeCount} Player(s) Ready`, this.width / 2, this.height / 2 + 25);
      }
    } else if (this.state === this.states.GAMEOVER) {
      this.ctx.font = 'bold 46px sans-serif';
      if (this.winner) {
        this.ctx.strokeText(`${this.winner.toUpperCase()} WINS!`, this.width / 2, this.height / 2 - 30);
        this.ctx.fillText(`${this.winner.toUpperCase()} WINS!`, this.width / 2, this.height / 2 - 30);
      } else {
        this.ctx.strokeText('GAME OVER', this.width / 2, this.height / 2 - 30);
        this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 30);
      }

      this.ctx.font = 'bold 24px sans-serif';
      this.ctx.strokeText('PRESS (A) TO PLAY AGAIN', this.width / 2, this.height / 2 + 25);
      this.ctx.fillText('PRESS (A) TO PLAY AGAIN', this.width / 2, this.height / 2 + 25);
    }
  }

  loop() {
    this.update();
    this.render();
    requestAnimationFrame(this.loop);
  }
}
