const PLAYER_COLORS = [
  '#ff3366', '#00e5ff', '#ffd500', '#b700ff',
  '#ff7300', '#00ff66', '#ff00aa', '#3399ff'
];

export class FlappyGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 1280;
    this.height = 720;

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

    this.initBackground();
    this.initPlayers();
    
    // Auto-start rendering pipeline
    this.start();
  }

  initPlayers() {
    this.birds = Array.from({ length: 8 }, (_, i) => ({
      slot: i,
      x: 180 + i * 25,
      y: 300 + (i % 3) * 40,
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
      x: Math.random() * this.width,
      y: 40 + Math.random() * 180,
      scale: 0.6 + Math.random() * 0.8,
      speed: 0.4 + Math.random() * 0.5
    }));
  }

  setPlayerActive(slot, active, name = null) {
    if (this.birds[slot]) {
      this.birds[slot].active = active;
      this.birds[slot].alive = active;
      if (name) this.birds[slot].name = name;
      if (active) {
        this.birds[slot].y = 300;
        this.birds[slot].vy = 0;
      }
    }
  }

  handleInput(slot, inputState) {
    const bird = this.birds[slot];
    if (bird && bird.active && bird.alive) {
      if (inputState.a || inputState.up) {
        bird.vy = this.jumpForce;
      }
    }
  }

  update() {
    this.frameCount++;
    this.groundOffset = (this.groundOffset + this.pipeSpeed) % 30;

    this.clouds.forEach(c => {
      c.x -= c.speed;
      if (c.x < -150) c.x = this.width + 100;
    });

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

    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const p = this.pipes[i];
      p.x -= this.pipeSpeed;
      if (p.x + p.width < 0) this.pipes.splice(i, 1);
    }

    this.birds.forEach(bird => {
      if (!bird.active || !bird.alive) return;

      bird.vy += this.gravity;
      bird.y += bird.vy;

      bird.tilt = Math.min(Math.PI / 3, Math.max(-Math.PI / 4, bird.vy * 0.08));
      bird.wingAngle = Math.sin(this.frameCount * 0.25) * 0.6;

      if (bird.y + bird.radius >= this.height - 60) {
        bird.y = this.height - 60 - bird.radius;
        bird.alive = false;
      }

      if (bird.y - bird.radius <= 0) {
        bird.y = bird.radius;
        bird.vy = 0;
      }

      this.pipes.forEach(pipe => {
        if (bird.x + bird.radius > pipe.x && bird.x - bird.radius < pipe.x + pipe.width) {
          if (bird.y - bird.radius < pipe.topHeight || bird.y + bird.radius > pipe.bottomY) {
            bird.alive = false;
          }
        }
      });
    });
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.drawSky();
    this.drawClouds();
    this.drawPipes();
    this.drawGround();
    this.drawBirds();
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

      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(6, -6, 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.fillStyle = '#000000';
      this.ctx.beginPath();
      this.ctx.arc(8, -6, 2.5, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#f39c12';
      this.ctx.beginPath();
      this.ctx.moveTo(8, -2);
      this.ctx.lineTo(18, 2);
      this.ctx.lineTo(6, 6);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();

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

      this.ctx.save();
      this.ctx.font = 'bold 12px Nunito, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = bird.color;
      this.ctx.fillText(bird.name, bird.x, bird.y - bird.radius - 12);
      this.ctx.restore();
    });
  }

  loop() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.loop());
  }

  start() {
    this.loop();
  }
}
