
import { BaseballScene } from "./Scene.js";
import { BaseballMatch } from "../baseball/Match.js";
import { GameInput } from "./Input.js";
import { initialPlayers } from "../data/Players.js";
import { SeasonManager } from "../modes/Season.js";
import { TrainingManager } from "../modes/Training.js";

export class BaseballGame {
  constructor() {
    this.players = this.loadPlayers();
    this.season = new SeasonManager();
    this.training = new TrainingManager(this.season, this.players);

    this.scene = new BaseballScene(
      document.getElementById("stadium")
    );

    this.match = new BaseballMatch(this.scene, {
      onUpdate: state => this.updateScoreboard(state),
      onMessage: message => this.setMessage(message),
      onPhase: phase => this.setPhase(phase),
      onSpeed: speed => {
        document.getElementById("speed").textContent = `${speed} km/h`;
      },
      onSwing: quality => {
        if (quality > 0.8) {
          document.getElementById("camera-status").textContent = "PERFECT TIMING";
        } else {
          document.getElementById("camera-status").textContent = "BATTER VIEW";
        }
      },
      getPlayer: () => this.getSelectedPlayer()
    });

    this.input = new GameInput({
      onSwing: () => this.match.swing(),
      onPitch: () => this.match.pitch(),
      onAim: (x, y) => this.moveAim(x, y)
    });

    this.bindEvents();
    this.renderAll();
  }

