
export class Pitcher {
  constructor(player) {
    this.player = player;
  }

  throw() {
    const ability = this.player?.pitching ?? 70;
    const speed = Math.round(
      115 + ability * 0.35 + Math.random() * 12
    );

    return {
      speed,
      accuracy: 0.5 + (ability / 200),
      breakAmount: Math.random() * 0.3
    };
  }
}
