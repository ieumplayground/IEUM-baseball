
const TEAMS = [
  "IEUM EAGLES",
  "NEX STARS",
  "SEOUL TIGERS",
  "BUSAN WAVES",
  "DAEGU FOXES",
  "PURPLE HAWKS"
];

export class SeasonManager {
  constructor() {
    this.load();
  }

  load() {
    try {
      const saved = JSON.parse(
        localStorage.getItem("ieum-baseball-season") || "null"
      );

      if (saved && Array.isArray(saved.schedule)) {
        this.data = saved;
        return;
      }
    } catch {}

    this.data = {
      season: 1,
      wins: 0,
      losses: 0,
      points: 1000,
      played: 0,
      schedule: this.createSchedule(),
      results: [],
      standings: TEAMS.map(name => ({
        name,
        wins: 0,
        losses: 0
      }))
    };

    this.save();
  }

  createSchedule() {
    return Array.from({ length: 10 }, (_, index) => ({
      number: index + 1,
      opponent: TEAMS[(index + 1) % TEAMS.length],
      played: false,
      result: null
    }));
  }

  save() {
    localStorage.setItem(
      "ieum-baseball-season",
      JSON.stringify(this.data)
    );
  }

  playNext() {
    const game = this.data.schedule.find(item => !item.played);

    if (!game) {
      this.data.season++;
      this.data.played = 0;
      this.data.schedule = this.createSchedule();
      this.save();
      return {
        message: `시즌 ${this.data.season} 시작!`,
        newSeason: true
      };
    }

    const myScore = Math.floor(Math.random() * 8);
    const opponentScore = Math.floor(Math.random() * 8);
    const won = myScore >= opponentScore;

    game.played = true;
    game.result = { myScore, opponentScore, won };
    this.data.played++;

    if (won) {
      this.data.wins++;
      this.data.points += 150;
    } else {
      this.data.losses++;
      this.data.points += 50;
    }

    const ownTeam = this.data.standings.find(
      team => team.name === "IEUM EAGLES"
    );

    if (ownTeam) {
      if (won) ownTeam.wins++;
      else ownTeam.losses++;
    }

    const rival = this.data.standings.find(
      team => team.name === game.opponent
    );

    if (rival) {
      if (won) rival.losses++;
      else rival.wins++;
    }

    this.data.results.push({
      opponent: game.opponent,
      myScore,
      opponentScore,
      won
    });

    this.save();

    return {
      message: `${game.opponent}전 ${myScore}:${opponentScore} ${
        won ? "승리!" : "패배!"
      }`,
      won,
      myScore,
      opponentScore
    };
  }

  train(player, type) {
    if (this.data.points < 100) {
      return { success: false, message: "포인트가 부족해!" };
    }

    const statMap = {
      contact: "contact",
      power: "power",
      eye: "eye",
      pitching: "pitching"
    };

    const stat = statMap[type];

    if (!stat || !player) {
      return { success: false, message: "훈련 설정을 확인해 줘." };
    }

    if (player[stat] >= 99) {
      return { success: false, message: "이 능력치는 이미 최대야!" };
    }

    this.data.points -= 100;
    player[stat] = Math.min(99, player[stat] + 3);
    player.exp += 30;

    if (player.exp >= player.level * 100) {
      player.exp = 0;
      player.level++;
      player.contact = Math.min(99, player.contact + 1);
      player.power = Math.min(99, player.power + 1);
    }

    this.save();

    return {
      success: true,
      message: `${player.name} 훈련 완료! ${stat} +3`
    };
  }

  getRecord() {
    return {
      wins: this.data.wins,
      losses: this.data.losses,
      points: this.data.points,
      played: this.data.played,
      rate: this.data.wins + this.data.losses
        ? Math.round(
            this.data.wins /
            (this.data.wins + this.data.losses) * 100
          )
        : 0
    };
  }
}