  loadPlayers() {
    try {
      const saved = JSON.parse(localStorage.getItem("ieum-baseball-players"));
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {}

    return structuredClone(initialPlayers);
  }

  getSelectedPlayer() {
    const id = document.getElementById("training-player")?.value;
    return this.players.find(player => player.id === id) || this.players[0];
  }

  bindEvents() {
    document.getElementById("pitch-button").addEventListener(
      "click", () => this.match.pitch()
    );

    document.getElementById("swing-button").addEventListener(
      "click", () => this.match.swing()
    );

    document.getElementById("aim-button").addEventListener(
      "click", () => {
        document.getElementById("aim-panel").classList.toggle("visible");
      }
    );

    document.querySelectorAll("[data-aim]").forEach(button => {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-aim]").forEach(item =>
          item.classList.remove("selected")
        );

        button.classList.add("selected");

        const [x, y] = button.dataset.aim.split(",").map(Number);
        this.match.setAim(x - 1, y);
      });
    });

    document.getElementById("reset-button").addEventListener(
      "click", () => this.match.reset()
    );

    document.getElementById("next-inning-button").addEventListener(
      "click", () => this.match.forceNextInning()
    );

    document.getElementById("play-season-button").addEventListener(
      "click", () => {
        const result = this.season.playNext();
        this.setMessage(result.message);
        this.renderAll();
      }
    );

    document.getElementById("train-button").addEventListener(
      "click", () => {
        const id = document.getElementById("training-player").value;
        const type = document.getElementById("training-type").value;
        const result = this.training.train(id, type);

        document.getElementById("training-message").textContent =
          result.message;

        this.renderAll();
      }
    );

    document.querySelectorAll("[data-page]").forEach(button => {
      button.addEventListener("click", () => this.showPage(button.dataset.page));
    });
  }

  moveAim(x, y) {
    const selected = document.querySelector("[data-aim].selected");
    let currentX = 0;
    let currentY = 0;

    if (selected) {
      [currentX, currentY] = selected.dataset.aim.split(",").map(Number);
    }

    const nextX = Math.max(0, Math.min(2, currentX + x));
    const nextY = Math.max(-1, Math.min(1, currentY + y));

    const key = `${nextX},${nextY}`;
    const button = document.querySelector(`[data-aim="${key}"]`);
    button?.click();
  }

  showPage(name) {
    document.querySelectorAll(".page").forEach(page => {
      page.classList.add("hidden");
    });

    document.getElementById(`page-${name}`).classList.remove("hidden");

    document.querySelectorAll("[data-page]").forEach(button => {
      button.classList.toggle("active", button.dataset.page === name);
    });

    const headings = {
      game: ["경기 플레이", "직접 타격하고 승리를 쟁취해."],
      season: ["시즌 · 리그", "경기 결과와 시즌 순위를 확인해."],
      players: ["선수단", "선수 능력치와 현재 성장 상태를 관리해."],
      training: ["선수 육성", "훈련을 통해 팀을 강화해."]
    };

    document.getElementById("page-title").textContent = headings[name][0];
    document.getElementById("page-description").textContent = headings[name][1];

    if (name === "players") this.renderPlayers();
    if (name === "season") this.renderSeason();
    if (name === "training") this.renderTrainingPlayers();

    if (name === "game") {
      setTimeout(() => this.scene.resize(), 50);
    }
  }

  setMessage(message) {
    document.getElementById("game-message").textContent = message;
    document.getElementById("save-status").textContent = "READY";
  }

  setPhase(phase) {
    document.getElementById("phase-badge").textContent = phase;
  }

  updateScoreboard(state) {
    document.getElementById("home-score").textContent = state.homeScore;
    document.getElementById("away-score").textContent = state.awayScore;

    document.getElementById("inning-label").textContent =
      `${state.inning}회${state.half === "top" ? "초" : "말"}`;

    document.getElementById("count-label").textContent =
      `B ${state.balls} · S ${state.strikes} · O ${state.outs}`;

    document.getElementById("balls").textContent = state.balls;
    document.getElementById("strikes").textContent = state.strikes;
    document.getElementById("outs").textContent = state.outs;

    const baseNames = ["1루", "2루", "3루"];
    const occupied = state.bases
      .map((hasRunner, index) => hasRunner ? baseNames[index] : null)
      .filter(Boolean);

    document.getElementById("bases-label").textContent =
      occupied.length ? `주자: ${occupied.join(", ")}` : "주자 없음";
  }

  renderAll() {
    const record = this.season.getRecord();

    document.getElementById("points").textContent = `${record.points} P`;
    document.getElementById("record").textContent =
      `${record.wins}승 ${record.losses}패`;

    document.getElementById("season-number").textContent =
      `SEASON ${this.season.data.season}`;

    this.renderSeason();
    this.renderPlayers();
    this.renderTrainingPlayers();
  }

  renderSeason() {
    const data = this.season.data;
    const record = this.season.getRecord();

    document.getElementById("season-wins").textContent = `${record.wins}승`;
    document.getElementById("wins-stat").textContent = record.wins;
    document.getElementById("losses-stat").textContent = record.losses;
    document.getElementById("win-rate").textContent = `${record.rate}%`;

    document.getElementById("season-progress").style.width =
      `${data.played / 10 * 100}%`;

    document.getElementById("season-progress-label").textContent =
      `${data.played} / 10 경기`;

    const table = document.getElementById("league-table");
    const standings = [...data.standings].sort((a, b) => {
      const rateA = a.wins + a.losses ? a.wins / (a.wins + a.losses) : 0;
      const rateB = b.wins + b.losses ? b.wins / (b.wins + b.losses) : 0;
      return rateB - rateA;
    });

    table.replaceChildren();

    standings.forEach((team, index) => {
      const tr = document.createElement("tr");
      const rate = team.wins + team.losses
        ? Math.round(team.wins / (team.wins + team.losses) * 100)
        : 0;

      [index + 1, team.name, team.wins, team.losses, `${rate}%`].forEach(value => {
        const td = document.createElement("td");
        td.textContent = value;
        tr.appendChild(td);
      });

      table.appendChild(tr);
    });

    const schedule = document.getElementById("schedule-list");
    schedule.replaceChildren();

    data.schedule.forEach(game => {
      const row = document.createElement("div");
      row.className = "schedule-row";

      const left = document.createElement("div");
      left.textContent = `${game.number}차전 · ${game.opponent}`;

      const small = document.createElement("small");
      small.textContent = game.played ? "경기 완료" : "예정 경기";
      left.appendChild(small);

      const right = document.createElement("span");

      if (game.result) {
        right.textContent = `${game.result.myScore} : ${game.result.opponentScore}`;
        right.className = "schedule-result";
      } else {
        right.textContent = "VS";
      }

      row.append(left, right);
      schedule.appendChild(row);
    });
  }

  renderPlayers() {
    const container = document.getElementById("player-list");
    container.replaceChildren();

    this.players.forEach(player => {
      const overall = Math.round(
        player.contact * 0.35 +
        player.power * 0.3 +
        player.eye * 0.2 +
        player.speed * 0.15
      );

      const card = document.createElement("article");
      card.className = "player-card";

      const head = document.createElement("div");
      head.className = "player-card-head";

      const info = document.createElement("div");
      const title = document.createElement("h2");
      title.textContent = player.name;

      const subtitle = document.createElement("p");
      subtitle.textContent =
        `${player.position} · Lv.${player.level} · ${player.role}`;

      info.append(title, subtitle);

      const rating = document.createElement("div");
      rating.className = "overall";
      rating.textContent = overall;

      head.append(info, rating);

      const stats = document.createElement("div");
      stats.className = "player-stats";

      const statLabels = {
        contact: "타격 정확도",
        power: "파워",
        eye: "선구안",
        pitching: "투구 능력"
      };

      Object.entries(statLabels).forEach(([key, label]) => {
        const box = document.createElement("div");
        box.className = "player-stat";
        box.textContent = label;

        const value = document.createElement("strong");
        value.textContent = player[key];

        box.appendChild(value);
        stats.appendChild(box);
      });

      card.append(head, stats);
      container.appendChild(card);
    });
  }

  renderTrainingPlayers() {
    const select = document.getElementById("training-player");
    const current = select.value;

    select.replaceChildren();

    this.players.forEach(player => {
      const option = document.createElement("option");
      option.value = player.id;
      option.textContent = `${player.name} · Lv.${player.level}`;
      select.appendChild(option);
    });

    if (this.players.some(player => player.id === current)) {
      select.value = current;
    }
  }

  destroy() {
    this.input.destroy();
    this.scene.destroy();
  }
}
