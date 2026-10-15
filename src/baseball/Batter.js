
export class Batter {
  constructor(player) {
    this.player = player;
  }

  evaluateTiming(elapsed, duration) {
    const ratio = elapsed / duration;
    const error = Math.abs(ratio - 0.82);

    return Math.max(0, Math.min(1, 1 - error * 3.5));
  }

  evaluateContact(timing, aimQuality = 1) {
    const contact = (this.player?.contact ?? 70) / 100;

    return Math.max(
      0,
      Math.min(1, timing * 0.65 + aimQuality * 0.25 + contact * 0.1)
    );
  }

  calculatePower(timing) {
    const power = this.player?.power ?? 70;
    return Math.round(power * (0.4 + timing * 0.6));
  }
}
