
export class BaseballBall {
  constructor() {
    this.reset();
  }

  reset() {
    this.position = { x: 0, y: 3, z: -3 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.active = false;
  }

  pitch(target, duration) {
    this.position = { x: 0, y: 3, z: -3 };
    this.velocity = {
      x: target.x / duration,
      y: (target.y - 3) / duration,
      z: 13 / duration
    };
    this.active = true;
  }

  update(delta) {
    if (!this.active) return;

    this.position.x += this.velocity.x * delta;
    this.position.y += this.velocity.y * delta;
    this.position.z += this.velocity.z * delta;

    if (this.position.z > 12) this.active = false;
  }
}
