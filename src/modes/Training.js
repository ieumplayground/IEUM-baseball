
export class TrainingManager {
  constructor(seasonManager, players) {
    this.season = seasonManager;
    this.players = players;
  }

  train(playerId, type) {
    const player = this.players.find(p => p.id === playerId);

    if (!player) {
      return { success: false, message: "선수를 찾을 수 없어." };
    }

    const result = this.season.train(player, type);

    if (result.success) {
      this.savePlayers();
    }

    return result;
  }

  savePlayers() {
    localStorage.setItem(
      "ieum-baseball-players",
      JSON.stringify(this.players)
    );
  }
}
